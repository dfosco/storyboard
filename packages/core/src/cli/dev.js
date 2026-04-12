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
import { createServer } from 'net'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { detectWorktreeName, getPort } from '../worktree/port.js'
import { generateCaddyfile, isCaddyRunning, reloadCaddy } from './proxy.js'

function readRepoName() {
  try {
    const configPath = resolve(process.cwd(), 'storyboard.config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    return config.repository?.name || 'storyboard'
  } catch {
    return 'storyboard'
  }
}

/** Check if a port is available by trying to bind it briefly. */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => { server.close(); resolve(true) })
    server.listen(port, '127.0.0.1')
  })
}

async function main() {
  const worktreeName = detectWorktreeName()
  let port = getPort(worktreeName)
  const repoName = readRepoName()
  const isMain = worktreeName === 'main'

  // Ensure assigned port is actually free — if not, find next available
  if (!(await isPortFree(port))) {
    const originalPort = port
    while (!(await isPortFree(port))) port++
    console.log(`[storyboard] port ${originalPort} in use, using ${port}`)
  }

  const basePath = isMain
    ? `/${repoName}/`
    : `/${worktreeName}/${repoName}/`

  const proxyUrl = `http://storyboard.localhost${basePath}`

  // Update Caddyfile with correct port and reload if running
  try {
    const caddyfilePath = generateCaddyfile({ [worktreeName]: port })
    if (isCaddyRunning()) {
      reloadCaddy(caddyfilePath)
    }
  } catch {
    // Caddy not available — that's fine, direct URL still works
  }

  console.log()
  console.log(`  ➜  ${proxyUrl}`)
  console.log()

  // Parse --port override from argv (skip 'dev' subcommand)
  const args = process.argv.slice(3)
  const portFlagIdx = args.indexOf('--port')
  const overridePort = portFlagIdx >= 0 ? Number(args[portFlagIdx + 1]) : null

  const extraArgs = args.filter((arg, i, arr) => {
    if (arg === '--port') return false
    if (i > 0 && arr[i - 1] === '--port') return false
    return true
  })

  const child = spawn('npx', ['vite', '--port', String(overridePort || port), '--strictPort', ...extraArgs], {
    stdio: 'inherit',
    env: { ...process.env, VITE_BASE_PATH: basePath },
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[storyboard] vite exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

main()
