/**
 * Autosync Server — automatic commit + push watcher.
 *
 * Dev-server middleware that provides git automation:
 * - List branches (excluding main/master)
 * - Enable/disable autosync with branch switching
 * - Push watcher: every 30s commits scoped changes, pulls --rebase, and pushes
 *
 * Routes (mounted at /_storyboard/autosync/):
 *   GET    /branches — list local git branches (excludes main/master)
 *   GET    /status   — current state (branch, enabled, scope, last sync, errors)
 *   POST   /enable   — enable autosync (stash → checkout → apply → start watcher)
 *   POST   /disable  — disable autosync (stop watcher, stay on branch)
 *   POST   /sync     — trigger a single sync cycle manually (using current scope)
 */

import { execFileSync } from 'node:child_process'

// ── Module-level watcher state (singleton, survives page reloads) ──

let watcherInterval = null
let autosyncEnabled = false
let targetBranch = null
let originalBranch = null
let lastSyncTime = null
let lastError = null
let syncing = false
let syncScope = 'canvas'

const SYNC_INTERVAL_MS = 30_000
const PUSH_RETRY_LIMIT = 3
const AUTOSYNC_SCOPES = new Set(['canvas', 'prototype'])

// Branch names must match git ref format — alphanumeric, hyphens, dots, slashes
const BRANCH_NAME_RE = /^[\w][\w.\-/]*$/

// ── Git helpers (argv-based, no shell) ──

function git(args, root) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf-8', timeout: 30_000 }).trim()
}

function getCurrentBranch(root) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], root)
}

function getUsername(root) {
  try {
    return git(['config', 'user.name'], root)
  } catch {
    return 'autosync'
  }
}

function getBranches(root) {
  const raw = git(['branch', '--list', '--format=%(refname:short)'], root)
  return raw
    .split('\n')
    .map(b => b.trim())
    .filter((b) => b && b.toLowerCase() !== 'main' && b.toLowerCase() !== 'master')
}

function hasUncommittedChanges(root) {
  const status = git(['status', '--porcelain'], root)
  return status.length > 0
}

function parseStashEntries(raw) {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ref, ...messageParts] = line.split(' ')
      return { ref, message: messageParts.join(' ') }
    })
}

function listStashes(root) {
  const raw = git(['stash', 'list', '--format=%gd %s'], root)
  return parseStashEntries(raw)
}

function stashWorkingChanges(root, label) {
  if (!hasUncommittedChanges(root)) return null

  const marker = `autosync:${label}:${Date.now()}`
  const beforeRefs = new Set(listStashes(root).map((stash) => stash.ref))
  const output = git(['stash', 'push', '-u', '-m', marker], root)
  if (output.includes('No local changes to save')) return null

  const created = listStashes(root).find(
    (stash) => !beforeRefs.has(stash.ref) && stash.message.includes(marker),
  )

  return created?.ref || null
}

function restoreStash(root, stashRef) {
  if (!stashRef) return
  git(['stash', 'apply', stashRef], root)
  git(['stash', 'drop', stashRef], root)
}

function listChangedFiles(root) {
  const tracked = git(['diff', '--name-only'], root)
  const staged = git(['diff', '--name-only', '--cached'], root)
  const untracked = git(['ls-files', '--others', '--exclude-standard'], root)
  return [...tracked, ...staged, ...untracked]
    .flatMap((raw) => raw.split('\n'))
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file, idx, arr) => arr.indexOf(file) === idx)
}

export function normalizeAutosyncScope(scope) {
  return AUTOSYNC_SCOPES.has(scope) ? scope : 'canvas'
}

