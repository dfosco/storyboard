import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { readProp, promptSchema } from './widgetProps.js'
import styles from './PromptWidget.module.css'

const POLL_INTERVAL_MS = 2000

function getApiBase() {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  return base + '/_storyboard/prompt'
}

async function executePrompt({ canvasName, widgetId, prompt, connections, widgetPosition }) {
  const res = await fetch(`${getApiBase()}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvasName, widgetId, prompt, connections, widgetPosition }),
  })
  return res.json()
}

async function checkStatus(sessionId) {
  const res = await fetch(`${getApiBase()}/status?sessionId=${encodeURIComponent(sessionId)}`)
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
  const pollRef = useRef(null)
  const canEdit = typeof onUpdate === 'function'

  // Parse connections (stored as comma-separated string in props)
  const connections = useMemo(
    () => connectionsRaw ? connectionsRaw.split(',').filter(Boolean) : [],
    [connectionsRaw]
  )

  // Polling logic via ref to avoid circular hook dependencies
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  const startPolling = useCallback((sid) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const result = await checkStatus(sid)
        if (result.status === 'done') {
          setExecStatus('done')
          clearInterval(pollRef.current)
          pollRef.current = null
          onUpdateRef.current?.({
            status: 'done',
            resultWidgetId: result.resultWidgetId || '',
          })
        } else if (result.status === 'error') {
          setExecStatus('error')
          setExecError(result.error || 'Unknown error')
          clearInterval(pollRef.current)
          pollRef.current = null
          onUpdateRef.current?.({
            status: 'error',
            errorMessage: result.error || 'Unknown error',
          })
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL_MS)
  }, [])

  // Reconnect polling on mount if there's a pending session
  useEffect(() => {
    if (execStatus === 'pending' && execSessionId) {
      startPolling(execSessionId)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const widgetPosition = props?.position

  const handleSubmit = useCallback(async () => {
    if (!draftText.trim() || !canEdit) return

    setExecStatus('pending')
    setExecError('')

    // Get canvas name from URL or default
    const pathParts = window.location.pathname.split('/')
    const canvasIdx = pathParts.indexOf('canvas')
    const canvasName = canvasIdx >= 0 ? pathParts[canvasIdx + 1] : 'default'

    // Persist the prompt text
    onUpdate?.({ text: draftText, status: 'pending' })

    try {
      const result = await executePrompt({
        canvasName,
        widgetId: id,
        prompt: draftText,
        connections,
        widgetPosition,
      })

      if (result.error) {
        setExecStatus('error')
        setExecError(result.error)
        onUpdate?.({ status: 'error', errorMessage: result.error })
        return
      }

      setExecSessionId(result.sessionId)
      onUpdate?.({ sessionId: result.sessionId })
      startPolling(result.sessionId)
    } catch (err) {
      setExecStatus('error')
      setExecError(err.message)
      onUpdate?.({ status: 'error', errorMessage: err.message })
    }
  }, [draftText, canEdit, id, connections, widgetPosition, onUpdate, startPolling])

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
