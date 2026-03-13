import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { globSync } from 'glob'
import { parse as parseJsonc } from 'jsonc-parser'

const VIRTUAL_MODULE_ID = 'virtual:storyboard-data-index'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

const GLOB_PATTERN = '**/*.{flow,scene,object,record,prototype,folder}.{json,jsonc}'

/**
 * Extract the data name and type suffix from a file path.
 * Flows and records inside src/prototypes/{Name}/ get prefixed with the
 * prototype name (e.g. "Dashboard/default"). Objects are never prefixed.
 * Directories ending in .folder/ are skipped when extracting prototype scope.
 *
 * e.g. "src/data/default.flow.json"                → { name: "default",           suffix: "flow" }
 *      "src/prototypes/Dashboard/default.flow.json" → { name: "Dashboard/default", suffix: "flow" }
 *      "src/prototypes/Dashboard/helpers.object.json"→ { name: "helpers",           suffix: "object" }
 *      "src/prototypes/X.folder/Dashboard/default.flow.json" → { name: "Dashboard/default", suffix: "flow", folder: "X" }
 */
function parseDataFile(filePath) {
  const base = path.basename(filePath)
  const match = base.match(/^(.+)\.(flow|scene|object|record|prototype|folder)\.(jsonc?)$/)
  if (!match) return null

  // Skip _-prefixed files (drafts/internal)
  if (match[1].startsWith('_')) return null

  // Skip files inside _-prefixed directories
  const normalized = filePath.replace(/\\/g, '/')
  if (normalized.split('/').some(seg => seg.startsWith('_'))) return null
  // Normalize .scene → .flow for backward compatibility
  const suffix = match[2] === 'scene' ? 'flow' : match[2]
  let name = match[1]

  // Detect if this file is inside a .folder/ directory
  const folderDirMatch = normalized.match(/(?:^|\/)src\/prototypes\/([^/]+)\.folder\//)
  const folderName = folderDirMatch ? folderDirMatch[1] : null

  // Folder metadata files are keyed by their folder directory name (sans .folder suffix)
  if (suffix === 'folder') {
    if (folderName) {
      name = folderName
    }
    return { name, suffix, ext: match[3] }
  }

  // Prototype metadata files are keyed by their prototype directory name
  // (skip .folder/ segments when determining prototype name)
  if (suffix === 'prototype') {
    const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/(?:[^/]+\.folder\/)?([^/]+)\//)
    if (protoMatch) {
      name = protoMatch[1]
    }
    return { name, suffix, ext: match[3], folder: folderName }
  }

  // Scope flows and records inside src/prototypes/{Name}/ with a prefix
  // (skip .folder/ segments when determining prototype name)
  if (suffix !== 'object') {
    const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/(?:[^/]+\.folder\/)?([^/]+)\//)
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
 * Look up the most recent commit date for any file in a directory.
 * Returns an ISO 8601 timestamp, or null if unavailable.
 */
function getLastModified(root, dirPath) {
  try {
    const result = execSync(
      `git log -1 --format="%aI" -- "${dirPath}"`,
      { cwd: root, encoding: 'utf-8', timeout: 5000 },
    ).trim()
    return result || null
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

  // Detect nested .folder/ directories (not supported)
  // Scan directories directly since empty nested folders have no data files
  const folderDirs = globSync('src/prototypes/**/*.folder', { cwd: root, ignore, absolute: false })
  for (const dir of folderDirs) {
    const normalized = dir.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(s => s.endsWith('.folder'))
    if (segments.length > 1) {
      throw new Error(
        `[storyboard-data] Nested .folder directories are not supported.\n` +
        `  Found at: ${dir}\n` +
        `  Folders can only be one level deep inside src/prototypes/.`
      )
    }
  }

  const index = { flow: {}, object: {}, record: {}, prototype: {}, folder: {} }
  const seen = {} // "name.suffix" → absolute path (for duplicate detection)
  const protoFolders = {} // prototype name → folder name (for injection)

  for (const relPath of files) {
    const parsed = parseDataFile(relPath)
    if (!parsed) continue

    const key = `${parsed.name}.${parsed.suffix}`
    const absPath = path.resolve(root, relPath)

    if (seen[key]) {
      const hint = parsed.suffix === 'object'
        ? '  Objects are globally scoped — even inside src/prototypes/ they share a single namespace.\n' +
          '  Rename one of the files to avoid the collision.'
        : parsed.suffix === 'folder'
          ? '  Folder names must be unique across the project.'
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

    // Track which folder a prototype belongs to
    if (parsed.suffix === 'prototype' && parsed.folder) {
      protoFolders[parsed.name] = parsed.folder
    }
  }

  return { index, protoFolders }
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
 * Returns the full config object { modes, tools }.
 * Falls back to hardcoded defaults if not found.
 */
function readModesConfig(root) {
  const fallback = {
    modes: [
      { name: 'prototype', label: 'Navigate' },
      { name: 'inspect', label: 'Develop' },
      { name: 'present', label: 'Collaborate' },
      { name: 'plan', label: 'Canvas' },
    ],
    tools: {},
  }

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
        return { modes: parsed.modes, tools: parsed.tools ?? {} }
      }
    } catch {
      // try next candidate
    }
  }

  return fallback
}

function generateModule({ index, protoFolders }, root) {
  const declarations = []
  const INDEX_KEYS = ['flow', 'object', 'record', 'prototype', 'folder']
  const entries = { flow: [], object: [], record: [], prototype: [], folder: [] }
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

      // Auto-fill lastModified from git history for prototypes
      if (suffix === 'prototype' && parsed) {
        const protoDir = path.dirname(absPath)
        const lastModified = getLastModified(root, protoDir)
        if (lastModified) {
          parsed = { ...parsed, lastModified }
        }
      }

      // Inject folder association into prototype metadata
      if (suffix === 'prototype' && protoFolders[name]) {
        parsed = { ...parsed, folder: protoFolders[name] }
      }

      declarations.push(`const ${varName} = ${JSON.stringify(parsed)}`)
      entries[suffix].push(`  ${JSON.stringify(name)}: ${varName}`)
    }
  }

  const imports = [`import { init } from '@dfosco/storyboard-core'`]
  const initCalls = [`init({ flows, objects, records, prototypes, folders })`]

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
    imports.push(`import { initModesConfig, registerMode, syncModeClasses, initTools } from '@dfosco/storyboard-core'`)
    initCalls.push(`initModesConfig(${JSON.stringify(config.modes)})`)

    if (config.modes.enabled) {
      imports.push(`import '@dfosco/storyboard-core/modes.css'`)

      const modesConfig = readModesConfig(root)
      const modes = config.modes.defaults || modesConfig.modes
      for (const m of modes) {
        initCalls.push(`registerMode(${JSON.stringify(m.name)}, { label: ${JSON.stringify(m.label)} })`)
      }

      // Seed tool registry from modes.config.json
      if (Object.keys(modesConfig.tools).length > 0) {
        initCalls.push(`initTools(${JSON.stringify(modesConfig.tools)})`)
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
    `const folders = {\n${entries.folder.join(',\n')}\n}`,
    '',
    '// Backward-compatible alias',
    'const scenes = flows',
    '',
    initCalls.join('\n'),
    '',
    `export { flows, scenes, objects, records, prototypes, folders }`,
    `export const index = { flows, scenes, objects, records, prototypes, folders }`,
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
  let buildResult = null

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
      if (!buildResult) buildResult = buildIndex(root)
      return generateModule(buildResult, root)
    },

    configureServer(server) {
      // Watch for data file changes in dev mode
      const watcher = server.watcher

      const invalidate = (filePath) => {
        const parsed = parseDataFile(filePath)
        // Also invalidate when files are added/removed inside .folder/ directories
        const inFolder = filePath.replace(/\\/g, '/').includes('.folder/')
        if (!parsed && !inFolder) return
        // Rebuild index and invalidate virtual module
        buildResult = null
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
          buildResult = null
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
      buildResult = null
    },
  }
}
