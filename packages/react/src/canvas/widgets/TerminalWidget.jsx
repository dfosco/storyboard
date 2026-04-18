import { useRef, useEffect, useCallback, useState } from 'react'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetProps.js'
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
 */
function getWsUrl(sessionId) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base : base + '/'
  return `${protocol}//${location.host}${baseClean}_storyboard/terminal/${sessionId}`
}

/**
 * Calculate terminal cols/rows from pixel dimensions.
 */
function calcDimensions(widthPx, heightPx) {
  const cellWidth = 7.8
  const cellHeight = 17
  const padding = 16
  const cols = Math.max(10, Math.floor((widthPx - padding) / cellWidth))
  const rows = Math.max(4, Math.floor((heightPx - padding) / cellHeight))
  return { cols, rows }
}

export default function TerminalWidget({ id, props, onUpdate, resizable }) {
  const width = readProp(props, 'width', terminalSchema)
  const height = readProp(props, 'height', terminalSchema)

  const containerRef = useRef(null)
  const widgetRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [interactive, setInteractive] = useState(false)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const enterInteractive = useCallback(() => {
    setInteractive(true)
    setTimeout(() => termRef.current?.focus(), 0)
  }, [])

  // Exit interactive mode on click outside
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  // Bubble-phase keyboard listener — only active in interactive mode.
  // The canvas keydown handlers listen on document in bubble phase.
  // We attach a bubble-phase listener on the widget element that stops
  // propagation, preventing canvas shortcuts from firing while letting
  // ghostty-web's internal handlers (on its own textarea) work normally.
  useEffect(() => {
    if (!interactive) return
    const el = widgetRef.current
    if (!el) return

    function stopKeys(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setInteractive(false)
        return
      }
      // Prevent browser focus navigation so Tab/Shift+Tab go to the PTY
      if (e.key === 'Tab') {
        e.preventDefault()
      }
      e.stopPropagation()
    }

    el.addEventListener('keydown', stopKeys)
    el.addEventListener('keyup', stopKeys)
    return () => {
      el.removeEventListener('keydown', stopKeys)
      el.removeEventListener('keyup', stopKeys)
    }
  }, [interactive])

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

        term = new ghostty.Terminal({
          fontSize: 13,
          fontFamily: "'Ghostty', 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
          cursorBlink: true,
          cursorStyle: 'bar',
          cols: dims.cols,
          rows: dims.rows,
          theme: {
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
          },
        })

        term.open(containerRef.current)
        termRef.current = term

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
          term.write(typeof e.data === 'string' ? e.data : new Uint8Array(e.data))
        }

        ws.onclose = () => {
          if (disposed) return
          term.write('\r\n\x1b[90m[session ended]\x1b[0m\r\n')
          setReady(false)
        }

        ws.onerror = () => {
          if (disposed) return
          setError('Connection failed')
        }

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
  }, [id])

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

  return (
    <div className={styles.container}>
      <div
        ref={widgetRef}
        className={styles.terminal}
        style={{
          ...(typeof width === 'number' ? { width: `${width}px` } : undefined),
          ...(typeof height === 'number' ? { height: `${height}px` } : undefined),
        }}
      >
        {error && (
          <div className={styles.error}>
            <span>⚠ {error}</span>
          </div>
        )}
        <div ref={containerRef} className={styles.xtermContainer} />
        {!ready && !error && (
          <div className={styles.loading}>Connecting…</div>
        )}
        {!interactive && ready && (
          <div
            className={overlayStyles.interactOverlay}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              enterInteractive()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                enterInteractive()
              }
            }}
            aria-label="Click to interact with terminal"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}
      </div>
      {resizable && (
        <ResizeHandle
          targetRef={widgetRef}
          onResize={handleResize}
          minWidth={300}
          minHeight={200}
        />
      )}
    </div>
  )
}
