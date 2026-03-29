/**
 * Workshop API — prototype creation and listing.
 *
 * Routes (mounted at /_storyboard/workshop/):
 *   GET  /prototypes  — list available folders and partials
 *   POST /prototypes  — create a new prototype (dir + metadata + page + optional flow)
 *
 * Recipes are defined in storyboard.config.json under workshop.partials.
 * Each entry has { type, name, globals? } where:
 *   - directory: "recipe" or "template" — maps to src/recipes/ or src/templates/
 *   - name: subdirectory name containing the component file
 *   - globals: optional array of $global names for prototype.json
 *
 * The server auto-discovers the main *.jsx or *.tsx component file
 * in that directory and generates the appropriate index.jsx import.
 */

import fs from 'node:fs'
import path from 'node:path'

const FLOW_SKELETON = JSON.stringify({ $global: [] }, null, 2) + '\n'

/** Map partial directory value → source directory name */
const DIR_MAP = {
  recipe: 'recipes',
  template: 'templates',
}

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

function toPascalCase(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function humanize(kebab) {
  return toPascalCase(kebab).replace(/([A-Z])/g, ' $1').trim()
}

function validatePrototypeName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Prototype name is required' }
  }

  const kebab = toKebabCase(name.trim())

  if (!kebab) {
    return { valid: false, error: 'Name must contain at least one alphanumeric character' }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebab)) {
    return { valid: false, error: 'Name must be kebab-case (lowercase letters, numbers, and hyphens)' }
  }

  const reserved = ['index', 'app', '_app']
  if (reserved.includes(kebab)) {
    return { valid: false, error: `"${kebab}" is a reserved name` }
  }

  return { valid: true, kebab }
}

function listFolders(root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  if (!fs.existsSync(prototypesDir)) return []

  return fs.readdirSync(prototypesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('.folder'))
    .map((d) => d.name.replace('.folder', ''))
}

/**
 * Find the main component file (*.jsx or *.tsx) in a recipe/template directory.
 * Returns the filename without extension, or null if not found.
 */
function findComponentFile(dir) {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
  const component = files.find((f) => /\.(jsx|tsx)$/.test(f) && !f.startsWith('_') && !f.includes('.test.'))
  return component ? component.replace(/\.(jsx|tsx)$/, '') : null
}

/**
 * Generate a blank React component (no template/recipe).
 */
function generateBlankIndexJsx(componentName, title) {
  return `export default function ${componentName}() {
  return (
    <div>
      <h1>${title}</h1>
      <p>Start building your prototype here.</p>
    </div>
  )
}
`
}

/**
 * Generate the index.jsx content for a new prototype.
 *
 * @param {object} partialEntry - Config entry { type, name }
 * @param {string} componentFile - Component filename without extension
 * @param {string} componentName - PascalCase name for the new prototype
 * @param {string} title - Human-readable title
 */
function generateIndexJsx({ partialEntry, componentFile, componentName, title }) {
  const typeDir = DIR_MAP[partialEntry.directory]
  const importPath = `@/${typeDir}/${partialEntry.name}/${componentFile}`

  if (partialEntry.directory === 'template') {
    return `import ${componentFile} from '${importPath}'

export default function ${componentName}() {
  return (
    <${componentFile} title="${title}">
      <h1>${title}</h1>
      <p>Start building your prototype here.</p>
    </${componentFile}>
  )
}
`
  }

  // recipe
  return `import ${componentFile} from '${importPath}'

export default function ${componentName}() {
  return (
    <${componentFile}>
      <h1>${title}</h1>
      <p>Start building your prototype here.</p>
    </${componentFile}>
  )
}
`
}

