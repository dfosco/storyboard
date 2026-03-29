/**
 * Workshop API — flow creation and listing.
 *
 * Routes (mounted at /_storyboard/workshop/):
 *   GET  /flows  — list prototypes, existing flows, and available objects
 *   POST /flows  — create a new flow file
 */

import fs from 'node:fs'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toKebabCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function humanize(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

function validateFlowName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Flow name is required' }
  }

  const kebab = toKebabCase(name.trim())

  if (!kebab) {
    return { valid: false, error: 'Name must contain at least one alphanumeric character' }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebab)) {
    return { valid: false, error: 'Name must be kebab-case (lowercase letters, numbers, and hyphens)' }
  }

  return { valid: true, kebab }
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'packages'])

/**
 * List prototypes by scanning src/prototypes/, following .folder directories.
 * Returns array of { name, folder? }.
 */
function listPrototypes(root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  if (!fs.existsSync(prototypesDir)) return []

  const results = []

  function scanDir(dir, folder) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name.endsWith('.folder')) {
        scanDir(path.join(dir, entry.name), entry.name.replace('.folder', ''))
      } else {
        const protoDir = path.join(dir, entry.name)
        const hasProtoJson = fs.readdirSync(protoDir).some((f) => f.endsWith('.prototype.json'))
        if (hasProtoJson) {
          results.push({ name: entry.name, ...(folder ? { folder } : {}) })
        }
      }
    }
  }

  scanDir(prototypesDir)
  return results
}

/**
 * List existing flow files from the src/ tree.
 * Returns array of { name, title, path }.
 */
function listFlows(root) {
  const results = []

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        scanDir(path.join(dir, entry.name))
      } else if (/\.flow\.jsonc?$/.test(entry.name)) {
        const flowName = entry.name.replace(/\.flow\.jsonc?$/, '')
        const filePath = path.join(dir, entry.name)
        const relPath = path.relative(root, filePath)

        let title = flowName
        try {
          const raw = fs.readFileSync(filePath, 'utf-8')
          const parsed = parseJsonc(raw)
          if (parsed?.meta?.title) title = parsed.meta.title
        } catch { /* ignore */ }

        results.push({ name: flowName, title, path: relPath })
      }
    }
  }

  scanDir(path.join(root, 'src'))
  return results
}

/**
 * List available object names from the src/ tree.
 */
function listObjects(root) {
  const results = []

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        scanDir(path.join(dir, entry.name))
      } else if (/\.object\.jsonc?$/.test(entry.name)) {
        results.push(entry.name.replace(/\.object\.jsonc?$/, ''))
      }
    }
  }

  scanDir(path.join(root, 'src'))
  return results
}

function generateFlowJson({ title, author, description, globals, sourceData }) {
  let data = sourceData ? { ...sourceData } : {}

  data.meta = {
    ...(sourceData?.meta || {}),
    title,
  }

  if (author) {
    const authors = author.split(',').map((a) => a.trim()).filter(Boolean)
    data.meta.author = authors.length === 1 ? authors[0] : authors
  }

  if (description) {
    data.meta.description = description
  }

  if (globals && globals.length > 0) {
    data.$global = globals
  } else if (!sourceData) {
    data.$global = []
  }

  return JSON.stringify(data, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Create the flows API route handler.
 * @param {object} ctx - Server context ({ root, sendJson, workshopConfig })
 */
export function createFlowsHandler(ctx) {
  const { root, sendJson } = ctx

  return async (req, res, { body, path: routePath, method }) => {
    if (routePath === '/flows' && method === 'GET') {
      const prototypes = listPrototypes(root)
      const flows = listFlows(root)
      const objects = listObjects(root)
      sendJson(res, 200, { prototypes, flows, objects })
      return
    }

    if (routePath === '/flows' && method === 'POST') {
      const {
        name,
        title: customTitle,
        prototype: protoName,
        folder: folderName,
        author,
        description,
        globals = [],
        copyFrom,
      } = body

      // Validate name
      const validation = validateFlowName(name)
      if (!validation.valid) {
        sendJson(res, 400, { error: validation.error })
        return
      }

      const { kebab } = validation
      const title = customTitle || humanize(kebab)

      // Determine target directory
      let targetDir
      if (protoName) {
        const prototypesDir = path.join(root, 'src', 'prototypes')
        if (folderName) {
          targetDir = path.join(prototypesDir, `${folderName}.folder`, protoName)
        } else {
          targetDir = path.join(prototypesDir, protoName)
        }
        if (!fs.existsSync(targetDir)) {
          sendJson(res, 400, { error: `Prototype "${protoName}" not found` })
          return
        }
      } else {
        targetDir = path.join(root, 'src', 'data')
      }

      // Check for existing flow file
      const flowFileName = `${kebab}.flow.json`
      const flowFilePath = path.join(targetDir, flowFileName)
      if (fs.existsSync(flowFilePath)) {
        sendJson(res, 409, { error: `Flow "${kebab}" already exists in this location` })
        return
      }

      // Load source flow data if copying
      let sourceData = null
      if (copyFrom) {
        const sourceFlowPath = path.join(root, copyFrom)
        if (fs.existsSync(sourceFlowPath)) {
          try {
            const raw = fs.readFileSync(sourceFlowPath, 'utf-8')
            sourceData = parseJsonc(raw)
          } catch {
            sendJson(res, 400, { error: `Failed to read source flow: ${copyFrom}` })
            return
          }
        }
      }

      // Ensure target directory exists
      fs.mkdirSync(targetDir, { recursive: true })

      // Generate and write flow file
      const content = generateFlowJson({ title, author, description, globals, sourceData })
      fs.writeFileSync(flowFilePath, content, 'utf-8')

      const relPath = path.relative(root, flowFilePath)
      sendJson(res, 201, {
        success: true,
        path: relPath,
        files: [relPath],
      })
      return
    }

    // Unmatched routes fall through — the server plugin compositor handles 404
  }
}
