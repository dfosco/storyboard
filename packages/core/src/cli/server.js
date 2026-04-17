/**
 * storyboard server [branch] — Start the persistent Storyboard dev server.
 *
 * Manages Vite child processes and serves the /_storyboard/ API.
 * If a branch is given, also starts Vite for that branch immediately.
 *
 * Usage:
 *   storyboard server              # start server, detect branch from cwd
 *   storyboard server main         # start server + dev for main
 *   storyboard server my-feature   # start server + dev for my-feature
 */

import * as p from '@clack/prompts'
import { startServer, SERVER_PORT, spawnViteForBranch } from '../server/index.js'
import { parseFlags } from './flags.js'
import { readDevDomain, generateCaddyfile, generateRouteConfig, upsertCaddyRoute, isCaddyRunning } from './proxy.js'
import { detectWorktreeName, getPort } from '../worktree/port.js'

const flagSchema = {
  port: { type: 'number', description: 'Server port (default: 4100)' },
}

async function main() {
  const { flags, positional } = parseFlags(process.argv.slice(3), flagSchema)
  const port = flags.port || SERVER_PORT
  const branchArg = positional[0] || undefined

  p.intro('storyboard server')

  const devDomain = readDevDomain()

  // Register server itself with Caddy so it's reachable at the dev domain
  try {
    const serverRoute = generateRouteConfig({ __server__: port })
    if (isCaddyRunning()) {
      upsertCaddyRoute(serverRoute)
    }
  } catch { /* Caddy not available */ }

  const server = startServer(port)

  // Determine initial branch to start
  const initialBranch = branchArg || detectWorktreeName()
  const isMain = initialBranch === 'main'
  const basePath = isMain ? '/' : `/branch--${initialBranch}/`
  const proxyUrl = `http://${devDomain}${basePath}`

  p.log.step(`Starting dev session for ${initialBranch}...`)

  try {
    const entry = spawnViteForBranch(initialBranch)

    // Wait for ready
    const { waitForPort } = await import('../server/index.js')
    const ready = await waitForPort(entry.port)

    if (ready) {
      p.log.success(proxyUrl)
    } else {
      p.log.warning(`Vite started but may not be ready yet — check ${proxyUrl}`)
    }
  } catch (err) {
    p.log.error(`Failed to start dev for ${initialBranch}: ${err.message}`)
  }

  p.outro('Server running')
}

main()
