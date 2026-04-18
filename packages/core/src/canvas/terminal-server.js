/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Spawns a PTY process per WebSocket connection using node-pty.
 * Handles resize messages and session lifecycle (create on connect,
 * destroy on disconnect).
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol:
 *   Client → Server:  text (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  text (stdout from PTY)
 */

import { WebSocketServer } from 'ws'

let pty
try {
  pty = await import('node-pty')
} catch {
  pty = null
}

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/** Active PTY sessions keyed by sessionId */
const sessions = new Map()

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * Call this from configureServer() in the server plugin.
 */
export function setupTerminalServer(httpServer, base = '/') {
  if (!pty) {
    console.warn('[storyboard] node-pty not available — terminal widgets disabled')
    return
  }

  console.log('[storyboard] terminal server ready (node-pty)')

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
