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

  // Find all widgets connected to this one
  const connectedIds = new Set()
  for (const c of bridge.connectors) {
    if (c.start?.widgetId === widgetId && c.end?.widgetId) connectedIds.add(c.end.widgetId)
    if (c.end?.widgetId === widgetId && c.start?.widgetId) connectedIds.add(c.start.widgetId)
  }
  if (connectedIds.size === 0) return null

  // Return the first connected widget that is split-screen capable
  for (const w of bridge.widgets) {
    if (connectedIds.has(w.id) && isSplitScreenCapable(w.type)) return w
  }
  return null
}

/**
 * Find ALL connected widgets that are split-screen capable.
 * If more than maxCount, picks the nearest by Euclidean distance from primary.
 * @param {string} widgetId — the primary (expanded) widget's ID
 * @param {number} [maxCount=3] — max connected widgets to return
 * @returns {Array<{ id: string, type: string, position: { x: number, y: number }, props: Object }>}
 */
export function findAllConnectedSplitTargets(widgetId, maxCount = 3) {
  const bridge = window.__storyboardCanvasBridgeState
  if (!bridge?.connectors || !bridge?.widgets) return []

  const connectedIds = new Set()
  for (const c of bridge.connectors) {
    if (c.start?.widgetId === widgetId && c.end?.widgetId) connectedIds.add(c.end.widgetId)
    if (c.end?.widgetId === widgetId && c.start?.widgetId) connectedIds.add(c.start.widgetId)
  }
  if (connectedIds.size === 0) return []

  const candidates = bridge.widgets.filter(
    (w) => connectedIds.has(w.id) && isSplitScreenCapable(w.type),
  )

  if (candidates.length <= maxCount) return candidates

  // Too many — pick the nearest by Euclidean distance from primary
  const primary = bridge.widgets.find((w) => w.id === widgetId)
  const px = primary?.position?.x ?? 0
  const py = primary?.position?.y ?? 0
  return candidates
    .map((w) => {
      const dx = (w.position?.x ?? 0) - px
      const dy = (w.position?.y ?? 0) - py
      return { widget: w, dist: dx * dx + dy * dy }
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxCount)
    .map((e) => e.widget)
}

/**
 * Build a 2D split layout (PaneConfig[][]) from a primary widget and connected widgets.
 * Uses quadrant-based spatial assignment: compute centroid, assign each widget to
 * TL/TR/BL/BR, then build columns (left = TL+BL, right = TR+BR).
 *
 * @param {{ id: string, type: string, position?: { x: number, y: number }, props: Object }} primaryWidget
 * @param {Array<{ id: string, type: string, position?: { x: number, y: number }, props: Object }>} connectedWidgets
 * @param {(widget: Object) => import('./ExpandedPane.jsx').PaneConfig | null} buildPaneFn — builds a PaneConfig for a widget
 * @returns {import('./ExpandedPane.jsx').PaneConfig[][]} — 2D layout: outer = columns, inner = rows
 */
export function buildSplitLayout(primaryWidget, connectedWidgets, buildPaneFn) {
  const allWidgets = [primaryWidget, ...connectedWidgets]

  // Build panes, filter nulls, keep widget reference for positioning
  const entries = allWidgets
    .map((w) => ({ widget: w, pane: buildPaneFn(w) }))
    .filter((e) => e.pane !== null)

  if (entries.length === 0) return []
  if (entries.length === 1) return [[entries[0].pane]]

  // Assign to quadrants
  const assigned = assignToQuadrants(entries.map((e) => ({
    x: e.widget.position?.x ?? 0,
    y: e.widget.position?.y ?? 0,
    data: e.pane,
  })))

  // Build columns: left = TL + BL (top first), right = TR + BR (top first)
  const leftCol = [assigned.tl, assigned.bl].filter(Boolean)
  const rightCol = [assigned.tr, assigned.br].filter(Boolean)

  const layout = []
  if (leftCol.length > 0) layout.push(leftCol)
  if (rightCol.length > 0) layout.push(rightCol)
  return layout
}

/**
 * Assign items to a 2×2 quadrant grid using centroid splitting.
 * Falls back to TL→TR→BL→BR cycling when positions are degenerate (all same x or y).
 *
 * @template T
 * @param {Array<{ x: number, y: number, data: T }>} items — 2-4 positioned items
 * @returns {{ tl: T|null, tr: T|null, bl: T|null, br: T|null }}
 */
export function assignToQuadrants(items) {
  const result = { tl: null, tr: null, bl: null, br: null }
  if (items.length === 0) return result

  // Centroid
  const cx = items.reduce((s, i) => s + i.x, 0) / items.length
  const cy = items.reduce((s, i) => s + i.y, 0) / items.length

  // Check if all x or all y are identical (degenerate)
  const allSameX = items.every((i) => i.x === items[0].x)
  const allSameY = items.every((i) => i.y === items[0].y)

  if (allSameX && allSameY) {
    // All positions identical — cycle TL→TR→BL→BR
    const slots = ['tl', 'tr', 'bl', 'br']
    for (let i = 0; i < Math.min(items.length, 4); i++) {
      result[slots[i]] = items[i].data
    }
    return result
  }

  // Assign to quadrants based on centroid
  // Use buckets to handle collisions (multiple items in same quadrant)
  const buckets = { tl: [], tr: [], bl: [], br: [] }
  for (const item of items) {
    const col = item.x < cx ? 'l' : 'r'
    const row = item.y < cy ? 't' : 'b'
    buckets[`${row}${col}`].push(item)
  }

  // If centroid splits are degenerate (e.g. 2 items with same x = centroid),
  // we may have empty quadrants and overflow. Redistribute overflow.
  const filled = []
  const overflow = []
  for (const [slot, bucket] of Object.entries(buckets)) {
    if (bucket.length > 0) {
      // Sort by position for deterministic order: top-left first
      bucket.sort((a, b) => a.y - b.y || a.x - b.x)
      result[slot] = bucket[0].data
      filled.push(slot)
      for (let i = 1; i < bucket.length; i++) overflow.push(bucket[i])
    }
  }

  // Place overflow into empty quadrant slots
  if (overflow.length > 0) {
    const allSlots = ['tl', 'tr', 'bl', 'br']
    const emptySlots = allSlots.filter((s) => result[s] === null)
    for (let i = 0; i < Math.min(overflow.length, emptySlots.length); i++) {
      result[emptySlots[i]] = overflow[i].data
    }
  }

  return result
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
