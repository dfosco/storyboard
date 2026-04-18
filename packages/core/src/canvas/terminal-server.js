/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Spawns a PTY process per WebSocket connection using node-pty.
 * Handles resize messages and session lifecycle (create on connect,
 * destroy on disconnect).
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol (binary frames = PTY data, text frames = JSON control):
 *   Client → Server:  binary data (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  binary data (stdout from PTY)
 */

import { WebSocketServer } from 'ws'

let pty
try {
  pty = await import('node-pty')
} catch {
  // node-pty is optional — terminal widgets won't work without it
  pty = null
}

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/** Active PTY sessions keyed by sessionId */
const sessions = new Map()

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * Call this from configureServer() in the server plugin.
 */
export function setupTerminalServer(httpServer) {
  if (!pty) {
    console.warn('[storyboard] node-pty not available — terminal widgets disabled')
    return
  }

  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith(TERMINAL_PATH_PREFIX)) return

    const sessionId = url.pathname.slice(TERMINAL_PATH_PREFIX.length)
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
  // Kill any existing session with the same ID (reconnect scenario)
  const existing = sessions.get(sessionId)
  if (existing) {
    try { existing.kill() } catch {}
    sessions.delete(sessionId)
  }

  const shell = process.env.SHELL || '/bin/zsh'
  const cwd = process.cwd()

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  })

  sessions.set(sessionId, ptyProcess)

  // PTY stdout → WebSocket
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

  // WebSocket → PTY stdin / control messages
  ws.on('message', (msg, isBinary) => {
    if (isBinary || typeof msg !== 'string') {
      // Binary or Buffer — raw stdin
      ptyProcess.write(typeof msg === 'string' ? msg : msg.toString('utf-8'))
      return
    }

    // Text frame — try parsing as JSON control message
    const str = typeof msg === 'string' ? msg : msg.toString('utf-8')
    try {
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows)
        return
      }
    } catch {
      // Not JSON — treat as stdin
    }
    ptyProcess.write(str)
  })

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
