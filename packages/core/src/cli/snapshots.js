/**
 * storyboard snapshots — batch-generate preview snapshots for canvas widgets.
 *
 * Fully standalone: reads JSONL from disk, spins up a temporary Vite server
 * on an ephemeral port, uses Playwright to capture each embed at the widget's
 * dimensions (both light and dark themes), writes images to src/canvas/images/,
 * and appends a widgets_replaced event to the JSONL.
 *
 * Does NOT touch the user's running dev server or browser.
 *
 * Requires: playwright installed (globally or locally).
 *
 * Usage:
 *   storyboard snapshots              # all canvases
 *   storyboard snapshots <name>       # specific canvas
 *   storyboard snapshots --force      # regenerate even if snapshots exist
 */

import fs from 'node:fs'
import path from 'node:path'
import { materializeFromText, serializeEvent } from '../canvas/materializer.js'
import * as p from '@clack/prompts'
import { bold, dim, green, yellow, cyan } from './intro.js'

const THEMES = ['light', 'dark']
const SNAPSHOT_PORT = 19876

// ── Disk I/O helpers ──

function findCanvasFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])
  function walk(dir, rel = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (entry.name.endsWith('.canvas.jsonl')) {
        results.push({ relPath, absPath: fullPath })
      }
    }
  }
  walk(root)
  return results
}

function toCanvasId(relPath) {
  return relPath
    .replace(/\.canvas\.jsonl$/, '')
    .replace(/\\/g, '/')
}

function readCanvasState(absPath) {
  const raw = fs.readFileSync(absPath, 'utf-8')
  return materializeFromText(raw)
}

function writeImage(imagesDir, widgetId, theme, buffer) {
  fs.mkdirSync(imagesDir, { recursive: true })
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}--${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const filename = `snapshot-${widgetId}--${theme}--${dateStr}.png`
  fs.writeFileSync(path.join(imagesDir, filename), buffer)
  return filename
}

function appendWidgetsReplaced(jsonlPath, widgets) {
  const event = {
    event: 'widgets_replaced',
    timestamp: new Date().toISOString(),
    widgets,
  }
  fs.appendFileSync(jsonlPath, serializeEvent(event) + '\n', 'utf-8')
}

// ── Main ──

