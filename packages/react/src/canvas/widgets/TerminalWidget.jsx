import { useRef, useEffect, useCallback, useState } from 'react'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetProps.js'
import { getTerminalConfig } from '@dfosco/storyboard-core'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './TerminalWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

const terminalSchema = schemas['terminal']

/**
 * Lazy-load ghostty-web to avoid bundling WASM in prod.
 */
let ghosttyPromise = null
function loadGhostty() {
  if (!ghosttyPromise) {
    ghosttyPromise = import('ghostty-web').then(async (mod) => {
      if (mod.init) await mod.init()
      return mod
    })
  }
  return ghosttyPromise
}

/**
 * Build the WebSocket URL for the terminal backend.
 * Includes the base path (e.g. /branch--4.2.0/) so the proxy routes correctly.
 * Passes canvasId as a query parameter for session scoping.
 */
function getWsUrl(sessionId) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base : base + '/'
  const canvasId = window.__storyboardCanvasBridgeState?.canvasId || 'unknown'
  return `${protocol}//${location.host}${baseClean}_storyboard/terminal/${sessionId}?canvas=${encodeURIComponent(canvasId)}`
}

/**
 * Calculate terminal cols/rows from pixel dimensions.
 */
function calcDimensions(widthPx, heightPx) {
  // Approximate character cell size for 13px monospace
  const cellWidth = 7.8
  const cellHeight = 17
  const padding = 24 // 12px each side
  const cols = Math.max(10, Math.floor((widthPx - padding) / cellWidth))
  const rows = Math.max(4, Math.floor((heightPx - padding) / cellHeight))
  return { cols, rows }
}

const DEFAULT_THEME = {
  background: '#0d1117',
  foreground: '#e6edf3',
  cursor: '#e6edf3',
  selectionBackground: '#264f78',
  black: '#484f58',
  red: '#ff7b72',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39d2c0',
  white: '#b1bac4',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#f0f6fc',
}

export default function TerminalWidget({ id, props, onUpdate, resizable }) {
  const width = readProp(props, 'width', terminalSchema)
  const height = readProp(props, 'height', terminalSchema)

  const containerRef = useRef(null)
  const termRef = useRef(null)
  const terminalRef = useRef(null)
  const wsRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectAttempt, setConnectAttempt] = useState(0)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    let term = null
    let ws = null

    async function setup() {
      try {
        const ghostty = await loadGhostty()
        if (disposed) return

        const dims = calcDimensions(width, height)
        const cfg = getTerminalConfig()

        term = new ghostty.Terminal({
          fontSize: cfg.fontSize ?? 13,
          fontFamily: cfg.fontFamily ?? "'Ghostty', 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
          cursorBlink: true,
          cursorStyle: 'bar',
          cols: dims.cols,
          rows: dims.rows,
          theme: { ...DEFAULT_THEME, ...cfg.theme },
        })

        term.open(containerRef.current)
        termRef.current = term

        // Connect WebSocket
        const url = getWsUrl(id)
        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (disposed) return
          setReady(true)
          ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
        }

        ws.onmessage = (e) => {
          if (disposed) return
          const data = typeof e.data === 'string' ? e.data : null
          // Intercept JSON control messages from the server
          if (data && data.startsWith('{')) {
            try {
              const msg = JSON.parse(data)
              if (msg.type === 'session-info' || msg.type === 'conflict' || msg.type === 'detached') {
                // Control message — don't render to terminal
                return
              }
            } catch {
              // Not valid JSON — pass through as terminal data
            }
          }
          term.write(typeof e.data === 'string' ? e.data : new Uint8Array(e.data))
        }

        ws.onclose = () => {
          if (disposed) return
          setReady(false)
          setSessionEnded(true)
        }

        ws.onerror = () => {
          if (disposed) return
          setReady(false)
          setSessionEnded(true)
        }

        // Terminal input → WebSocket
        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data)
          }
        })
      } catch (err) {
        if (!disposed) setError(err.message || 'Failed to load terminal')
      }
    }

    setup()

    return () => {
      disposed = true
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close()
      if (term) term.dispose()
      termRef.current = null
      wsRef.current = null
    }
  }, [id, connectAttempt])

  // Resize terminal on dimension changes
  useEffect(() => {
    if (!termRef.current) return
    const timer = setTimeout(() => {
      const dims = calcDimensions(width, height)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [width, height])

  const handleClick = useCallback(() => {
    if (sessionEnded) return
    termRef.current?.focus()
  }, [sessionEnded])

  const handleStartSession = useCallback(() => {
    setSessionEnded(false)
    setError(null)
    setConnectAttempt(c => c + 1)
  }, [])

  return (
    <div className={styles.container}>
      <div
        ref={terminalRef}
        className={styles.terminal}
        style={{
          ...(typeof width === 'number' ? { width: `${width}px` } : undefined),
          ...(typeof height === 'number' ? { height: `${height}px` } : undefined),
        }}
        onClick={handleClick}
      >
        {error && !sessionEnded && (
          <div className={styles.error}>
            <span>⚠ {error}</span>
          </div>
        )}
        <div ref={containerRef} className={styles.xtermContainer} />
        {sessionEnded && (
          <div
            className={overlayStyles.interactOverlay}
            style={{ backgroundColor: '#0d1117' }}
            onClick={handleStartSession}
            role="button"
            tabIndex={0}
            aria-label="Start terminal session"
            onKeyDown={(e) => { if (e.key === 'Enter') handleStartSession() }}
          >
            <span className={overlayStyles.interactHint}>Start terminal session</span>
          </div>
        )}
        {!ready && !error && !sessionEnded && (
          <div className={styles.loading}>Connecting…</div>
        )}
      </div>
      {resizable && (
        <ResizeHandle
          targetRef={terminalRef}
          onResize={handleResize}
          minWidth={300}
          minHeight={200}
        />
      )}
    </div>
  )
}
