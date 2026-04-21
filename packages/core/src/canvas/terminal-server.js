/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Uses tmux for session persistence across page refreshes. Each terminal
 * widget gets a tmux session with an opaque name (hash of branch + canvas +
 * widget). On disconnect the pty process is killed (detaching from tmux)
 * but the tmux session stays alive. On reconnect the existing tmux session
 * is reattached.
 *
 * Session lifecycle is managed by terminal-registry.js which persists
 * session metadata to `.storyboard/terminal-sessions.json`.
 *
 * Falls back to direct shell spawn when tmux is not available.
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol:
 *   Client → Server:  text (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  text (stdout from PTY)
 *   Server → Client:  JSON { type: "conflict", ... }
 *   Server → Client:  JSON { type: "session-info", ... }
 */

import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

let WebSocketServer
try {
  WebSocketServer = (await import('ws')).WebSocketServer
} catch {
  WebSocketServer = null
}
import {
  initRegistry,
  registerSession,
  disconnectSession,
  orphanSession,
  generateTmuxName,
  findTmuxNameForWidget,
  killSession,
} from './terminal-registry.js'
import {
  writeTerminalConfig as writeTermConfig,
  initTerminalConfig,
} from './terminal-config.js'
import { findByWorktree } from '../worktree/serverRegistry.js'
import { detectWorktreeName } from '../worktree/port.js'

let pty
try {
  pty = await import('node-pty')
} catch {
  pty = null
}

/** Check if tmux is available on the system */
let hasTmux = false
try {
  execSync('which tmux', { stdio: 'ignore' })
  hasTmux = true
} catch {
  hasTmux = false
}

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/** Read terminal config from storyboard.config.json */
function readTerminalConfig() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    return config?.canvas?.terminal ?? {}
  } catch {
    return {}
  }
}

/** Active PTY processes keyed by tmuxName (not tmux sessions — those persist independently) */
const ptyProcesses = new Map()

/** WebSocket connections keyed by tmuxName, for conflict notification */
const wsConnections = new Map()

/** Branch name for this worktree, set during setup */
let currentBranch = 'unknown'

/** Actual server port, resolved from httpServer at setup time */
let actualServerPort = null

