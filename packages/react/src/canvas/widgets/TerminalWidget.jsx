import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetProps.js'
import { getTerminalConfig } from '@dfosco/storyboard-core'
import { useOverride } from '../../hooks/useOverride.js'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './TerminalWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

const terminalSchema = schemas['terminal']

let ghosttyPromise = null
function loadGhostty() {
  if (!ghosttyPromise) {
    ghosttyPromise = import('ghostty-web')
      .then(async (mod) => {
        if (mod.init) await mod.init()
        return mod
      })
      .catch((err) => {
        ghosttyPromise = null
        console.warn('[TerminalWidget] ghostty-web not available:', err.message)
        return null
      })
  }
  return ghosttyPromise
}

function getWsUrl(sessionId, prettyName) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base : base + '/'
  const canvasId = window.__storyboardCanvasBridgeState?.canvasId || 'unknown'
  let url = `${protocol}//${location.host}${baseClean}_storyboard/terminal/${sessionId}?canvas=${encodeURIComponent(canvasId)}`
  if (prettyName) url += `&name=${encodeURIComponent(prettyName)}`
  return url
}

function calcDimensions(widthPx, heightPx, fontSize = 13) {
  // Cell dimensions scale proportionally with font size.
  // Base measurements at 13px: ~7.8px wide, ~17px tall.
  const scale = fontSize / 13
  const cellWidth = 7.8 * scale
  const cellHeight = 17 * scale
  const padding = 24
  const cols = Math.max(10, Math.floor((widthPx - padding) / cellWidth))
  const rows = Math.max(4, Math.floor((heightPx - padding) / cellHeight))
  return { cols, rows }
}

const EMBED_TYPES = new Set(['prototype', 'story'])

function findConnectedEmbed(widgetId) {
  const bridge = window.__storyboardCanvasBridgeState
  if (!bridge?.connectors || !bridge?.widgets) return null
  const connectedIds = new Set()
  for (const c of bridge.connectors) {
    if (c.startWidgetId === widgetId) connectedIds.add(c.endWidgetId)
    if (c.endWidgetId === widgetId) connectedIds.add(c.startWidgetId)
  }
  for (const w of bridge.widgets) {
    if (connectedIds.has(w.id) && EMBED_TYPES.has(w.type)) return w
  }
  return null
}

