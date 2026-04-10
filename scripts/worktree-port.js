/**
 * Worktree Port Registry
 *
 * Manages a JSON registry (.worktrees/ports.json) that maps worktree names
 * to unique dev-server ports. Main always gets 1234; worktrees get 1235+.
 *
 * Usage:
 *   node scripts/worktree-port.js <worktree-name>
 *
 * Prints the assigned port to stdout.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const PORTS_FILE = join(process.cwd(), '.worktrees', 'ports.json')
const BASE_PORT = 1234

export function getPort(worktreeName) {
  // Ensure .worktrees/ directory exists
  const dir = dirname(PORTS_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  let ports = { main: BASE_PORT }
  if (existsSync(PORTS_FILE)) {
    try {
      ports = JSON.parse(readFileSync(PORTS_FILE, 'utf8'))
    } catch {
      // Corrupted file — start fresh
    }
  }

  if (worktreeName === 'main') return ports.main || BASE_PORT

  if (!ports[worktreeName]) {
    const usedPorts = Object.values(ports)
    let nextPort = BASE_PORT + 1
    while (usedPorts.includes(nextPort)) nextPort++
    ports[worktreeName] = nextPort
    writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2) + '\n')
  }

  return ports[worktreeName]
}

// CLI: node scripts/worktree-port.js <name>
const name = process.argv[2]
if (name) {
  console.log(getPort(name))
}
