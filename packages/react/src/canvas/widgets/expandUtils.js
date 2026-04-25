/**
 * Shared utilities for expandable widget modals and split-screen.
 *
 * Reads the canvas bridge state to find connected widgets eligible
 * for split-screen, and builds iframe URLs for secondary panes.
 */
import { createElement, useRef, useEffect } from 'react'
import { isSplitScreenCapable, getWidgetMeta } from './widgetConfig.js'

// Re-export for convenience
export { isSplitScreenCapable }

/**
 * Build a pane config for a connected widget to use with ExpandedPane.
 * Returns a ReactPane or ExternalPane config depending on the widget type.
 *
 * @param {{ id: string, type: string, props: Object }} widget
 * @returns {import('./ExpandedPane.jsx').PaneConfig | null}
 */
export function buildPaneForWidget(widget) {
  if (!widget) return null

  const label = getSplitPaneLabel(widget)

  // Terminal/agent: external pane with DOM reparenting
  if (widget.type === 'terminal' || widget.type === 'terminal-read' || widget.type === 'agent') {
    return {
      id: widget.id,
      label,
      kind: 'external',
      attach: (container) => reparentTerminalInto(widget.id, container),
      onResize: (rect) => {
        // fitTerminalToElement is in TerminalWidget.jsx (module-level).
        // We call it via the global registry if available.
        if (typeof window !== 'undefined' && window.__storyboardTerminalRegistry) {
          const entry = window.__storyboardTerminalRegistry.get(widget.id)
          if (entry) {
            const { term, ws } = entry
            const cw = term.renderer?.charWidth
            const ch = term.renderer?.charHeight
            if (cw && ch && rect.width > 50 && rect.height > 50) {
              const cols = Math.max(10, Math.floor(rect.width / cw))
              const rows = Math.max(4, Math.floor(rect.height / ch))
              term.resize?.(cols, rows)
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'resize', cols, rows }))
              }
            }
          }
        }
      },
    }
  }

  // iframe-embeddable types: build iframe URL
  const iframeUrl = buildSecondaryIframeUrl(widget)
  if (iframeUrl) {
    return {
      id: widget.id,
      label,
      kind: 'react',
      render: () => createElement('iframe', {
        src: iframeUrl,
        style: { border: 'none', width: '100%', height: '100%', display: 'block' },
        title: label,
      }),
    }
  }

  // Markdown: render content
  if (widget.type === 'markdown') {
    const content = widget.props?.content || ''
    return {
      id: widget.id,
      label,
      kind: 'react',
      render: () => createElement(LazyMarkdownPane, { content }),
    }
  }

  // Link-preview
  if (widget.type === 'link-preview') {
    return {
      id: widget.id,
      label,
      kind: 'react',
      render: () => createElement(LazyLinkPreviewPane, { widget }),
    }
  }

  return null
}

/**
 * Lazy markdown renderer for secondary panes (avoids bundling remark eagerly).
 */
function LazyMarkdownPane({ content }) {
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
  return createElement('div', {
    ref,
    style: {
      padding: '32px 40px',
      fontSize: '15px',
      lineHeight: 1.7,
      color: 'var(--fgColor-default, #1f2328)',
      maxWidth: '800px',
      margin: '0 auto',
    },
  })
}

/**
 * Lazy link-preview renderer for secondary panes.
 */
