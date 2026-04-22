import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetProps.js'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './ActionWidget.module.css'

const actionSchema = schemas['action']

/**
 * ActionWidget — a canvas widget that runs a background agent.
 *
 * Displays a "Run" button. When clicked, spawns a headless tmux+copilot
 * session via the /agent/spawn endpoint. Shows status indicators
 * (running/done/error) and allows peeking into errored sessions.
 */
export default forwardRef(function ActionWidget({ id, props, onUpdate, resizable }, ref) {
  const width = readProp(props, 'width', actionSchema)
  const height = readProp(props, 'height', actionSchema)
  const prompt = readProp(props, 'prompt', actionSchema) || ''
  const label = readProp(props, 'label', actionSchema) || 'Run Agent'

  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [message, setMessage] = useState(null)

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      // ActionWidget doesn't handle expand/split-screen itself
      return false
    },
  }), [])

  // Listen for agent status updates via Vite HMR custom events
  useEffect(() => {
    if (!import.meta.hot) return

    const handler = (data) => {
      if (data.widgetId === id) {
        setStatus(data.status)
        setMessage(data.message || null)
      }
    }

    import.meta.hot.on('storyboard:agent-status', handler)
    return () => {
      // Vite HMR doesn't support removeListener, but cleanup on unmount
    }
  }, [id])

  // Poll for status on mount (in case we missed a WS event)
  useEffect(() => {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
    const baseClean = base.endsWith('/') ? base : base + '/'

    fetch(`${baseClean}_storyboard/canvas/agent/status?widgetId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.agentStatus?.status) {
          setStatus(data.agentStatus.status)
          setMessage(data.agentStatus.message || null)
        }
      })
      .catch(() => {})
  }, [id])

  const handleRun = useCallback(async () => {
    if (status === 'running') return

    setStatus('running')
    setMessage('Spawning agent...')

    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
    const baseClean = base.endsWith('/') ? base : base + '/'

    try {
      const res = await fetch(`${baseClean}_storyboard/canvas/agent/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: window.__storyboardCanvasBridgeState?.canvasId || 'unknown',
          widgetId: id,
          prompt,
          autopilot: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setMessage(data.error || 'Spawn failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Connection failed')
    }
  }, [id, prompt, status])

  const handlePeek = useCallback(async () => {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
    const baseClean = base.endsWith('/') ? base : base + '/'

    try {
      const res = await fetch(`${baseClean}_storyboard/canvas/agent/peek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: id,
          canvasId: window.__storyboardCanvasBridgeState?.canvasId || 'unknown',
        }),
      })

      if (res.ok) {
        setMessage('Session opened — check the new terminal widget')
      } else {
        const data = await res.json().catch(() => ({}))
        setMessage(data.error || 'Peek failed')
      }
    } catch (err) {
      setMessage(err.message || 'Connection failed')
    }
  }, [id])

  const handleDismiss = useCallback(() => {
    setStatus('idle')
    setMessage(null)
  }, [])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const statusIcon = {
    idle: '⚡',
    running: '⏳',
    done: '✓',
    error: '!',
  }

  const statusClass = {
    idle: styles.idle,
    running: styles.running,
    done: styles.done,
    error: styles.error,
  }

  return (
    <div
      className={`${styles.container} ${statusClass[status] || ''}`}
      style={{
        ...(typeof width === 'number' ? { width: `${width}px` } : undefined),
        ...(typeof height === 'number' ? { height: `${height}px` } : undefined),
      }}
    >
      <div className={styles.header}>
        <span className={styles.icon}>{statusIcon[status]}</span>
        <span className={styles.label}>{label}</span>
      </div>

      {prompt && (
        <div className={styles.prompt}>
          {prompt.length > 100 ? prompt.slice(0, 100) + '…' : prompt}
        </div>
      )}

      <div className={styles.actions}>
        {(status === 'idle' || status === 'done') && (
          <button className={styles.runButton} onClick={handleRun}>
            {status === 'done' ? 'Run Again' : 'Run'}
          </button>
        )}

        {status === 'running' && (
          <div className={styles.spinner}>Running…</div>
        )}

        {status === 'error' && (
          <div className={styles.errorActions}>
            <button className={styles.peekButton} onClick={handlePeek}>
              Peek Session
            </button>
            <button className={styles.dismissButton} onClick={handleDismiss}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={styles.message}>{message}</div>
      )}

      {resizable && (
        <ResizeHandle
          onResize={handleResize}
          minWidth={200}
          minHeight={120}
        />
      )}
    </div>
  )
})
