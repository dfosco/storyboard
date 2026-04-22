/**
 * Shared utilities for expandable widget modals and split-screen.
 *
 * Reads the canvas bridge state to find connected widgets eligible
 * for split-screen, and builds iframe URLs for secondary panes.
 */
import { isSplitScreenCapable } from './widgetConfig.js'

/**
 * Find a connected widget that is split-screen capable.
 * Returns the first match, or null.
 * @param {string} widgetId — the primary (expanded) widget's ID
 * @returns {{ id: string, type: string, position: { x: number, y: number }, props: Object } | null}
 */
export function findConnectedSplitTarget(widgetId) {
  const bridge = window.__storyboardCanvasBridgeState
  if (!bridge?.connectors || !bridge?.widgets) return null

  const connectedIds = new Set()
  for (const c of bridge.connectors) {
    if (c.startWidgetId === widgetId) connectedIds.add(c.endWidgetId)
    if (c.endWidgetId === widgetId) connectedIds.add(c.startWidgetId)
  }

  for (const w of bridge.widgets) {
    if (connectedIds.has(w.id) && isSplitScreenCapable(w.type)) return w
  }
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
