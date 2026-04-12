/**
 * storyboard dev — Start Vite with correct base path for the current worktree.
 *
 * Main:   http://storyboard.localhost/
 * Branch: http://storyboard.localhost/branch--<name>/
 */

import * as p from '@clack/prompts'
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
  const isMain = worktreeName === 'main'

  const basePath = isMain
    ? '/'
    : `/branch--${worktreeName}/`

  const proxyUrl = `http://storyboard.localhost${basePath}`
  const directUrl = `http://localhost:${port}${basePath}`

  p.intro('storyboard dev')

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
  // Capture stdout to detect actual port and update Caddy.
  const child = spawn('npx', ['vite', '--port', String(overridePort || port), ...extraArgs], {
    env: { ...process.env, VITE_BASE_PATH: basePath },
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  let caddyUpdated = false
  let ready = false

  child.stdout.on('data', (data) => {
    const text = data.toString()

    // Suppress noisy Vite lines
    if (text.includes('[vite-plugin-svelte]') && text.includes('no Svelte config')) return
    if (text.includes('Port') && text.includes('is in use')) return
    if (text.includes('Forced re-optimization')) return
    if (text.includes('➜  Local:') || text.includes('➜  Network:')) return
    if (text.includes('press h + enter')) return

    // Detect Vite ready and show clean URL
    const portMatch = text.match(/localhost:(\d+)/)
    if (portMatch && !caddyUpdated) {
      const actualPort = Number(portMatch[1])
      caddyUpdated = true
      try {
        const caddyfilePath = generateCaddyfile({ [worktreeName]: actualPort })
        if (isCaddyRunning()) {
          reloadCaddy(caddyfilePath)
        }
      } catch {
        // Caddy not available
      }
    }

    if (text.includes('ready in') && !ready) {
      ready = true
      const timeMatch = text.match(/ready in (\d+)/i)
      const ms = timeMatch ? timeMatch[1] : ''

      if (isCaddyRunning()) {
        p.log.success(proxyUrl)
      } else {
        p.log.success(directUrl)
        p.log.warning('Proxy not running — run `npx storyboard setup` for clean URLs')
      }
      p.outro(`Ready${ms ? ` in ${ms}ms` : ''} — press h + enter for help`)

      // After ready, pipe stdout directly so Vite keyboard shortcuts work
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      return
    }

    // Before ready, pass through other output (shouldn't happen but just in case)
    if (!ready) return
  })

  child.stderr.on('data', (data) => {
    if (ready) return // piped directly after ready
    const text = data.toString()
    // Suppress svelte config noise from stderr during startup
    if (text.includes('[vite-plugin-svelte]') && text.includes('no Svelte config')) return
    if (text.includes('[generouted]')) return
    process.stderr.write(data)
  })

  child.on('exit', (code) => {
    if (code && code !== 0 && !ready) {
      p.log.error(`Vite exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

main()
