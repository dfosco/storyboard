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
 *   GET    /stories  — list all .story.{jsx,tsx} files with exports
 *   POST   /create-story — scaffold a new .story.{jsx,tsx} file
 *   POST   /image    — upload a pasted image to src/canvas/images/
 *   GET    /images/* — serve an image file from src/canvas/images/
 *   POST   /image/toggle-private — toggle _prefix on image filename
 */

import fs from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { materializeFromText, serializeEvent } from './materializer.js'
import { toCanvasId, parseCanvasId } from './identity.js'

/**
 * Scan src/canvas/ for directories containing .meta.json files.
 * Returns an object keyed by directory name (without .folder suffix).
 */
function findCanvasMeta(root) {
  const canvasDir = path.join(root, 'src', 'canvas')
  const groups = {}
  if (!fs.existsSync(canvasDir)) return groups

  const entries = fs.readdirSync(canvasDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirName = entry.name.replace(/\.folder$/, '')
    const metaPath = path.join(canvasDir, entry.name, `${dirName}.meta.json`)
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        groups[dirName] = meta
      } catch { /* skip invalid meta */ }
    }
  }
  return groups
}

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
 * Recursively find all .story.{jsx,tsx} files in routable directories
 * (src/canvas/ and src/components/) and extract their named exports.
 */
function findStoryFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])
  const ROUTABLE_DIRS = ['src/canvas', 'src/components']

  function walk(dir, rel) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      if (entry.name.startsWith('_')) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (/\.story\.(jsx|tsx)$/.test(entry.name)) {
        const name = entry.name.replace(/\.story\.(jsx|tsx)$/, '')
        const exports = parseExportNames(fullPath)
        results.push({ name, path: relPath, exports })
      }
    }
  }

  for (const dir of ROUTABLE_DIRS) {
    const absDir = path.join(root, dir)
    if (fs.existsSync(absDir)) {
      walk(absDir, dir)
    }
  }
  return results
}

/**
 * Parse named function/const exports from a JSX/TSX file.
 */
function parseExportNames(filePath) {
  try {
    const src = fs.readFileSync(filePath, 'utf-8')
    const names = []
    const re = /export\s+(?:function|const|class)\s+([A-Z]\w*)/g
    let m
    while ((m = re.exec(src)) !== null) names.push(m[1])
    return names
  } catch { return [] }
}

/**
 * Find a canvas JSONL file by canonical ID.
 * Only matches canonical path-based IDs from toCanvasId().
 */
