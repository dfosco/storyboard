/**
 * Autosync Server — automatic commit + push watcher.
 *
 * Dev-server middleware that provides git automation:
 * - List branches (excluding main/master)
 * - Enable/disable autosync per scope (canvas/prototype)
 * - Keep an isolated autosync worktree per target branch
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
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'

// ── Module-level watcher state (singleton, survives page reloads) ──

let schedulerInterval = null
let schedulerTimeout = null
let targetBranch = null
let originalBranch = null
let autosyncWorktreeRoot = null
let lastSyncTime = null
let lastError = null
let syncing = false
let syncingScope = null

let enabledScopes = { canvas: false, prototype: false }
let lastSyncByScope = { canvas: null, prototype: null }
let lastErrorByScope = { canvas: null, prototype: null }

const SYNC_INTERVAL_MS = 30_000
const PUSH_RETRY_LIMIT = 3
const AUTOSYNC_WORKTREE_DIR = 'autosync-worktrees'
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

function getGitCommonDir(root) {
  return resolve(root, git(['rev-parse', '--git-common-dir'], root))
}

export function getAutosyncWorktreeDirName(branch) {
  const safe = String(branch || 'branch')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '--')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return safe || 'branch'
}

function getAutosyncWorktreePath(root, branch) {
  return join(getGitCommonDir(root), AUTOSYNC_WORKTREE_DIR, getAutosyncWorktreeDirName(branch))
}

function removeAutosyncWorktree(root, worktreePath) {
  if (!worktreePath) return
  try {
    git(['worktree', 'remove', '--force', worktreePath], root)
  } catch {
    // Path may not be a registered worktree.
  }
  rmSync(worktreePath, { recursive: true, force: true })
}

function resetAutosyncWorktree(root, branch) {
  const worktreePath = getAutosyncWorktreePath(root, branch)
  removeAutosyncWorktree(root, worktreePath)

  mkdirSync(dirname(worktreePath), { recursive: true })
  const branchHead = git(['rev-parse', branch], root)
  git(['worktree', 'add', '--detach', worktreePath, branchHead], root)

  const worktreeHead = git(['rev-parse', 'HEAD'], worktreePath)
  if (worktreeHead !== branchHead) {
    throw new Error(`Autosync worktree init mismatch for ${branch}`)
  }

  autosyncWorktreeRoot = worktreePath
  return worktreePath
}

function clearAutosyncWorktree(root) {
  if (!autosyncWorktreeRoot) return
  removeAutosyncWorktree(root, autosyncWorktreeRoot)
  autosyncWorktreeRoot = null
}

function resolveScopedFilePath(root, file) {
  const absoluteRoot = resolve(root)
  const absoluteFile = resolve(absoluteRoot, file)
  if (absoluteFile !== absoluteRoot && !absoluteFile.startsWith(`${absoluteRoot}${sep}`)) {
    throw new Error(`Invalid scoped file path: ${file}`)
  }
  return absoluteFile
}

function syncScopedFilesToWorktree(sourceRoot, worktreeRoot, files) {
  for (const file of files) {
    const sourcePath = resolveScopedFilePath(sourceRoot, file)
    const targetPath = resolveScopedFilePath(worktreeRoot, file)

    if (!existsSync(sourcePath)) {
      rmSync(targetPath, { force: true })
      continue
    }

    mkdirSync(dirname(targetPath), { recursive: true })
    copyFileSync(sourcePath, targetPath)
  }
}

function hasScopedStagedChanges(root, files) {
  if (!files || files.length === 0) return false
  const changed = git(['diff', '--cached', '--name-only', '--', ...files], root)
  return changed.length > 0
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
  clearAutosyncWorktree(root)
  resetRuntimeState({ clearBranch })
  if (clearErrors) {
    lastError = null
    lastErrorByScope = { canvas: null, prototype: null }
  }
}

// ── Sync cycle ──

/** Run one scoped sync against the isolated autosync worktree. */
function runSyncCycle(root, scope) {
  if (syncing) return false
  syncing = true
  syncingScope = scope
  let cycleSucceeded = false

  try {
    if (!targetBranch) {
      throw new Error('Autosync branch is not configured')
    }
    if (!autosyncWorktreeRoot) {
      throw new Error('Autosync worktree is not initialized')
    }

    const scopedFiles = listScopedChangedFiles(root, scope)
    if (scopedFiles.length === 0) {
      cycleSucceeded = true
      return true
    }

    syncScopedFilesToWorktree(root, autosyncWorktreeRoot, scopedFiles)
    git(['add', '-A', '--', ...scopedFiles], autosyncWorktreeRoot)

    if (!hasScopedStagedChanges(autosyncWorktreeRoot, scopedFiles)) {
      cycleSucceeded = true
      return true
    }

    const username = getUsername(root)
    const time = formatTime()
    git(
      ['commit', '-m', `[auto:${scope}] ${username} update at ${time}`, '--', ...scopedFiles],
      autosyncWorktreeRoot,
    )

    for (let attempt = 1; attempt <= PUSH_RETRY_LIMIT; attempt += 1) {
      if (remoteBranchExists(root, targetBranch)) {
        git(['fetch', 'origin', targetBranch], autosyncWorktreeRoot)
        git(['rebase', 'FETCH_HEAD'], autosyncWorktreeRoot)
      }

      try {
        git(['push', 'origin', `HEAD:refs/heads/${targetBranch}`], autosyncWorktreeRoot)
        cycleSucceeded = true
        break
      } catch (pushErr) {
        if (!isRetryablePushError(pushErr?.message) || attempt === PUSH_RETRY_LIMIT) {
          throw pushErr
        }
      }
    }
  } catch (err) {
    lastError = err.message || 'Sync failed'
    lastErrorByScope[scope] = lastError
    try {
      if (autosyncWorktreeRoot) {
        git(['rebase', '--abort'], autosyncWorktreeRoot)
      }
    } catch {
      // no rebase in progress
    }
    stopAutosync(root, { clearBranch: false })
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

        const normalizedScope = normalizeAutosyncScope(scope)
        const hadEnabledScopes = hasAnyScopeEnabled()

        if (hadEnabledScopes && targetBranch !== branch) {
          sendJson(res, 409, { error: `Autosync is active on ${targetBranch}. Disable all scopes before switching branch.` })
          return
        }

        if (!hadEnabledScopes) {
          originalBranch = getCurrentBranch(root)
          targetBranch = branch
          // Recreate from selected branch HEAD so autosync starts from current branch tip.
          resetAutosyncWorktree(root, branch)
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
