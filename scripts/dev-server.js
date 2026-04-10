/**
 * Smart Dev Server Launcher (root repo wrapper)
 *
 * Delegates to the core worktree port logic published in @dfosco/storyboard-core.
 * In the source repo, we import directly from the local package path so edits
 * take effect immediately. Client repos use `npx storyboard-dev` instead.
 *
 * Usage:
 *   node scripts/dev-server.js          # auto-detect worktree
 *   node scripts/dev-server.js --port N # override port
 */

import { spawn } from 'child_process'
import { detectWorktreeName, getPort } from '../packages/core/src/worktree/port.js'

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
