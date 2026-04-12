#!/usr/bin/env node
/**
 * storyboard CLI — unified dev tooling for Storyboard projects.
 *
 * Commands:
 *   storyboard dev              Start Vite dev server + update proxy
 *   storyboard setup            Install deps, Caddy, start proxy
 *   storyboard proxy            Generate Caddyfile + start/reload Caddy
 *   storyboard update:flag K V  Update a feature flag in storyboard.config.json
 *
 * Aliases: `sb` is equivalent to `storyboard`.
 */

import * as p from '@clack/prompts'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', '..', 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const command = process.argv[2]

switch (command) {
  case 'dev':
    import('./dev.js')
    break
  case 'setup':
    import('./setup.js')
    break
  case 'proxy':
    import('./proxy.js')
    break
  case 'update:flag':
    import('./updateFlag.js')
    break
  case 'exit':
    import('./exit.js')
    break
  default: {
    const version = getVersion()
    p.intro(`storyboard v${version}`)
    p.log.message(`Commands:
  dev              Start Vite dev server + update proxy
  setup            Install deps, Caddy proxy, start proxy
  proxy            Generate Caddyfile + start/reload Caddy
  exit             Stop all dev servers and proxy
  update:flag K V  Update a feature flag`)

    if (command) {
      p.log.error(`Unknown command: ${command}`)
      process.exit(1)
    }
    p.outro('Run: npx storyboard <command>')
  }
}
