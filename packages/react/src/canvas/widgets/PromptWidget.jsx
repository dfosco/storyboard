import { useState, useCallback, useEffect, useRef } from 'react'
import { readProp, promptSchema } from './widgetProps.js'
import styles from './PromptWidget.module.css'

function getBase() {
  return (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
}

/** Spawn a prompt agent session via the canvas prompt API. */
async function spawnPromptAgent({ canvasId, widgetId, prompt }) {
  const res = await fetch(`${getBase()}/_storyboard/canvas/prompt/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvasId, widgetId, prompt }),
  })
  return res.json()
}

function SpinnerIcon() {
  return (
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="8" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.343 13.657A8 8 0 1 1 13.66 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z" />
    </svg>
  )
}

function SubmitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M.989 2.47a.75.75 0 0 1 1.02-.3l12.5 7a.75.75 0 0 1 0 1.32l-12.5 7a.75.75 0 0 1-1.07-.82L2.63 8 .94 3.29a.75.75 0 0 1 .05-.82ZM4.101 8.5 2.832 12.94 13.2 7.16v1.68L2.832 3.06 4.1 7.5H8.75a.75.75 0 0 1 0 1.5H4.1v-.5Z" />
    </svg>
  )
}

export default function PromptWidget({ id, props, onUpdate }) {
  const persistedText = readProp(props, 'text', promptSchema)
  const persistedStatus = readProp(props, 'status', promptSchema)
  const sessionId = readProp(props, 'sessionId', promptSchema)
  const errorMessage = readProp(props, 'errorMessage', promptSchema)
  const width = readProp(props, 'width', promptSchema)
  const connectionsRaw = readProp(props, 'connections', promptSchema)

  // Local state for draft input and execution status
  const [draftText, setDraftText] = useState('')
  const [execStatus, setExecStatus] = useState(persistedStatus || 'idle')
  const [execSessionId, setExecSessionId] = useState(sessionId || '')
  const [execError, setExecError] = useState(errorMessage || '')
  const canEdit = typeof onUpdate === 'function'

  // Parse connections (stored as comma-separated string in props)
  const connections = connectionsRaw ? connectionsRaw.split(',').filter(Boolean) : []

  // Listen for agent status via HMR
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
      }
    }

    import.meta.hot.on('storyboard:agent-status', handler)
    return () => import.meta.hot.off('storyboard:agent-status', handler)
  }, [id])

  const handleSubmit = useCallback(async () => {
    if (!draftText.trim() || !canEdit) return

    setExecStatus('pending')
    setExecError('')

    // Get canvas ID from URL
    const pathParts = window.location.pathname.split('/')
    const canvasIdx = pathParts.indexOf('canvas')
    const canvasId = canvasIdx >= 0 ? pathParts[canvasIdx + 1] : 'default'

    // Persist the prompt text
    onUpdate?.({ text: draftText, status: 'pending' })

    try {
      // Spawn prompt agent (server handles hot pool acquisition internally)
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

      setExecSessionId(result.tmuxName || canvasId)
      onUpdate?.({ sessionId: result.tmuxName || '' })
    } catch (err) {
      setExecStatus('error')
      setExecError(err.message)
      onUpdate?.({ status: 'error', errorMessage: err.message })
    }
  }, [draftText, canEdit, id, onUpdate, startPolling])

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
    setExecSessionId('')
    setDraftText('')
    onUpdate?.({ status: 'idle', sessionId: '', errorMessage: '', text: '' })
  }, [onUpdate])

  const isPending = execStatus === 'pending'
  const isDone = execStatus === 'done'
  const isError = execStatus === 'error'

  return (
    <div
      className={styles.container}
      style={typeof width === 'number' ? { width: `${width}px` } : undefined}
    >
      <header className={styles.header}>
        <span className={styles.icon}>✨</span>
        <span className={styles.title}>Prompt</span>
        {isPending && <SpinnerIcon />}
        {isDone && <span className={styles.doneIcon}><CheckIcon /></span>}
        {isError && <span className={styles.errorIcon}><ErrorIcon /></span>}
      </header>

      {(execStatus === 'idle' || isError) && (
        <div className={styles.inputArea}>
          <textarea
            className={styles.textarea}
            data-canvas-allow-text-selection
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="What should I do?"
            rows={3}
            disabled={!canEdit}
          />
          {isError && (
            <p className={styles.errorText} title={execError}>
              {execError}
            </p>
          )}
          <div className={styles.actions}>
            {connections.length > 0 && (
              <span className={styles.connectionBadge}>
                {connections.length} connected
              </span>
            )}
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!draftText.trim() || !canEdit}
              title="Submit prompt (⌘+Enter)"
            >
              <SubmitIcon />
              <span>{isError ? 'Retry' : 'Run'}</span>
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div className={styles.pendingArea}>
          <p className={styles.pendingText}>{persistedText || draftText}</p>
          <p className={styles.pendingHint}>Processing…</p>
        </div>
      )}

      {isDone && (
        <div className={styles.doneArea}>
          <p className={styles.doneText}>{persistedText}</p>
          <button className={styles.resetBtn} onClick={handleReset}>
            New prompt
          </button>
        </div>
      )}
    </div>
  )
}
