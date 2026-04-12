/**
 * storyboard setup — One-time setup for the Storyboard dev environment.
 *
 * Idempotent: safe to run multiple times, only does what's needed.
 *
 * Steps:
 *   1. npm install (if node_modules missing or stale)
 *   2. Install Homebrew (if missing — macOS/Linux)
 *   3. Install Caddy via brew (if missing)
 *   4. Install gh CLI via brew (if missing)
 *   5. Generate Caddyfile + start proxy
 */

import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { generateCaddyfile, isCaddyInstalled, isCaddyRunning, startCaddy, reloadCaddy } from './proxy.js'

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts })
}

function isInstalled(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function ensureBrew() {
  if (isInstalled('brew')) return true
  console.log('🍺 Homebrew not found — installing...')
  try {
    run('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
    // After install, brew may not be on PATH yet in the current shell
    const brewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew', '/home/linuxbrew/.linuxbrew/bin/brew']
    for (const p of brewPaths) {
      if (existsSync(p)) {
        process.env.PATH = `${p.replace(/\/brew$/, '')}:${process.env.PATH}`
        break
      }
    }
    console.log('🍺 Homebrew installed ✓')
    return true
  } catch {
    console.error('🍺 Failed to install Homebrew.')
    console.error('   Install manually: https://brew.sh')
    return false
  }
}

function brewInstall(pkg, label) {
  if (isInstalled(pkg)) {
    console.log(`${label} installed ✓`)
    return true
  }
  console.log(`${label} not found — installing via brew...`)
  try {
    run(`brew install ${pkg}`)
    console.log(`${label} installed ✓`)
    return true
  } catch {
    console.error(`${label} failed to install. Try manually: brew install ${pkg}`)
    return false
  }
}

console.log('[storyboard] Setting up dev environment...\n')

// 1. npm install
if (!existsSync('node_modules')) {
  console.log('📦 Installing dependencies...')
  run('npm install')
  console.log()
} else {
  console.log('📦 Dependencies installed ✓')
}

// 2. Ensure Homebrew
const hasBrew = ensureBrew()

if (hasBrew) {
  // 3. Install Caddy
  brewInstall('caddy', '🌐 Caddy')

  // 4. Install gh CLI (optional but auto-installed for turn-key experience)
  brewInstall('gh', '🔧 GitHub CLI')
}

// 5. Generate Caddyfile + start/reload proxy
console.log()
const caddyfilePath = generateCaddyfile()
console.log(`📝 Caddyfile written to ${caddyfilePath}`)

if (isCaddyInstalled()) {
  if (isCaddyRunning()) {
    console.log('🔄 Reloading proxy...')
    reloadCaddy(caddyfilePath)
  } else {
    console.log('🚀 Starting proxy (requires sudo for port 80)...')
    startCaddy(caddyfilePath)
  }
  console.log()
  console.log('✅ Setup complete! Run `storyboard dev` to start developing.')
  console.log('   URL: http://storyboard.localhost/storyboard/')
} else {
  console.log()
  console.log('⚠️  Setup partially complete — install Caddy for clean URLs.')
  console.log('   Without Caddy, use direct URLs with port numbers.')
}
