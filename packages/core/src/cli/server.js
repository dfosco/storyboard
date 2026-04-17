/**
 * storyboard server — Start the persistent Storyboard dev server.
 *
 * Manages Vite child processes and serves the /_storyboard/ API.
 * Start once; then use `storyboard dev <branch>` or the UI to switch branches.
 *
 * Usage:
 *   storyboard server              # start on default port (4100)
 *   storyboard server --port 4200  # custom port
 */

import * as p from '@clack/prompts'
import { startServer, SERVER_PORT } from '../server/index.js'
import { parseFlags } from './flags.js'
import { readDevDomain } from './proxy.js'

const flagSchema = {
  port: { type: 'number', description: 'Server port (default: 4100)' },
}

function main() {
  const { flags } = parseFlags(process.argv.slice(2), flagSchema)
  const port = flags.port || SERVER_PORT

  p.intro('storyboard server')

  const devDomain = readDevDomain()
  p.log.info(`Dev domain: ${devDomain}`)

  startServer(port)

  p.log.success(`Server running on http://localhost:${port}`)
  p.log.info(`API: http://localhost:${port}/_storyboard/`)
  p.log.info(`Switch branches: POST http://localhost:${port}/_storyboard/switch-branch`)
  p.outro('Press Ctrl+C to stop')
}

main()
