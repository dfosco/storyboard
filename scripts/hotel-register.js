/**
 * hotel Registration (optional)
 *
 * Reads .worktrees/ports.json and registers each entry with hotel
 * so worktrees are available at http://storyboard-<name>.localhost.
 *
 * Prerequisites:
 *   npm install -g hotel
 *   hotel start
 *
 * Usage:
 *   node scripts/hotel-register.js
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PORTS_FILE = join(process.cwd(), '.worktrees', 'ports.json')

// Check hotel is available
try {
  execSync('hotel --version', { stdio: 'ignore' })
} catch {
  console.error('hotel is not installed. Install it with: npm install -g hotel')
  console.error('Then start the daemon with: hotel start')
  process.exit(1)
}

if (!existsSync(PORTS_FILE)) {
  console.log('No .worktrees/ports.json found.')
  console.log('Run `npm run dev` in each worktree first to register ports.')
  process.exit(0)
}

const ports = JSON.parse(readFileSync(PORTS_FILE, 'utf8'))

for (const [name, port] of Object.entries(ports)) {
  // Sanitize dots to hyphens for valid subdomain names
  const slug = name.replace(/\./g, '-')
  try {
    execSync(`hotel add http://localhost:${port} --name storyboard-${slug}`, {
      stdio: 'inherit',
    })
    console.log(`✓ storyboard-${slug}.localhost → localhost:${port}`)
  } catch {
    console.error(`✗ Failed to register ${name}`)
  }
}

console.log('')
console.log('Worktrees registered with hotel.')
console.log('Visit http://localhost:2000 to see all registered servers.')
