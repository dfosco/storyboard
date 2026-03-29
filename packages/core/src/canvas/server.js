/**
 * Canvas Server API — CRUD operations for .canvas.json files.
 *
 * Routes (mounted at /_storyboard/canvas/):
 *   PUT    /update   — update widget positions/content in a canvas
 *   POST   /widget   — add a widget to a canvas
 *   DELETE /widget   — remove a widget from a canvas
 *   POST   /create   — create a new canvas
 *   GET    /list     — list all canvases
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Recursively find all .canvas.json files in the project.
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
      } else if (entry.name.match(/\.canvas\.jsonc?$/)) {
        results.push(relPath)
      }
    }
  }

  walk(root, '')
  return results
}

/**
 * Find a canvas file by name. Searches src/prototypes/ for matching .canvas.json.
 */
function findCanvasPath(root, name) {
  const files = findCanvasFiles(root)
  for (const file of files) {
    const base = path.basename(file)
    const match = base.match(/^(.+)\.canvas\.(jsonc?)$/)
    if (match && match[1] === name) {
      return path.resolve(root, file)
    }
  }
  return null
}

/**
 * Read and parse a canvas JSON file.
 */
function readCanvas(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

/**
 * Write canvas data back to disk with pretty formatting.
 */
function writeCanvas(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
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

    // GET /list — list all canvases
    if (routePath === '/list' && method === 'GET') {
      const files = findCanvasFiles(root)
      const canvases = files.map((file) => {
        const base = path.basename(file)
        const match = base.match(/^(.+)\.canvas\.(jsonc?)$/)
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

    // PUT /update — update canvas data (positions, widget props, canvas settings)
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
        const data = readCanvas(filePath)

        // Update widget positions/props
        if (widgets) {
          data.widgets = widgets
        }

        // Update JSX source positions
        if (sources) {
          data.sources = sources
        }

        // Update canvas-level settings
        if (settings) {
          for (const [key, value] of Object.entries(settings)) {
            if (['title', 'description', 'grid', 'gridSize', 'colorMode', 'dotted', 'centered'].includes(key)) {
              data[key] = value
            }
          }
        }

        writeCanvas(filePath, data)
        sendJson(res, 200, { success: true, name })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update canvas: ${err.message}` })
      }
      return
    }

    // POST /widget — add a widget to a canvas
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
        const data = readCanvas(filePath)
        if (!data.widgets) data.widgets = []

        const widgetId = generateWidgetId(type)
        const widget = { id: widgetId, type, position, props }
        data.widgets.push(widget)

        writeCanvas(filePath, data)
        sendJson(res, 201, { success: true, widget })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to add widget: ${err.message}` })
      }
      return
    }

    // DELETE /widget — remove a widget from a canvas
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
        const data = readCanvas(filePath)
        const before = (data.widgets || []).length
        data.widgets = (data.widgets || []).filter((w) => w.id !== widgetId)
        const removed = before - data.widgets.length

        if (removed === 0) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found in canvas "${name}"` })
          return
        }

        writeCanvas(filePath, data)
        sendJson(res, 200, { success: true, removed })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove widget: ${err.message}` })
      }
      return
    }

    // POST /create — create a new canvas
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

      const canvasPath = path.join(targetDir, `${kebab}.canvas.json`)
      if (fs.existsSync(canvasPath)) {
        sendJson(res, 409, { error: `Canvas "${kebab}" already exists` })
        return
      }

      const canvasData = {
        title: title || kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        grid,
        gridSize,
        colorMode,
        widgets: [],
      }

      if (includeJsx) {
        canvasData.jsx = `${kebab}.canvas.jsx`
      }

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        writeCanvas(canvasPath, canvasData)

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
 * Canvas components for ${canvasData.title}.
 * Each named export becomes a draggable widget on the canvas.
 */

export function ${componentName}Example() {
  return (
    <div style={{ padding: '1rem', minWidth: 200 }}>
      <h3>${canvasData.title}</h3>
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
