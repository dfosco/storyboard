/**
 * Autosync Server — automatic commit + push watcher.
 *
 * Dev-server middleware that provides git automation:
 * - List branches (excluding main/master)
 * - Enable/disable autosync per scope (canvas/prototype)
 * - Direct commit + push on the current branch (scoped files only)
 * - Push watcher: every 30s runs enabled scopes in relay sequence
 *
 * Routes (mounted at /_storyboard/autosync/):
 *   GET    /branches — list local git branches (excludes main/master)
 *   GET    /status   — current state (branch, enabled scopes, last sync/errors)
 *   POST   /enable   — enable autosync for a scope on a branch
 *   POST   /disable  — disable autosync for a scope (or all scopes)
 *   POST   /sync     — trigger a single sync cycle manually
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── Module-level watcher state (singleton, survives page reloads) ──

let schedulerInterval = null
let schedulerTimeout = null
let targetBranch = null
let originalBranch = null
let lastSyncTime = null
let lastError = null
let syncing = false
let syncingScope = null

let enabledScopes = { canvas: false, prototype: false }
let lastSyncByScope = { canvas: null, prototype: null }
let lastErrorByScope = { canvas: null, prototype: null }

const SYNC_INTERVAL_MS = 30_000
const PUSH_RETRY_LIMIT = 3
const SCOPE_ORDER = ['canvas', 'prototype']
const AUTOSYNC_SCOPES = new Set(SCOPE_ORDER)

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
    .map((b) => b.trim())
    .filter((b) => b && b.toLowerCase() !== 'main' && b.toLowerCase() !== 'master')
}

function getGitDir(root) {
  return resolve(root, git(['rev-parse', '--git-dir'], root))
}

function hasScopedStagedChanges(root, files) {
  if (!files || files.length === 0) return false
  const changed = git(['diff', '--cached', '--name-only', '--', ...files], root)
  return changed.length > 0
}

function listChangedFiles(root) {
  const tracked = git(['diff', '--name-only'], root)
  const untracked = git(['ls-files', '--others', '--exclude-standard'], root)
  return [tracked, untracked]
    .flatMap((raw) => raw.split('\n'))
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file, idx, arr) => arr.indexOf(file) === idx)
}

// ── Repo-busy guards ──

/**
 * Check if the repo is in a state where autosync should defer.
 * Returns { busy: true, reason } if unsafe, { busy: false } otherwise.
 */
export function isRepoBusy(root) {
  const gitDir = getGitDir(root)

  if (existsSync(join(gitDir, 'index.lock'))) {
    return { busy: true, reason: 'index.lock exists — another git process is active' }
  }
  if (existsSync(join(gitDir, 'rebase-merge')) || existsSync(join(gitDir, 'rebase-apply'))) {
    return { busy: true, reason: 'rebase in progress' }
  }
  if (existsSync(join(gitDir, 'MERGE_HEAD'))) {
    return { busy: true, reason: 'merge in progress' }
  }
  if (existsSync(join(gitDir, 'CHERRY_PICK_HEAD'))) {
    return { busy: true, reason: 'cherry-pick in progress' }
  }

  if (targetBranch && getCurrentBranch(root) !== targetBranch) {
    return { busy: true, reason: `branch drift: expected ${targetBranch}, on ${getCurrentBranch(root)}` }
  }

  return { busy: false }
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
    file.endsWith('.canvas.jsonl') ||
    file.startsWith('assets/.storyboard-public/')
  )
}

export function filterFilesForAutosyncScope(scope, files) {
  return (files || []).filter((file) => matchesAutosyncScope(scope, file))
}

function listScopedChangedFiles(root, scope) {
  return filterFilesForAutosyncScope(scope, listChangedFiles(root))
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

function hasAnyScopeEnabled() {
  return enabledScopes.canvas || enabledScopes.prototype
}

function getEnabledScopesInOrder() {
  return SCOPE_ORDER.filter((scope) => enabledScopes[scope])
}

function stopScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout)
    schedulerTimeout = null
  }
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

