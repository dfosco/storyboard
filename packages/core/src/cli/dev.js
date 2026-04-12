/**
 * storyboard dev — Start Vite with correct base path for the current worktree.
 *
 * Main:   VITE_BASE_PATH=/storyboard/  (default, unchanged)
 *         URL: http://storyboard.localhost/storyboard/
 *
 * Branch: VITE_BASE_PATH=/<branchname>/storyboard/
 *         URL: http://storyboard.localhost/<branchname>/storyboard/
 */

import { spawn } from 'child_process'
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

async function main() {
  const worktreeName = detectWorktreeName()
  const port = getPort(worktreeName)
  const repoName = readRepoName()
  const isMain = worktreeName === 'main'

  const basePath = isMain
    ? '/'
    : `/branch--${worktreeName}/`

  const proxyUrl = `http://storyboard.localhost${basePath}`

  // Parse --port override from argv (skip 'dev' subcommand)
  const args = process.argv.slice(3)
  const portFlagIdx = args.indexOf('--port')
  const overridePort = portFlagIdx >= 0 ? Number(args[portFlagIdx + 1]) : null

  const extraArgs = args.filter((arg, i, arr) => {
    if (arg === '--port') return false
    if (i > 0 && arr[i - 1] === '--port') return false
    return true
  })

  // Start Vite — let it find a free port if assigned one is busy.
  // We capture stdout to detect the actual port and update Caddy.
  const child = spawn('npx', ['vite', '--port', String(overridePort || port), ...extraArgs], {
    env: { ...process.env, VITE_BASE_PATH: basePath },
    stdio: ['inherit', 'pipe', 'inherit'],
  })

  let caddyUpdated = false

  child.stdout.on('data', (data) => {
    const line = data.toString()

    // Suppress noisy Vite lines
    if (line.includes('[vite-plugin-svelte]') && line.includes('no Svelte config')) return
    if (line.includes('Port') && line.includes('is in use')) return
    if (line.includes('Forced re-optimization')) return

    // Detect Vite's actual listening port and update Caddy
    const portMatch = line.match(/localhost:(\d+)/)
    if (portMatch && !caddyUpdated) {
      const actualPort = Number(portMatch[1])
      caddyUpdated = true
      try {
        const caddyfilePath = generateCaddyfile({ [worktreeName]: actualPort })
        if (isCaddyRunning()) {
          reloadCaddy(caddyfilePath)
        }
      } catch {
        // Caddy not available — direct URL still works
      }
      // Print the clean proxy URL instead of Vite's default
      process.stdout.write(`\n  ➜  ${proxyUrl}\n`)
    }

    // Pass through other Vite output (HMR updates, errors, etc.)
    // but skip the default Local/Network lines since we print our own URL
    if (line.includes('➜  Local:') || line.includes('➜  Network:')) return
    process.stdout.write(data)
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[storyboard] vite exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

main()
