/**
 * Workshop API — page creation and listing.
 *
 * Routes (mounted at /_storyboard/workshop/):
 *   GET  /pages  — list existing pages
 *   POST /pages  — create a new page (+ optional scene)
 */

import fs from 'node:fs'
import path from 'node:path'

const SCENE_SKELETON = JSON.stringify({ $global: [] }, null, 2) + '\n'

/**
 * Convert a raw name to PascalCase for use as component name + filename.
 * "my cool page" → "MyCoolPage"
 */
function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/**
 * Validate a page name.
 */
function validatePageName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Page name is required' }
  }

  const pascalName = toPascalCase(name.trim())

  if (!pascalName) {
    return { valid: false, error: 'Page name must contain at least one alphanumeric character' }
  }

  if (/^[0-9]/.test(pascalName)) {
    return { valid: false, error: 'Page name cannot start with a number' }
  }

  const reserved = ['_app', 'index', 'App', 'Index']
  if (reserved.includes(pascalName)) {
    return { valid: false, error: `"${pascalName}" is a reserved page name` }
  }

  return { valid: true, pascalName }
}

/**
 * Read a template file and replace {{PageName}} placeholders.
 */
function renderTemplate(templatesDir, templateName, pageName) {
  const tplPath = path.join(templatesDir, `${templateName}.html`)
  if (!fs.existsSync(tplPath)) {
    throw new Error(`Template not found: ${templateName}`)
  }
  const tpl = fs.readFileSync(tplPath, 'utf-8')
  return tpl.replaceAll('{{PageName}}', pageName)
}

/**
 * List all existing page files in src/pages/.
 */
function listPages(root) {
  const pagesDir = path.join(root, 'src', 'pages')
  if (!fs.existsSync(pagesDir)) return []

  return fs.readdirSync(pagesDir)
    .filter((f) => f.endsWith('.jsx') && !f.startsWith('_'))
    .map((f) => {
      const name = f.replace('.jsx', '')
      const route = name === 'index' ? '/' : `/${name}`
      return { name, file: f, route }
    })
}

/**
 * Create the pages API route handler.
 * @param {object} ctx - Server context ({ root, sendJson })
 * @param {string} templatesDir - Absolute path to templates directory
 */
export function createPagesHandler(ctx, templatesDir) {
  const { root, sendJson } = ctx

  return async (req, res, { body, path: routePath, method }) => {
    if (routePath === '/pages' && method === 'GET') {
      const pages = listPages(root)
      sendJson(res, 200, { pages })
      return
    }

    if (routePath === '/pages' && method === 'POST') {
      const { name, template = 'blank', createScene = true } = body

      const validation = validatePageName(name)
      if (!validation.valid) {
        sendJson(res, 400, { error: validation.error })
        return
      }

      const { pascalName } = validation
      const pagesDir = path.join(root, 'src', 'pages')
      const pagePath = path.join(pagesDir, `${pascalName}.jsx`)

      if (fs.existsSync(pagePath)) {
        sendJson(res, 409, { error: `Page "${pascalName}" already exists` })
        return
      }

      let content
      try {
        content = renderTemplate(templatesDir, template, pascalName)
      } catch (err) {
        sendJson(res, 400, { error: err.message })
        return
      }

      fs.mkdirSync(pagesDir, { recursive: true })
      fs.writeFileSync(pagePath, content, 'utf-8')

      const result = {
        success: true,
        path: `src/pages/${pascalName}.jsx`,
        route: `/${pascalName}`,
      }

      if (createScene) {
        const dataDir = path.join(root, 'src', 'data')
        const scenePath = path.join(dataDir, `${pascalName}.scene.json`)

        if (!fs.existsSync(scenePath)) {
          fs.mkdirSync(dataDir, { recursive: true })
          fs.writeFileSync(scenePath, SCENE_SKELETON, 'utf-8')
          result.scenePath = `src/data/${pascalName}.scene.json`
        }
      }

      sendJson(res, 201, result)
      return
    }

    sendJson(res, 404, { error: `Unknown route: ${method} ${routePath}` })
  }
}
