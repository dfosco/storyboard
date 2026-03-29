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
 */

import fs from 'node:fs'
import path from 'node:path'
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
  const { root, sendJson, watcher } = ctx

  // Append an event, temporarily unwatching the file to prevent Vite reloads
  function appendEvent(filePath, event) {
    if (watcher) watcher.unwatch(filePath)
    appendEventRaw(filePath, event)
    if (watcher) setTimeout(() => watcher.add(filePath), 1500)
  }

  // Write a new JSONL file with a single creation event
  function writeNewCanvas(filePath, event) {
    if (watcher) watcher.unwatch(filePath)
    fs.writeFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
    if (watcher) setTimeout(() => watcher.add(filePath), 1500)
  }

  return async (req, res, { body, path: routePath, method }) => {
    // GET /folders — list available canvas folders
    if (routePath === '/folders' && method === 'GET') {
      const canvasesDir = path.join(root, 'src', 'canvases')
      let folders = []
      try {
        if (fs.existsSync(canvasesDir)) {
          folders = fs.readdirSync(canvasesDir, { withFileTypes: true })
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
            if (['title', 'description', 'grid', 'gridSize', 'colorMode', 'dotted', 'centered'].includes(key)) {
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
      const canvasesDir = path.join(root, 'src', 'canvases')
      let targetDir = canvasesDir

      if (folder) {
        const folderDir = path.join(canvasesDir, `${folder}.folder`)
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

    sendJson(res, 404, { error: `Unknown route: ${method} ${routePath}` })
  }
}
