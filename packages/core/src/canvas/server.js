/**
 * Canvas Server API — CRUD operations for .canvas.jsonl files.
 *
 * Canvas data is stored as an append-only JSONL event stream.
 * Each line is a JSON event object. The first line is always a
 * `canvas_created` event containing the full initial state.
 * Subsequent lines are atomic change events. Current state is
 * derived by replaying the stream via the materializer.
 *
 * Routes (mounted at /_storyboard/canvas/):
 *   GET    /read     — read materialized canvas state
 *   GET    /list     — list all canvases
 *   GET    /folders  — list canvas folders
 *   PUT    /update   — append update events (widgets, sources, settings)
 *   POST   /widget   — append a widget_added event
 *   DELETE /widget   — append a widget_removed event
 *   POST   /create   — create a new .canvas.jsonl file
 *   POST   /image    — upload a pasted image to src/canvas/images/
 *   GET    /images/* — serve an image file from src/canvas/images/
 *   POST   /image/toggle-private — toggle _prefix on image filename
 */

import fs from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { materializeFromText, serializeEvent } from './materializer.js'

/**
 * Recursively find all .canvas.jsonl files in the project.
 */
function findCanvasFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])

  function walk(dir, rel) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (entry.name.endsWith('.canvas.jsonl')) {
        results.push(relPath)
      }
    }
  }

  walk(root, '')
  return results
}

/**
 * Find a canvas JSONL file by name.
 */
function findCanvasPath(root, name) {
  const files = findCanvasFiles(root)
  for (const file of files) {
    const base = path.basename(file)
    const match = base.match(/^(.+)\.canvas\.jsonl$/)
    if (match && match[1] === name) {
      return path.resolve(root, file)
    }
  }
  return null
}

/**
 * Read a .canvas.jsonl file and materialize its current state.
 */
function readCanvas(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return materializeFromText(raw)
}

/**
 * Append a single event line to a .canvas.jsonl file.
 */
function appendEventRaw(filePath, event) {
  fs.appendFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
}

/**
 * Generate a unique widget ID.
 */
