/**
 * Terminal Server — WebSocket shell backend for terminal canvas widgets.
 *
 * Spawns a shell process per WebSocket connection using child_process.
 * Handles session lifecycle (create on connect, destroy on disconnect).
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol (all frames are text):
 *   Client → Server:  raw text (stdin to shell)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  raw text (stdout/stderr from shell)
 */

import { WebSocketServer } from 'ws'
import { spawn } from 'node:child_process'

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/** Active shell sessions keyed by sessionId */
const sessions = new Map()

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * Call this from configureServer() in the server plugin.
 */
export function setupTerminalServer(httpServer, base = '/') {
  console.log('[storyboard] terminal server ready')

  const wss = new WebSocketServer({ noServer: true })
  const baseNoTrail = (base || '/').replace(/\/$/, '')

  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = req.url || ''
    // Strip base path prefix (e.g. /branch--4.2.0/)
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
  // Kill any existing session with the same ID (reconnect scenario)
  const existing = sessions.get(sessionId)
  if (existing) {
    try { existing.kill() } catch {}
    sessions.delete(sessionId)
  }

  // Use bash for pipe-based shell (zsh's ZLE doesn't work well over pipes)
  const shell = '/bin/bash'
  const cwd = process.cwd()

  const proc = spawn(shell, ['--norc', '-i'], {
    cwd,
    env: { ...process.env, TERM: 'xterm-256color', PS1: '\\[\\033[32m\\]\\w\\[\\033[0m\\] $ ' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  sessions.set(sessionId, proc)

  // stdout → WebSocket
  proc.stdout.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data.toString('utf-8'))
    }
  })

  // stderr → WebSocket (merged with stdout for terminal display)
  proc.stderr.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data.toString('utf-8'))
    }
  })

  proc.on('exit', () => {
    sessions.delete(sessionId)
    if (ws.readyState === ws.OPEN) {
      ws.close()
    }
  })

  proc.on('error', (err) => {
    console.error('[storyboard] terminal process error:', err.message)
    sessions.delete(sessionId)
    if (ws.readyState === ws.OPEN) {
      ws.close()
    }
  })

  // WebSocket → shell stdin
  ws.on('message', (msg) => {
    const str = typeof msg === 'string' ? msg : msg.toString('utf-8')

    // Try parsing as JSON control message
    try {
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize') {
        // No resize support without a real PTY — ignored
        return
      }
    } catch {
      // Not JSON — raw stdin
    }

    if (proc.stdin.writable) {
      proc.stdin.write(str)
    }
  })

  ws.on('close', () => {
    const p = sessions.get(sessionId)
    if (p === proc) {
      try { proc.kill() } catch {}
      sessions.delete(sessionId)
    }
  })

  ws.on('error', () => {
    try { proc.kill() } catch {}
    sessions.delete(sessionId)
  })
}
