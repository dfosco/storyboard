/**
 * storyboard dev — Start Vite with correct base path for the current worktree.
 *
 * Main:   http://<devDomain>.localhost/
 * Branch: http://<devDomain>.localhost/branch--<name>/
 */

import * as p from '@clack/prompts'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { detectWorktreeName, getPort } from '../worktree/port.js'
import { generateCaddyfile, generateRouteConfig, upsertCaddyRoute, isCaddyRunning, reloadCaddy, readDevDomain } from './proxy.js'
import { startRenameWatcher } from '../rename-watcher/watcher.js'

async function main() {
  const worktreeName = detectWorktreeName()
  const port = getPort(worktreeName)
  const isMain = worktreeName === 'main'

  const basePath = isMain
    ? '/'
    : `/branch--${worktreeName}/`

  const domain = readDevDomain()
  const proxyUrl = `http://${domain}${basePath}`
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

  // Resolve Vite binary directly to skip npx overhead (~5s)
  const localVite = resolve(process.cwd(), 'node_modules', '.bin', 'vite')
  const useLocalVite = existsSync(localVite)

  // Start Vite — let it find a free port if assigned one is busy.
  // Capture stdout to detect actual port and update Caddy.
  const viteArgs = ['--port', String(overridePort || port), ...extraArgs]
  const child = useLocalVite
    ? spawn(localVite, viteArgs, {
        env: { ...process.env, VITE_BASE_PATH: basePath },
        stdio: ['inherit', 'pipe', 'pipe'],
      })
    : spawn('npx', ['vite', ...viteArgs], {
        env: { ...process.env, VITE_BASE_PATH: basePath },
        stdio: ['inherit', 'pipe', 'pipe'],
      })

  // Start rename watcher after Vite spawn (no need to block startup)
  const renameWatcher = startRenameWatcher(process.cwd())

  let caddyUpdated = false
  let ready = false
  let caddyRunning = null // cached result of isCaddyRunning()

  function getCaddyRunning() {
    if (caddyRunning === null) caddyRunning = isCaddyRunning()
    return caddyRunning
  }

  child.stdout.on('data', (data) => {
    const text = data.toString()

    // Detect Vite's actual listening port BEFORE filtering
    const portMatch = text.match(/localhost:(\d+)/)
    if (portMatch && !caddyUpdated) {
      const actualPort = Number(portMatch[1])
      caddyUpdated = true
      try {
        // Try admin API first (additive, doesn't wipe other repos' routes)
        const routeConfig = generateRouteConfig({ [worktreeName]: actualPort })
        if (getCaddyRunning() && upsertCaddyRoute(routeConfig)) {
          // Also write Caddyfile for future cold starts
          generateCaddyfile({ [worktreeName]: actualPort })
        } else {
          // Fall back to full Caddyfile reload
          const caddyfilePath = generateCaddyfile({ [worktreeName]: actualPort })
          if (getCaddyRunning()) {
            reloadCaddy(caddyfilePath)
          }
        }
      } catch {
        // Caddy not available
      }
    }

    // Suppress noisy Vite lines
    if (text.includes('[vite-plugin-svelte]') && text.includes('no Svelte config')) return
    if (text.includes('Port') && text.includes('is in use')) return
    if (text.includes('Forced re-optimization')) return
    if (text.includes('➜  Local:') || text.includes('➜  Network:')) return
    if (text.includes('press h + enter')) return

    if (text.includes('ready in') && !ready) {
      ready = true
      const timeMatch = text.match(/ready in (\d+)/i)
      const ms = timeMatch ? timeMatch[1] : ''

      if (getCaddyRunning()) {
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
    // Suppress svelte warnings from stderr during startup
    if (text.includes('[vite-plugin-svelte]')) return
    if (text.includes('svelte.dev/e/')) return
    if (text.includes('[generouted]')) return
    process.stderr.write(data)
  })

  child.on('exit', (code) => {
    renameWatcher.close()
    if (code && code !== 0 && !ready) {
      p.log.error(`Vite exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

main()
