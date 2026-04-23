import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { readProp, promptSchema } from './widgetProps.js'
import { CopilotIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon, XIcon, SquareFillIcon, LinkIcon, SmileyIcon, PlusIcon } from '@primer/octicons-react'
import styles from './PromptWidget.module.css'

function getBase() {
  return (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
}

async function spawnPromptAgent({ canvasId, widgetId, prompt }) {
  const res = await fetch(`${getBase()}/_storyboard/canvas/prompt/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvasId, widgetId, prompt }),
  })
  return res.json()
}

async function killSession(widgetId) {
  const res = await fetch(`${getBase()}/_storyboard/canvas/terminal/kill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgetId }),
  })
  return res.json()
}

function getWsUrl(sessionId, canvasId, readOnly = false) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base : base + '/'
  let url = `${protocol}//${location.host}${baseClean}_storyboard/terminal/${sessionId}?canvas=${encodeURIComponent(canvasId)}`
  if (readOnly) url += '&readOnly=1'
  return url
}

let ghosttyPromise = null
function loadGhostty() {
  if (!ghosttyPromise) {
    ghosttyPromise = import(/* @vite-ignore */ 'ghostty-web')
      .then(async (mod) => {
        if (mod.init) await mod.init()
        return mod
      })
      .catch((err) => {
        ghosttyPromise = null
        console.warn('[PromptWidget] ghostty-web not available:', err.message)
        return null
      })
  }
  return ghosttyPromise
}

const MINI_FONT_SIZE = 11
const MINI_TERMINAL_HEIGHT = 180

const DEFAULT_THEME = {
  background: '#0d1117',
  foreground: '#e6edf3',
  cursor: '#e6edf3',
  selectionBackground: '#264f78',
}

function calcMiniDimensions(widthPx) {
  const scale = MINI_FONT_SIZE / 13
  const cellWidth = 7.8 * scale
  const cellHeight = 17 * scale
  const hPad = 18
  const vPad = 18
  const cols = Math.max(10, Math.floor((widthPx - hPad) / cellWidth))
  const rows = Math.max(4, Math.floor((MINI_TERMINAL_HEIGHT - vPad) / cellHeight))
  return { cols, rows }
}

const SUGGESTIONS = [
  'Implement the connected design',
  'Review and refactor this code',
]