/** Check if a tmux session with the given name exists */
function tmuxSessionExists(name) {
  try {
    execSync(`tmux has-session -t "${name}" 2>/dev/null`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Orphan a terminal session by widget ID. Called when a terminal widget is
 * deleted. The tmux session is preserved with a grace timer.
 */
export function orphanTerminalSession(widgetId) {
  const tmuxName = findTmuxNameForWidget(widgetId)
  if (!tmuxName) {
    console.warn(`[storyboard] orphanTerminalSession: no registry entry for widget ${widgetId}`)
    legacyKillSession(widgetId)
    return
  }

  console.log(`[storyboard] orphanTerminalSession: archiving ${tmuxName} (widget: ${widgetId})`)

  // Set archived status FIRST (bumps generation so WS onclose won't override)
  orphanSession(tmuxName)

  // Close the WS connection if any (notifies client)
  const ws = wsConnections.get(tmuxName)
  if (ws && ws.readyState <= 1) {
    try { ws.close() } catch {}
  }
  wsConnections.delete(tmuxName)

  // Kill the PTY process (detaches from tmux)
  const proc = ptyProcesses.get(tmuxName)
  if (proc) {
    try { proc.kill() } catch {}
    ptyProcesses.delete(tmuxName)
  }
}

/** Kill legacy sb-{widgetId} sessions for backwards compat */
function legacyKillSession(widgetId) {
  const legacyName = `sb-${widgetId}`
  try {
    execSync(`tmux kill-session -t "${legacyName}" 2>/dev/null`, { stdio: 'ignore' })
  } catch {}
}

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * @param {object} httpServer
 * @param {string} base — Vite base path
 * @param {string} branch — current git branch name
 */
export function setupTerminalServer(httpServer, base = '/', branch = 'unknown') {
  if (!pty || !WebSocketServer) {
    if (!pty) console.warn('[storyboard] node-pty not available — terminal widgets disabled')
    if (!WebSocketServer) console.warn('[storyboard] ws not available — terminal widgets disabled')
    return
  }

  currentBranch = branch

  // Capture the actual port from the running HTTP server
  try {
    const addr = httpServer.address()
    if (addr && addr.port) actualServerPort = addr.port
  } catch {}

  // Ensure node-pty spawn-helper has execute permission (npm install can strip it)
  try {
    const nodePtyDir = resolve(process.cwd(), 'node_modules/node-pty/prebuilds')
    execSync(`chmod +x "${nodePtyDir}"/darwin-*/spawn-helper 2>/dev/null || true`, { stdio: 'ignore' })
  } catch {}

  // Initialize registry and terminal config
  const root = process.cwd()
  const termCfg = readTerminalConfig()
  initRegistry(root, { gracePeriod: termCfg.orphanGracePeriod })
  initTerminalConfig(root)

  const mode = hasTmux ? 'tmux (persistent sessions)' : 'node-pty (no persistence)'
  console.log(`[storyboard] terminal server ready (${mode}) [branch: ${branch}]`)

  const wss = new WebSocketServer({ noServer: true })
  const baseNoTrail = (base || '/').replace(/\/$/, '')

  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = req.url || ''
    if (baseNoTrail && pathname.startsWith(baseNoTrail)) {
      pathname = pathname.slice(baseNoTrail.length) || '/'
    }

    if (!pathname.startsWith(TERMINAL_PATH_PREFIX)) return

    // Parse sessionId and query params
    const pathAndQuery = pathname.slice(TERMINAL_PATH_PREFIX.length)
    const [sessionId, queryStr] = pathAndQuery.split('?')
    if (!sessionId) {
      socket.destroy()
      return
    }

    const params = new URLSearchParams(queryStr || '')
    const canvasId = params.get('canvas') || 'unknown'
    const prettyName = params.get('name') || null

    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, sessionId, canvasId, prettyName)
    })
  })
}

