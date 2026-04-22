import { forwardRef, useImperativeHandle, useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import { toFigmaEmbedUrl, getFigmaTitle, getFigmaType, isFigmaUrl } from './figmaUrl.js'
import { useIframeDevLogs } from './iframeDevLogs.js'
import { findConnectedSplitTarget, getPaneOrder, buildSecondaryIframeUrl, reparentTerminalInto, getSplitPaneLabel } from './expandUtils.js'
import SplitScreenTopBar from './SplitScreenTopBar.jsx'
import styles from './FigmaEmbed.module.css'
import overlayStyles from './embedOverlay.module.css'

const figmaEmbedSchema = schemas['figma-embed']

/** Feather-icons figma icon (monochrome, stroke-based) */
function FigmaIcon({ size = 32, className }) {
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
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    </svg>
  )
}

/** Inline Figma logo SVG */
function FigmaLogo() {
  return (
    <svg className={styles.figmaLogo} viewBox="0 0 38 57" fill="none" aria-hidden="true">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
    </svg>
  )
}

const TYPE_LABELS = { board: 'Board', design: 'Design', proto: 'Prototype' }

export default forwardRef(function FigmaEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const url = readProp(props, 'url', figmaEmbedSchema)
  const width = readProp(props, 'width', figmaEmbedSchema)
  const height = readProp(props, 'height', figmaEmbedSchema)

  const [interactive, setInteractive] = useState(false)
  const [showIframe, setShowIframe] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const iframeRef = useRef(null)
  const embedRef = useRef(null)
  const inlineContainerRef = useRef(null)
  const modalContainerRef = useRef(null)
  const teardownTimerRef = useRef(null)
  const exitSessionRef = useRef(0)

  // Validate URL at render time — only embed known Figma URLs
  const isValid = useMemo(() => isFigmaUrl(url), [url])
  const embedUrl = useMemo(() => (isValid ? toFigmaEmbedUrl(url) : ''), [url, isValid])
  const title = useMemo(() => (url ? getFigmaTitle(url) : 'Figma'), [url])
  const figmaType = useMemo(() => getFigmaType(url), [url])
  const typeLabel = figmaType ? TYPE_LABELS[figmaType] : 'Figma'

  useIframeDevLogs({
    widget: 'FigmaEmbed',
    loaded: showIframe && Boolean(embedUrl),
    src: embedUrl,
  })

  const enterInteractive = useCallback(() => {
    exitSessionRef.current++
    clearTimeout(teardownTimerRef.current)
    setShowIframe(true)
    setInteractive(true)
  }, [])

  useEffect(() => {
    if (!interactive || expanded) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        setInteractive(false)
        // Keep iframe alive for 5 min — Figma is slow to reload
        const session = ++exitSessionRef.current
        clearTimeout(teardownTimerRef.current)
        teardownTimerRef.current = setTimeout(() => {
          if (exitSessionRef.current !== session) return
          setShowIframe(false)
        }, 5 * 60 * 1000)
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

  // Reparent iframe DOM node between inline container and modal.
  // Uses moveBefore() (Chrome 133+) which preserves the iframe's
  // browsing context — no reload. Falls back to appendChild.
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
      } else if (actionId === 'expand' || actionId === 'split-screen') {
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
          <FigmaLogo />
          <span className={styles.headerTitle}>{title}</span>
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
                  title={`Figma ${typeLabel}: ${title}`}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className={styles.iframeContainer} />
            )}
            {!interactive && !expanded && (
              <div
                className={overlayStyles.interactOverlay}
                onClick={(e) => {
                  // Don't enter interactive mode for modifier clicks (shift/meta/ctrl for multi-select)
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
                aria-label="Click to interact with Figma embed"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        ) : (
        <div className={styles.emptyState}>
          <FigmaIcon size={32} className={styles.emptyIcon} />
          <span className={styles.emptyLabel}>No Figma URL</span>
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
      <FigmaExpandModal
        expanded={expanded && !!embedUrl}
        onClose={() => setExpanded(false)}
        modalContainerRef={modalContainerRef}
        widgetId={widgetId}
      />,
      document.body
    )}
    </>
  )
})

