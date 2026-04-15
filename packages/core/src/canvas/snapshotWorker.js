/**
 * Background snapshot worker for canvas widgets.
 *
 * Lazily starts a headless Playwright browser and captures snapshots
 * for prototype/story embed widgets. Runs entirely in the background
 * with zero console output — invisible to the user.
 *
 * Triggered by the canvas server when widgets are created or updated.
 * Uses `widget_updated` events (per-widget prop merge) to avoid
 * clobbering concurrent edits.
 */

import fs from 'node:fs'
import path from 'node:path'
import { serializeEvent } from './materializer.js'

// ── Config ──

const EMBEDDABLE_TYPES = new Set(['prototype', 'story'])
const CAPTURE_WAIT_MS = 2000
const CAPTURE_TIMEOUT_MS = 30_000

// ── State ──

let _getServerUrl = null
let _root = null
let _browser = null
let _browserPromise = null
let _queue = new Map() // widgetId → { widget, canvasId, jsonlPath }
let _processing = false
let _available = null   // null = unknown, true = Playwright installed, false = not

// ── Public API ──

/**
 * Initialize the snapshot worker.
 * @param {Function} getServerUrl — returns the dev server URL (lazy, called at capture time)
 * @param {string} root — project root directory
 */
export function init(getServerUrl, root) {
  _getServerUrl = getServerUrl
  _root = root
}

/**
 * Enqueue a widget for snapshot capture.
 * Coalesces by widgetId — only the latest request per widget is kept.
 */
export function enqueue(widget, canvasId, jsonlPath) {
  if (!EMBEDDABLE_TYPES.has(widget.type)) return
  if (!widget.props?.src && !widget.props?.storyId) return
  // External URLs can't be screenshotted
  if (widget.type === 'prototype' && /^https?:\/\//.test(widget.props?.src || '')) return

  _queue.set(widget.id, { widget, canvasId, jsonlPath })
  if (!_processing) processQueue()
}

/**
 * Shut down the Playwright browser if running.
 */
export async function shutdown() {
  _queue.clear()
  _processing = false
  if (_browser) {
    try { await _browser.close() } catch { /* */ }
    _browser = null
    _browserPromise = null
  }
}

// ── Internals ──

async function ensureBrowser() {
  if (_browser) return _browser
  if (_available === false) return null
  if (_browserPromise) return _browserPromise

  _browserPromise = (async () => {
    try {
      const pw = await import('playwright')
      _browser = await pw.chromium.launch({ headless: true })
      _available = true
      return _browser
    } catch {
      _available = false
      // Single warning — then silent forever
      console.warn('[storyboard] Playwright not installed — reactive snapshots disabled. Install: npm i -D playwright && npx playwright install chromium')
      return null
    }
  })()

  return _browserPromise
}

async function processQueue() {
  if (_processing) return
  _processing = true

  try {
    while (_queue.size > 0) {
      // Take the first queued item
      const [widgetId, job] = _queue.entries().next().value
      _queue.delete(widgetId)

      try {
        await captureWidget(job)
      } catch { /* silent — never crash the dev server */ }
    }
  } finally {
    _processing = false
  }
}

async function captureWidget({ widget, canvasId, jsonlPath }) {
  const browser = await ensureBrowser()
  if (!browser) return

  const serverUrl = _getServerUrl?.()
  if (!serverUrl) return

  const embedUrl = resolveEmbedUrl(serverUrl, widget)
  if (!embedUrl) return

  const imagesDir = path.join(_root, 'assets', 'canvas', 'snapshots')
  fs.mkdirSync(imagesDir, { recursive: true })

  const { captureW, captureH } = computeCaptureDimensions(widget)
  // Stories hardcode day theme in embed mode — only capture light
  const isStory = widget.type === 'story'
  const themes = isStory ? ['light'] : ['light', 'dark']
  const updates = {}
  const cacheBust = `?v=${Date.now()}`

  for (const theme of themes) {
    const url = appendThemeParam(embedUrl, theme)
    let context
    try {
      context = await browser.newContext({
        viewport: { width: captureW, height: captureH },
        deviceScaleFactor: 2,
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      })
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'networkidle', timeout: CAPTURE_TIMEOUT_MS })
      await page.waitForTimeout(CAPTURE_WAIT_MS)

      const buffer = await page.screenshot({ type: 'png' })
      const filename = writeSnapshotImage(imagesDir, canvasId, widget.id, theme, buffer)
      const themeKey = theme === 'dark' ? 'snapshotDark' : 'snapshotLight'
      updates[themeKey] = `/_storyboard/canvas/images/${filename}${cacheBust}`
    } catch { /* silent */ } finally {
      if (context) try { await context.close() } catch { /* */ }
    }
  }

  if (Object.keys(updates).length === 0) return

  // Append a widget_updated event (prop merge, not full replace)
  try {
    const event = {
      event: 'widget_updated',
      timestamp: new Date().toISOString(),
      widgetId: widget.id,
      props: updates,
    }
    fs.appendFileSync(jsonlPath, serializeEvent(event) + '\n', 'utf-8')
  } catch { /* silent */ }
}

// ── URL helpers (duplicated from snapshots.js to avoid touching CLI) ──

function resolveEmbedUrl(serverUrl, widget) {
  const { type, props } = widget
  if (type === 'prototype') {
    const src = props?.src
    if (!src) return null
    if (/^https?:\/\//.test(src)) return null
    const cleaned = src.replace(/^\/branch--[^/]+/, '')
    const hashIdx = cleaned.indexOf('#')
    const base = hashIdx >= 0 ? cleaned.slice(0, hashIdx) : cleaned
    const hash = hashIdx >= 0 ? cleaned.slice(hashIdx) : ''
    const sep = base.includes('?') ? '&' : '?'
    return `${serverUrl}${base}${sep}_sb_embed${hash}`
  }
  if (type === 'story') {
    const storyId = props?.storyId
    const exportName = props?.exportName || ''
    if (!storyId) return null
    const params = new URLSearchParams({ _sb_embed: '1' })
    if (exportName) params.set('export', exportName)
    return `${serverUrl}/components/${storyId}?${params}`
  }
  return null
}

function appendThemeParam(url, theme) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_sb_theme_target=prototype&_sb_canvas_theme=${theme}`
}

function writeSnapshotImage(imagesDir, canvasId, widgetId, theme, buffer) {
  const safeCanvasId = canvasId.replace(/\//g, '-')
  const filename = `snapshot-${safeCanvasId}-${widgetId}--${theme}--latest.png`
  fs.writeFileSync(path.join(imagesDir, filename), buffer)
  return filename
}

function computeCaptureDimensions(widget) {
  const rawW = widget.props?.width || 800
  const rawH = widget.props?.height || 600
  const isStory = widget.type === 'story'
  const zoom = widget.props?.zoom || 100
  const scale = zoom / 100
  // Story widgets have a 31px header; prototypes may have zoom scaling
  const captureW = isStory ? rawW : Math.round(rawW / scale)
  const captureH = isStory ? Math.max(rawH - 31, 100) : Math.round(rawH / scale)
  return { captureW, captureH }
}
