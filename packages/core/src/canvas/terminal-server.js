/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Uses tmux for session persistence across page refreshes. Each terminal
 * widget gets a tmux session named `sb-{sessionId}`. On disconnect the
 * pty process is killed (detaching from tmux) but the tmux session stays
 * alive. On reconnect the existing tmux session is reattached.
 *
 * Falls back to direct shell spawn when tmux is not available.
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol:
 *   Client → Server:  text (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  text (stdout from PTY)
 */

import { execSync } from 'node:child_process'
import { WebSocketServer } from 'ws'

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

const TMUX_PREFIX = 'sb-'
const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/** Active PTY processes keyed by sessionId (not tmux sessions — those persist independently) */
const sessions = new Map()

/** Check if a tmux session with the given name exists */
function tmuxSessionExists(name) {
  try {
    execSync(`tmux has-session -t ${name} 2>/dev/null`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Destroy a terminal session (pty + tmux). Called when a terminal widget is deleted. */
export function killTerminalSession(sessionId) {
  const proc = sessions.get(sessionId)
  if (proc) {
    try { proc.kill() } catch {}
    sessions.delete(sessionId)
  }
  if (hasTmux) {
    const tmuxName = `${TMUX_PREFIX}${sessionId}`
    try {
      execSync(`tmux kill-session -t ${tmuxName} 2>/dev/null`, { stdio: 'ignore' })
    } catch {}
  }
}

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * Call this from configureServer() in the server plugin.
 */
export function setupTerminalServer(httpServer, base = '/') {
  if (!pty) {
    console.warn('[storyboard] node-pty not available — terminal widgets disabled')
    return
  }

  const mode = hasTmux ? 'tmux (persistent sessions)' : 'node-pty (no persistence)'
  console.log(`[storyboard] terminal server ready (${mode})`)

  const wss = new WebSocketServer({ noServer: true })
  const baseNoTrail = (base || '/').replace(/\/$/, '')

  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = req.url || ''
    if (baseNoTrail && pathname.startsWith(baseNoTrail)) {
      pathname = pathname.slice(baseNoTrail.length) || '/'
    }

    if (!pathname.startsWith(TERMINAL_PATH_PREFIX)) return

    const sessionId = pathname.slice(TERMINAL_PATH_PREFIX.length)
    if (!sessionId) {
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, sessionId)
    })
  })
}

function handleConnection(ws, sessionId) {
  // Kill any existing pty process for this session (stale WebSocket)
  const existing = sessions.get(sessionId)
  if (existing) {
    try { existing.kill() } catch {}
    sessions.delete(sessionId)
  }

  const cwd = process.cwd()
  const env = {
    ...process.env,
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    // Suppress shell theme frameworks (starship, oh-my-zsh, powerlevel10k)
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
  }
  let ptyProcess

  if (hasTmux) {
    const tmuxName = `${TMUX_PREFIX}${sessionId}`
    const reattach = tmuxSessionExists(tmuxName)

    const cmd = reattach
      ? 'tmux'
      : 'tmux'
    const args = reattach
      ? ['attach-session', '-t', tmuxName]
      : ['new-session', '-s', tmuxName]

    ptyProcess = pty.spawn(cmd, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env,
    })
  } else {
    const shell = process.env.SHELL || '/bin/zsh'
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env,
    })
  }

  sessions.set(sessionId, ptyProcess)

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data)
    }
  })

  ptyProcess.onExit(() => {
    sessions.delete(sessionId)
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
    const proc = sessions.get(sessionId)
    if (proc === ptyProcess) {
      try { ptyProcess.kill() } catch {}
      sessions.delete(sessionId)
    }
  })

  ws.on('error', () => {
    try { ptyProcess.kill() } catch {}
    sessions.delete(sessionId)
  })
}