function buildEmbedUrl(widget) {
  if (!widget) return null
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base.slice(0, -1) : base
  if (widget.type === 'prototype') {
    const src = widget.props?.src
    if (!src) return null
    if (/^https?:\/\//.test(src)) return src
    return `${baseClean}${src.startsWith('/') ? '' : '/'}${src}?_sb_embed&_sb_hide_branch_bar`
  }
  if (widget.type === 'story') {
    const storyId = widget.props?.storyId
    const exportName = widget.props?.exportName
    if (!storyId) return null
    const storyData = typeof window !== 'undefined' && window.__storyboardStoryIndex?.[storyId]
    if (storyData?._route) {
      const route = exportName ? `${storyData._route}?export=${exportName}` : storyData._route
      return `${baseClean}${route}`
    }
    return null
  }
  return null
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

export default forwardRef(function TerminalWidget({ id, props, onUpdate, resizable }, ref) {
  const cfg = getTerminalConfig()
  const fontSize = cfg.fontSize ?? 13
  const width = props?.width ?? cfg.defaultWidth ?? readProp(props, 'width', terminalSchema)
  const height = props?.height ?? cfg.defaultHeight ?? readProp(props, 'height', terminalSchema)
  const prettyName = props?.prettyName || null

  const containerRef = useRef(null)
  const termRef = useRef(null)
  const terminalRef = useRef(null)
  const wsRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectAttempt, setConnectAttempt] = useState(0)
  const [interactive, setInteractive] = useState(false)
  const [expandedOverride, setExpandedOverride, clearExpandedOverride] = useOverride(`_terminal_expanded_${id}`)
  const expanded = expandedOverride === 'true'
  const setExpanded = useCallback((val) => {
    if (val) setExpandedOverride('true')
    else clearExpandedOverride()
  }, [setExpandedOverride, clearExpandedOverride])
  const [waking, setWaking] = useState(false)
  const [showDragHint, setShowDragHint] = useState(false)
  const expandContainerRef = useRef(null)
  const dragHintTimer = useRef(null)

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'expand') setExpanded(true)
    },
  }), [setExpanded])

  // Exit interactive on click outside
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (terminalRef.current && !terminalRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${id}"]`)
        if (chromeEl) return
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, id])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  // Connect terminal + WebSocket
  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    let term = null
    let ws = null

    async function setup() {
      try {
        const ghostty = await loadGhostty()
        if (disposed) return
        if (!ghostty) {
          setError('ghostty-web not installed — add it to your dependencies to enable terminal widgets')
          return
        }

        const dims = calcDimensions(width, height, fontSize)
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

        // SGR mouse wheel for tmux scroll in alternate screen
        term.attachCustomWheelEventHandler((e) => {
          if (!(term.wasmTerm?.isAlternateScreen?.() ?? false)) return false
          const sock = wsRef.current
          if (!sock || sock.readyState !== WebSocket.OPEN) return true
          const btn = e.deltaY < 0 ? 64 : 65
          const lines = Math.max(1, Math.min(5, Math.ceil(Math.abs(e.deltaY) / 33)))
          for (let i = 0; i < lines; i++) {
            sock.send(`\x1b[<${btn};1;1M`)
            sock.send(`\x1b[<${btn};1;1m`)
          }
          return true
        })

        const url = getWsUrl(id, prettyName)
        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (disposed) return
          setReady(true)
          setInteractive(true)
          ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
        }

        ws.onmessage = (e) => {
          if (disposed) return
          const data = typeof e.data === 'string' ? e.data : null
          if (data && data.startsWith('{')) {
            try {
              const msg = JSON.parse(data)
              if (msg.type === 'session-info' || msg.type === 'conflict' || msg.type === 'detached') return
            } catch { /* not JSON */ }
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

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data)
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
      const dims = calcDimensions(width, height, fontSize)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [width, height])

  // Resize for expand
  useEffect(() => {
    if (!expanded || !termRef.current || !expandContainerRef.current) return
    const timer = setTimeout(() => {
      const el = expandContainerRef.current
      if (!el) return
      const dims = calcDimensions(el.clientWidth, el.clientHeight - 40, fontSize)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
      setInteractive(true)
      termRef.current?.focus?.()
    }, 100)
    return () => clearTimeout(timer)
  }, [expanded])

  // Restore size on collapse
  useEffect(() => {
    if (expanded || !termRef.current) return
    const timer = setTimeout(() => {
      const dims = calcDimensions(width, height, fontSize)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [expanded, width, height])

  // Reparent terminal DOM between inline and expand
  useEffect(() => {
    const xtermEl = containerRef.current
    if (!xtermEl) return
    if (expanded && expandContainerRef.current) {
      expandContainerRef.current.appendChild(xtermEl)
    } else if (!expanded && terminalRef.current) {
      terminalRef.current.appendChild(xtermEl)
    }
  }, [expanded])

  const handleClick = useCallback(() => {
    if (sessionEnded) return
    if (ready) {
      setInteractive(true)
      const scrollEl = terminalRef.current?.closest('[class*="canvasScroll"]')
      const scrollTop = scrollEl?.scrollTop
      const scrollLeft = scrollEl?.scrollLeft
      termRef.current?.focus({ preventScroll: true })
      if (scrollEl && (scrollEl.scrollTop !== scrollTop || scrollEl.scrollLeft !== scrollLeft)) {
        scrollEl.scrollTop = scrollTop
        scrollEl.scrollLeft = scrollLeft
      }
    }
  }, [sessionEnded, ready])

  const handleTerminalPointerDown = useCallback((e) => {
    if (!interactive) return
    if (e.target.closest('.tc-drag-handle')) return
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    function onMove(me) {
      if (!moved && (Math.abs(me.clientX - startX) > 5 || Math.abs(me.clientY - startY) > 5)) {
        moved = true
        setShowDragHint(true)
        clearTimeout(dragHintTimer.current)
        dragHintTimer.current = setTimeout(() => setShowDragHint(false), 2000)
      }
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [interactive])

  const handleStartSession = useCallback(() => {
    setWaking(true)
    setTimeout(() => {
      setWaking(false)
      setSessionEnded(false)
      setError(null)
      setConnectAttempt(c => c + 1)
    }, 1500)
  }, [])

  const titleLabel = `terminal · ${prettyName || '...'}`
  const connectedEmbed = expanded ? findConnectedEmbed(id) : null
  const embedUrl = expanded ? buildEmbedUrl(connectedEmbed) : null
  const hasSplit = Boolean(embedUrl)

  return (
    <>
    <div className={styles.container}>
      <div className={styles.titleBar}>{titleLabel}</div>
      <div
        ref={terminalRef}
        className={styles.terminal}
        style={{
          ...(typeof width === 'number' ? { width: `${width}px` } : undefined),
          ...(typeof height === 'number' ? { height: `${height}px` } : undefined),
        }}
        onClick={handleClick}
        onPointerDown={handleTerminalPointerDown}
        onKeyDown={interactive ? (e) => e.stopPropagation() : undefined}
      >
        {showDragHint && (
          <div className={styles.dragHint}>
            <span className={styles.dragHintArrow}>←</span> Drag here to move widget
          </div>
        )}
        {error && !sessionEnded && (
          <div className={styles.error}>
            <span>⚠ {error}</span>
          </div>
        )}
        <div ref={containerRef} className={styles.xtermContainer} />

        {/* Live but not interactive */}
        {ready && !interactive && !sessionEnded && (
          <div
            className={overlayStyles.interactOverlay}
            style={{ backgroundColor: 'transparent' }}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              setInteractive(true)
              termRef.current?.focus({ preventScroll: true })
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') { setInteractive(true); termRef.current?.focus({ preventScroll: true }) } }}
            aria-label="Click to interact"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}

        {/* Session ended */}
        {sessionEnded && (
          <div
            className={overlayStyles.interactOverlay}
            style={{ backgroundColor: '#0d1117', flexDirection: 'column', gap: 0 }}
            onClick={handleStartSession}
            role="button"
            tabIndex={0}
            aria-label="Start terminal session"
            onKeyDown={(e) => { if (e.key === 'Enter') handleStartSession() }}
          >
            {!waking && (
              <div className={styles.buddyZzz}>
                <span className={styles.z1}>z</span>
                <span className={styles.z2}>z</span>
                <span className={styles.z3}>z</span>
              </div>
            )}
            <span className={overlayStyles.interactHint}>
              {waking ? 'Waking up...' : connectAttempt > 0 ? 'Continue terminal session' : 'Start terminal session'}
            </span>
          </div>
        )}

        {/* Connecting */}
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
    {createPortal(
      <div
        className={styles.expandBackdrop}
        style={expanded ? undefined : { display: 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(false) }}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className={styles.expandTopBar}>
          <span className={styles.expandTitle}>{titleLabel}</span>
          {hasSplit && connectedEmbed && (
            <span className={styles.expandEmbedLabel}>
              {connectedEmbed.type === 'story' ? connectedEmbed.props?.storyId : connectedEmbed.props?.src || 'Prototype'}
            </span>
          )}
          <button className={styles.expandClose} onClick={() => setExpanded(false)} aria-label="Close expanded view" autoFocus>✕</button>
        </div>
        <div className={`${styles.expandBody}${hasSplit ? ` ${styles.expandSplit}` : ''}`}>
          <div ref={expandContainerRef} className={styles.expandTerminal} />
          {hasSplit && (
            <div className={styles.expandEmbed}>
              <iframe src={embedUrl} className={styles.expandIframe} title="Connected embed" />
            </div>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  )
})