function generateWidgetId(type) {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${type}-${suffix}`
}

/**
 * Create the canvas API route handler.
 */
export function createCanvasHandler(ctx) {
  const { root, sendJson } = ctx

  // Append an event to an existing canvas file.
  // The data plugin already skips .canvas.jsonl `change` events to avoid
  // a save → reload → lost-editing-state feedback loop, so we just write
  // directly without touching the watcher.
  function appendEvent(filePath, event) {
    appendEventRaw(filePath, event)
  }

  // Write a new JSONL file with a single creation event.
  // New files are detected naturally by Vite's watcher as an `add` event,
  // which correctly triggers a full reload to register new routes.
  function writeNewCanvas(filePath, event) {
    fs.writeFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
  }

  return async (req, res, { body, path: routePath, method }) => {
    // GET /folders — list available canvas folders
    if (routePath === '/folders' && method === 'GET') {
      const canvasDir = path.join(root, 'src', 'canvas')
      let folders = []
      try {
        if (fs.existsSync(canvasDir)) {
          folders = fs.readdirSync(canvasDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && d.name.endsWith('.folder'))
            .map((d) => d.name.replace('.folder', ''))
        }
      } catch { /* empty */ }
      sendJson(res, 200, { folders })
      return
    }

    // GET /read?name=... — read materialized canvas data from disk
    if (routePath.startsWith('/read') && method === 'GET') {
      const url = new URL(routePath, 'http://localhost')
      const name = url.searchParams.get('name')
      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required (?name=...)' })
        return
      }
      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }
      try {
        const data = readCanvas(filePath)
        sendJson(res, 200, data)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read canvas: ${err.message}` })
      }
      return
    }

    // GET /list — list all canvases
    if (routePath === '/list' && method === 'GET') {
      const files = findCanvasFiles(root)
      const canvases = files.map((file) => {
        const base = path.basename(file)
        const match = base.match(/^(.+)\.canvas\.jsonl$/)
        if (!match) return null
        try {
          const data = readCanvas(path.resolve(root, file))
          return {
            name: match[1],
            title: data.title || match[1],
            path: file,
            widgetCount: (data.widgets || []).length + (data.sources || []).length,
          }
        } catch {
          return { name: match[1], title: match[1], path: file, widgetCount: 0 }
        }
      }).filter(Boolean)
      sendJson(res, 200, { canvases })
      return
    }

    // PUT /update — append update events to the canvas stream
    if (routePath === '/update' && method === 'PUT') {
      const { name, widgets, sources, settings } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const ts = new Date().toISOString()

        if (widgets) {
          appendEvent(filePath, { event: 'widgets_replaced', timestamp: ts, widgets })
        }

        if (sources) {
          appendEvent(filePath, { event: 'source_updated', timestamp: ts, sources })
        }

        if (settings) {
          const filtered = {}
          for (const [key, value] of Object.entries(settings)) {
            if (['title', 'description', 'grid', 'gridSize', 'colorMode', 'dotted', 'centered', 'author', 'snapToGrid'].includes(key)) {
              filtered[key] = value
            }
          }
          if (Object.keys(filtered).length > 0) {
            appendEvent(filePath, { event: 'settings_updated', timestamp: ts, settings: filtered })
          }
        }

        sendJson(res, 200, { success: true, name })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update canvas: ${err.message}` })
      }
      return
    }

    // POST /widget — append a widget_added event
    if (routePath === '/widget' && method === 'POST') {
      const { name, type, props = {}, position = { x: 0, y: 0 } } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }
      if (!type) {
        sendJson(res, 400, { error: 'Widget type is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const widgetId = generateWidgetId(type)
        const widget = { id: widgetId, type, position, props }

        appendEvent(filePath, {
          event: 'widget_added',
          timestamp: new Date().toISOString(),
          widget,
        })

        sendJson(res, 201, { success: true, widget })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to add widget: ${err.message}` })
      }
      return
    }

    // DELETE /widget — append a widget_removed event
    if (routePath === '/widget' && method === 'DELETE') {
      const { name, widgetId } = body

      if (!name || !widgetId) {
        sendJson(res, 400, { error: 'Canvas name and widgetId are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        // Verify the widget exists before appending the removal event
        const data = readCanvas(filePath)
        const exists = (data.widgets || []).some((w) => w.id === widgetId)
        if (!exists) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found in canvas "${name}"` })
          return
        }

        appendEvent(filePath, {
          event: 'widget_removed',
          timestamp: new Date().toISOString(),
          widgetId,
        })

        sendJson(res, 200, { success: true, removed: 1 })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove widget: ${err.message}` })
      }
      return
    }

    // POST /create — create a new .canvas.jsonl file
    if (routePath === '/create' && method === 'POST') {
      const {
        name,
        title,
        folder,
        author,
        description,
        grid = true,
        gridSize = 24,
        colorMode = 'auto',
        includeJsx = false,
      } = body

      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const kebab = name
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'Name must contain at least one alphanumeric character' })
        return
      }

      // Determine target directory
      const canvasDir = path.join(root, 'src', 'canvas')
      let targetDir = canvasDir

      if (folder) {
        const folderDir = path.join(canvasDir, `${folder}.folder`)
        if (!fs.existsSync(folderDir)) {
          sendJson(res, 400, { error: `Folder "${folder}" does not exist` })
          return
        }
        targetDir = folderDir
      }

      const canvasPath = path.join(targetDir, `${kebab}.canvas.jsonl`)
      if (fs.existsSync(canvasPath)) {
        sendJson(res, 409, { error: `Canvas "${kebab}" already exists` })
        return
      }

      const creationEvent = {
        event: 'canvas_created',
        timestamp: new Date().toISOString(),
        title: title || kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        grid,
        gridSize,
        colorMode,
        widgets: [],
      }

      if (author) {
        creationEvent.author = author
      }

      if (description) {
        creationEvent.description = description
      }

      if (includeJsx) {
        creationEvent.jsx = `${kebab}.canvas.jsx`
      }

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        writeNewCanvas(canvasPath, creationEvent)

        const result = {
          success: true,
          name: kebab,
          path: path.relative(root, canvasPath),
          route: `/canvas/${kebab}`,
        }

        // Optionally create starter JSX file
        if (includeJsx) {
          const jsxPath = path.join(targetDir, `${kebab}.canvas.jsx`)
          const componentName = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
          const jsxContent = `/**
 * Canvas components for ${creationEvent.title}.
 * Each named export becomes a draggable widget on the canvas.
 */

export function ${componentName}Example() {
  return (
    <div style={{ padding: '1rem', minWidth: 200 }}>
      <h3>${creationEvent.title}</h3>
      <p>Edit this component in the .canvas.jsx file.</p>
    </div>
  )
}
`
          fs.writeFileSync(jsxPath, jsxContent, 'utf-8')
          result.jsxPath = path.relative(root, jsxPath)
        }

        sendJson(res, 201, result)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to create canvas: ${err.message}` })
      }
      return
    }

    // ── Image routes ──────────────────────────────────────────────────

    const imagesDir = path.join(root, 'src', 'canvas', 'images')

    const MIME_TO_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
    const EXT_TO_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

    // POST /image — upload a pasted image (base64 data URL)
    if (routePath === '/image' && method === 'POST') {
      const { dataUrl, canvasName } = body

      if (!dataUrl || typeof dataUrl !== 'string') {
        sendJson(res, 400, { error: 'dataUrl is required' })
        return
      }

      const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (!match) {
        sendJson(res, 400, { error: 'Invalid data URL format' })
        return
      }

      const mime = match[1].toLowerCase()
      const ext = MIME_TO_EXT[mime]
      if (!ext) {
        sendJson(res, 400, { error: `Unsupported image type: ${mime}` })
        return
      }

      const base64 = match[2]
      const buffer = Buffer.from(base64, 'base64')

      if (buffer.length > MAX_IMAGE_SIZE) {
        sendJson(res, 413, { error: `Image exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` })
        return
      }

      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}--${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
      const prefix = canvasName ? `${canvasName}--` : ''
      const filename = `${prefix}${dateStr}.${ext}`

      try {
        fs.mkdirSync(imagesDir, { recursive: true })
        fs.writeFileSync(path.join(imagesDir, filename), buffer)
        sendJson(res, 201, { success: true, filename })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to save image: ${err.message}` })
      }
      return
    }

    // GET /images/<filename> — serve an image file
    if (routePath.startsWith('/images/') && method === 'GET') {
      const filename = routePath.slice('/images/'.length)

      // Block path traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        sendJson(res, 400, { error: 'Invalid filename' })
        return
      }

      const filePath = path.join(imagesDir, filename)
      if (!fs.existsSync(filePath)) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }

      const ext = path.extname(filename).slice(1).toLowerCase()
      const contentType = EXT_TO_MIME[ext] || 'application/octet-stream'

      try {
        const data = fs.readFileSync(filePath)
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': data.length,
          'Cache-Control': 'no-cache',
        })
        res.end(data)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to serve image: ${err.message}` })
      }
      return
    }

    // POST /image/toggle-private — toggle underscore prefix on image filename
    if (routePath === '/image/toggle-private' && method === 'POST') {
      const { filename } = body

      if (!filename || typeof filename !== 'string') {
        sendJson(res, 400, { error: 'filename is required' })
        return
      }

      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        sendJson(res, 400, { error: 'Invalid filename' })
        return
      }

      const isPrivate = filename.startsWith('_')
      const newFilename = isPrivate ? filename.slice(1) : `_${filename}`
      const oldPath = path.join(imagesDir, filename)
      const newPath = path.join(imagesDir, newFilename)

      if (!fs.existsSync(oldPath)) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }

      try {
        fs.renameSync(oldPath, newPath)
        sendJson(res, 200, { success: true, filename: newFilename, private: !isPrivate })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to toggle private: ${err.message}` })
      }
      return
    }

    sendJson(res, 404, { error: `Unknown route: ${method} ${routePath}` })
  }
}
