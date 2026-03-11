import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { globSync } from 'glob'
import { parse as parseJsonc } from 'jsonc-parser'

const VIRTUAL_MODULE_ID = 'virtual:storyboard-data-index'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

const GLOB_PATTERN = '**/*.{flow,scene,object,record,prototype}.{json,jsonc}'

/**
 * Extract the data name and type suffix from a file path.
 * Flows and records inside src/prototypes/{Name}/ get prefixed with the
 * prototype name (e.g. "Dashboard/default"). Objects are never prefixed.
 *
 * e.g. "src/data/default.flow.json"                → { name: "default",           suffix: "flow" }
 *      "src/prototypes/Dashboard/default.flow.json" → { name: "Dashboard/default", suffix: "flow" }
 *      "src/prototypes/Dashboard/helpers.object.json"→ { name: "helpers",           suffix: "object" }
 */
function parseDataFile(filePath) {
  const base = path.basename(filePath)
  const match = base.match(/^(.+)\.(flow|scene|object|record|prototype)\.(jsonc?)$/)
  if (!match) return null
  // Normalize .scene → .flow for backward compatibility
  const suffix = match[2] === 'scene' ? 'flow' : match[2]
  let name = match[1]

  // Prototype metadata files are keyed by their prototype directory name
  if (suffix === 'prototype') {
    const normalized = filePath.replace(/\\/g, '/')
    const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/([^/]+)\//)
    if (protoMatch) {
      name = protoMatch[1]
    }
    return { name, suffix, ext: match[3] }
  }

  // Scope flows and records inside src/prototypes/{Name}/ with a prefix
  if (suffix !== 'object') {
    const normalized = filePath.replace(/\\/g, '/')
    const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/([^/]+)\//)
    if (protoMatch) {
      name = `${protoMatch[1]}/${name}`
    }
  }

  return { name, suffix, ext: match[3] }
}

/**
 * Look up the git author who first created a file.
 * Used to auto-fill the author field in .prototype.json when missing.
 */
function getGitAuthor(root, filePath) {
  try {
    const result = execSync(
      `git log --follow --diff-filter=A --format="%aN" -- "${filePath}"`,
      { cwd: root, encoding: 'utf-8', timeout: 5000 },
    ).trim()
    const lines = result.split('\n').filter(Boolean)
    return lines.length > 0 ? lines[lines.length - 1] : null
  } catch {
    return null
  }
}

/**
 * Scan the repo for all data files, validate uniqueness, return the index.
 */
function buildIndex(root) {
  const ignore = ['node_modules/**', 'dist/**', '.git/**']
  const files = globSync(GLOB_PATTERN, { cwd: root, ignore, absolute: false })

  const index = { flow: {}, object: {}, record: {}, prototype: {} }
  const seen = {} // "name.suffix" → absolute path (for duplicate detection)

  for (const relPath of files) {
    const parsed = parseDataFile(relPath)
    if (!parsed) continue

    const key = `${parsed.name}.${parsed.suffix}`
    const absPath = path.resolve(root, relPath)

    if (seen[key]) {
      const hint = parsed.suffix === 'object'
        ? '  Objects are globally scoped — even inside src/prototypes/ they share a single namespace.\n' +
          '  Rename one of the files to avoid the collision.'
        : '  Flows and records are scoped to their prototype directory.\n' +
          '  If both files are global (outside src/prototypes/), rename one to avoid the collision.'

      throw new Error(
        `[storyboard-data] Duplicate ${parsed.suffix} "${parsed.name}"\n` +
        `  Found at: ${seen[key]}\n` +
        `  And at:   ${absPath}\n` +
        hint
      )
    }

    seen[key] = absPath
    index[parsed.suffix][parsed.name] = absPath
  }

  return index
}

/**
 * Generate the virtual module source code.
 * Reads each data file, parses JSONC at build time, and emits pre-parsed
 * JavaScript objects — no runtime parsing needed.
 */
/**
 * Read storyboard.config.json from the project root (if it exists).
 * Returns the parsed config object, or null if not found.
 */
function readConfig(root) {
  const configPath = path.resolve(root, 'storyboard.config.json')
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const errors = []
    const config = parseJsonc(raw, errors)
    // Treat malformed JSON (e.g. mid-edit partial saves) as missing config
    if (errors.length > 0) return { config: null, configPath }
    return { config, configPath }
  } catch {
    return { config: null, configPath }
  }
}

/**
 * Read modes.config.json from @dfosco/storyboard-core.
 * Falls back to the core package's bundled config via require.resolve,
 * or returns hardcoded defaults if not found.
 */
function readModesConfig(root) {
  const fallback = [
    { name: 'prototype', label: 'Navigate' },
    { name: 'inspect', label: 'Develop' },
    { name: 'present', label: 'Collaborate' },
    { name: 'plan', label: 'Canvas' },
  ]

  // Try local workspace path first (monorepo), then node_modules
  const candidates = [
    path.resolve(root, 'packages/core/modes.config.json'),
    path.resolve(root, 'node_modules/@dfosco/storyboard-core/modes.config.json'),
  ]

  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.modes) && parsed.modes.length > 0) {
        return parsed.modes
      }
    } catch {
      // try next candidate
    }
  }

  return fallback
}

