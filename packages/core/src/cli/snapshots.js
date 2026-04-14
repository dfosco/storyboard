/**
 * storyboard snapshots — batch-generate preview snapshots for canvas widgets.
 *
 * Opens each prototype/story embed URL in a headless browser at the widget's
 * dimensions, captures a screenshot for both light and dark themes, uploads
 * each image via the dev server API, and persists the snapshot paths in the
 * canvas JSONL.
 *
 * Requires: dev server running, playwright installed.
 *
 * Usage:
 *   storyboard snapshots              # all canvases
 *   storyboard snapshots <name>       # specific canvas
 *   storyboard snapshots --force      # regenerate even if snapshots exist
 */

import { getServerUrl } from './serverUrl.js'
import * as p from '@clack/prompts'
import { bold, dim, green, yellow, cyan } from './intro.js'

const THEMES = ['light', 'dark']

async function run() {
  const args = process.argv.slice(3)
  const force = args.includes('--force')
  const canvasFilter = args.find(a => !a.startsWith('--')) || null

  p.intro(bold('storyboard snapshots'))

  // Resolve dev server
  let serverUrl
  try {
    serverUrl = getServerUrl()
  } catch {
    p.log.error('Could not resolve dev server URL. Is the dev server running?')
    process.exit(1)
  }

  const apiBase = `${serverUrl}/_storyboard/canvas`

  // Verify server is reachable
  try {
    const res = await fetch(`${apiBase}/list`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    p.log.error(`Dev server not reachable at ${serverUrl}: ${err.message}`)
    p.log.info('Start the dev server first: ' + yellow('storyboard dev'))
    process.exit(1)
  }

  // List canvases
  const listRes = await fetch(`${apiBase}/list`)
  const { canvases } = await listRes.json()

  const targets = canvasFilter
    ? canvases.filter(c => c.name === canvasFilter || c.name.includes(canvasFilter))
    : canvases

  if (targets.length === 0) {
    p.log.warn(canvasFilter
      ? `No canvases matching "${canvasFilter}"`
      : 'No canvases found')
    process.exit(0)
  }

  p.log.info(`Found ${bold(targets.length)} canvas${targets.length > 1 ? 'es' : ''} to process`)

  // Import playwright
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    p.log.error('Playwright is required for snapshot generation.')
    p.log.info('Install it: ' + yellow('npm install -g playwright && npx playwright install chromium'))
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })

  let totalWidgets = 0
  let totalSnapshots = 0
  let totalSkipped = 0

  for (const canvas of targets) {
    const spin = p.spinner()
    spin.start(`Reading ${cyan(canvas.name)}`)

    // Read materialized canvas state
    const readRes = await fetch(`${apiBase}/read?name=${encodeURIComponent(canvas.name)}`)
    if (!readRes.ok) {
      spin.stop(`${canvas.name}: failed to read`)
      continue
    }
    const state = await readRes.json()

    // Collect embeddable widgets (prototype + story)
    const widgets = (state.widgets || []).filter(w =>
      w.type === 'prototype' || w.type === 'story'
    )

    if (widgets.length === 0) {
      spin.stop(`${canvas.name}: no embeddable widgets`)
      continue
    }

    spin.stop(`${canvas.name}: ${widgets.length} widget${widgets.length > 1 ? 's' : ''}`)
    totalWidgets += widgets.length
    let canvasDirty = false

    for (const widget of widgets) {
      const widgetLabel = widget.props?.label || widget.props?.exportName || widget.id
      const w = widget.props?.width || 800
      const h = widget.props?.height || 600

      // Check if snapshots already exist
      const hasLight = !!widget.props?.snapshotLight
      const hasDark = !!widget.props?.snapshotDark
      if (hasLight && hasDark && !force) {
        totalSkipped++
        p.log.step(dim(`  ${widgetLabel} — snapshots exist, skipping`))
        continue
      }

      const themesToCapture = force
        ? THEMES
        : THEMES.filter(t => t === 'light' ? !hasLight : !hasDark)

      // Resolve the embed URL for this widget
      const embedUrl = resolveEmbedUrl(serverUrl, widget)
      if (!embedUrl) {
        p.log.warn(`  ${widgetLabel} — could not resolve embed URL, skipping`)
        continue
      }

      const updates = {}

      for (const theme of themesToCapture) {
        const themeUrl = appendThemeParam(embedUrl, theme)
        const wspin = p.spinner()
        wspin.start(`  ${widgetLabel} (${theme}) ${dim(`${w}×${h}`)}`)

        try {
          const context = await browser.newContext({
            viewport: { width: w, height: h },
            deviceScaleFactor: 2,
            colorScheme: theme === 'dark' ? 'dark' : 'light',
          })
          const page = await context.newPage()

          await page.goto(themeUrl, { waitUntil: 'networkidle', timeout: 30000 })
          // Extra settle time for React renders + animations
          await page.waitForTimeout(2000)

          const buffer = await page.screenshot({
            type: 'webp',
            quality: 85,
          })

          await context.close()

          // Upload via dev server API
          const base64 = buffer.toString('base64')
          const dataUrl = `data:image/webp;base64,${base64}`
          const uploadRes = await fetch(`${apiBase}/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              canvasName: `snapshot-${widget.id}`,
            }),
          })
          const uploadData = await uploadRes.json()

          if (uploadData.success && uploadData.filename) {
            const imageUrl = `/_storyboard/canvas/images/${uploadData.filename}`
            const themeKey = theme === 'dark' ? 'snapshotDark' : 'snapshotLight'
            updates[themeKey] = imageUrl
            totalSnapshots++
            wspin.stop(green(`  ${widgetLabel} (${theme}) ✓`))
          } else {
            wspin.stop(`  ${widgetLabel} (${theme}) — upload failed`)
          }
        } catch (err) {
          wspin.stop(`  ${widgetLabel} (${theme}) — ${err.message}`)
        }
      }

      // Accumulate updates into the widget props (applied to JSONL after all widgets)
      if (Object.keys(updates).length > 0) {
        widget.props = { ...widget.props, ...updates }
        canvasDirty = true
      }
    }

    // Persist all snapshot updates for this canvas in a single widgets_replaced event
    if (canvasDirty) {
      await fetch(`${apiBase}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: canvas.name,
          widgets: state.widgets,
        }),
      })
    }
  }

  await browser.close()

  p.outro([
    green(`Done!`),
    `${bold(totalSnapshots)} snapshot${totalSnapshots !== 1 ? 's' : ''} generated`,
    totalSkipped > 0 ? dim(`${totalSkipped} skipped (already exist)`) : '',
    `across ${bold(totalWidgets)} widget${totalWidgets !== 1 ? 's' : ''}`,
  ].filter(Boolean).join('  ·  '))
}

/**
 * Build the embed URL for a widget based on its type.
 */
function resolveEmbedUrl(serverUrl, widget) {
  const { type, props } = widget
  if (type === 'prototype') {
    const src = props?.src
    if (!src) return null
    if (/^https?:\/\//.test(src)) return null // skip external

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

/**
 * Append theme parameter to the embed URL.
 */
function appendThemeParam(url, theme) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_sb_theme_target=prototype&_sb_canvas_theme=${theme}`
}

run().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
