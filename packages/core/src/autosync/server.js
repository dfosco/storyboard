/**
 * Autosync Server — automatic commit + push watcher.
 *
 * Dev-server middleware that provides git automation:
 * - List branches (excluding main/master)
 * - Enable/disable autosync with branch switching
 * - Push watcher: every 30s commits changes, pulls --rebase, and pushes
 *
 * Routes (mounted at /_storyboard/autosync/):
 *   GET    /branches — list local git branches (excludes main/master)
 *   GET    /status   — current state (branch, enabled, last sync, errors)
 *   POST   /enable   — enable autosync (stash → checkout → apply → start watcher)
 *   POST   /disable  — disable autosync (stop watcher, stay on branch)
 *   POST   /sync     — trigger a single sync cycle manually
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

const SYNC_INTERVAL_MS = 30_000

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
    .filter(b => b && b !== 'main' && b !== 'master')
}

function hasUncommittedChanges(root) {
  const status = git(['status', '--porcelain'], root)
  return status.length > 0
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

// ── Sync cycle ──

/** Run a single sync cycle. Returns true on success, false on failure. */
function runSyncCycle(root) {
  if (syncing) return false
  syncing = true
  lastError = null

  try {
    if (hasUncommittedChanges(root)) {
      const username = getUsername(root)
      const time = formatTime()
      git(['add', '-A'], root)
      git(['commit', '-m', `${username} update at ${time}`], root)
    }

    const branch = getCurrentBranch(root)
    if (remoteBranchExists(root, branch)) {
      git(['pull', '--rebase', 'origin', branch], root)
    }
    git(['push', 'origin', branch], root)

    lastSyncTime = new Date().toISOString()
    return true
  } catch (err) {
    lastError = err.message || 'Sync failed'
    try { git(['rebase', '--abort'], root) } catch { /* not in rebase */ }
    stopWatcher()
    return false
  } finally {
    syncing = false
  }
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
        const { branch } = body || {}
        if (!branch) {
          sendJson(res, 400, { error: 'branch is required' })
          return
        }

        if (!isValidBranch(branch)) {
          sendJson(res, 400, { error: 'Invalid branch name' })
          return
        }

        if (branch === 'main' || branch === 'master') {
          sendJson(res, 400, { error: 'Cannot autosync to main/master' })
          return
        }

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
      })
      return
    }

    // POST /sync — manual single sync cycle
    if (routePath === '/sync' && method === 'POST') {
      try {
        const ok = runSyncCycle(root)
        sendJson(res, ok ? 200 : 500, {
          ok,
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