function generatePrototypeJson({ title, author, description, partialEntry }) {
  const meta = { title }
  if (author) {
    meta.author = author.split(',').map((a) => a.trim()).filter(Boolean)
  }
  if (description) {
    meta.description = description
  }

  const json = { meta }

  if (partialEntry?.globals?.length) {
    json.$global = partialEntry.globals
  }

  return JSON.stringify(json, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Create the prototypes API route handler.
 * @param {object} ctx - Server context ({ root, sendJson, workshopConfig })
 */
export function createPrototypesHandler(ctx) {
  const { root, sendJson, workshopConfig = {} } = ctx
  const partials = workshopConfig.partials || []

  return async (req, res, { body, path: routePath, method }) => {
    if (routePath === '/prototypes' && method === 'GET') {
      const folders = listFolders(root)
      sendJson(res, 200, { folders, partials })
      return
    }

    if (routePath === '/prototypes' && method === 'POST') {
      const {
        name,
        title: customTitle,
        folder,
        partial: partialName,
        author,
        description,
        createFlow = false,
      } = body

      // Validate name
      const validation = validatePrototypeName(name)
      if (!validation.valid) {
        sendJson(res, 400, { error: validation.error })
        return
      }

      const { kebab } = validation
      const componentName = toPascalCase(kebab)
      const title = customTitle || humanize(kebab)

      // Look up recipe in config (optional — blank prototype if none)
      const partialEntry = partialName
        ? partials.find((r) => r.name === partialName)
        : null

      if (partialName && !partialEntry) {
        const validNames = partials.map((r) => r.name).join(', ')
        sendJson(res, 400, { error: `Unknown recipe "${partialName}". Available: ${validNames}` })
        return
      }

      let content

      if (!partialEntry) {
        // Blank prototype — no template
        content = generateBlankIndexJsx(componentName, title)
      } else {
        // Discover the component file from the recipe/template directory
        const typeDir = DIR_MAP[partialEntry.directory]
        if (!typeDir) {
          sendJson(res, 400, { error: `Invalid directory "${partialEntry.directory}". Must be "recipe" or "template".` })
          return
        }

        const partialDir = path.join(root, 'src', typeDir, partialEntry.name)
        const componentFile = findComponentFile(partialDir)
        if (!componentFile) {
          sendJson(res, 400, { error: `No .jsx or .tsx file found in src/${typeDir}/${partialEntry.name}/` })
          return
        }

        content = generateIndexJsx({ partialEntry, componentFile, componentName, title })
      }

      // Determine target directory
      const prototypesDir = path.join(root, 'src', 'prototypes')
      let targetDir

      if (folder) {
        const folderDir = path.join(prototypesDir, `${folder}.folder`)
        if (!fs.existsSync(folderDir)) {
          sendJson(res, 400, { error: `Folder "${folder}" does not exist` })
          return
        }
        targetDir = path.join(folderDir, kebab)
      } else {
        targetDir = path.join(prototypesDir, kebab)
      }

      if (fs.existsSync(targetDir)) {
        sendJson(res, 409, { error: `Prototype "${kebab}" already exists` })
        return
      }

      // Create directory
      fs.mkdirSync(targetDir, { recursive: true })

      // Write prototype.json
      const protoJsonName = `${kebab}.prototype.json`
      fs.writeFileSync(
        path.join(targetDir, protoJsonName),
        generatePrototypeJson({ title, author, description, partialEntry }),
      )

      // Write index.jsx
      fs.writeFileSync(path.join(targetDir, 'index.jsx'), content, 'utf-8')

      const relDir = targetDir.replace(root + '/', '')
      const result = {
        success: true,
        path: relDir,
        route: `/${kebab}`,
        files: [
          `${relDir}/${protoJsonName}`,
          `${relDir}/index.jsx`,
        ],
      }

      // Optionally create flow.json
      if (createFlow) {
        const flowName = `${kebab}.flow.json`
        const flowPath = path.join(targetDir, flowName)
        fs.writeFileSync(flowPath, FLOW_SKELETON, 'utf-8')
        result.files.push(`${relDir}/${flowName}`)
        result.flowPath = `${relDir}/${flowName}`
      }

      sendJson(res, 201, result)
      return
    }

    // Unmatched routes fall through — the server plugin compositor handles 404
  }
}
