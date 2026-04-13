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

// ANSI helpers
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const magenta = (s) => `\x1b[35m${s}\x1b[0m`
const cyan = (s) => `\x1b[36m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', '..', 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function helpScreen(version) {
  const d = dim('·')
  const b = dim
  const f = magenta

  const mascot = [
    `  ${b('╭─────────────────╮')}`,
    `  ${b('│')}  ${d}  ${f('◠')}  ${f('◡')}  ${f('◠')}  ${d}  ${b('│')}  ${bold('storyboard')} ${dim(`v${version}`)}`,
    `  ${b('│')}  ${d}  ${d}  ${d}  ${d}  ${d}  ${b('│')}  ${dim('A design tool for prototyping')}`,
    `  ${b('╰─────────────────╯')}`,
  ].join('\n')

  const cmd = (name, desc) => `    ${green(name.padEnd(17))}${desc}`

  const gettingStarted = [
    '',
    `  Welcome! Storyboard is a design tool to build and`,
    `  collaborate on prototypes. Here's how to get started:`,
    '',
    `    ${green('npx storyboard dev')}                Start developing locally`,
    `    ${green('npx storyboard create prototype')}   Create a prototype`,
    `    ${green('npx storyboard create canvas')}      Create a canvas`,
    '',
    `    ${dim('Using an AI assistant? You can also ask it to')}`,
    `    ${dim('"create a prototype" or "create a canvas" for you!')}`,
    '',
    `    ${dim('Docs:')} ${cyan('https://github.com/dfosco/storyboard/blob/main/README.md')}`,
  ].join('\n')

  const commands = [
    '',
    `  ${bold('All commands:')}`,
    '',
    `  ${bold(cyan('Development'))}`,
    cmd('dev', 'Start Vite dev server + update proxy'),
    cmd('create', 'Create a prototype or canvas'),
    cmd('exit', 'Stop all dev servers and proxy'),
    '',
    `  ${bold(cyan('Setup'))}`,
    cmd('setup', 'Install deps, Caddy proxy, start proxy'),
    cmd('proxy', 'Generate Caddyfile + start/reload Caddy'),
    '',
    `  ${bold(cyan('Updates'))}`,
    cmd('update', 'Update storyboard packages to latest'),
    cmd('update:<tag>', 'Update to a specific tag ' + dim('(beta, alpha, ...)')),
    '',
    `  ${dim('Usage:')} ${yellow('npx storyboard')} ${dim('<command>')}`,
    `  ${dim('Alias:')} ${yellow('npx sb')} ${dim('<command>')}`,
  ].join('\n')

  return `\n${mascot}\n${gettingStarted}\n${commands}\n`
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
  case 'create':
    import('./create.js')
    break
  case 'exit':
    import('./exit.js')
    break
  default: {
    if (command === 'update' || (command && command.startsWith('update:'))) {
      import('./updateVersion.js')
      break
    }
    const version = getVersion()

    if (command) {
      console.log(helpScreen(version))
      p.log.error(`Unknown command: ${bold(command)}`)
      process.exit(1)
    }

    console.log(helpScreen(version))
  }
}
