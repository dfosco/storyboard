/**
 * Smart Dev Server Launcher
 *
 * Detects whether the current working directory is inside a git worktree
 * and resolves the correct port from .worktrees/ports.json.
 *
 * Fallback: port 1234 (the default) if not in a worktree or no registry exists.
 *
 * Usage:
 *   node scripts/dev-server.js          # auto-detect worktree
 *   node scripts/dev-server.js --port N # override port
 */

import { spawn } from 'child_process'
import { basename, resolve, join } from 'path'
import { existsSync, readFileSync, realpathSync } from 'fs'
import { execSync } from 'child_process'

const DEFAULT_PORT = 1234

function detectWorktreeName() {
  try {
    // git rev-parse --show-toplevel gives us the worktree root.
    // If running inside .worktrees/<name>, the basename is the worktree name.
    const topLevel = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
    const realTop = realpathSync(topLevel)

    // Check if we're inside a .worktrees/<name> directory
    if (realTop.includes('.worktrees/') || realTop.includes('.worktrees\\')) {
      return basename(realTop)
    }

    // Also check the parent directory pattern
    const cwd = process.cwd()
    const realCwd = realpathSync(cwd)
    const worktreeMatch = realCwd.match(/\.worktrees[/\\]([^/\\]+)/)
    if (worktreeMatch) return worktreeMatch[1]

    return 'main'
  } catch {
    return 'main'
  }
}

function resolvePort(worktreeName) {
  // Look for ports.json in multiple locations:
  // 1. .worktrees/ports.json in the repo root (when running from main)
  // 2. ../../.worktrees/ports.json (when running from .worktrees/<name>/)
  // 3. ../ports.json (when cwd is inside .worktrees/<name>/)
  const candidates = [
    join(process.cwd(), '.worktrees', 'ports.json'),
    join(process.cwd(), '..', '..', '.worktrees', 'ports.json'),
    join(process.cwd(), '..', 'ports.json'),
  ]

  for (const portsFile of candidates) {
    try {
      const resolved = resolve(portsFile)
      if (existsSync(resolved)) {
        const raw = readFileSync(resolved, 'utf8')
        let ports
        try {
          ports = JSON.parse(raw)
        } catch {
          continue // Corrupted file — try next candidate
        }
        if (ports[worktreeName] != null) return ports[worktreeName]
      }
    } catch {
      // Continue to next candidate
    }
  }

  return DEFAULT_PORT
}

// Parse --port override from argv
const portFlagIdx = process.argv.indexOf('--port')
const overridePort = portFlagIdx >= 0 ? Number(process.argv[portFlagIdx + 1]) : null

const worktreeName = detectWorktreeName()
const port = overridePort || resolvePort(worktreeName)

console.log(`[storyboard] worktree: ${worktreeName}, port: ${port}`)

// Forward any extra args (excluding --port N) to vite
const extraArgs = process.argv.slice(2).filter((arg, i, arr) => {
  if (arg === '--port') return false
  if (i > 0 && arr[i - 1] === '--port') return false
  return true
})

const child = spawn('npx', ['vite', '--port', String(port), ...extraArgs], {
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => process.exit(code ?? 0))
