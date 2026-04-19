#!/usr/bin/env node
/**
 * storyboard terminal-welcome — interactive welcome prompt for new terminal sessions.
 *
 * Runs inside tmux, presents a Clack select prompt, loops back after
 * the chosen program exits.
 *
 * Usage (called automatically by terminal-server for new sessions):
 *   storyboard terminal-welcome [--branch <name>] [--canvas <name>]
 */

import * as p from '@clack/prompts'
import { execSync, spawn } from 'node:child_process'
import { parseFlags } from './flags.js'
import { dim, cyan, bold } from './intro.js'

const blue = (s) => `\x1b[34m${s}\x1b[0m`

const flagSchema = {
  branch: { type: 'string', description: 'Current branch name' },
  canvas: { type: 'string', description: 'Current canvas name' },
  name: { type: 'string', description: 'Terminal pretty name' },
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)
const branch = flags.branch || 'unknown'
const canvas = flags.canvas || 'unknown'
const prettyName = flags.name || null
const canvasShort = canvas === 'unknown' ? canvas : canvas.split('/').pop()

async function welcomeLoop() {
  while (true) {
    console.clear()
    p.intro(`${bold('storyboard terminal')}`)

    const action = await p.select({
      message: 'How would you like to start?',
      options: [
        { value: 'copilot', label: '✦ Start a new Copilot session' },
        { value: 'shell', label: '▸ Start a new terminal session', hint: 'opens shell' },
        { value: 'sessions', label: '⊞ Browse existing sessions', hint: 'runs: storyboard terminal' },
      ],
    })

    if (p.isCancel(action)) {
      p.outro(dim('Opening shell...'))
      break
    }

    // Show metadata after selection
    const meta = [
      prettyName ? `${dim('name:')} ${blue(prettyName)}` : null,
      `${dim('branch:')} ${blue(branch)}`,
      `${dim('canvas:')} ${blue(canvasShort)}`,
    ].filter(Boolean).join('  ')
    p.log.info(meta)

    if (action === 'shell') {
      p.outro(dim('Opening shell...'))
      break
    }

    if (action === 'copilot') {
      p.outro(dim('Starting Copilot...'))
      // Run copilot as a child process, wait for it to exit, then loop back
      try {
        const child = spawn('copilot', [], { stdio: 'inherit' })
        await new Promise((resolve) => {
          child.on('close', resolve)
          child.on('error', resolve)
        })
      } catch {
        p.log.error('Failed to start Copilot. Is it installed?')
        await new Promise(r => setTimeout(r, 2000))
      }
      // Loop back to welcome prompt
      continue
    }

    if (action === 'sessions') {
      p.outro(dim('Loading sessions...'))
      try {
        const child = spawn('storyboard', ['terminal'], { stdio: 'inherit' })
        await new Promise((resolve) => {
          child.on('close', resolve)
          child.on('error', resolve)
        })
      } catch {
        p.log.error('Failed to load sessions.')
        await new Promise(r => setTimeout(r, 2000))
      }
      // Loop back to welcome prompt
      continue
    }
  }
}

welcomeLoop().catch(() => {
  // On any error, just let the shell take over
})