function FigmaExpandModal({ expanded, onClose, modalContainerRef, widgetId }) {
  const connectedWidget = useMemo(
    () => (expanded ? findConnectedSplitTarget(widgetId) : null),
    [expanded, widgetId],
  )
  const hasSplit = Boolean(connectedWidget)
  const paneOrder = useMemo(
    () => (hasSplit ? getPaneOrder(widgetId, connectedWidget) : { primaryIsLeft: true }),
    [hasSplit, widgetId, connectedWidget],
  )
  const secondaryUrl = useMemo(() => buildSecondaryIframeUrl(connectedWidget), [connectedWidget])
  const isTerminalSecondary = connectedWidget?.type === 'terminal' || connectedWidget?.type === 'terminal-read' || connectedWidget?.type === 'agent'
  const terminalRef = useRef(null)
  const cleanupRef = useRef(null)
  const [activePane, setActivePane] = useState('left')

  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || { type: 'figma-embed', props: {} }
  }, [widgetId, expanded])

  const primaryLabel = useMemo(() => getSplitPaneLabel(primaryWidget), [primaryWidget])
  const secondaryLabel = useMemo(() => getSplitPaneLabel(connectedWidget), [connectedWidget])
  const leftLabel = paneOrder.primaryIsLeft ? primaryLabel : secondaryLabel
  const rightLabel = paneOrder.primaryIsLeft ? secondaryLabel : primaryLabel

  useEffect(() => {
    if (!isTerminalSecondary || !expanded || !terminalRef.current) return
    cleanupRef.current = reparentTerminalInto(connectedWidget.id, terminalRef.current)
    return () => { cleanupRef.current?.(); cleanupRef.current = null }
  }, [isTerminalSecondary, expanded, connectedWidget?.id])

  const primaryPane = (
    <div
      ref={modalContainerRef}
      className={hasSplit ? styles.expandContainerSplit : styles.expandContainer}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={() => setActivePane(paneOrder.primaryIsLeft ? 'left' : 'right')}
    >
      {!hasSplit && <button className={styles.expandClose} onClick={onClose} aria-label="Close expanded view" autoFocus>✕</button>}
    </div>
  )

  let secondaryPane = null
  const secondarySide = paneOrder.primaryIsLeft ? 'right' : 'left'
  if (hasSplit) {
    if (secondaryUrl) {
      secondaryPane = <div className={styles.expandSecondary} onClick={(e) => e.stopPropagation()} onPointerDown={() => setActivePane(secondarySide)}><iframe src={secondaryUrl} className={styles.expandSecondaryIframe} title="Connected widget" /></div>
    } else if (isTerminalSecondary) {
      secondaryPane = <div className={styles.expandSecondary} onClick={(e) => e.stopPropagation()} onPointerDown={() => setActivePane(secondarySide)}><div ref={terminalRef} className={styles.expandTerminal} /></div>
    }
  }

  const leftPane = paneOrder.primaryIsLeft ? primaryPane : secondaryPane
  const rightPane = paneOrder.primaryIsLeft ? secondaryPane : primaryPane

  return (
    <div
      className={styles.expandBackdrop}
      style={expanded ? undefined : { display: 'none' }}
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') onClose() }}
      onWheel={(e) => e.stopPropagation()}
      tabIndex={-1}
      ref={(el) => { if (el && expanded) el.focus() }}
    >
      {hasSplit ? (
        <div className={styles.expandSplitBody}>
          <SplitScreenTopBar
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            activePane={activePane}
            onClose={onClose}
          />
          <div className={styles.expandSplitPanes}>
            <div className={styles.expandSplitLeft}>{leftPane}</div>
            <div className={styles.expandSplitRight}>{rightPane}</div>
          </div>
        </div>
      ) : (
        primaryPane
      )}
    </div>
  )
}
