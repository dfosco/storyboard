#!/usr/bin/env node
/**
 * storyboard terminal-welcome — interactive welcome prompt for new terminal sessions.
 *
 * Runs inside tmux, presents a Clack select prompt, loops back after
 * the chosen program exits.
 *
 * When called with --startup <cmd>, auto-launches that command on the first
 * iteration, then falls back to the interactive menu on subsequent iterations
 * (i.e. when the command exits). This makes the welcome screen the universal
 * supervisor for all terminal widget sessions.
 *
 * Usage (called automatically by terminal-server for new sessions):
 *   storyboard terminal-welcome [--branch <name>] [--canvas <name>]
 *   storyboard terminal-welcome --startup "copilot --agent terminal-agent" [--branch <name>] [--canvas <name>]
 */

import * as p from '@clack/prompts'
import { execSync, spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { parseFlags } from './flags.js'
import { dim, cyan, bold } from './intro.js'

const blue = (s) => `\x1b[34m${s}\x1b[0m`

// Prepend .storyboard/terminals/bin/ to PATH so `start`, `copilot`, etc.
// are available in child shells. Done once at startup; child shells inherit it.
const binDir = join(process.cwd(), '.storyboard', 'terminals', 'bin')
if (existsSync(binDir) && !process.env.PATH?.includes(binDir)) {
  process.env.PATH = `${binDir}:${process.env.PATH || ''}`
}

/**
 * Read agents config from storyboard.config.json.
 * Returns an array of { id, label, startupCommand, resumeCommand } entries.
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
      resumeCommand: cfg.resumeCommand || null,
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
  startup: { type: 'string', description: 'Auto-launch this command on first iteration' },
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)
const branch = flags.branch || 'unknown'
const canvas = flags.canvas || 'unknown'
const prettyName = flags.name || null
const canvasShort = canvas === 'unknown' ? canvas : canvas.split('/').pop()
const startupCmd = flags.startup || null

/**
 * Reset terminal state after a child process exits.
 * Children (especially TUI apps) may leave the terminal in raw mode,
 * alternate screen, or with the cursor hidden.
 */
function resetTerminal() {
  // Leave alternate screen, show cursor, reset attributes
  process.stdout.write('\x1b[?1049l\x1b[?25h\x1b[0m')
  try { execSync('stty sane 2>/dev/null', { stdio: 'ignore' }) } catch {}
}

/**
 * Spawn an interactive shell with the storyboard bin dir on PATH.
 * zsh re-initializes PATH from .zshrc/.zprofile, so we inject an
 * `export PATH=...` via tmux send-keys after the shell initializes.
 */
function spawnShell() {
  const shell = process.env.SHELL || '/bin/zsh'
  const child = spawn(shell, [], { stdio: 'inherit' })

  // Inject PATH after shell init so `start`, `copilot`, etc. are available
  if (existsSync(binDir)) {
    setTimeout(() => {
      try {
        execSync(`tmux send-keys -l ${JSON.stringify(`export PATH="${binDir}:$PATH"`)}`, { stdio: 'ignore' })
        execSync(`tmux send-keys Enter`, { stdio: 'ignore' })
        setTimeout(() => {
          try {
            execSync(`tmux send-keys -l "clear"`, { stdio: 'ignore' })
            execSync(`tmux send-keys Enter`, { stdio: 'ignore' })
          } catch {}
        }, 200)
      } catch {}
    }, 500)
  }

  return new Promise((resolve) => {
    child.on('close', resolve)
    child.on('error', resolve)
  })
}

/**
 * Launch an agent by spawning its startupCommand via the user's shell.
 * If the command starts with `copilot`, also polls for readiness and sends /allow-all.
 */
async function launchAgent(agent) {
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
    const shell = process.env.SHELL || '/bin/zsh'
    const child = spawn(shell, ['-lc', agent.startupCommand], { stdio: 'inherit' })

    // For copilot, poll for readiness and pre-type /allow-all
    let pollInterval = null
    const firstWord = agent.startupCommand.trim().split(/\s+/)[0]
    if (firstWord === 'copilot') {
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
  let firstIteration = true

  while (true) {
    // On first iteration with --startup, auto-launch the command
    if (firstIteration && startupCmd) {
      firstIteration = false

      if (startupCmd === 'shell') {
        // Plain shell — spawn interactive shell, return to welcome on exit
        setMouse(true)
        try { await spawnShell() } catch {}
        resetTerminal()
        continue
      }

      // Try to match against a configured agent for label resolution
      const matchedAgent = agents.find(a =>
        startupCmd.startsWith(a.startupCommand?.split(' ')[0])
      )
      const agent = matchedAgent || { label: startupCmd.split(/\s+/)[0], startupCommand: startupCmd }
      await launchAgent(agent)
      resetTerminal()
      continue
    }
    firstIteration = false

    resetTerminal()
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
      try { await spawnShell() } catch {}
      continue
    }

    if (action === 'sessions') {
      // Sub-menu: pick which agent's sessions to browse, or terminal sessions
      const resumableAgents = agents.filter(a => a.resumeCommand)

      const sessionOptions = [
        ...resumableAgents.map(a => ({
          value: `agent:${a.id}`,
          label: `✦ ${a.label} sessions`,
        })),
        { value: 'terminal', label: '⊞ Terminal sessions' },
      ]

      const sessionChoice = await p.select({
        message: 'Browse sessions',
        options: sessionOptions,
      })

      if (p.isCancel(sessionChoice)) continue

      if (sessionChoice === 'terminal') {
        p.outro(dim('Loading terminal sessions...'))
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

      // Agent resume — spawn the resume command interactively
      if (sessionChoice.startsWith('agent:')) {
        const agentId = sessionChoice.replace('agent:', '')
        const agent = resumableAgents.find(a => a.id === agentId)
        if (agent) {
          p.outro(dim(`Loading ${agent.label} sessions...`))
          setMouse(true)
          try {
            const shell = process.env.SHELL || '/bin/zsh'
            const child = spawn(shell, ['-lc', agent.resumeCommand], { stdio: 'inherit' })
            await new Promise((resolve) => {
              child.on('close', resolve)
              child.on('error', resolve)
            })
          } catch {
            p.log.error(`Failed to load ${agent.label} sessions.`)
            await new Promise(r => setTimeout(r, 2000))
          }
        }
        continue
      }

      continue
    }
  }
}

welcomeLoop().catch(() => {
  // On any error, just let the shell take over
})
