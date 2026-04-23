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
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFlags } from './flags.js'
import { dim, cyan, bold } from './intro.js'

const blue = (s) => `\x1b[34m${s}\x1b[0m`

/**
 * Read agents config from storyboard.config.json.
 * Returns an array of { id, label, startupCommand } entries.
 */
function loadAgents() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    const agents = config?.canvas?.agents
    if (!agents || typeof agents !== 'object') return []
    return Object.entries(agents).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      startupCommand: cfg.startupCommand || null,
    })).filter(a => a.startupCommand)
  } catch { return [] }
}

const agents = loadAgents()

// Enable/disable tmux mouse — must be off during Clack prompts (mouse
// events crash Clack), on during shell/copilot sessions (for scrolling).
function setMouse(on) {
  try { execSync(`tmux set-option mouse ${on ? 'on' : 'off'} 2>/dev/null`, { stdio: 'ignore' }) } catch {}
}

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

/**
 * Launch an agent by parsing and spawning its startupCommand.
 * If the command is `copilot`, also polls for readiness and sends /allow-all.
 */
async function launchAgent(agent) {
  const parts = agent.startupCommand.split(/\s+/)
  const cmd = parts[0]
  const args = parts.slice(1)

  // Show metadata after selection
  const meta = [
    prettyName ? `${dim('name:')} ${blue(prettyName)}` : null,
    `${dim('branch:')} ${blue(branch)}`,
    `${dim('canvas:')} ${blue(canvasShort)}`,
  ].filter(Boolean).join('  ')
  p.log.info(meta)
  p.outro(dim(`Starting ${agent.label}...`))
  setMouse(true)

  try {
    const child = spawn(cmd, args, { stdio: 'inherit' })

    // For copilot, poll for readiness and pre-type /allow-all
    let pollInterval = null
    if (cmd === 'copilot') {
      let autopilotSent = false
      pollInterval = setInterval(() => {
        if (autopilotSent) { clearInterval(pollInterval); return }
        try {
          const paneContent = execSync(`tmux capture-pane -p`, { encoding: 'utf8', timeout: 1000 })
          if (paneContent.includes('Environment loaded:') || paneContent.match(/^[>❯]\s*$/m)) {
            autopilotSent = true
            clearInterval(pollInterval)
            setTimeout(() => {
              try {
                execSync(`tmux send-keys -l "/allow-all on"`, { stdio: 'ignore' })
                execSync(`tmux send-keys Enter`, { stdio: 'ignore' })
              } catch {}
            }, 500)
          }
        } catch {}
      }, 1000)

      setTimeout(() => {
        if (!autopilotSent) {
          autopilotSent = true
          clearInterval(pollInterval)
        }
      }, 15000)
    }

    await new Promise((resolve) => {
      child.on('close', () => { if (pollInterval) clearInterval(pollInterval); resolve() })
      child.on('error', () => { if (pollInterval) clearInterval(pollInterval); resolve() })
    })
  } catch {
    p.log.error(`Failed to start ${agent.label}. Is it installed?`)
    await new Promise(r => setTimeout(r, 2000))
  }
}

async function welcomeLoop() {
  while (true) {
    setMouse(false)
    console.clear()
    p.intro(`${bold('storyboard terminal')}`)

    // Build the first option based on number of configured agents
    const agentOption = agents.length > 1
      ? { value: 'agents', label: '✦ Start a new agent session' }
      : { value: 'copilot', label: `✦ Start a new ${agents[0]?.label || 'Copilot'} session` }

    const action = await p.select({
      message: 'How would you like to start?',
      options: [
        agentOption,
        { value: 'shell', label: '▸ Start a new terminal session' },
        { value: 'sessions', label: '⊞ Browse existing sessions' },
      ],
    })

    if (p.isCancel(action)) {
      // Don't exit to shell on cancel — loop back to welcome
      continue
    }

    if (action === 'agents') {
      // Multi-agent sub-select
      const agentChoice = await p.select({
        message: 'Which agent?',
        options: agents.map(a => ({
          value: a.id,
          label: `✦ Start a new ${a.label} session`,
        })),
      })

      if (p.isCancel(agentChoice)) continue

      const agent = agents.find(a => a.id === agentChoice)
      if (agent) {
        await launchAgent(agent)
      }
      continue
    }

    if (action === 'copilot') {
      // Single agent — launch directly
      const agent = agents[0] || { label: 'Copilot', startupCommand: 'copilot --agent terminal-agent' }
      await launchAgent(agent)
      continue
    }

    // Show metadata for non-agent actions (shell, sessions)
    const meta = [
      prettyName ? `${dim('name:')} ${blue(prettyName)}` : null,
      `${dim('branch:')} ${blue(branch)}`,
      `${dim('canvas:')} ${blue(canvasShort)}`,
    ].filter(Boolean).join('  ')
    p.log.info(meta)

    if (action === 'shell') {
      p.outro(dim('Opening shell... Enter any command below.'))
      setMouse(true)
      // Spawn an interactive shell; when it exits, loop back to welcome
      try {
        const shell = process.env.SHELL || '/bin/zsh'
        const child = spawn(shell, [], { stdio: 'inherit' })
        await new Promise((resolve) => {
          child.on('close', resolve)
          child.on('error', resolve)
        })
      } catch {}
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
      continue
    }
  }
}

welcomeLoop().catch(() => {
  // On any error, just let the shell take over
})