async function run() {
  const args = process.argv.slice(3)
  const force = args.includes('--force')
  const canvasFilter = args.find(a => !a.startsWith('--')) || null

  p.intro(bold('storyboard snapshots'))

  const root = process.cwd()
  const imagesDir = path.join(root, 'assets', 'canvas', 'snapshots')

  // Discover canvases from disk
  const allFiles = findCanvasFiles(root)
  const targets = canvasFilter
    ? allFiles.filter(f => {
        const id = toCanvasId(f.relPath)
        return id === canvasFilter || id.includes(canvasFilter)
      })
    : allFiles

  if (targets.length === 0) {
    p.log.warn(canvasFilter
      ? `No canvases matching "${canvasFilter}"`
      : 'No canvases found')
    process.exit(0)
  }

  p.log.info(`Found ${bold(targets.length)} canvas${targets.length > 1 ? 'es' : ''}`)

  // Import playwright
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    p.log.error('Playwright is required for snapshot generation.')
    p.log.info('Install: ' + yellow('npx storyboard setup'))
    p.log.info('Or manually: ' + yellow('npm install --save-dev playwright && npx playwright install chromium'))
    process.exit(1)
  }

  // Start a temporary Vite server on an ephemeral port
  const serverSpin = p.spinner()
  serverSpin.start('Starting temporary Vite server')
  let server
  try {
    const { createServer } = await import('vite')
    server = await createServer({
      root,
      server: { port: SNAPSHOT_PORT, strictPort: false },
      logLevel: 'silent',
    })
    await server.listen()
    const address = server.httpServer.address()
    const serverUrl = `http://localhost:${address.port}`
    serverSpin.stop(`Vite server ready at ${dim(serverUrl)}`)

    const browser = await chromium.launch({ headless: true })

    let totalWidgets = 0
    let totalSnapshots = 0
    let totalSkipped = 0

    for (const { relPath, absPath } of targets) {
      const canvasId = toCanvasId(relPath)
      const spin = p.spinner()
      spin.start(`Reading ${cyan(canvasId)}`)

      let state
      try {
        state = readCanvasState(absPath)
      } catch (err) {
        spin.stop(`${canvasId}: failed to read — ${err.message}`)
        continue
      }

      // Collect embeddable widgets (prototype + story + figma-embed)
      const widgets = (state.widgets || []).filter(w =>
        w.type === 'prototype' || w.type === 'story' || w.type === 'figma-embed'
      )

      if (widgets.length === 0) {
        spin.stop(`${canvasId}: no embeddable widgets`)
        continue
      }

      spin.stop(`${canvasId}: ${widgets.length} widget${widgets.length > 1 ? 's' : ''}`)
      totalWidgets += widgets.length
      let canvasDirty = false

      for (const widget of widgets) {
        const widgetLabel = widget.props?.label || widget.props?.exportName || widget.id
        const rawW = widget.props?.width || 800
        const rawH = widget.props?.height || 600
        const isFigma = widget.type === 'figma-embed'

        // Compute capture dimensions:
        // - Story widgets have a 31px header above iframe content
        // - Prototype widgets may have a zoom factor
        // - Figma embeds use raw dimensions
        const isStory = widget.type === 'story'
        const zoom = widget.props?.zoom || 100
        const scale = zoom / 100
        const captureW = isStory ? rawW : isFigma ? rawW : Math.round(rawW / scale)
        const captureH = isStory ? Math.max(rawH - 31, 100) : isFigma ? rawH : Math.round(rawH / scale)

        // Figma embeds only need a single snapshot (no theme variants)
        const themesNeeded = isFigma ? ['light'] : THEMES

        // Check existing snapshots
        const hasLight = !!widget.props?.snapshotLight
        const hasDark = !!widget.props?.snapshotDark
        const allExist = isFigma ? hasLight : (hasLight && hasDark)
        if (allExist && !force) {
          totalSkipped++
          p.log.step(dim(`  ${widgetLabel} — snapshots exist, skipping`))
          continue
        }

        const themesToCapture = force
          ? themesNeeded
          : themesNeeded.filter(t => t === 'light' ? !hasLight : !hasDark)

        const embedUrl = resolveEmbedUrl(serverUrl, widget)
        if (!embedUrl) {
          p.log.warn(`  ${widgetLabel} — could not resolve embed URL, skipping`)
          continue
        }

        const updates = {}

        for (const theme of themesToCapture) {
          const themeUrl = isFigma ? embedUrl : appendThemeParam(embedUrl, theme)
          const wspin = p.spinner()
          wspin.start(`  ${widgetLabel}${isFigma ? '' : ` (${theme})`} ${dim(`${captureW}×${captureH}`)}`)

          try {
            const context = await browser.newContext({
              viewport: { width: captureW, height: captureH },
              deviceScaleFactor: 2,
              colorScheme: theme === 'dark' ? 'dark' : 'light',
            })
            const page = await context.newPage()

            await page.goto(themeUrl, { waitUntil: 'networkidle', timeout: 30000 })
            await page.waitForTimeout(isFigma ? 4000 : 2000)

            const buffer = await page.screenshot({ type: 'png' })
            await context.close()

            const filename = writeImage(imagesDir, widget.id, theme, buffer)
            const imageUrl = `/_storyboard/canvas/images/${filename}`
            const themeKey = theme === 'dark' ? 'snapshotDark' : 'snapshotLight'
            updates[themeKey] = imageUrl
            totalSnapshots++
            wspin.stop(green(`  ${widgetLabel} (${theme}) ✓`))
          } catch (err) {
            wspin.stop(`  ${widgetLabel} (${theme}) — ${err.message}`)
          }
        }

        if (Object.keys(updates).length > 0) {
          widget.props = { ...widget.props, ...updates }
          canvasDirty = true
        }
      }

      // Persist all snapshot updates in a single widgets_replaced event
      if (canvasDirty) {
        try {
          appendWidgetsReplaced(absPath, state.widgets)
        } catch (err) {
          p.log.warn(`  ${canvasId}: failed to write JSONL — ${err.message}`)
        }
      }
    }

    await browser.close()

    // Auto-commit snapshot files so they don't clutter git status
    if (totalSnapshots > 0) {
      try {
        const { execSync } = await import(/* @vite-ignore */ 'node:child_process')
        execSync('git add assets/canvas/snapshots/ src/canvas/', { cwd: root, stdio: 'pipe' })
        execSync(
          `git commit -m "chore: update canvas snapshots" --no-verify --allow-empty`,
          { cwd: root, stdio: 'pipe' }
        )
        p.log.step(dim('Snapshots committed'))
      } catch {
        // Not in a git repo or nothing to commit — that's fine
      }
    }

    p.outro([
      green('Done!'),
      `${bold(totalSnapshots)} snapshot${totalSnapshots !== 1 ? 's' : ''} generated`,
      totalSkipped > 0 ? dim(`${totalSkipped} skipped (already exist)`) : '',
      `across ${bold(totalWidgets)} widget${totalWidgets !== 1 ? 's' : ''}`,
    ].filter(Boolean).join('  ·  '))
  } finally {
    if (server) await server.close()
  }
}

// ── URL helpers ──

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
  if (type === 'figma-embed') {
    const url = props?.url
    if (!url) return null
    // Convert figma.com URL to embed.figma.com URL
    try {
      const parsed = new URL(url)
      if (!/^(www\.)?figma\.com$/.test(parsed.hostname)) return null
      parsed.hostname = 'embed.figma.com'
      parsed.searchParams.delete('t')
      parsed.searchParams.set('embed-host', 'share')
      return parsed.toString()
    } catch {
      return null
    }
  }
  return null
}

function appendThemeParam(url, theme) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_sb_theme_target=prototype&_sb_canvas_theme=${theme}`
}

run().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
