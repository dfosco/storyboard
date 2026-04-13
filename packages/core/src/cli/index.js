#!/usr/bin/env node
/**
 * storyboard CLI — unified dev tooling for Storyboard projects.
 *
 * Commands:
 *   storyboard dev              Start Vite dev server + update proxy
 *   storyboard setup            Install deps, Caddy, start proxy
 *   storyboard proxy            Generate Caddyfile + start/reload Caddy
 *   storyboard update:version   Update @dfosco/storyboard-* packages to latest
 *   storyboard update:beta      Update to latest beta
 *   storyboard update:alpha     Update to latest alpha
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
  case 'update':
  case 'update:version':
  case 'update:beta':
  case 'update:alpha':
    import('./updateVersion.js')
    break
  case 'create':
    import('./create.js')
    break
  case 'exit':
    import('./exit.js')
    break
  default: {
    const version = getVersion()
    p.intro(`storyboard v${version}`)
    p.log.message(`Commands:
  dev              Start Vite dev server + update proxy
  create           Create a prototype or canvas
  setup            Install deps, Caddy proxy, start proxy
  proxy            Generate Caddyfile + start/reload Caddy
  exit             Stop all dev servers and proxy
  update             Update storyboard packages to latest
  update:version V   Update to specific version V
  update:beta        Update to latest beta
  update:alpha       Update to latest alpha`)

    if (command) {
      p.log.error(`Unknown command: ${command}`)
      process.exit(1)
    }
    p.outro('Run: npx storyboard <command>')
  }
}
