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
 *
 * CLI:
 *   node -e "import('@dfosco/storyboard-core/worktree/port').then(m => console.log(m.getPort('my-branch')))"
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'fs'
import { join, resolve, dirname, basename } from 'path'
import { execSync } from 'child_process'

const BASE_PORT = 1234

/**
 * Resolve the path to .worktrees/ports.json.
 *
 * Searches up from cwd for a .worktrees/ directory. This works whether
 * running from the repo root (main checkout) or from inside a worktree
 * (.worktrees/<name>/).
 *
 * @param {string} [cwd] — override working directory
 * @returns {string} absolute path to ports.json
 */
export function portsFilePath(cwd = process.cwd()) {
  // When running from .worktrees/<name>/, the parent dir is .worktrees/
  const candidates = [
    join(cwd, '.worktrees', 'ports.json'),          // repo root
    join(cwd, '..', 'ports.json'),                   // inside .worktrees/<name>/
    join(cwd, '..', '..', '.worktrees', 'ports.json'), // inside .worktrees/<name>/subdir
  ]
  for (const c of candidates) {
    const abs = resolve(c)
    if (existsSync(abs)) return abs
  }
  // Default: create under repo root
  return join(cwd, '.worktrees', 'ports.json')
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
 * Resolve the port for the current worktree from .worktrees/ports.json
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