function findCanvasPath(root, canvasId) {
  const files = findCanvasFiles(root)

  for (const file of files) {
    const id = toCanvasId(file)
    if (id === canvasId) {
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
          const entries = fs.readdirSync(canvasDir, { withFileTypes: true })
          // .folder directories (existing behavior)
          const folderDirs = entries
            .filter((d) => d.isDirectory() && d.name.endsWith('.folder'))
            .map((d) => d.name.replace('.folder', ''))
          // Plain directories containing .canvas.jsonl files
          const plainDirs = entries
            .filter((d) => {
              if (!d.isDirectory() || d.name.endsWith('.folder') || d.name.startsWith('_')) return false
              const files = fs.readdirSync(path.join(canvasDir, d.name))
              return files.some((f) => f.endsWith('.canvas.jsonl'))
            })
            .map((d) => d.name)
          folders = [...folderDirs, ...plainDirs]
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
        const widgetFilter = url.searchParams.get('widget')
        if (widgetFilter) {
          const widget = (data.widgets || []).find((w) => w.id === widgetFilter)
          if (!widget) {
            sendJson(res, 404, { error: `Widget "${widgetFilter}" not found in canvas "${name}"` })
            return
          }
          sendJson(res, 200, { ...data, widgets: [widget] })
        } else {
          sendJson(res, 200, data)
        }
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read canvas: ${err.message}` })
      }
      return
    }

    // GET /list — list all canvases
    if (routePath === '/list' && method === 'GET') {
      const files = findCanvasFiles(root)
      const canvases = files.map((file) => {
        const id = toCanvasId(file)
        if (!id) return null
        const { segments } = parseCanvasId(id)
        const group = segments.length > 1 ? segments.slice(0, -1).join('/') : null
        try {
          const data = readCanvas(path.resolve(root, file))
          return {
            name: id,
            title: data.title || segments[segments.length - 1],
            path: file,
            widgetCount: (data.widgets || []).length + (data.sources || []).length,
            group,
          }
        } catch {
          return { name: id, title: segments[segments.length - 1], path: file, widgetCount: 0, group }
        }
      }).filter(Boolean)
      const groups = findCanvasMeta(root)
      sendJson(res, 200, { canvases, groups })
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
        meta,
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
        const dotFolderDir = path.join(canvasDir, `${folder}.folder`)
        const plainDir = path.join(canvasDir, folder)

        if (fs.existsSync(dotFolderDir)) {
          // Existing .folder/ directory
          targetDir = dotFolderDir
        } else if (fs.existsSync(plainDir) && fs.statSync(plainDir).isDirectory()) {
          // Existing plain directory
          targetDir = plainDir
        } else {
          // Create new plain directory
          try {
            fs.mkdirSync(plainDir, { recursive: true })
            // Write .meta.json if meta was provided
            if (meta && typeof meta === 'object') {
              const metaPath = path.join(plainDir, `${folder}.meta.json`)
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
            }
          } catch (err) {
            sendJson(res, 500, { error: `Failed to create directory: ${err.message}` })
            return
          }
          targetDir = plainDir
        }
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

        const relPath = path.relative(root, canvasPath).replace(/\\/g, '/')
        const canonicalName = toCanvasId(relPath) || kebab

        const result = {
          success: true,
          name: canonicalName,
          path: relPath,
          route: `/canvas/${canonicalName}`,
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

    // ── Story routes ──────────────────────────────────────────────────

    // GET /stories — list all .story.{jsx,tsx} files with their exports
    if (routePath === '/stories' && method === 'GET') {
      try {
        const storyFiles = findStoryFiles(root)
        sendJson(res, 200, { stories: storyFiles })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to list stories: ${err.message}` })
      }
      return
    }

    // POST /create-story — scaffold a new .story.jsx/.tsx file
    if (routePath === '/create-story' && method === 'POST') {
      const { name, location, format = 'jsx', canvasName: storyCanvasName } = body

      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Component name is required' })
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

      const ext = format === 'tsx' ? 'tsx' : 'jsx'

      // Resolve target directory from location + canvas name
      let targetDir
      if (location === 'components') {
        targetDir = path.join(root, 'src', 'components')
      } else if (storyCanvasName) {
        const canvasPath = findCanvasPath(root, storyCanvasName)
        targetDir = canvasPath ? path.dirname(canvasPath) : path.join(root, 'src', 'canvas')
      } else {
        targetDir = path.join(root, 'src', 'canvas')
      }

      const storyPath = path.join(targetDir, `${kebab}.story.${ext}`)
      if (fs.existsSync(storyPath)) {
        sendJson(res, 409, { error: `Story "${kebab}.story.${ext}" already exists at ${path.relative(root, targetDir)}` })
        return
      }

      // Check for duplicate story name anywhere in the project (Vite data plugin
      // enforces global uniqueness and would fail the build on duplicates)
      const existing = findStoryFiles(root)
      if (existing.some(s => s.name === kebab)) {
        sendJson(res, 409, { error: `A story named "${kebab}" already exists in the project` })
        return
      }

      const componentName = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
      const content = `/**
 * ${componentName} component stories.
 * Each named export becomes a draggable widget on the canvas.
 */

export function Default() {
  return (
    <div style={{ padding: '1.5rem', minWidth: 200 }}>
      <h3>${componentName}</h3>
      <p>Edit this file to build your component.</p>
    </div>
  )
}
`

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(storyPath, content, 'utf-8')

        const relPath = path.relative(root, storyPath)
        sendJson(res, 201, {
          success: true,
          name: kebab,
          path: relPath,
          storyId: kebab,
        })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to create story: ${err.message}` })
      }
      return
    }

    // ── Image routes ──────────────────────────────────────────────────

    const imagesDir = path.join(root, 'assets', 'canvas', 'images')
    const snapshotsDir = path.join(root, 'assets', 'canvas', 'snapshots')

    const MIME_TO_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
    const EXT_TO_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

    // Resolve which directory to write to based on canvasName prefix
    function resolveWriteDir(canvasName) {
      return canvasName && canvasName.startsWith('snapshot-') ? snapshotsDir : imagesDir
    }

    // Resolve a filename to its on-disk path (check snapshots first, then images)
    function resolveImagePath(filename) {
      const snapshotPath = path.join(snapshotsDir, filename)
      if (fs.existsSync(snapshotPath)) return snapshotPath
      const imagePath = path.join(imagesDir, filename)
      if (fs.existsSync(imagePath)) return imagePath
      return null
    }

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
      const prefix = canvasName ? `${canvasName.replace(/[\/:]/g, '--')}--` : ''
      const filename = `${prefix}${dateStr}.${ext}`
      const targetDir = resolveWriteDir(canvasName)

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(path.join(targetDir, filename), buffer)
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

      const filePath = resolveImagePath(filename)
      if (!filePath) {
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
      const oldPath = resolveImagePath(filename)
      if (!oldPath) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }
      const parentDir = path.dirname(oldPath)
      const newPath = path.join(parentDir, newFilename)

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
