/**
 * storyboard terminal reset — Kill tmux server and clear terminal registry.
 *
 * Nuclear option for when terminal sessions get into a bad state.
 * Kills the tmux server (all sessions), wipes the registry file,
 * and clears terminal snapshots. Widgets will show the sleep overlay
 * and create fresh sessions on next connect.
 */

import * as p from '@clack/prompts'
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const storyboardDir = join(root, '.storyboard')
const registryPath = join(storyboardDir, 'terminal-sessions.json')
const snapshotsDir = join(storyboardDir, 'terminal-snapshots')

p.intro('storyboard terminal reset')

// 1. Kill tmux server (destroys all sb- sessions)
let tmuxKilled = false
try {
  execSync('tmux kill-server 2>/dev/null', { stdio: 'ignore' })
  tmuxKilled = true
  p.log.success('Killed tmux server (all sessions destroyed)')
} catch {
  p.log.info('No tmux server running')
}

// 2. Clear the terminal registry
if (existsSync(registryPath)) {
  try {
    writeFileSync(registryPath, '[]')
    p.log.success('Cleared terminal registry')
  } catch (err) {
    p.log.warning(`Failed to clear registry: ${err.message}`)
  }
} else {
  p.log.info('No terminal registry found')
}

// 3. Clear terminal snapshots
if (existsSync(snapshotsDir)) {
  try {
    rmSync(snapshotsDir, { recursive: true, force: true })
    p.log.success('Cleared terminal snapshots')
  } catch (err) {
    p.log.warning(`Failed to clear snapshots: ${err.message}`)
  }
} else {
  p.log.info('No terminal snapshots found')
}

p.outro('Terminal state reset — widgets will create fresh sessions on next connect')
