/**
 * storyboard setup — One-time setup for the Storyboard dev environment.
 *
 * Idempotent: safe to run multiple times, only does what's needed.
 */

import * as p from '@clack/prompts'
import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { generateCaddyfile, isCaddyInstalled, isCaddyRunning, startCaddy, reloadCaddy } from './proxy.js'

// ANSI colors
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const magenta = (s) => `\x1b[35m${s}\x1b[0m`
const cyan = (s) => `\x1b[36m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

function mascot() {
  const d = dim('·')
  const f = magenta
  const b = dim
  const msg = `  ${bold('Happy prototyping!')} 🎨`
  return [
    `        ${b('╭─────────────────╮')}`,
    `        ${b('│')}  ${d}  ${f('◠')}  ${f('◡')}  ${f('◠')}  ${d}  ${b('│')}${msg}`,
    `        ${b('│')}  ${d}  ${d}  ${d}  ${d}  ${d}  ${b('│')}`,
    `        ${b('╰─────────────────╯')}`,
  ].join('\n')
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'pipe', ...opts })
}

function isInstalled(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

p.intro('storyboard setup')

// 1. Dependencies
const depSpin = p.spinner()
if (!existsSync('node_modules')) {
  depSpin.start('Installing dependencies...')
  try {
    run('npm install')
    depSpin.stop('Dependencies installed')
  } catch {
    depSpin.stop('Failed to install dependencies')
    p.log.error('Run `npm install` manually to debug.')
  }
} else {
  p.log.success('Dependencies installed')
}

// 2. Homebrew
let hasBrew = isInstalled('brew')
if (!hasBrew) {
  const brewSpin = p.spinner()
  brewSpin.start('Installing Homebrew...')
  try {
    run('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
    const brewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew', '/home/linuxbrew/.linuxbrew/bin/brew']
    for (const bp of brewPaths) {
      if (existsSync(bp)) {
        process.env.PATH = `${bp.replace(/\/brew$/, '')}:${process.env.PATH}`
        break
      }
    }
    hasBrew = true
    brewSpin.stop('Homebrew installed')
  } catch {
    brewSpin.stop('Failed to install Homebrew')
    p.log.warning('Install manually: https://brew.sh')
  }
}

// 3. Caddy
if (hasBrew) {
  if (isCaddyInstalled()) {
    p.log.success('Caddy proxy installed')
  } else {
    const caddySpin = p.spinner()
    caddySpin.start('Installing Caddy...')
    try {
      run('brew install caddy')
      caddySpin.stop('Caddy proxy installed')
    } catch {
      caddySpin.stop('Failed to install Caddy')
      p.log.warning('Install manually: brew install caddy')
    }
  }

  // 4. GitHub CLI
  if (isInstalled('gh')) {
    p.log.success('GitHub CLI installed')
  } else {
    const ghSpin = p.spinner()
    ghSpin.start('Installing GitHub CLI...')
    try {
      run('brew install gh')
      ghSpin.stop('GitHub CLI installed')
    } catch {
      ghSpin.stop('Failed to install GitHub CLI')
      p.log.warning('Install manually: brew install gh')
    }
  }
}

// 5. Proxy
if (isCaddyInstalled()) {
  const proxySpin = p.spinner()
  const caddyfilePath = generateCaddyfile()
  if (isCaddyRunning()) {
    proxySpin.start('Reloading proxy...')
    reloadCaddy(caddyfilePath)
    proxySpin.stop('Proxy reloaded')
  } else {
    proxySpin.start('Starting proxy (requires sudo for port 80)...')
    startCaddy(caddyfilePath)
    proxySpin.stop('Proxy started')
  }
}

p.note(
  [
    `${bold('Welcome!')} Storyboard is a design tool to build and`,
    `collaborate on prototypes. Here's how to get started:`,
    '',
    `  ${green('npx storyboard dev')}                Start developing locally`,
    `  ${green('npx storyboard create prototype')}   Create a prototype`,
    `  ${green('npx storyboard create canvas')}      Create a canvas`,
    '',
    `  ${dim('Using an AI assistant? You can also ask it to')}`,
    `  ${dim('"create a prototype" or "create a canvas" for you!')}`,
    '',
    `  ${dim('Docs:')} ${cyan('https://github.com/dfosco/storyboard/blob/main/README.md')}`,
    `  ${dim('PS: You can also use')} ${green('npx sb ...')} ${dim('for shorter commands')}`,
  ].join('\n'),
  'Getting started'
)

console.log()
console.log(mascot())

p.outro('')
