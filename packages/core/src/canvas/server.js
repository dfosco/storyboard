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
 *   PUT    /rename-page — rename a canvas page file
 *   PUT    /reorder-pages — save page order for a canvas folder
 *   GET    /page-order — read page order for a folder
 *   PUT    /update-folder-meta — update folder .meta.json title
 *   POST   /widget   — append a widget_added event
 *   DELETE /widget   — append a widget_removed event
 *   POST   /connector — append a connector_added event
 *   DELETE /connector — append a connector_removed event
 *   POST   /create   — create a new .canvas.jsonl file
 *   GET    /stories  — list all .story.{jsx,tsx} files with exports
 *   POST   /create-story — scaffold a new .story.{jsx,tsx} file
 *   GET    /github/available — check if local gh CLI is installed
 *   POST   /github/embed — fetch GitHub issue/discussion/PR/comment metadata via gh
 *   POST   /image    — upload a pasted image to src/canvas/images/
 *   GET    /images/* — serve an image file from src/canvas/images/
 *   POST   /image/toggle-private — toggle _prefix on image filename
 */

import fs from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { materializeFromText, serializeEvent } from './materializer.js'
import { toCanvasId, parseCanvasId } from './identity.js'
import {
  GH_INSTALL_URL,
  GitHubEmbedError,
  fetchGitHubEmbedSnapshot,
  isGhCliAvailable,
  isGitHubEmbedUrl,
} from './githubEmbeds.js'
import { stampBounds, stampBoundsAll } from './collision.js'

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
 * Read .meta.json from a canvas folder directory.
 */
function readFolderMeta(folderDir) {
  const dirName = path.basename(folderDir).replace(/\.folder$/, '')
  const metaPath = path.join(folderDir, `${dirName}.meta.json`)
  if (fs.existsSync(metaPath)) {
    try { return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) } catch { /* ignore */ }
  }
  return {}
}

/**
 * Write .meta.json to a canvas folder directory.
 */