const PromptWidget = forwardRef(function PromptWidget({ id, props, onUpdate }, ref) {
  const persistedText = readProp(props, 'text', promptSchema)
  const persistedStatus = readProp(props, 'status', promptSchema)
  const errorMessage = readProp(props, 'errorMessage', promptSchema)
  const width = readProp(props, 'width', promptSchema)
  const connectionsRaw = readProp(props, 'connections', promptSchema)

  const [draftText, setDraftText] = useState('')
  const [execStatus, setExecStatus] = useState(persistedStatus || 'idle')
  const [execError, setExecError] = useState(errorMessage || '')
  const [showOutput, setShowOutput] = useState(false)
  const canEdit = typeof onUpdate === 'function'

  const connections = connectionsRaw ? connectionsRaw.split(',').filter(Boolean) : []

  const termContainerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const termDisposedRef = useRef(false)
  const textareaRef = useRef(null)

  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  useEffect(() => {
    if (!import.meta.hot) return

    const handler = (data) => {
      if (data.widgetId !== id) return
      if (data.status === 'done' || data.status === 'completed') {
        setExecStatus('done')
        onUpdateRef.current?.({ status: 'done' })
      } else if (data.status === 'error') {
        setExecStatus('error')
        setExecError(data.message || 'Unknown error')
        onUpdateRef.current?.({ status: 'error', errorMessage: data.message || 'Unknown error' })
      } else if (data.status === 'cancelled') {
        setExecStatus('idle')
        onUpdateRef.current?.({ status: 'idle', sessionId: '', errorMessage: '' })
      }
    }

    import.meta.hot.on('storyboard:agent-status', handler)
    return () => import.meta.hot.off('storyboard:agent-status', handler)
  }, [id])

  useImperativeHandle(ref, () => ({
    handleAction(action) {
      if (action === 'expand-output') {
        setShowOutput(prev => !prev)
        return true
      }
      if (action === 'open-terminal') {
        document.dispatchEvent(new CustomEvent('storyboard:expand-widget', {
          detail: { widgetId: id, type: 'prompt' },
        }))
        return true
      }
      return false
    },
    getState(key) {
      if (key === 'showOutput') return showOutput
      if (key === 'hasSession') return execStatus !== 'idle'
      return undefined
    },
  }), [id, showOutput, execStatus])

  const handleSubmit = useCallback(async () => {
    if (!draftText.trim() || !canEdit) return

    setExecStatus('pending')
    setExecError('')

    const pathParts = window.location.pathname.split('/')
    const canvasIdx = pathParts.indexOf('canvas')
    const canvasId = canvasIdx >= 0 ? pathParts[canvasIdx + 1] : 'default'

    onUpdate?.({ text: draftText, status: 'pending' })

    try {
      const result = await spawnPromptAgent({
        canvasId,
        widgetId: id,
        prompt: draftText,
      })

      if (result.error) {
        setExecStatus('error')
        setExecError(result.error)
        onUpdate?.({ status: 'error', errorMessage: result.error })
        return
      }

      onUpdate?.({ sessionId: result.tmuxName || '' })
      setShowOutput(true)
    } catch (err) {
      setExecStatus('error')
      setExecError(err.message)
      onUpdate?.({ status: 'error', errorMessage: err.message })
    }
  }, [draftText, canEdit, id, onUpdate])

  const handleCancel = useCallback(async () => {
    try {
      await killSession(id)
      setExecStatus('idle')
      setExecError('')
      onUpdate?.({ status: 'idle', sessionId: '', errorMessage: '' })
    } catch (err) {
      setExecError(`Cancel failed: ${err.message}`)
    }
  }, [id, onUpdate])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    e.stopPropagation()
  }, [handleSubmit])

  const handleReset = useCallback(() => {
    setExecStatus('idle')
    setExecError('')
    setDraftText('')
    setShowOutput(false)
    onUpdate?.({ status: 'idle', sessionId: '', errorMessage: '', text: '' })
  }, [onUpdate])

  const handleSuggestionClick = useCallback((text) => {
    setDraftText(text)
    textareaRef.current?.focus()
  }, [])

  // Embedded read-only terminal
  useEffect(() => {
    if (!showOutput || execStatus === 'idle') return
    if (!termContainerRef.current) return

    termDisposedRef.current = false
    let term = null
    let ws = null

    async function setup() {
      try {
        const ghostty = await loadGhostty()
        if (termDisposedRef.current) return
        if (!ghostty) return

        const widthPx = typeof width === 'number' ? width : 320
        const dims = calcMiniDimensions(widthPx)

        term = new ghostty.Terminal({
          fontSize: MINI_FONT_SIZE,
          fontFamily: "'Ghostty', 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
          cursorBlink: false,
          cursorStyle: 'bar',
          cols: dims.cols,
          rows: dims.rows,
          theme: DEFAULT_THEME,
        })

        term.open(termContainerRef.current)
        termRef.current = term

        const pathParts = window.location.pathname.split('/')
        const canvasIdx = pathParts.indexOf('canvas')
        const canvasId = canvasIdx >= 0 ? pathParts[canvasIdx + 1] : 'default'

        const url = getWsUrl(id, canvasId, true)
        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (termDisposedRef.current) return
          ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
        }

        ws.onmessage = (e) => {
          if (termDisposedRef.current) return
          const data = typeof e.data === 'string' ? e.data : null
          if (data && data.startsWith('{')) {
            try {
              const msg = JSON.parse(data)
              if (msg.type === 'session-info' || msg.type === 'error') return
            } catch { /* not JSON */ }
          }
          term.write(typeof e.data === 'string' ? e.data : new Uint8Array(e.data))
        }

        ws.onclose = () => {}
        ws.onerror = () => {}
      } catch (err) {
        console.warn('[PromptWidget] terminal setup failed:', err.message)
      }
    }

    setup()

    return () => {
      termDisposedRef.current = true
      if (ws && ws.readyState <= 1) try { ws.close() } catch { /* best effort */ }
      if (term) try { term.dispose() } catch { /* best effort */ }
      termRef.current = null
      wsRef.current = null
    }
  }, [showOutput, execStatus, id, width])

  const isPending = execStatus === 'pending'
  const isDone = execStatus === 'done'
  const isError = execStatus === 'error'
  const hasSession = isPending || isDone || isError

  return (
    <div
      className={styles.wrapper}
      style={typeof width === 'number' ? { width: `${width}px` } : undefined}
    >
      {/* ── Idle / Error: input state ── */}
      {(execStatus === 'idle' || isError) && (
        <>
          <div className={styles.header}>
            <span className={styles.avatar}>
              <CopilotIcon size={20} />
            </span>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              data-canvas-allow-text-selection
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="What should I do?"
              rows={1}
              disabled={!canEdit}
            />
          </div>

          {isError && (
            <p className={styles.errorText} title={execError}>
              {execError}
            </p>
          )}

          <div className={styles.toolbar}>
            <div className={styles.toolbarIcons}>
              <button className={styles.iconButton} aria-label="Add context" title="Add context">
                <PlusIcon size={16} />
              </button>
              <span className={styles.separator} />
              <button className={styles.iconButton} aria-label="Connections" title="Connections">
                <LinkIcon size={16} />
              </button>
              {connections.length > 0 && (
                <span className={styles.connectionBadge}>{connections.length}</span>
              )}
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!draftText.trim() || !canEdit}
              title="Run prompt (⌘+Enter)"
            >
              {isError ? 'Retry' : 'Run'}
            </button>
          </div>

          {!draftText.trim() && (
            <>
              <div className={styles.suggestionsLabel}>
                Start with a suggestion <span className={styles.sparkle}>✦</span>
              </div>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((text, i) => (
                  <button
                    key={i}
                    className={styles.chip}
                    onClick={() => handleSuggestionClick(text)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Pending state ── */}
      {isPending && (
        <div className={styles.pendingArea}>
          <div className={styles.pendingHeader}>
            <span className={styles.avatar}>
              <CopilotIcon size={20} />
            </span>
            <p className={styles.pendingText}>{persistedText || draftText}</p>
          </div>
          <div className={styles.pendingFooter}>
            <span className={styles.pendingHint}>Processing…</span>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
              title="Cancel (stop agent)"
            >
              <svg className={styles.spinnerSvg} viewBox="0 0 16 16" width="14" height="14">
                <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="28 10" />
              </svg>
              <span className={styles.stopIcon}>
                <SquareFillIcon size={8} />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Done state ── */}
      {isDone && (
        <div className={styles.doneArea}>
          <div className={styles.doneHeader}>
            <span className={`${styles.avatar} ${styles.avatarDone}`}>
              <CheckCircleIcon size={20} />
            </span>
            <p className={styles.doneText}>{persistedText}</p>
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>
            New prompt
          </button>
        </div>
      )}

      {/* ── Inline read-only terminal output ── */}
      {hasSession && showOutput && (
        <div className={styles.terminalArea}>
          <div className={styles.terminalHeader}>
            <span className={styles.terminalLabel}>Output</span>
            <button
              className={styles.terminalClose}
              onClick={() => setShowOutput(false)}
              title="Hide output"
            >
              <XIcon size={12} />
            </button>
          </div>
          <div
            ref={termContainerRef}
            className={styles.terminalContainer}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}
    </div>
  )
})

export default PromptWidget
