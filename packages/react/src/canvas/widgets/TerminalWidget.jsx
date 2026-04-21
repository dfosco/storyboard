import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
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

/**
 * Build the WebSocket URL for the terminal backend.
 * Includes the base path (e.g. /branch--4.2.0/) so the proxy routes correctly.
 * Passes canvasId as a query parameter for session scoping.
 */
function getWsUrl(sessionId, prettyName) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base : base + '/'
  const canvasId = window.__storyboardCanvasBridgeState?.canvasId || 'unknown'
  let url = `${protocol}//${location.host}${baseClean}_storyboard/terminal/${sessionId}?canvas=${encodeURIComponent(canvasId)}`
  if (prettyName) url += `&name=${encodeURIComponent(prettyName)}`
  return url
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

const EMBED_TYPES = new Set(['prototype', 'story'])

/**
 * Find the first connected embed (prototype or story) widget via the canvas bridge.
 */
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

/**
 * Build an iframe URL for a connected embed widget.
 */
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
  const width = readProp(props, 'width', terminalSchema)
  const height = readProp(props, 'height', terminalSchema)
  const prettyName = props?.prettyName || null

  const containerRef = useRef(null)
  const termRef = useRef(null)
  const terminalRef = useRef(null)
  const wsRef = useRef(null)

  // State machine: connecting → interacting ⇄ live → ended
  //                          ↘ error
  // Connects on mount. Goes to interacting immediately on WS open.
  // Click outside → live. Click on live → interacting. WS close → ended.
  const [phase, setPhase] = useState('connecting') // connecting | interacting | live | error | ended
  const [errorMsg, setErrorMsg] = useState(null)
  const [connectAttempt, setConnectAttempt] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [waking, setWaking] = useState(false)
  const expandContainerRef = useRef(null)

  // Track phase in a ref for native event listeners
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // [devlog] Instrument wheel events to diagnose scroll issue
  useEffect(() => {
    const el = terminalRef.current
    if (!el) return
    function debugWheel(e) {
      const target = e.target
      const classes = target?.className || ''
      const tag = target?.tagName || ''
      console.log(`[devlog][TerminalWidget] wheel phase=${phaseRef.current} target=${tag}.${classes} defaultPrevented=${e.defaultPrevented}`)
    }
    el.addEventListener('wheel', debugWheel, { passive: true })
    return () => el.removeEventListener('wheel', debugWheel)
  }, [])

  // Auto-connect on first mount
  const hasMounted = useRef(false)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      setConnectAttempt(1)
    }
  }, [])

  const enterInteractive = useCallback(() => {
    setPhase('interacting')
    // Focus terminal so keyboard input goes to the PTY immediately
    const scrollEl = terminalRef.current?.closest('[class*="canvasScroll"]')
    const scrollTop = scrollEl?.scrollTop
    const scrollLeft = scrollEl?.scrollLeft
    termRef.current?.focus({ preventScroll: true })
    if (scrollEl && (scrollEl.scrollTop !== scrollTop || scrollEl.scrollLeft !== scrollLeft)) {
      scrollEl.scrollTop = scrollTop
      scrollEl.scrollLeft = scrollLeft
    }
  }, [])

  // Exit interacting on click outside → back to live
  // Also: focus terminal whenever entering interacting phase
  useEffect(() => {
    if (phase !== 'interacting') return

    // Focus the terminal (with scroll prevention)
    if (termRef.current) {
      const scrollEl = terminalRef.current?.closest('[class*="canvasScroll"]')
      const scrollTop = scrollEl?.scrollTop
      const scrollLeft = scrollEl?.scrollLeft
      termRef.current.focus({ preventScroll: true })
      if (scrollEl && (scrollEl.scrollTop !== scrollTop || scrollEl.scrollLeft !== scrollLeft)) {
        scrollEl.scrollTop = scrollTop
        scrollEl.scrollLeft = scrollLeft
      }
    }

    function handlePointerDown(e) {
      if (terminalRef.current && !terminalRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${id}"]`)
        if (chromeEl) return
        setPhase('live')
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [phase, id])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'expand') {
        setExpanded(true)
      }
    },
  }), [])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  // Connect terminal + WebSocket when connectAttempt changes
  useEffect(() => {
    if (connectAttempt === 0 || !containerRef.current) return

    let disposed = false
    let term = null
    let ws = null

    async function setup() {
      try {
        const ghostty = await loadGhostty()
        if (disposed || !ghostty) return

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

        const url = getWsUrl(id, prettyName)
        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (disposed) return
          setPhase('interacting')
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
          setPhase('ended')
        }

        ws.onerror = () => {
          if (disposed) return
          setPhase('ended')
        }

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data)
        })
      } catch (err) {
        if (!disposed) {
          setErrorMsg(err.message || 'Failed to load terminal')
          setPhase('error')
        }
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

  // Resize terminal to fill the expand container
  useEffect(() => {
    if (!expanded || !termRef.current || !expandContainerRef.current) return
    const timer = setTimeout(() => {
      const el = expandContainerRef.current
      if (!el) return
      const dims = calcDimensions(el.clientWidth, el.clientHeight - 40)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [expanded])

  // Restore terminal size when collapsing
  useEffect(() => {
    if (expanded) return
    if (!termRef.current) return
    const timer = setTimeout(() => {
      const dims = calcDimensions(width, height)
      termRef.current?.resize?.(dims.cols, dims.rows)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [expanded, width, height])

  // Reparent terminal DOM node between inline and expand
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
    if (phase === 'ended') return
    if (phase === 'interacting') {
      const scrollEl = terminalRef.current?.closest('[class*="canvasScroll"]')
      const scrollTop = scrollEl?.scrollTop
      const scrollLeft = scrollEl?.scrollLeft
      termRef.current?.focus({ preventScroll: true })
      if (scrollEl && (scrollEl.scrollTop !== scrollTop || scrollEl.scrollLeft !== scrollLeft)) {
        scrollEl.scrollTop = scrollTop
        scrollEl.scrollLeft = scrollLeft
      }
    }
  }, [phase])

  const handleStartSession = useCallback(() => {
    setWaking(true)
    setTimeout(() => {
      setWaking(false)
      setErrorMsg(null)
      setPhase('connecting')
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
        onKeyDown={phase === 'interacting' ? (e) => e.stopPropagation() : undefined}
      >
        {phase === 'error' && (
          <div className={styles.error}>
            <span>⚠ {errorMsg}</span>
          </div>
        )}
        {!expanded && <div ref={containerRef} className={styles.xtermContainer} />}

        {/* Live: click to re-enter interacting */}
        {phase === 'live' && (
          <div
            className={overlayStyles.interactOverlay}
            style={{ backgroundColor: 'transparent' }}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              enterInteractive()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') enterInteractive() }}
            aria-label="Click to interact"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}

        {/* Session ended */}
        {phase === 'ended' && (
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
              {waking ? 'Waking up...' : 'Start terminal session'}
            </span>
          </div>
        )}

        {/* Connecting */}
        {phase === 'connecting' && (
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
