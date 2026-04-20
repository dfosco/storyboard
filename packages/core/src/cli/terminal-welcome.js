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
        { value: 'shell', label: '▸ Start a new terminal session' },
        { value: 'sessions', label: '⊞ Browse existing sessions' },
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
      // Run copilot with terminal-agent, then pre-type /autopilot via tmux
      try {
        const agentArgs = ['--agent', 'terminal-agent']
        const child = spawn('copilot', agentArgs, { stdio: 'inherit' })

        // Poll for copilot readiness, then pre-type /autopilot once
        let autopilotSent = false
        const pollInterval = setInterval(() => {
          if (autopilotSent) { clearInterval(pollInterval); return }
          try {
            // Capture the current pane content and check for copilot's input prompt
            const paneContent = execSync(`tmux capture-pane -p`, { encoding: 'utf8', timeout: 1000 })
            // Copilot shows ">" or "❯" at the prompt when ready for input
            // Also check for "Environment loaded" which appears right before the prompt
            if (paneContent.includes('Environment loaded:') || paneContent.match(/^[>❯]\s*$/m)) {
              autopilotSent = true
              clearInterval(pollInterval)
              // Small delay to ensure the prompt is fully rendered
              setTimeout(() => {
                try {
                  execSync(`tmux send-keys -l "/autopilot "`, { stdio: 'ignore' })
                } catch {}
              }, 500)
            }
          } catch {}
        }, 1000)

        // Safety: stop polling after 15s no matter what
        setTimeout(() => {
          if (!autopilotSent) {
            autopilotSent = true
            clearInterval(pollInterval)
          }
        }, 15000)

        await new Promise((resolve) => {
          child.on('close', () => { clearInterval(pollInterval); resolve() })
          child.on('error', () => { clearInterval(pollInterval); resolve() })
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
