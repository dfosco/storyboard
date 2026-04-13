/**
 * Worktree Port Registry
 *
 * Manages a JSON registry (.worktrees/ports.json) that maps worktree names
 * to unique dev-server ports. Main always gets 1234; worktrees get 1235+.
 *
 * This module is published as part of @dfosco/storyboard-core so client
 * repos can use port detection without duplicating the logic.
 *
 * Programmatic API:
 *   import { getPort, detectWorktreeName, resolvePort } from '@dfosco/storyboard-core/worktree/port'
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'fs'
import { join, dirname, basename } from 'path'
import { execSync } from 'child_process'

const BASE_PORT = 1234

/**
 * Resolve the path to .worktrees/ports.json.
 *
 * Derives the repo root from directory structure so it works whether
 * running from the repo root or from inside .worktrees/<name>/ — even
 * when ports.json does not exist yet.
 *
 * @param {string} [cwd] — override working directory
 * @returns {string} absolute path to ports.json
 */
export function portsFilePath(cwd = process.cwd()) {
  const realCwd = realpathSync(cwd)

  // Check if we're inside .worktrees/<name>/
  const worktreeMatch = realCwd.match(/^(.+)[/\\]\.worktrees[/\\][^/\\]+/)
  if (worktreeMatch) {
    return join(worktreeMatch[1], '.worktrees', 'ports.json')
  }

  // We're at the repo root (or somewhere else) — default location
  return join(realCwd, '.worktrees', 'ports.json')
}

/**
 * Detect the worktree name from the current git context.
 *
 * Returns 'main' when not inside a .worktrees/<name>/ directory.
 */
export function detectWorktreeName() {
  try {
    const topLevel = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
    const realTop = realpathSync(topLevel)

    // Check if we're inside a .worktrees/<name> directory
    if (realTop.includes('.worktrees/') || realTop.includes('.worktrees\\')) {
      return basename(realTop)
    }

    // Also check the cwd pattern
    const realCwd = realpathSync(process.cwd())
    const worktreeMatch = realCwd.match(/\.worktrees[/\\]([^/\\]+)/)
    if (worktreeMatch) return worktreeMatch[1]

    // Not a worktree — check the current branch name
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    if (branch && branch !== 'main' && branch !== 'master') return branch

    return 'main'
  } catch {
    return 'main'
  }
}

/**
 * Get or assign a port for the given worktree name.
 *
 * Creates .worktrees/ports.json if it doesn't exist. Assigns ports
 * starting at BASE_PORT+1 (1235) for non-main worktrees.
 *
 * @param {string} worktreeName
 * @returns {number}
 */
export function getPort(worktreeName) {
  const portsFile = portsFilePath()
  const dir = dirname(portsFile)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  let ports = { main: BASE_PORT }
  if (existsSync(portsFile)) {
    try {
      ports = JSON.parse(readFileSync(portsFile, 'utf8'))
    } catch {
      // Corrupted file — start fresh
    }
  }

  if (worktreeName === 'main') return ports.main || BASE_PORT

  if (!ports[worktreeName]) {
    const usedPorts = Object.values(ports)
    let nextPort = BASE_PORT + 1
    while (usedPorts.includes(nextPort)) nextPort++
    ports[worktreeName] = nextPort
    writeFileSync(portsFile, JSON.stringify(ports, null, 2) + '\n')
  }

  return ports[worktreeName]
}

/**
 * Resolve the port for a worktree from .worktrees/ports.json
 * without assigning a new one if missing.
 *
 * @param {string} worktreeName
 * @returns {number}
 */
export function resolvePort(worktreeName) {
  const portsFile = portsFilePath()
  if (!existsSync(portsFile)) return BASE_PORT

  try {
    const ports = JSON.parse(readFileSync(portsFile, 'utf8'))
    return ports[worktreeName] ?? BASE_PORT
  } catch {
    return BASE_PORT
  }
}

/**
 * Slugify a branch name for filesystem and subdomain safety.
 *
 * - lowercase
 * - dots, spaces, underscores, non-alphanumeric (except - and /) → hyphens
 * - collapse consecutive hyphens
 * - trim leading/trailing hyphens per segment
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9/-]/g, '-')
    .replace(/-{2,}/g, '-')
    .split('/')
    .map((s) => s.replace(/^-+|-+$/g, ''))
    .join('/')
}