function handleConnection(ws, widgetId, canvasId, prettyName) {
  const branch = currentBranch
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)

  // Register in registry, check for conflicts
  const { entry, conflict } = registerSession({ branch, canvasId, widgetId, prettyName })

  // Resolve server URL deterministically:
  // 1. Use the actual port from httpServer (set at setup time)
  // 2. Fall back to server registry (tracks running dev servers)
  // 3. Last resort: default port 1234
  let serverPort = actualServerPort
  if (!serverPort) {
    try {
      const name = detectWorktreeName()
      const servers = findByWorktree(name)
      if (servers.length > 0) serverPort = servers[0].port
    } catch {}
  }
  if (!serverPort) serverPort = 1234
  const serverUrl = `http://localhost:${serverPort}`

  // Write terminal config for agent context
  writeTermConfig({ branch, canvasId, widgetId, serverUrl })

  // Close any existing WS for this session (one viewer at a time)
  const existingWs = wsConnections.get(tmuxName)
  if (existingWs && existingWs !== ws && existingWs.readyState <= 1) {
    try { existingWs.close() } catch {}
  }
  wsConnections.set(tmuxName, ws)

  // Kill any existing pty process for this session (stale connection)
  const existing = ptyProcesses.get(tmuxName)
  if (existing) {
    try { existing.kill() } catch {}
    ptyProcesses.delete(tmuxName)
  }

  const cwd = process.cwd()
  const shell = process.env.SHELL || '/bin/zsh'
  const termCfg = readTerminalConfig()
  const prompt = termCfg.prompt || '$ '

  // Create a minimal ZDOTDIR with .zshrc to override the default prompt.
  const zdotdir = join(tmpdir(), 'storyboard-terminal')
  try {
    mkdirSync(zdotdir, { recursive: true })
    writeFileSync(join(zdotdir, '.zshenv'), '')
    writeFileSync(join(zdotdir, '.zshrc'), `export PS1='${prompt.replace(/'/g, "'\\''")}'\nunset RPS1\n`)
  } catch { /* best effort */ }

  const env = {
    ...process.env,
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    ZDOTDIR: zdotdir,
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
    BASH_ENV: '',
    ENV: '',
    PS1: prompt,
    STORYBOARD_WIDGET_ID: widgetId,
    STORYBOARD_CANVAS_ID: canvasId,
    STORYBOARD_BRANCH: branch,
    STORYBOARD_SERVER_URL: serverUrl,
  }
  let ptyProcess
  let isNewSession = false

  try {
  if (hasTmux) {
    const reattach = tmuxSessionExists(tmuxName)

    // Also check for legacy sb-{widgetId} sessions and migrate
    const legacyName = `sb-${widgetId}`
    const hasLegacy = !reattach && tmuxSessionExists(legacyName)
    const actualName = hasLegacy ? legacyName : tmuxName

    // -f /dev/null skips user tmux.conf; 'set status off' hides the status bar
    const args = (reattach || hasLegacy)
      ? ['-f', '/dev/null', 'attach-session', '-t', actualName]
      : ['-f', '/dev/null', 'new-session', '-s', tmuxName, '-c', cwd]

    // If migrating from legacy, rename the tmux session
    if (hasLegacy) {
      try {
        execSync(`tmux rename-session -t "${legacyName}" "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
      } catch {}
    }

    ptyProcess = pty.spawn('tmux', args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env,
    })

    // Hide status bar
    const targetName = (reattach || hasLegacy) ? actualName : tmuxName
    isNewSession = !(reattach || hasLegacy)
    const hideStatus = () => {
      try {
        execSync(`tmux set-option -t "${targetName}" status off 2>/dev/null`, { stdio: 'ignore' })
        execSync(`tmux set-option -t "${targetName}" mouse on 2>/dev/null`, { stdio: 'ignore' })
        execSync(`tmux set-option -t "${targetName}" set-clipboard off 2>/dev/null`, { stdio: 'ignore' })
      } catch {}
    }
    setTimeout(hideStatus, 200)

    // For new sessions, run the welcome prompt script inside tmux
    if (isNewSession) {
      const canvasArg = canvasId !== 'unknown' ? canvasId : ''
      setTimeout(() => {
        // Send the welcome command to the shell inside tmux
        const nameArg = prettyName ? ` --name "${prettyName}"` : ''
        const cmd = `storyboard terminal-welcome --branch "${branch}" --canvas "${canvasArg}"${nameArg}\r`
        ptyProcess.write(cmd)
      }, 600)

      // Execute startup sequence if configured (after welcome completes)
      const startupSeq = termCfg.defaultStartupSequence
      if (startupSeq?.steps?.length) {
        setTimeout(() => {
          executeStartupSequence(tmuxName, ws, startupSeq)
        }, 1500)
      }
    }

    // Write conflict warning if session was live elsewhere
    if (conflict) {
      setTimeout(() => {
        const warning = [
          '',
          `\x1b[33m⚠ Session conflict\x1b[0m`,
          `\x1b[2mThis session was\x1b[0m \x1b[34mLive\x1b[0m \x1b[2mon branch\x1b[0m \x1b[34m${conflict.currentBranch}\x1b[0m \x1b[2m(canvas: ${conflict.currentCanvas})\x1b[0m`,
          `\x1b[2mDetached from there and attached here.\x1b[0m`,
          '',
        ].join('\r\n')
        if (ws.readyState === ws.OPEN) {
          ws.send(warning)
        }
      }, 300)
    }
  } else {
    const noRcFlag = shell.endsWith('/zsh') ? '--no-rcs' : shell.endsWith('/bash') ? '--norc' : ''
    const shellArgs = noRcFlag ? [noRcFlag] : []
    ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env,
    })
  }
  } catch (spawnErr) {
    console.error(`[storyboard] terminal spawn failed: ${spawnErr.message}`)
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n\x1b[31m✖ Terminal failed to start: ${spawnErr.message}\x1b[0m\r\n`)
      ws.send(`\x1b[2mTry: chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper\x1b[0m\r\n`)
      ws.close()
    }
    return
  }

  const generation = entry.generation
  ptyProcesses.set(tmuxName, ptyProcess)

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data)
    }
  })

  ptyProcess.onExit(() => {
    ptyProcesses.delete(tmuxName)
    if (ws.readyState === ws.OPEN) {
      ws.close()
    }
  })

  ws.on('message', (msg) => {
    const str = typeof msg === 'string' ? msg : msg.toString('utf-8')
    try {
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows)
        return
      }
    } catch {
      // Not JSON — raw stdin
    }

    ptyProcess.write(str)
  })

  // On disconnect: kill the pty (detaches from tmux) but leave the tmux session alive
  ws.on('close', () => {
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    const proc = ptyProcesses.get(tmuxName)
    if (proc === ptyProcess) {
      try { ptyProcess.kill() } catch {}
      ptyProcesses.delete(tmuxName)
    }
    disconnectSession(tmuxName, generation)
  })

  ws.on('error', () => {
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    try { ptyProcess.kill() } catch {}
    ptyProcesses.delete(tmuxName)
    disconnectSession(tmuxName, generation)
  })
}

/** Send a JSON message over WebSocket */
function sendJson(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

/**
 * Execute a startup sequence for a new terminal session.
 * Runs server-side via tmux send-keys. Only called for new sessions.
 *
 * Step types:
 *   command   — send text + \n to the shell
 *   keystroke — send raw keys (e.g. {enter}, {tab})
 *   wait      — pause for ms or until output matches a pattern
 *   tmux      — run a tmux command against the session
 *   env       — set env var (must be before shell starts, so this is a pre-step)
 *
 * @param {string} tmuxName — tmux session name
 * @param {object} ws — WebSocket connection
 * @param {object} sequence — { steps: [], renderAfterStep?: number }
 */
async function executeStartupSequence(tmuxName, ws, sequence) {
  if (!sequence?.steps?.length) return
  if (!hasTmux) return

  const { steps, renderAfterStep } = sequence
  const shouldGateRender = typeof renderAfterStep === 'number' && renderAfterStep >= 0

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]

    try {
      switch (step.type) {
        case 'command':
          // Use -l for literal text to avoid shell interpretation issues
          execSync(
            `tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(step.value)}`,
            { stdio: 'ignore' }
          )
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          break

        case 'keystroke': {
          const keyMap = { '{enter}': 'Enter', '{tab}': 'Tab', '{escape}': 'Escape', '{space}': 'Space' }
          const key = keyMap[step.value] || step.value
          execSync(`tmux send-keys -t "${tmuxName}" ${key}`, { stdio: 'ignore' })
          break
        }

        case 'wait':
          if (step.until === 'ready' || step.until === 'output') {
            const timeout = step.timeout || 10000
            const start = Date.now()
            const match = step.match || null
            while (Date.now() - start < timeout) {
              await new Promise(r => setTimeout(r, 500))
              if (match) {
                try {
                  const capture = execSync(
                    `tmux capture-pane -t "${tmuxName}" -p`,
                    { encoding: 'utf8', timeout: 2000 }
                  )
                  if (capture.includes(match)) break
                } catch { /* continue waiting */ }
              }
            }
          } else {
            await new Promise(r => setTimeout(r, step.ms || 1000))
          }
          break

        case 'tmux':
          execSync(`tmux ${step.value}`, { stdio: 'ignore' })
          break

        default:
          console.warn(`[storyboard] Unknown startup step type: ${step.type}`)
      }
    } catch (err) {
      console.warn(`[storyboard] Startup sequence step ${i} (${step.type}) failed:`, err.message)
      // Non-fatal — continue to next step
    }

    // Send render signal after the specified step
    if (shouldGateRender && i === renderAfterStep) {
      sendJson(ws, { type: 'render' })
    }
  }

  // If renderAfterStep was beyond all steps, send it now
  if (shouldGateRender && renderAfterStep >= steps.length) {
    sendJson(ws, { type: 'render' })
  }
}

// Re-export for backwards compat (canvas server uses this name)
export { killSession as killTerminalSession }