function generateModule(index, root) {
  const declarations = []
  const INDEX_KEYS = ['flow', 'object', 'record', 'prototype']
  const entries = { flow: [], object: [], record: [], prototype: [] }
  let i = 0

  for (const suffix of INDEX_KEYS) {
    for (const [name, absPath] of Object.entries(index[suffix])) {
      const varName = `_d${i++}`
      const raw = fs.readFileSync(absPath, 'utf-8')
      let parsed = parseJsonc(raw)

      // Auto-fill gitAuthor for prototype metadata from git history
      if (suffix === 'prototype' && parsed && !parsed.gitAuthor) {
        const gitAuthor = getGitAuthor(root, absPath)
        if (gitAuthor) {
          parsed = { ...parsed, gitAuthor }
        }
      }

      declarations.push(`const ${varName} = ${JSON.stringify(parsed)}`)
      entries[suffix].push(`  ${JSON.stringify(name)}: ${varName}`)
    }
  }

  const imports = [`import { init } from '@dfosco/storyboard-core'`]
  const initCalls = [`init({ flows, objects, records, prototypes })`]

  // Feature flags from storyboard.config.json
  const { config } = readConfig(root)
  if (config?.featureFlags && Object.keys(config.featureFlags).length > 0) {
    imports.push(`import { initFeatureFlags } from '@dfosco/storyboard-core'`)
    initCalls.push(`initFeatureFlags(${JSON.stringify(config.featureFlags)})`)
  }

  // Plugin configuration from storyboard.config.json
  if (config?.plugins && Object.keys(config.plugins).length > 0) {
    imports.push(`import { initPlugins } from '@dfosco/storyboard-core'`)
    initCalls.push(`initPlugins(${JSON.stringify(config.plugins)})`)
  }

  // Modes configuration from storyboard.config.json
  if (config?.modes) {
    imports.push(`import { initModesConfig, registerMode, syncModeClasses } from '@dfosco/storyboard-core'`)
    initCalls.push(`initModesConfig(${JSON.stringify(config.modes)})`)

    if (config.modes.enabled) {
      imports.push(`import '@dfosco/storyboard-core/modes.css'`)

      const modesConfig = readModesConfig(root)
      const modes = config.modes.defaults || modesConfig
      for (const m of modes) {
        initCalls.push(`registerMode(${JSON.stringify(m.name)}, { label: ${JSON.stringify(m.label)} })`)
      }
      initCalls.push(`syncModeClasses()`)
    }
  }

  return [
    imports.join('\n'),
    '',
    declarations.join('\n'),
    '',
    `const flows = {\n${entries.flow.join(',\n')}\n}`,
    `const objects = {\n${entries.object.join(',\n')}\n}`,
    `const records = {\n${entries.record.join(',\n')}\n}`,
    `const prototypes = {\n${entries.prototype.join(',\n')}\n}`,
    '',
    '// Backward-compatible alias',
    'const scenes = flows',
    '',
    initCalls.join('\n'),
    '',
    `export { flows, scenes, objects, records, prototypes }`,
    `export const index = { flows, scenes, objects, records, prototypes }`,
    `export default index`,
  ].join('\n')
}

/**
 * Vite plugin for storyboard data discovery.
 *
 * - Scans the repo for *.flow.json, *.scene.json (compat), *.object.json, *.record.json
 * - Validates no two files share the same name+suffix (hard build error)
 * - Generates a virtual module `virtual:storyboard-data-index`
 * - Watches for file additions/removals in dev mode
 */
export default function storyboardDataPlugin() {
  let root = ''
  let index = null

  return {
    name: 'storyboard-data',
    enforce: 'pre',

    config() {
      return {
        optimizeDeps: {
          exclude: ['@dfosco/storyboard-react'],
        },
      }
    },

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return null
      if (!index) index = buildIndex(root)
      return generateModule(index, root)
    },

    configureServer(server) {
      // Watch for data file changes in dev mode
      const watcher = server.watcher

      const invalidate = (filePath) => {
        const parsed = parseDataFile(filePath)
        if (!parsed) return
        // Rebuild index and invalidate virtual module
        index = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      // Watch storyboard.config.json for changes
      const { configPath } = readConfig(root)
      watcher.add(configPath)
      const invalidateConfig = (filePath) => {
        if (path.resolve(filePath) === configPath) {
          index = null
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        }
      }

      watcher.on('add', invalidate)
      watcher.on('unlink', invalidate)
      watcher.on('change', (filePath) => {
        invalidate(filePath)
        invalidateConfig(filePath)
      })
    },

    // Rebuild index on each build start
    buildStart() {
      index = null
    },
  }
}
