#!/usr/bin/env node
/**
 * storyboard-dev — Smart Dev Server Launcher
 *
 * Detects whether the current working directory is inside a git worktree
 * and resolves the correct port from .worktrees/ports.json.
 *
 * Fallback: port 1234 (the default) if not in a worktree or no registry exists.
 *
 * Published as a bin in @dfosco/storyboard-core so client repos can use:
 *   npx storyboard-dev
 *
 * Or add to package.json scripts:
 *   "dev": "storyboard-dev"
 *
 * Accepts:
 *   --port N    Override port
 *   [any]       Extra args forwarded to vite
 */

import { spawn } from 'child_process'
import { detectWorktreeName, getPort } from './port.js'

const DEFAULT_PORT = 1234

// Parse --port override from argv
const portFlagIdx = process.argv.indexOf('--port')
const overridePort = portFlagIdx >= 0 ? Number(process.argv[portFlagIdx + 1]) : null

const worktreeName = detectWorktreeName()
const port = overridePort || getPort(worktreeName)

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

child.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[storyboard] vite exited with code ${code}`)
  }
  process.exit(code ?? 0)
})
