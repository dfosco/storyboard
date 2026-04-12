/**
 * storyboard dev — Start Vite with correct base path for the current worktree.
 *
 * Main:   VITE_BASE_PATH=/storyboard/  (default, unchanged)
 *         URL: http://storyboard.localhost/storyboard/
 *
 * Branch: VITE_BASE_PATH=/<branchname>/storyboard/
 *         URL: http://storyboard.localhost/<branchname>/storyboard/
 */

import { spawn, execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { detectWorktreeName, getPort } from '../worktree/port.js'

function readRepoName() {
  try {
    const configPath = resolve(process.cwd(), 'storyboard.config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    return config.repository?.name || 'storyboard'
  } catch {
    return 'storyboard'
  }
}

const worktreeName = detectWorktreeName()
const port = getPort(worktreeName)
const repoName = readRepoName()
const isMain = worktreeName === 'main'

// Build VITE_BASE_PATH: main keeps default, branches prepend worktree name
const basePath = isMain
  ? `/${repoName}/`
  : `/${worktreeName}/${repoName}/`

const proxyUrl = `http://storyboard.localhost${basePath}`
const directUrl = `http://localhost:${port}${basePath}`

console.log(`[storyboard] worktree: ${worktreeName}, port: ${port}`)
console.log(`[storyboard] base path: ${basePath}`)
console.log(`[storyboard] proxy URL: ${proxyUrl}`)
console.log(`[storyboard] direct URL: ${directUrl}`)
console.log()

// Try to reload Caddy proxy with updated routes
try {
  execSync('caddy reload --config .worktrees/Caddyfile 2>/dev/null', {
    stdio: 'ignore',
    timeout: 3000,
  })
  console.log('[storyboard] proxy reloaded ✓')
} catch {
  // Caddy not running or Caddyfile doesn't exist — that's fine
  console.log('[storyboard] proxy not running — use `storyboard setup` for clean URLs')
}

// Parse --port override from argv (skip 'dev' subcommand)
const args = process.argv.slice(3)
const portFlagIdx = args.indexOf('--port')
const overridePort = portFlagIdx >= 0 ? Number(args[portFlagIdx + 1]) : null

const extraArgs = args.filter((arg, i, arr) => {
  if (arg === '--port') return false
  if (i > 0 && arr[i - 1] === '--port') return false
  return true
})

const child = spawn('npx', ['vite', '--port', String(overridePort || port), ...extraArgs], {
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE_PATH: basePath },
})

child.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[storyboard] vite exited with code ${code}`)
  }
  process.exit(code ?? 0)
})
