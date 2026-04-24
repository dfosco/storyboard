/**
 * SplitExpandModal — reusable full-screen modal for expandable widgets.
 *
 * When a connected split-screen-capable widget exists, renders a 50/50
 * split (ordered by x-coordinate). Otherwise renders single-pane.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ScreenNormalIcon, MarkGithubIcon, PencilIcon, EyeIcon } from '@primer/octicons-react'
import { findConnectedSplitTarget, getPaneOrder, buildSecondaryIframeUrl, reparentTerminalInto, getSplitPaneLabel, writeSplitToURL, clearSplitFromURL } from './expandUtils.js'
import SplitScreenTopBar from './SplitScreenTopBar.jsx'
import styles from './SplitExpandModal.module.css'

/**
 * Renders the content for a secondary pane based on widget type.
 */
export function SecondaryPane({ widget, editing, setEditing }) {
  const iframeUrl = useMemo(() => buildSecondaryIframeUrl(widget), [widget])
  const terminalRef = useRef(null)
  const cleanupRef = useRef(null)

  // Reparent terminal DOM into the pane
  useEffect(() => {
    if ((widget.type !== 'terminal' && widget.type !== 'terminal-read' && widget.type !== 'agent') || !terminalRef.current) return
    cleanupRef.current = reparentTerminalInto(widget.id, terminalRef.current)
    // Trigger resize so xterm recalculates its dimensions in the new container
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
      // Trigger resize when returning to original container too
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
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
    const content = widget.props?.content || ''
    return (
      <div className={styles.secondaryPane}>
        <MarkdownSecondary content={content} widgetId={widget.id} editing={editing} />
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
 * Renders markdown as HTML for the secondary pane, with optional edit mode.
 * Uses dynamic import to avoid bundling remark in this module eagerly.
 */
function MarkdownSecondary({ content, widgetId, editing }) {
  const ref = useRef(null)
  const [localContent, setLocalContent] = useState(content)

  // Sync incoming content when not editing
  useEffect(() => {
    if (!editing) setLocalContent(content)
  }, [content, editing])

  useEffect(() => {
    if (editing || !ref.current || !localContent) return
    let cancelled = false
    ;(async () => {
      const { remark } = await import('remark')
      const remarkGfm = (await import('remark-gfm')).default
      const remarkHtml = (await import('remark-html')).default
      if (cancelled) return
      const result = remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).processSync(localContent)
      let html = String(result).replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
      if (ref.current) ref.current.innerHTML = html
    })()
    return () => { cancelled = true }
  }, [localContent, editing])

  if (editing) {
    return (
      <textarea
        className={styles.markdownEditor}
        value={localContent}
        onChange={(e) => {
          setLocalContent(e.target.value)
          document.dispatchEvent(new CustomEvent('storyboard:widget-update', {
            detail: { widgetId, updates: { content: e.target.value } },
          }))
        }}
        autoFocus
      />
    )
  }

  return <div ref={ref} className={styles.markdownContent} />
}

/**
 * Post-process HTML body for canvas rendering (mirrors LinkPreview's postProcessHtml):
 * - Links open in new tabs
 * - Unwrap <details> wrappers around videos
 * - Convert bare video URLs and video-linked images to <video> elements
 * - Mark checked checkboxes with data attribute for accent styling
 */
function postProcessHtml(html) {
  if (!html) return ''
  let out = html
  out = out.replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
  out = out.replace(/target="_blank"\s*rel="noopener noreferrer"\s*target="_blank"/g, 'target="_blank"')
  out = out.replace(/<details[^>]*>\s*<summary[^>]*>[\s\S]*?<\/summary>\s*(<video[\s\S]*?<\/video>)\s*<\/details>/gi, '$1')
  const VIDEO_URL_LINE_RE = /^<p>\s*(https?:\/\/[^\s<]+\.(mp4|mov|webm|ogg)(?:\?[^\s<]*)?)\s*<\/p>$/gim
  out = out.replace(VIDEO_URL_LINE_RE, (_, url) => `<video src="${url}" controls preload="none"></video>`)
  out = out.replace(/<img\s+([^>]*?)src="([^"]+\.(mp4|mov|webm|ogg)(?:\?[^"]*)?)"([^>]*)\/?>/gi, (_, _pre, url) =>
    `<video src="${url}" controls preload="none"></video>`)
  out = out.replace(/<video\s/g, '<video preload="none" ')
  out = out.replace(/preload="none"\s+preload="[^"]*"/g, 'preload="none"')
  out = out.replace(/<input\s+([^>]*?)disabled([^>]*)>/gi, (match, before, after) => {
    if (!match.includes('type="checkbox"')) return match
    return `<input ${before}${after}>`
  })
  return out
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

function splitIssueTitle(title) {
  if (!title) return { number: '', rest: '' }
  const match = title.match(/^(#\d+)\s+(.*)$/)
  if (match) return { number: match[1], rest: match[2] }
  return { number: '', rest: title }
}

function getCommentKindLabel(github) {
  const KIND_LABELS = { issue: 'Issue', pull_request: 'Pull Request', discussion: 'Discussion', comment: 'Comment' }
  if (github?.kind !== 'comment') return KIND_LABELS[github?.kind] || 'GitHub'
  if (github?.parentKind === 'issue') return 'Issue Comment'
  if (github?.parentKind === 'pull_request') return 'PR Comment'
  if (github?.parentKind === 'discussion') return 'Discussion Comment'
  return 'Comment'
}

/**
 * Renders a link-preview widget's content for the secondary pane.
 */
function LinkPreviewSecondary({ widget }) {
  const { url, title, github } = widget.props || {}
  const bodyRef = useRef(null)
  const lastHtmlRef = useRef('')

  const bodyHtml = useMemo(() => {
    if (github?.bodyHtml) return postProcessHtml(github.bodyHtml)
    return ''
  }, [github?.bodyHtml])

  useEffect(() => {
    if (bodyRef.current && bodyHtml !== lastHtmlRef.current) {
      bodyRef.current.innerHTML = bodyHtml
      lastHtmlRef.current = bodyHtml
    }
  }, [bodyHtml])

  const setBodyRef = useCallback((el) => {
    bodyRef.current = el
    if (el && bodyHtml && bodyHtml !== lastHtmlRef.current) {
      el.innerHTML = bodyHtml
      lastHtmlRef.current = bodyHtml
    }
  }, [bodyHtml])

  if (github) {
    const authors = Array.isArray(github?.authors)
      ? github.authors.filter((a) => typeof a === 'string' && a.trim())
      : []
    const primaryAuthor = authors[0] || ''
    const createdAgo = timeAgo(github?.createdAt)
    const kindLabel = getCommentKindLabel(github)
    const { number: issueNumber, rest: titleText } = splitIssueTitle(title)

    return (
      <div className={styles.githubCard}>
        <div className={styles.githubTitleBlock}>
          <h2 className={styles.githubTitleText}>
            <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={styles.githubTitleLink}>
              {titleText || url}
              {issueNumber && <span className={styles.githubIssueNumber}> {issueNumber}</span>}
            </a>
          </h2>
          <div className={styles.githubByline}>
            {primaryAuthor && (
              <a href={`https://github.com/${primaryAuthor}`} target="_blank" rel="noopener noreferrer" className={styles.githubAuthor}>
                <img src={`https://github.com/${primaryAuthor}.png?size=40`} alt="" width="20" height="20" className={styles.githubAvatar} loading="lazy" />
                {primaryAuthor}
              </a>
            )}
            {createdAgo && <span className={styles.githubBylineText}>{primaryAuthor ? ` opened ${createdAgo}` : `Opened ${createdAgo}`}</span>}
          </div>
        </div>
        {bodyHtml && <div ref={setBodyRef} className={styles.githubBody} />}
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
 * @param {boolean} [props.forceSingle] — when true, skip split-screen even if a connected widget exists
 * @param {boolean} [props.editing] — whether the widget is in edit mode
 * @param {() => void} [props.onEdit] — callback to toggle edit mode (renders edit button in title bar)
 * @param {React.ReactNode} props.children — primary pane content
 */
export default function SplitExpandModal({ expanded, onClose, widgetId, title, forceSingle, editing, onEdit, children }) {
  const connectedWidget = useMemo(
    () => (expanded && !forceSingle ? findConnectedSplitTarget(widgetId) : null),
    [expanded, widgetId, forceSingle],
  )
  const hasSplit = Boolean(connectedWidget)
  const paneOrder = useMemo(
    () => (hasSplit ? getPaneOrder(widgetId, connectedWidget) : { primaryIsLeft: true }),
    [hasSplit, widgetId, connectedWidget],
  )
  const [activePane, setActivePane] = useState('left')

  // Persist split-screen state in URL
  useEffect(() => {
    if (hasSplit && connectedWidget) {
      writeSplitToURL(widgetId, connectedWidget.id)
    }
    return () => {
      // Only clear if this modal owned the split param
      if (hasSplit) clearSplitFromURL()
    }
  }, [expanded, hasSplit, widgetId, connectedWidget])

  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || null
  }, [widgetId, expanded])

  const primaryLabel = useMemo(() => getSplitPaneLabel(primaryWidget) || title || '', [primaryWidget, title])
  const secondaryLabel = useMemo(() => getSplitPaneLabel(connectedWidget), [connectedWidget])
  const leftLabel = paneOrder.primaryIsLeft ? primaryLabel : secondaryLabel
  const rightLabel = paneOrder.primaryIsLeft ? secondaryLabel : primaryLabel

  // Close on Escape (but not when editing inside a textarea/input)
  useEffect(() => {
    if (!expanded) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        const tag = e.target?.tagName
        if (tag === 'TEXTAREA' || tag === 'INPUT') return
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [expanded, onClose])

  // Secondary markdown editing state
  const isSecondaryMarkdown = connectedWidget?.type === 'markdown'
  const [secondaryEditing, setSecondaryEditing] = useState(false)

  // Reset secondary editing when modal closes
  useEffect(() => {
    if (!expanded) setSecondaryEditing(false)
  }, [expanded])

  if (!expanded) return null

  // Build per-side edit actions
  const primaryEditActions = onEdit ? [{ icon: editing ? EyeIcon : PencilIcon, label: editing ? 'Preview' : 'Edit', onClick: onEdit }] : undefined
  const secondaryEditActions = isSecondaryMarkdown ? [{ icon: secondaryEditing ? EyeIcon : PencilIcon, label: secondaryEditing ? 'Preview' : 'Edit', onClick: () => setSecondaryEditing((v) => !v) }] : undefined

  const leftActions = paneOrder.primaryIsLeft ? primaryEditActions : secondaryEditActions
  const rightActions = paneOrder.primaryIsLeft ? secondaryEditActions : primaryEditActions

  const primarySide = paneOrder.primaryIsLeft ? 'left' : 'right'
  const secondarySide = paneOrder.primaryIsLeft ? 'right' : 'left'
  const primaryPane = <div className={styles.primaryPane} onPointerDownCapture={() => setActivePane(primarySide)}>{children}</div>
  const secondaryPane = hasSplit ? <div style={{ height: '100%' }} onPointerDownCapture={() => setActivePane(secondarySide)}><SecondaryPane widget={connectedWidget} editing={secondaryEditing} setEditing={setSecondaryEditing} /></div> : null

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
              leftActions={leftActions}
              rightActions={rightActions}
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
                {onEdit && (
                  <button className={styles.closeBtn} onClick={onEdit} aria-label={editing ? 'Preview' : 'Edit'}>
                    {editing ? <EyeIcon size={16} /> : <PencilIcon size={16} />}
                  </button>
                )}
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
