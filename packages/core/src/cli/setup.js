/**
 * storyboard setup — One-time setup for the Storyboard dev environment.
 *
 * Idempotent: safe to run multiple times, only does what's needed.
 *
 * Steps:
 *   1. npm install (if node_modules missing or stale)
 *   2. Check for gh CLI (print instructions if missing)
 *   3. Install Caddy via brew (if missing)
 *   4. Generate Caddyfile + start proxy
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

console.log('[storyboard] Setting up dev environment...\n')

// 1. npm install
if (!existsSync('node_modules')) {
  console.log('📦 Installing dependencies...')
  run('npm install')
  console.log()
} else {
  console.log('📦 Dependencies installed ✓')
}

// 2. Check gh CLI
if (isInstalled('gh')) {
  console.log('🔧 GitHub CLI installed ✓')
} else {
  console.log('🔧 GitHub CLI not found — install with: brew install gh')
  console.log('   (optional, used for autosync and GitHub embed features)')
}

// 3. Install Caddy
if (isCaddyInstalled()) {
  console.log('🌐 Caddy installed ✓')
} else {
  console.log('🌐 Installing Caddy...')
  try {
    run('brew install caddy')
    console.log('🌐 Caddy installed ✓')
  } catch {
    console.error('🌐 Failed to install Caddy. Install manually: brew install caddy')
    console.log('   (Caddy provides clean localhost URLs without port numbers)')
  }
}

// 4. Generate Caddyfile + start/reload proxy
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
