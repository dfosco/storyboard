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
  default:
    console.log(`storyboard — dev tooling for Storyboard projects

Commands:
  storyboard dev              Start Vite dev server + update proxy
  storyboard setup            Install deps, Caddy, start proxy
  storyboard proxy            Generate Caddyfile + start/reload Caddy
  storyboard update:flag K V  Update a feature flag in storyboard.config.json
`)
    if (command) {
      console.error(`Unknown command: ${command}`)
      process.exit(1)
    }
}