function getAlignedDelay() {
  const remainder = Date.now() % SYNC_INTERVAL_MS
  return remainder === 0 ? SYNC_INTERVAL_MS : SYNC_INTERVAL_MS - remainder
}

function resetRuntimeState({ clearBranch = true } = {}) {
  enabledScopes = { canvas: false, prototype: false }
  syncing = false
  syncingScope = null
  if (clearBranch) {
    targetBranch = null
    originalBranch = null
  }
}

/** Undo a commit that was never pushed, leaving files staged then unstaged. */
function rollbackUnpushedCommit(root, scopedFiles) {
  try {
    git(['reset', '--soft', 'HEAD~1'], root)
    git(['reset', '--', ...scopedFiles], root)
  } catch {
    // Best-effort rollback; if this fails the user's tree is still valid.
  }
}

function buildStatusPayload(root) {
  const singleScope = enabledScopes.canvas === enabledScopes.prototype
    ? null
    : (enabledScopes.canvas ? 'canvas' : 'prototype')

  return {
    enabled: hasAnyScopeEnabled(),
    enabledScopes: { ...enabledScopes },
    scope: singleScope, // legacy field for older clients
    branch: getCurrentBranch(root),
    targetBranch,
    originalBranch,
    availableScopes: [...AUTOSYNC_SCOPES],
    lastSyncTime,
    lastSyncByScope: { ...lastSyncByScope },
    lastError,
    lastErrorByScope: { ...lastErrorByScope },
    syncing,
    syncingScope,
  }
}

function stopAutosync(root, { clearBranch = true, clearErrors = false } = {}) {
  stopScheduler()
  resetRuntimeState({ clearBranch })
  if (clearErrors) {
    lastError = null
    lastErrorByScope = { canvas: null, prototype: null }
  }
}

// ── Sync cycle ──

/** Run one scoped sync — stage, commit, and push scoped files directly. */
function runSyncCycle(root, scope) {
  if (syncing) return false
  syncing = true
  syncingScope = scope
  let cycleSucceeded = false
  let committed = false
  let scopedFiles = []

  try {
    if (!targetBranch) {
      throw new Error('Autosync branch is not configured')
    }

    // Guard: skip if repo is busy (index lock, rebase, merge, branch drift)
    const busy = isRepoBusy(root)
    if (busy.busy) {
      cycleSucceeded = true // defer, not failure
      return true
    }

    scopedFiles = listScopedChangedFiles(root, scope)
    if (scopedFiles.length === 0) {
      cycleSucceeded = true
      return true
    }

    // Guard: skip if scoped files already have user-staged changes
    if (hasScopedStagedChanges(root, scopedFiles)) {
      cycleSucceeded = true // defer, not failure
      return true
    }

    git(['add', '-A', '--', ...scopedFiles], root)

    if (!hasScopedStagedChanges(root, scopedFiles)) {
      cycleSucceeded = true
      return true
    }

    const username = getUsername(root)
    const time = formatTime()
    git(
      ['commit', '-m', `[auto:${scope}] ${username} update at ${time}`, '--', ...scopedFiles],
      root,
    )
    committed = true

    for (let attempt = 1; attempt <= PUSH_RETRY_LIMIT; attempt += 1) {
      // Re-check guards before push/rebase
      const pushBusy = isRepoBusy(root)
      if (pushBusy.busy) {
        rollbackUnpushedCommit(root, scopedFiles)
        committed = false
        cycleSucceeded = true // defer
        return true
      }

      try {
        git(['push', 'origin', `HEAD:refs/heads/${targetBranch}`], root)
        cycleSucceeded = true
        break
      } catch (pushErr) {
        if (!isRetryablePushError(pushErr?.message) || attempt === PUSH_RETRY_LIMIT) {
          throw pushErr
        }

        // Fetch and rebase with autostash to handle non-fast-forward
        try {
          git(['fetch', 'origin', targetBranch], root)
          git(['rebase', '--autostash', 'FETCH_HEAD'], root)
        } catch {
          // Rebase failed — abort and defer
          try { git(['rebase', '--abort'], root) } catch { /* no rebase in progress */ }
          rollbackUnpushedCommit(root, scopedFiles)
          committed = false
          cycleSucceeded = true // defer, try again next cycle
          return true
        }
      }
    }
  } catch (err) {
    lastError = err.message || 'Sync failed'
    lastErrorByScope[scope] = lastError

    // Rollback the commit if we made one but never pushed
    if (committed) {
      rollbackUnpushedCommit(root, scopedFiles)
    }
  } finally {
    if (cycleSucceeded) {
      const nowIso = new Date().toISOString()
      lastSyncTime = nowIso
      lastSyncByScope[scope] = nowIso
      lastErrorByScope[scope] = null
      lastError = null
    }
    syncing = false
    syncingScope = null
  }

  return cycleSucceeded
}