function LazyLinkPreviewPane({ widget }) {
  const { url, title, github } = widget.props || {}
  const bodyRef = useRef(null)
  useEffect(() => {
    if (bodyRef.current && github?.bodyHtml) bodyRef.current.innerHTML = github.bodyHtml
  }, [github?.bodyHtml])

  if (github) {
    return createElement('div', { style: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bgColor-default, #ffffff)' } },
      createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--borderColor-muted, #d8dee4)' } }, title || url || 'GitHub'),
      github.bodyHtml && createElement('div', { ref: bodyRef, style: { flex: 1, overflow: 'auto', padding: '24px', fontSize: '15px', lineHeight: 1.7 } }),
    )
  }
  return createElement('div', { style: { padding: '32px 40px' } },
    createElement('p', { style: { fontSize: '18px', fontWeight: 600, margin: '0 0 8px' } }, title || url || 'Link'),
    url && createElement('a', { href: url, target: '_blank', rel: 'noopener noreferrer', style: { fontSize: '14px', color: 'var(--fgColor-accent, #0969da)' } }, url),
  )
}

/**
 * Find a connected widget that is split-screen capable.
 * Returns the first match, or null.
 * @param {string} widgetId — the primary (expanded) widget's ID
 * @returns {{ id: string, type: string, position: { x: number, y: number }, props: Object } | null}
 */
export function findConnectedSplitTarget(widgetId) {
  const bridge = window.__storyboardCanvasBridgeState
  if (!bridge?.connectors || !bridge?.widgets) return null

  // Only allow split-screen when this widget has exactly one connection
  const myConnections = bridge.connectors.filter(
    (c) => c.start?.widgetId === widgetId || c.end?.widgetId === widgetId,
  )
  if (myConnections.length !== 1) return null

  const conn = myConnections[0]
  const otherId = conn.start?.widgetId === widgetId ? conn.end?.widgetId : conn.start?.widgetId

  // The other widget must also have exactly one connection
  const otherConnections = bridge.connectors.filter(
    (c) => c.start?.widgetId === otherId || c.end?.widgetId === otherId,
  )
  if (otherConnections.length !== 1) return null

  const other = bridge.widgets.find((w) => w.id === otherId)
  if (other && isSplitScreenCapable(other.type)) return other
  return null
}

/**
 * Get the x-coordinate position of a widget from bridge state.
 * @param {string} widgetId
 * @returns {number}
 */
export function getWidgetX(widgetId) {
  const bridge = window.__storyboardCanvasBridgeState
  if (!bridge?.widgets) return 0
  const w = bridge.widgets.find((w) => w.id === widgetId)
  return w?.position?.x ?? 0
}

/**
 * Determine pane order (left/right) based on x-coordinates.
 * Returns { left, right } where each is 'primary' or 'secondary'.
 * @param {string} primaryId — the widget being expanded
 * @param {{ id: string, position?: { x: number } }} secondaryWidget
 * @returns {{ primaryIsLeft: boolean }}
 */
export function getPaneOrder(primaryId, secondaryWidget) {
  const primaryX = getWidgetX(primaryId)
  const secondaryX = secondaryWidget?.position?.x ?? 0
  return { primaryIsLeft: primaryX <= secondaryX }
}

/**
 * Build an iframe URL for a widget to render in a secondary pane.
 * Returns null if the widget type isn't iframe-embeddable.
 * @param {{ type: string, props: Object }} widget
 * @returns {string | null}
 */
export function buildSecondaryIframeUrl(widget) {
  if (!widget) return null
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const baseClean = base.endsWith('/') ? base.slice(0, -1) : base

  if (widget.type === 'prototype') {
    const src = widget.props?.src
    if (!src) return null
    if (/^https?:\/\//.test(src)) return src
    return `${baseClean}${src.startsWith('/') ? '' : '/'}${src}?_sb_embed&_sb_hide_branch_bar&_sb_theme_target=prototype`
  }

  if (widget.type === 'figma-embed') {
    const url = widget.props?.url
    if (!url) return null
    // Inline a minimal figma embed URL builder to avoid circular deps
    try {
      const u = new URL(url)
      if (!u.hostname.endsWith('figma.com')) return null
      return `https://www.figma.com/embed?embed_host=storyboard&url=${encodeURIComponent(url)}`
    } catch { return null }
  }

  if (widget.type === 'codepen-embed') {
    const url = widget.props?.url
    if (!url) return null
    try {
      const u = new URL(url)
      if (!u.hostname.endsWith('codepen.io')) return null
      const path = u.pathname.replace(/\/(pen|full|details)\//, '/embed/')
      return `https://codepen.io${path}?default-tab=result`
    } catch { return null }
  }

  if (widget.type === 'story') {
    const storyId = widget.props?.storyId
    const exportName = widget.props?.exportName
    if (!storyId) return null
    const storyData = typeof window !== 'undefined' && window.__storyboardStoryIndex?.[storyId]
    if (storyData?._route) {
      const params = new URLSearchParams()
      if (exportName) params.set('export', exportName)
      params.set('_sb_embed', '')
      params.set('_sb_hide_branch_bar', '')
      return `${baseClean}${storyData._route}?${params}`
    }
    return null
  }

  return null
}

/**
 * Reparent a terminal widget's xterm container into a target element.
 * Returns a cleanup function to restore the original position.
 * @param {string} widgetId
 * @param {HTMLElement} targetEl
 * @returns {(() => void) | null}
 */
export function reparentTerminalInto(widgetId, targetEl) {
  const widgetEl = document.querySelector(`[data-widget-id="${widgetId}"]`)
  if (!widgetEl) return null

  const xtermEl = widgetEl.querySelector('[class*="xtermContainer"]')
  if (!xtermEl) return null

  const originalParent = xtermEl.parentElement
  const originalNextSibling = xtermEl.nextSibling

  targetEl.appendChild(xtermEl)

  return () => {
    if (originalNextSibling) {
      originalParent.insertBefore(xtermEl, originalNextSibling)
    } else {
      originalParent.appendChild(xtermEl)
    }
  }
}

/**
 * Build a "Type · Metadata" label for a widget in split-screen top bar.
 * @param {{ type: string, props: Object }} widget
 * @returns {string}
 */
export function getSplitPaneLabel(widget) {
  if (!widget) return ''
  const meta = getWidgetMeta(widget.type)
  const typeName = meta?.label || widget.type

  if (widget.type === 'terminal' || widget.type === 'terminal-read') {
    return `Terminal · ${widget.props?.prettyName || '…'}`
  }
  if (widget.type === 'agent') {
    return `Agent · ${widget.props?.prettyName || '…'}`
  }
  if (widget.type === 'prototype') {
    return `Prototype · ${widget.props?.src || '…'}`
  }
  if (widget.type === 'figma-embed') {
    const url = widget.props?.url || ''
    let name = 'Figma'
    try { name = new URL(url).pathname.split('/').pop() || 'Figma' } catch { /* */ }
    return `Figma · ${name}`
  }
  if (widget.type === 'codepen-embed') {
    return `CodePen · ${widget.props?.url || '…'}`
  }
  if (widget.type === 'story') {
    return `Story · ${widget.props?.storyId || '…'}`
  }
  if (widget.type === 'markdown') {
    const content = widget.props?.content || ''
    const firstLine = content.split('\n').find((l) => l.trim()) || ''
    const preview = firstLine.replace(/^#+\s*/, '').slice(0, 40)
    return `Markdown · ${preview || '…'}`
  }
  if (widget.type === 'link-preview') {
    return `${widget.props?.github ? 'GitHub' : 'Link'} · ${widget.props?.title || widget.props?.url || '…'}`
  }
  return typeName
}
