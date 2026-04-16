/**
 * CodePen embed widget for canvas.
 *
 * Behaves like FigmaEmbed: click-to-interact overlay, iframe kept alive
 * after deselect, expand modal, open-external action. Created via paste
 * when a CodePen URL is pasted onto the canvas.
 */
import { forwardRef, useImperativeHandle, useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import { isCodePenUrl, toCodePenEmbedUrl, getCodePenTitle, fetchCodePenMeta } from './codepenUrl.js'
import { useIframeDevLogs } from './iframeDevLogs.js'
import styles from './CodePenEmbed.module.css'
import overlayStyles from './embedOverlay.module.css'

const codepenEmbedSchema = schemas['codepen-embed']

/** CodePen logo SVG */
function CodePenLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M100 34.2c0-.4-.1-.8-.2-1.2 0-.1 0-.2-.1-.3 0-.2-.1-.3-.2-.5 0-.1-.1-.2-.1-.3-.1-.2-.1-.3-.2-.4-.1-.1-.1-.2-.2-.3-.1-.1-.1-.3-.2-.4l-.3-.3-.2-.3c-.1-.1-.2-.2-.3-.2l-.3-.3c-.1-.1-.2-.1-.3-.2l-.3-.3-.4-.2-.6-.3L52.1 2.5c-1.3-.8-2.9-.8-4.2 0L3.2 27.6l-.6.3c-.1.1-.2.1-.4.2l-.3.3c-.1.1-.2.1-.3.2l-.3.3-.3.3-.2.3c-.1.1-.2.3-.2.4-.1.1-.1.2-.2.3-.1.1-.1.3-.2.4 0 .1-.1.2-.1.3-.1.2-.1.3-.2.5 0 .1 0 .2-.1.3-.1.4-.1.8-.2 1.2v31.4c0 .4.1.8.2 1.2 0 .1 0 .2.1.3 0 .2.1.3.2.5 0 .1.1.2.1.3.1.2.1.3.2.4.1.1.1.2.2.3.1.1.1.3.2.4l.3.3.2.3c.1.1.2.2.3.2l.3.3c.1.1.2.1.3.2l.3.3.4.2.6.3 44.7 25.1c.6.4 1.4.5 2.1.5.7 0 1.4-.2 2.1-.5l44.7-25.1.6-.3c.1-.1.2-.1.4-.2l.3-.3c.1-.1.2-.1.3-.2l.3-.3.3-.3.2-.3c.1-.1.2-.3.2-.4.1-.1.1-.2.2-.3.1-.1.1-.3.2-.4 0-.1.1-.2.1-.3.1-.2.1-.3.2-.5 0-.1 0-.2.1-.3.1-.4.1-.8.2-1.2V34.2zm-50-24L88.5 33 73 43.4 54.8 32.2V10.2zM45.2 10.2v22l-18.2 11.2L11.5 33l38.5-22.8zm-40 28.4L18.4 49.8 5.2 60.9V38.6zm40 51.2L6.7 66.6 22.2 56.2l23 14.1v19.5zm4.8-24.3l-16-9.8 16-9.8 16 9.8-16 9.8zm4.8 24.3V70.3l23-14.1 15.5 10.4L54.8 89.8zm40-28.9L81.6 49.8 94.8 38.6v22.3z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Stroke-based code icon for empty state */
function CodeIcon({ size = 32, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

export default forwardRef(function CodePenEmbed({ props, onUpdate, resizable }, ref) {
  const url = readProp(props, 'url', codepenEmbedSchema)
  const width = readProp(props, 'width', codepenEmbedSchema)
  const height = readProp(props, 'height', codepenEmbedSchema)

  const [interactive, setInteractive] = useState(false)
  const [showIframe, setShowIframe] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const iframeRef = useRef(null)
  const embedRef = useRef(null)
  const inlineContainerRef = useRef(null)
  const modalContainerRef = useRef(null)
  const teardownTimerRef = useRef(null)
  const exitSessionRef = useRef(0)

  const isValid = useMemo(() => isCodePenUrl(url), [url])
  const embedUrl = useMemo(() => (isValid ? toCodePenEmbedUrl(url) : ''), [url, isValid])
  const fallbackTitle = useMemo(() => (url ? getCodePenTitle(url) : 'CodePen'), [url])

  // Fetch pen metadata (title + author) from CodePen oEmbed API
  const [penMeta, setPenMeta] = useState(null)
  useEffect(() => {
    if (!url || !isValid) return
    let cancelled = false
    fetchCodePenMeta(url).then((meta) => {
      if (!cancelled && meta) setPenMeta(meta)
    })
    return () => { cancelled = true }
  }, [url, isValid])

  const headerTitle = penMeta?.title
    ? `${penMeta.title} · ${penMeta.author || fallbackTitle}`
    : fallbackTitle

  useIframeDevLogs({
    widget: 'CodePenEmbed',
    loaded: showIframe && Boolean(embedUrl),
    src: embedUrl,
  })

  const enterInteractive = useCallback(() => {
    exitSessionRef.current++
    clearTimeout(teardownTimerRef.current)
    setShowIframe(true)
    setInteractive(true)
  }, [])

  // Exit interactive mode on click outside — keep iframe alive for 2 min
  useEffect(() => {
    if (!interactive || expanded) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        setInteractive(false)
        const session = ++exitSessionRef.current
        clearTimeout(teardownTimerRef.current)
        teardownTimerRef.current = setTimeout(() => {
          if (exitSessionRef.current !== session) return
          setShowIframe(false)
        }, 2 * 60 * 1000)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, expanded])

  useEffect(() => () => clearTimeout(teardownTimerRef.current), [])

  // Close expanded modal on Escape
  useEffect(() => {
    if (!expanded) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setExpanded(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [expanded])

  // Reparent iframe between inline and modal containers
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    if (expanded && modalContainerRef.current) {
      iframe._savedClassName = iframe.className
      iframe._savedStyle = iframe.getAttribute('style') || ''
      iframe.className = styles.expandIframe
      iframe.removeAttribute('style')
      const target = modalContainerRef.current
      if (target.moveBefore) {
        target.moveBefore(iframe, target.firstChild)
      } else {
        target.prepend(iframe)
      }
    } else if (!expanded && inlineContainerRef.current) {
      if (iframe._savedClassName !== undefined) {
        iframe.className = iframe._savedClassName
        iframe.setAttribute('style', iframe._savedStyle)
        delete iframe._savedClassName
        delete iframe._savedStyle
      }
      const target = inlineContainerRef.current
      if (target.moveBefore) {
        target.moveBefore(iframe, null)
      } else {
        target.appendChild(iframe)
      }
    }
  }, [expanded])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'open-external') {
        if (url) window.open(url, '_blank', 'noopener')
      } else if (actionId === 'expand') {
        setShowIframe(true)
        setExpanded(true)
      }
    },
  }), [url])

  return (
    <>
    <WidgetWrapper>
      <div ref={embedRef} className={styles.embed} style={{ width, height }}>
        <div className={styles.header}>
          <CodePenLogo className={styles.codepenLogo} />
          <span className={styles.headerTitle}>{headerTitle}</span>
        </div>
        {embedUrl ? (
          <>
            {showIframe ? (
              <div
                ref={inlineContainerRef}
                className={styles.iframeContainer}
                style={expanded ? { visibility: 'hidden' } : undefined}
              >
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className={styles.iframe}
                  title={`CodePen: ${headerTitle}`}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className={styles.iframeContainer} />
            )}
            {!interactive && !expanded && (
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
                aria-label="Click to interact with CodePen embed"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <CodeIcon size={32} className={styles.emptyIcon} />
            <span className={styles.emptyLabel}>No CodePen URL</span>
          </div>
        )}
      </div>
      {resizable && (
        <div
          className={styles.resizeHandle}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const startX = e.clientX
            const startY = e.clientY
            const startW = width
            const startH = height
            function onMove(ev) {
              const newW = Math.max(200, startW + ev.clientX - startX)
              const newH = Math.max(150, startH + ev.clientY - startY)
              onUpdate?.({ width: newW, height: newH })
            }
            function onUp() {
              document.removeEventListener('mousemove', onMove)
              document.removeEventListener('mouseup', onUp)
            }
            document.addEventListener('mousemove', onMove)
            document.addEventListener('mouseup', onUp)
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </WidgetWrapper>
    {createPortal(
      <div
        className={styles.expandBackdrop}
        style={expanded && embedUrl ? undefined : { display: 'none' }}
        onClick={() => setExpanded(false)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') setExpanded(false)
        }}
        onWheel={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={(el) => { if (el && expanded) el.focus() }}
      >
        <div
          ref={modalContainerRef}
          className={styles.expandContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={styles.expandClose}
            onClick={() => setExpanded(false)}
            aria-label="Close expanded view"
            autoFocus
          >✕</button>
        </div>
      </div>,
      document.body
    )}
    </>
  )
})