function runRelayCycle(root, scopes = getEnabledScopesInOrder()) {
  if (syncing || scopes.length === 0) return true

  let ok = true
  let firstRelaySyncTime = null

  for (const scope of scopes) {
    if (!runSyncCycle(root, scope)) {
      ok = false
      break
    }

    if (!firstRelaySyncTime && lastSyncByScope[scope]) {
      firstRelaySyncTime = lastSyncByScope[scope]
    }
  }

  // Keep a single "last sync" timestamp for relay cycles — the first synced scope.
  if (firstRelaySyncTime) {
    lastSyncTime = firstRelaySyncTime
  }

  return ok
}

function startScheduler(root) {
  if (schedulerInterval || schedulerTimeout) return
  schedulerTimeout = setTimeout(() => {
    schedulerTimeout = null
    runRelayCycle(root)
    schedulerInterval = setInterval(() => runRelayCycle(root), SYNC_INTERVAL_MS)
  }, getAlignedDelay())
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
        sendJson(res, 200, buildStatusPayload(root))
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // POST /enable — enable autosync for a scope
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

        const currentBranch = getCurrentBranch(root)
        if (branch !== currentBranch) {
          sendJson(res, 400, {
            error: `Autosync requires you to be on the target branch. Current: ${currentBranch}, requested: ${branch}`,
          })
          return
        }

        const normalizedScope = normalizeAutosyncScope(scope)
        const hadEnabledScopes = hasAnyScopeEnabled()

        if (hadEnabledScopes && targetBranch !== branch) {
          sendJson(res, 409, { error: `Autosync is active on ${targetBranch}. Disable all scopes before switching branch.` })
          return
        }

        if (!hadEnabledScopes) {
          originalBranch = currentBranch
          targetBranch = branch
        }

        enabledScopes[normalizedScope] = true
        lastErrorByScope[normalizedScope] = null
        startScheduler(root)

        // Immediate first sync for the enabled scope.
        runSyncCycle(root, normalizedScope)
        sendJson(res, 200, buildStatusPayload(root))
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // POST /disable — disable one scope or all scopes
    if (routePath === '/disable' && method === 'POST') {
      try {
        const requestedScope = body?.scope
        if (requestedScope) {
          const normalizedScope = normalizeAutosyncScope(requestedScope)
          enabledScopes[normalizedScope] = false
        } else {
          enabledScopes = { canvas: false, prototype: false }
        }

        if (!hasAnyScopeEnabled()) {
          stopAutosync(root, { clearBranch: true, clearErrors: true })
        }

        sendJson(res, 200, buildStatusPayload(root))
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    // POST /sync — manual single relay cycle
    if (routePath === '/sync' && method === 'POST') {
      try {
        if (syncing) {
          sendJson(res, 409, { error: 'Autosync is already running' })
          return
        }

        let ok = true
        if (body?.scope) {
          const scope = normalizeAutosyncScope(body.scope)
          ok = runSyncCycle(root, scope)
        } else {
          ok = runRelayCycle(root)
        }

        sendJson(res, ok ? 200 : 500, {
          ok,
          ...buildStatusPayload(root),
        })
      } catch (err) {
        sendJson(res, 500, { error: err.message })
      }
      return
    }

    sendJson(res, 404, { error: `Unknown autosync route: ${method} ${routePath}` })
  }
}