export function matchesAutosyncScope(scope, filePath) {
  const normalizedScope = normalizeAutosyncScope(scope)
  const file = String(filePath || '').replaceAll('\\', '/').replace(/^\.\//, '')
  if (!file) return false

  if (normalizedScope === 'prototype') {
    return file === 'src/prototypes' || file.startsWith('src/prototypes/')
  }

  // canvas scope
  return (
    file === 'src/canvas' ||
    file.startsWith('src/canvas/') ||
    file.endsWith('.canvas.jsonl')
  )
}

export function filterFilesForAutosyncScope(scope, files) {
  return (files || []).filter((file) => matchesAutosyncScope(scope, file))
}

function listScopedChangedFiles(root, scope) {
  return filterFilesForAutosyncScope(scope, listChangedFiles(root))
}

function remoteBranchExists(root, branch) {
  try {
    git(['ls-remote', '--exit-code', '--heads', 'origin', branch], root)
    return true
  } catch {
    return false
  }
}

function isValidBranch(name) {
  return typeof name === 'string' && BRANCH_NAME_RE.test(name) && name.length < 256
}

function formatTime() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function isRetryablePushError(message) {
  const normalized = String(message || '').toLowerCase()
  return (
    normalized.includes('failed to push some refs') ||
    normalized.includes('non-fast-forward') ||
    normalized.includes('updates were rejected') ||
    normalized.includes('tip of your current branch is behind') ||
    normalized.includes('fetch first') ||
    normalized.includes('[rejected]')
  )
}

// ── Sync cycle ──

/** Run a single sync cycle. Returns true on success, false on failure. */
function runSyncCycle(root, scope = syncScope) {
  if (syncing) return false
  syncing = true
  lastError = null
  let cycleSucceeded = false
  let externalStashRef = null

  try {
    const scopedFiles = listScopedChangedFiles(root, scope)
    if (scopedFiles.length > 0) {
      const username = getUsername(root)
      const time = formatTime()
      git(['add', '-A', '--', ...scopedFiles], root)
      git(['commit', '-m', `[auto:${scope}] ${username} update at ${time}`, '--', ...scopedFiles], root)
    }

    const branch = getCurrentBranch(root)
    if (scopedFiles.length > 0) {
      externalStashRef = stashWorkingChanges(root, 'pre-rebase')

      for (let attempt = 1; attempt <= PUSH_RETRY_LIMIT; attempt += 1) {
        if (remoteBranchExists(root, branch)) {
          git(['pull', '--rebase', 'origin', branch], root)
        }

        try {
          git(['push', 'origin', branch], root)
          cycleSucceeded = true
          break
        } catch (pushErr) {
          if (!isRetryablePushError(pushErr?.message) || attempt === PUSH_RETRY_LIMIT) {
            throw pushErr
          }
        }
      }
    } else {
      cycleSucceeded = true
    }
  } catch (err) {
    lastError = err.message || 'Sync failed'
    try { git(['rebase', '--abort'], root) } catch { /* not in rebase */ }
    stopWatcher()
  } finally {
    if (externalStashRef) {
      try {
        restoreStash(root, externalStashRef)
      } catch (restoreErr) {
        cycleSucceeded = false
        lastError = `Autosync saved your external changes to stash ${externalStashRef}. ` +
          `Re-apply failed: ${restoreErr.message}`
        stopWatcher()
      }
    }

    if (cycleSucceeded) {
      lastSyncTime = new Date().toISOString()
    }

    syncing = false
  }

  return cycleSucceeded
}

function startWatcher(root) {
  if (watcherInterval) return
  watcherInterval = setInterval(() => runSyncCycle(root), SYNC_INTERVAL_MS)
}

function stopWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval)
    watcherInterval = null
  }
  autosyncEnabled = false
}

// ── Route handler ──

export function createAutosyncHandler({ root, sendJson }) {
  return async (req, res, { body, path: routePath, method }) => {

    // GET /branches — list local branches
    if (routePath === '/branches' && method === 'GET') {
      try {
        const branches = getBranches(root)
        const current = getCurrentBranch(root)
        sendJson(res, 200, { branches, current })
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // GET /status — current autosync state
    if (routePath === '/status' && method === 'GET') {
      try {
        const current = getCurrentBranch(root)
        sendJson(res, 200, {
          enabled: autosyncEnabled,
          branch: current,
          targetBranch,
          originalBranch,
          scope: syncScope,
          availableScopes: [...AUTOSYNC_SCOPES],
          lastSyncTime,
          lastError,
          syncing,
        })
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // POST /enable — enable autosync
    if (routePath === '/enable' && method === 'POST') {
      try {
        const { branch, scope } = body || {}
        if (!branch) {
          sendJson(res, 400, { error: 'branch is required' })
          return
        }

        if (!isValidBranch(branch)) {
          sendJson(res, 400, { error: 'Invalid branch name' })
          return
        }

        if (branch.toLowerCase() === 'main' || branch.toLowerCase() === 'master') {
          sendJson(res, 400, { error: 'Cannot autosync to main/master' })
          return
        }

        syncScope = normalizeAutosyncScope(scope)
        const currentBranch = getCurrentBranch(root)
        originalBranch = currentBranch
        targetBranch = branch

        // Switch branch if needed
        if (branch !== currentBranch) {
          const hadChanges = hasUncommittedChanges(root)
          if (hadChanges) {
            git(['stash', 'push', '-u', '-m', 'autosync: pre-switch stash'], root)
          }

          try {
            git(['checkout', branch], root)
          } catch {
            git(['checkout', '-b', branch], root)
          }

          if (hadChanges) {
            try {
              git(['stash', 'apply'], root)
            } catch {
              // Stash apply failed (conflicts) — abort: go back to original branch
              try { git(['checkout', currentBranch], root) } catch { /* best effort */ }
              stopWatcher()
              sendJson(res, 409, { error: 'Stash apply failed — conflicts detected. Returned to original branch.' })
              return
            }
          }
        }

        autosyncEnabled = true
        lastError = null

        // Run an immediate sync — only start the interval watcher if it succeeds
        const ok = runSyncCycle(root)
        if (ok) {
          startWatcher(root)
        }

        sendJson(res, 200, {
          enabled: autosyncEnabled,
          branch: getCurrentBranch(root),
          targetBranch,
          originalBranch,
          scope: syncScope,
          lastError,
        })
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // POST /disable — disable autosync
    if (routePath === '/disable' && method === 'POST') {
      stopWatcher()
      targetBranch = null
      lastError = null
      sendJson(res, 200, {
        enabled: false,
        branch: getCurrentBranch(root),
        scope: syncScope,
      })
      return
    }

    // POST /sync — manual single sync cycle
    if (routePath === '/sync' && method === 'POST') {
      try {
        syncScope = normalizeAutosyncScope(body?.scope || syncScope)
        const ok = runSyncCycle(root, syncScope)
        sendJson(res, ok ? 200 : 500, {
          ok,
          scope: syncScope,
          lastSyncTime,
          lastError,
          branch: getCurrentBranch(root),
        })
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    sendJson(res, 404, { error: `Unknown autosync route: ${method} ${routePath}` })
  }
}
