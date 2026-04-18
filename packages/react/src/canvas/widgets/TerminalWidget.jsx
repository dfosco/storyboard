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

/**
 * Convert a KeyboardEvent to an ANSI escape sequence.
 * Used as a fallback when ghostty-web's textarea didn't receive the event
 * (e.g. focus was on the widget div instead of the textarea).
 */
function keyToAnsi(e) {
  // Ctrl+letter → control character (0x01–0x1a)
  if (e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
    const code = e.key.toLowerCase().charCodeAt(0)
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(code - 96)
    }
  }

  // Tab / Shift+Tab
  if (e.key === 'Tab') return e.shiftKey ? '\x1b[Z' : '\t'

  // Arrow keys (with shift/ctrl/alt modifiers)
  const arrowMap = { ArrowUp: 'A', ArrowDown: 'B', ArrowRight: 'C', ArrowLeft: 'D' }
  if (arrowMap[e.key]) {
    const mod = (e.shiftKey ? 1 : 0) + (e.altKey ? 2 : 0) + (e.ctrlKey ? 4 : 0)
    if (mod > 0) return `\x1b[1;${mod + 1}${arrowMap[e.key]}`
    return `\x1b[${arrowMap[e.key]}`
  }

  // Other special keys
  const specialMap = {
    Enter: '\r',
    Backspace: '\x7f',
    Delete: '\x1b[3~',
    Home: '\x1b[H',
    End: '\x1b[F',
    PageUp: '\x1b[5~',
    PageDown: '\x1b[6~',
    Insert: '\x1b[2~',
  }
  if (specialMap[e.key]) return specialMap[e.key]

  // Printable character
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) return e.key

  return null
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

  const focusTerminal = useCallback(() => {
    // Focus ghostty-web's internal textarea directly for reliable keyboard capture.
    // term.focus() may not work in all cases, so fall back to querying the DOM.
    const term = termRef.current
    if (term?.focus) term.focus()
    const textarea = containerRef.current?.querySelector('textarea')
    if (textarea) textarea.focus()
  }, [])

  const enterInteractive = useCallback(() => {
    setInteractive(true)
    setTimeout(focusTerminal, 0)
  }, [focusTerminal])

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

  // Keyboard isolation for interactive mode.
  // We use capture phase on the widget so we intercept events before any
  // canvas-level handlers (which listen on document in bubble phase).
  // For most keys, ghostty-web handles keydown→ANSI conversion internally
  // on its textarea. We just need to stop propagation so canvas shortcuts
  // (Delete, Ctrl+C copy-widget, etc.) don't fire, and preventDefault so
  // the browser doesn't steal Tab/Shift+Tab for focus navigation.
  //
  // As a safety net, if ghostty-web doesn't produce onData for certain
  // modifier combos, we send the ANSI sequence manually.
  useEffect(() => {
    if (!interactive) return
    const el = widgetRef.current
    if (!el) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setInteractive(false)
        return
      }

      // Stop the event from reaching canvas handlers
      e.stopPropagation()

      // Prevent browser defaults (Tab focus navigation, Ctrl+C copy, etc.)
      // ghostty-web processes the key in its own handler on the textarea
      // before this capture-phase handler fires on the parent, so this
      // does not interfere with terminal input.
      if (e.key === 'Tab' || (e.ctrlKey && e.key !== 'v')) {
        e.preventDefault()
      }

      // Re-focus the terminal textarea if focus drifted to the widget div
      const active = document.activeElement
      const textarea = containerRef.current?.querySelector('textarea')
      if (textarea && active !== textarea) {
        textarea.focus()
        // Manually send ANSI for this keystroke since the textarea missed it
        const ansi = keyToAnsi(e)
        if (ansi && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(ansi)
        }
      }
    }

    function handleKeyUp(e) {
      if (e.key !== 'Escape') {
        e.stopPropagation()
      }
    }

    el.addEventListener('keydown', handleKeyDown, true)
    el.addEventListener('keyup', handleKeyUp, true)
    return () => {
      el.removeEventListener('keydown', handleKeyDown, true)
      el.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [interactive])

  // Re-focus terminal textarea when interactive mode is activated
  // and periodically ensure it stays focused (e.g. after pointer clicks
  // inside the terminal area that might move focus to the widget div).
  useEffect(() => {
    if (!interactive) return
    focusTerminal()
    function handleFocusIn(e) {
      const textarea = containerRef.current?.querySelector('textarea')
      if (textarea && e.target !== textarea && widgetRef.current?.contains(e.target)) {
        textarea.focus()
      }
    }
    const el = widgetRef.current
    if (el) el.addEventListener('focusin', handleFocusIn)
    return () => {
      if (el) el.removeEventListener('focusin', handleFocusIn)
    }
  }, [interactive, focusTerminal])

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