function writeFolderMeta(folderDir, meta) {
  const dirName = path.basename(folderDir).replace(/\.folder$/, '')
  const metaPath = path.join(folderDir, `${dirName}.meta.json`)
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
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
          const stamped = stampBoundsAll(widgets)
          appendEvent(filePath, { event: 'widgets_replaced', timestamp: ts, widgets: stamped })
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
        const widget = stampBounds({ id: widgetId, type, position, props })

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
        const widget = (data.widgets || []).find((w) => w.id === widgetId)
        if (!widget) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found in canvas "${name}"` })
          return
        }

        appendEvent(filePath, {
          event: 'widget_removed',
          timestamp: new Date().toISOString(),
          widgetId,
        })

        // Orphan terminal session when a terminal widget is deleted (not killed)
        if (widget.type === 'terminal') {
          try {
            const { orphanTerminalSession } = await import('./terminal-server.js')
            orphanTerminalSession(widgetId)
          } catch {}
        }

        sendJson(res, 200, { success: true, removed: 1 })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove widget: ${err.message}` })
      }
      return
    }

    // POST /connector — append a connector_added event
    if (routePath === '/connector' && method === 'POST') {
      const { name, startWidgetId, startAnchor, endWidgetId, endAnchor, connectorType = 'default' } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }
      if (!startWidgetId || !endWidgetId) {
        sendJson(res, 400, { error: 'startWidgetId and endWidgetId are required' })
        return
      }
      const validAnchors = ['top', 'bottom', 'left', 'right']
      if (!validAnchors.includes(startAnchor) || !validAnchors.includes(endAnchor)) {
        sendJson(res, 400, { error: `Anchors must be one of: ${validAnchors.join(', ')}` })
        return
      }
      if (startWidgetId === endWidgetId) {
        sendJson(res, 400, { error: 'Cannot connect a widget to itself' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const widgetIds = new Set((data.widgets || []).map((w) => w.id))
        if (!widgetIds.has(startWidgetId)) {
          sendJson(res, 404, { error: `Widget "${startWidgetId}" not found` })
          return
        }
        if (!widgetIds.has(endWidgetId)) {
          sendJson(res, 404, { error: `Widget "${endWidgetId}" not found` })
          return
        }

        const connectorId = generateWidgetId('connector')
        const connector = {
          id: connectorId,
          type: 'connector',
          connectorType,
          start: { widgetId: startWidgetId, anchor: startAnchor },
          end: { widgetId: endWidgetId, anchor: endAnchor },
          meta: {},
        }

        appendEvent(filePath, {
          event: 'connector_added',
          timestamp: new Date().toISOString(),
          connector,
        })

        sendJson(res, 201, { success: true, connector })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to add connector: ${err.message}` })
      }
      return
    }

    // DELETE /connector — append a connector_removed event
    if (routePath === '/connector' && method === 'DELETE') {
      const { name, connectorId } = body

      if (!name || !connectorId) {
        sendJson(res, 400, { error: 'Canvas name and connectorId are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const exists = (data.connectors || []).some((c) => c.id === connectorId)
        if (!exists) {
          sendJson(res, 404, { error: `Connector "${connectorId}" not found in canvas "${name}"` })
          return
        }

        appendEvent(filePath, {
          event: 'connector_removed',
          timestamp: new Date().toISOString(),
          connectorId,
        })

        sendJson(res, 200, { success: true, removed: 1 })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove connector: ${err.message}` })
      }
      return
    }

    // PUT /rename-page — rename a canvas page file
    if (routePath === '/rename-page' && method === 'PUT') {
      const { name, newTitle } = body

      if (!name || !newTitle) {
        sendJson(res, 400, { error: 'Canvas name and newTitle are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      const kebab = newTitle
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'newTitle must contain at least one alphanumeric character' })
        return
      }

      try {
        const dir = path.dirname(filePath)
        const newFilename = `${kebab}.canvas.jsonl`
        const newPath = path.join(dir, newFilename)

        if (newPath !== filePath && fs.existsSync(newPath)) {
          sendJson(res, 409, { error: `A canvas file named "${newFilename}" already exists in this directory` })
          return
        }

        fs.renameSync(filePath, newPath)

        const newCanonicalId = toCanvasId(path.relative(root, newPath).replace(/\\/g, '/'))

        appendEvent(newPath, {
          event: 'settings_updated',
          timestamp: new Date().toISOString(),
          settings: { title: newTitle },
        })

        // Update pageOrder in .meta.json if it exists
        const metaForOrder = readFolderMeta(dir)
        if (metaForOrder?.pageOrder) {
          try {
            const updated = metaForOrder.pageOrder.map((entry) =>
              typeof entry === 'string' && entry === name ? newCanonicalId : entry
            )
            metaForOrder.pageOrder = updated
            writeFolderMeta(dir, metaForOrder)
          } catch { /* skip */ }
        }

        sendJson(res, 200, { success: true, name: newCanonicalId, route: '/canvas/' + newCanonicalId })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to rename page: ${err.message}` })
      }
      return
    }

    // PUT /reorder-pages — save page order for a canvas folder
    if (routePath === '/reorder-pages' && method === 'PUT') {
      const { folder, order } = body

      if (!folder || !Array.isArray(order)) {
        sendJson(res, 400, { error: 'folder (string) and order (array) are required' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const folderDir = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        meta.pageOrder = order
        writeFolderMeta(folderDir, meta)
        sendJson(res, 200, { success: true })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to save page order: ${err.message}` })
      }
      return
    }

    // GET /page-order?folder=... — read page order for a folder
    if (routePath.startsWith('/page-order') && method === 'GET') {
      const pageOrderUrl = new URL(routePath, 'http://localhost')
      const folder = pageOrderUrl.searchParams.get('folder')

      if (!folder) {
        sendJson(res, 400, { error: 'folder query parameter is required' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const folderDir = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        sendJson(res, 200, { order: meta?.pageOrder || null })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read page order: ${err.message}` })
      }
      return
    }

    // PUT /update-folder-meta — update folder .meta.json title
    if (routePath === '/update-folder-meta' && method === 'PUT') {
      const { folder, title } = body

      if (!folder || !title) {
        sendJson(res, 400, { error: 'folder and title are required' })
        return
      }

      const kebab = title
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'title must contain at least one alphanumeric character' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const isFolderSuffix = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
      const folderDir = isFolderSuffix
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        const dirName = path.basename(folderDir).replace(/\.folder$/, '')
        meta.title = title

        // Rename folder directory if the kebab name differs
        const needsRename = kebab !== dirName
        let newDirName = dirName

        if (needsRename) {
          const suffix = isFolderSuffix ? '.folder' : ''
          const newFolderDir = path.join(canvasDir, `${kebab}${suffix}`)
          if (fs.existsSync(newFolderDir)) {
            sendJson(res, 409, { error: `A folder named "${kebab}" already exists` })
            return
          }
          // Write updated meta, rename file to match new dir name, rename dir
          writeFolderMeta(folderDir, meta)
          const metaPath = path.join(folderDir, `${dirName}.meta.json`)
          const newMetaPath = path.join(folderDir, `${kebab}.meta.json`)
          if (newMetaPath !== metaPath) {
            fs.renameSync(metaPath, newMetaPath)
          }
          fs.renameSync(folderDir, newFolderDir)
          newDirName = kebab
        } else {
          writeFolderMeta(folderDir, meta)
        }

        sendJson(res, 200, { success: true, folder: newDirName, renamed: needsRename })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update folder meta: ${err.message}` })
      }
      return
    }

    // POST /duplicate — duplicate an existing canvas page with its widgets
    if (routePath === '/duplicate' && method === 'POST') {
      const { name, newTitle } = body

      if (!name || !newTitle) {
        sendJson(res, 400, { error: 'Canvas name and newTitle are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      const kebab = newTitle
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'newTitle must contain at least one alphanumeric character' })
        return
      }

      try {
        const sourceData = readCanvas(filePath)
        const dir = path.dirname(filePath)
        const newFilename = `${kebab}.canvas.jsonl`
        const newPath = path.join(dir, newFilename)

        if (fs.existsSync(newPath)) {
          sendJson(res, 409, { error: `A canvas file named "${newFilename}" already exists` })
          return
        }

        // Re-ID all widgets to avoid collisions
        const widgets = (sourceData.widgets || []).map(w => ({
          ...w,
          id: generateWidgetId(w.type || 'widget'),
        }))

        const creationEvent = {
          event: 'canvas_created',
          timestamp: new Date().toISOString(),
          title: newTitle,
          grid: sourceData.grid ?? true,
          gridSize: sourceData.gridSize ?? 24,
          colorMode: sourceData.colorMode ?? 'auto',
          widgets,
        }

        writeNewCanvas(newPath, creationEvent)

        const relPath = path.relative(root, newPath).replace(/\\/g, '/')
        const canonicalName = toCanvasId(relPath) || kebab

        sendJson(res, 201, {
          success: true,
          name: canonicalName,
          path: relPath,
          route: `/canvas/${canonicalName}`,
        })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to duplicate canvas: ${err.message}` })
      }
      return
    }

    // POST /create — create a new .canvas.jsonl file
    // Supports `convertFrom` to convert a single-page canvas into a multi-page folder.
    if (routePath === '/create' && method === 'POST') {
      const {
        name,
        title,
        folder,
        convertFrom,
        author,
        description,
        meta,
        grid = true,
        gridSize = 24,
        colorMode = 'auto',
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

      // ── Convert single-page canvas to multi-page folder ──────────────
      if (convertFrom && typeof convertFrom === 'string') {
        // Only allow flat root canvases (no path segments, no proto:)
        if (convertFrom.includes('/') || convertFrom.startsWith('proto:')) {
          sendJson(res, 400, { error: 'convertFrom only supports flat root canvases (no path segments or proto: prefix)' })
          return
        }

        const canvasDir = path.join(root, 'src', 'canvas')
        const existingPath = findCanvasPath(root, convertFrom)
        if (!existingPath) {
          sendJson(res, 404, { error: `Canvas "${convertFrom}" not found` })
          return
        }

        // Verify it's actually a flat file in src/canvas/ (not already in a folder)
        const existingRel = path.relative(canvasDir, existingPath).replace(/\\/g, '/')
        if (existingRel.includes('/')) {
          sendJson(res, 400, { error: `Canvas "${convertFrom}" is already inside a folder` })
          return
        }

        const newDir = path.join(canvasDir, convertFrom)
        const dotFolderDir = path.join(canvasDir, `${convertFrom}.folder`)

        // Preflight: check for collisions
        if (fs.existsSync(newDir)) {
          sendJson(res, 409, { error: `Directory "${convertFrom}" already exists in src/canvas/` })
          return
        }
        if (fs.existsSync(dotFolderDir)) {
          sendJson(res, 409, { error: `Directory "${convertFrom}.folder" already exists in src/canvas/` })
          return
        }

        // Read the existing canvas to extract metadata for .meta.json
        let existingData
        try {
          existingData = readCanvas(existingPath)
        } catch (err) {
          sendJson(res, 500, { error: `Failed to read existing canvas: ${err.message}` })
          return
        }

        const existingBasename = path.basename(existingPath)

        const movedCanvasPath = path.join(newDir, existingBasename)
        const newPagePath = path.join(newDir, `${kebab}.canvas.jsonl`)

        if (existingBasename === `${kebab}.canvas.jsonl`) {
          sendJson(res, 409, { error: `New page name "${kebab}" collides with existing canvas filename` })
          return
        }

        // Perform the conversion with rollback on failure
        const rollbackOps = []
        try {
          // 1. Create the directory
          fs.mkdirSync(newDir, { recursive: true })
          rollbackOps.push(() => { try { fs.rmdirSync(newDir) } catch { /* ignore */ } })

          // 2. Move the existing canvas file
          fs.renameSync(existingPath, movedCanvasPath)
          rollbackOps.push(() => { try { fs.renameSync(movedCanvasPath, existingPath) } catch { /* ignore */ } })

          // 3. Write .meta.json with metadata from the existing canvas
          const metaObj = { title: existingData?.title || convertFrom }
          if (existingData?.description) metaObj.description = existingData.description
          if (existingData?.author) metaObj.author = existingData.author
          const metaPath = path.join(newDir, `${convertFrom}.meta.json`)
          fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2) + '\n', 'utf-8')
          rollbackOps.push(() => { try { fs.unlinkSync(metaPath) } catch { /* ignore */ } })

          // 4. Create the new page
          const creationEvent = {
            event: 'canvas_created',
            timestamp: new Date().toISOString(),
            title: title || kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            grid,
            gridSize,
            colorMode,
            widgets: [],
          }
          writeNewCanvas(newPagePath, creationEvent)

          const relPath = path.relative(root, newPagePath).replace(/\\/g, '/')
          const canonicalName = toCanvasId(relPath) || kebab

          sendJson(res, 201, {
            success: true,
            converted: true,
            name: canonicalName,
            path: relPath,
            route: `/canvas/${canonicalName}`,
          })
        } catch (err) {
          // Rollback in reverse order
          for (let i = rollbackOps.length - 1; i >= 0; i--) {
            rollbackOps[i]()
          }
          sendJson(res, 500, { error: `Failed to convert canvas to folder: ${err.message}` })
        }
        return
      }

      // ── Standard canvas creation ─────────────────────────────────────
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

    // GET /github/available — check if gh CLI is installed locally
    if (routePath === '/github/available' && method === 'GET') {
      sendJson(res, 200, {
        available: isGhCliAvailable(),
        installUrl: GH_INSTALL_URL,
      })
      return
    }

    // POST /github/embed — fetch metadata for GitHub issue/discussion/comment links
    if (routePath === '/github/embed' && method === 'POST') {
      const rawUrl = typeof body?.url === 'string' ? body.url.trim() : ''

      if (!rawUrl) {
        sendJson(res, 400, { code: 'invalid_url', error: 'url is required' })
        return
      }

      if (!isGitHubEmbedUrl(rawUrl)) {
        sendJson(res, 400, {
          code: 'unsupported_url',
          error: 'Only GitHub issue, discussion, and comment URLs are supported.',
        })
        return
      }

      try {
        const snapshot = fetchGitHubEmbedSnapshot(rawUrl)
        sendJson(res, 200, { success: true, snapshot })
      } catch (error) {
        if (error instanceof GitHubEmbedError) {
          sendJson(res, error.status ?? 500, {
            code: error.code,
            error: error.message,
            installUrl: error.code === 'gh_unavailable' ? GH_INSTALL_URL : undefined,
          })
          return
        }

        sendJson(res, 500, {
          code: 'gh_fetch_failed',
          error: error?.message || 'Failed to fetch GitHub metadata.',
        })
      }
      return
    }

    // ── Image routes ──────────────────────────────────────────────────

    const imagesDir = path.join(root, 'assets', 'canvas', 'images')
    const snapshotsDir = path.join(root, 'assets', 'canvas', 'snapshots')

    const MIME_TO_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
    const EXT_TO_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

    // Route snapshot uploads (snapshot-* prefix) to the snapshots directory
    function resolveWriteDir(canvasName) {
      return canvasName?.startsWith('snapshot-') ? snapshotsDir : imagesDir
    }

    function resolveImagePath(filename) {
      // Check snapshots dir first, then images
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
      const prefix = canvasName ? `${canvasName.replace(/[/:]/g, '--')}--` : ''

      // Support explicit filename for snapshot uploads (stable naming)
      const explicitName = body.filename
      let filename
      if (explicitName && /^snapshot-[a-z0-9_-]+--(latest|light|dark)\.webp$/i.test(explicitName)) {
        filename = explicitName
      } else {
        filename = `${prefix}${dateStr}.${ext}`
      }
      const targetDir = resolveWriteDir(canvasName || '')

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
      // Strip query string (e.g. ?v=123 cache busters) from filename
      let filename = routePath.slice('/images/'.length)
      const qIdx = filename.indexOf('?')
      if (qIdx !== -1) filename = filename.slice(0, qIdx)

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
