/**
 * SplitExpandModal — reusable full-screen modal for expandable widgets.
 *
 * When a connected split-screen-capable widget exists, renders a 50/50
 * split (ordered by x-coordinate). Otherwise renders single-pane.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ScreenNormalIcon, MarkGithubIcon } from '@primer/octicons-react'
import { findConnectedSplitTarget, getPaneOrder, buildSecondaryIframeUrl, reparentTerminalInto, getSplitPaneLabel } from './expandUtils.js'
import SplitScreenTopBar from './SplitScreenTopBar.jsx'
import styles from './SplitExpandModal.module.css'

/**
 * Renders the content for a secondary pane based on widget type.
 */
function SecondaryPane({ widget }) {
  const iframeUrl = useMemo(() => buildSecondaryIframeUrl(widget), [widget])
  const terminalRef = useRef(null)
  const cleanupRef = useRef(null)

  // Reparent terminal DOM into the pane
  useEffect(() => {
    if ((widget.type !== 'terminal' && widget.type !== 'terminal-read' && widget.type !== 'agent') || !terminalRef.current) return
    cleanupRef.current = reparentTerminalInto(widget.id, terminalRef.current)
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [widget.id, widget.type])

  // iframe-embeddable types
  if (iframeUrl) {
    return (
      <div className={styles.secondaryPane}>
        <iframe src={iframeUrl} className={styles.secondaryIframe} title="Connected widget" />
      </div>
    )
  }

  // Terminal: reparent its DOM
  if (widget.type === 'terminal' || widget.type === 'terminal-read' || widget.type === 'agent') {
    return (
      <div className={styles.secondaryPane}>
        <div ref={terminalRef} className={styles.terminalContainer} />
      </div>
    )
  }

  // Markdown: render content from props
  if (widget.type === 'markdown') {
    // Import remark inline to avoid making it a hard dep of this module
    const content = widget.props?.content || ''
    return (
      <div className={styles.secondaryPane}>
        <MarkdownSecondary content={content} />
      </div>
    )
  }

  // Link-preview (GitHub card or plain)
  if (widget.type === 'link-preview') {
    return (
      <div className={styles.secondaryPane}>
        <LinkPreviewSecondary widget={widget} />
      </div>
    )
  }

  return null
}

/**
 * Renders markdown as HTML for the secondary pane.
 * Uses dynamic import to avoid bundling remark in this module eagerly.
 */
function MarkdownSecondary({ content }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !content) return
    let cancelled = false
    ;(async () => {
      const { remark } = await import('remark')
      const remarkGfm = (await import('remark-gfm')).default
      const remarkHtml = (await import('remark-html')).default
      if (cancelled) return
      const result = remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).processSync(content)
      let html = String(result).replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
      if (ref.current) ref.current.innerHTML = html
    })()
    return () => { cancelled = true }
  }, [content])

  return <div ref={ref} className={styles.markdownContent} />
}

/**
 * Renders a link-preview widget's content for the secondary pane.
 */
function LinkPreviewSecondary({ widget }) {
  const { url, title, github } = widget.props || {}
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    const bodyHtml = github?.bodyHtml || ''
    if (bodyHtml) bodyRef.current.innerHTML = bodyHtml
  }, [github?.bodyHtml])

  if (github) {
    return (
      <div className={styles.githubCard}>
        <div className={styles.githubHeader}>
          <MarkGithubIcon size={16} />
          <span className={styles.githubTitle}>{title || url || 'GitHub'}</span>
        </div>
        {github.bodyHtml && <div ref={bodyRef} className={styles.githubBody} />}
      </div>
    )
  }

  return (
    <div className={styles.linkCard}>
      <p className={styles.linkTitle}>{title || url || 'Link'}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
          {url}
        </a>
      )}
    </div>
  )
}

/**
 * @param {Object} props
 * @param {boolean} props.expanded — whether the modal is visible
 * @param {() => void} props.onClose — callback to close the modal
 * @param {string} props.widgetId — the primary widget's ID
 * @param {string} [props.title] — optional title for the top bar
 * @param {React.ReactNode} props.children — primary pane content
 */
export default function SplitExpandModal({ expanded, onClose, widgetId, title, children }) {
  const connectedWidget = useMemo(
    () => (expanded ? findConnectedSplitTarget(widgetId) : null),
    [expanded, widgetId],
  )
  const hasSplit = Boolean(connectedWidget)
  const paneOrder = useMemo(
    () => (hasSplit ? getPaneOrder(widgetId, connectedWidget) : { primaryIsLeft: true }),
    [hasSplit, widgetId, connectedWidget],
  )
  const [activePane, setActivePane] = useState('left')

  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || null
  }, [widgetId, expanded])

  const primaryLabel = useMemo(() => getSplitPaneLabel(primaryWidget) || title || '', [primaryWidget, title])
  const secondaryLabel = useMemo(() => getSplitPaneLabel(connectedWidget), [connectedWidget])
  const leftLabel = paneOrder.primaryIsLeft ? primaryLabel : secondaryLabel
  const rightLabel = paneOrder.primaryIsLeft ? secondaryLabel : primaryLabel

  // Close on Escape
  useEffect(() => {
    if (!expanded) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [expanded, onClose])

  if (!expanded) return null

  const primarySide = paneOrder.primaryIsLeft ? 'left' : 'right'
  const secondarySide = paneOrder.primaryIsLeft ? 'right' : 'left'
  const primaryPane = <div className={styles.primaryPane} onPointerDown={() => setActivePane(primarySide)}>{children}</div>
  const secondaryPane = hasSplit ? <div onPointerDown={() => setActivePane(secondarySide)}><SecondaryPane widget={connectedWidget} /></div> : null

  const leftPane = paneOrder.primaryIsLeft ? primaryPane : secondaryPane
  const rightPane = paneOrder.primaryIsLeft ? secondaryPane : primaryPane

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className={hasSplit ? styles.modalFullscreen : styles.modal} onClick={(e) => e.stopPropagation()}>
        {hasSplit ? (
          <>
            <SplitScreenTopBar
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              activePane={activePane}
              onClose={onClose}
            />
            <div className={styles.bodySplit}>
              <div className={styles.splitLeft}>{leftPane}</div>
              <div className={styles.splitRight}>{rightPane}</div>
            </div>
          </>
        ) : (
          <>
            {title && (
              <div className={styles.topBar}>
                <span className={styles.topBarTitle}>{title}</span>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
                  <ScreenNormalIcon size={16} />
                </button>
              </div>
            )}
            <div className={styles.body}>
              {primaryPane}
            </div>
            {!title && (
              <button className={styles.closeBtnFloat} onClick={onClose} aria-label="Close expanded view" autoFocus>
                ✕
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
