/**
 * Storyboard Server Plugin — core dev-server infrastructure.
 *
 * Always-on Vite plugin that mounts a middleware backbone at `/_storyboard/`.
 * Reads `storyboard.config.json` for workshop features and plugin config.
 * Workshop API routes are wired directly; plugins register via the registry.
 *
 * Usage in vite.config.js:
 *   import storyboardServer from '@dfosco/storyboard-core/vite/server'
 *   storyboardServer()  // reads storyboard.config.json, no args needed
 */

import fs from 'node:fs'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'
import { serverFeatures as workshopFeatures } from '../workshop/features/registry-server.js'
import { docsHandler, collectFiles } from './docs-handler.js'
import { createCanvasHandler } from '../canvas/server.js'

const API_PREFIX = '/_storyboard/'

/**
 * Parse JSON request body from an IncomingMessage.
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (!body) return resolve({})
      try { resolve(JSON.parse(body)) }
      catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

/**
 * Send a JSON response.
 */
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/**
 * Read storyboard.config.json from the project root.
 */
function readConfig(root) {
  const configPath = path.join(root, 'storyboard.config.json')
  if (!fs.existsSync(configPath)) return {}
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return parseJsonc(raw) || {}
  } catch {
    return {}
  }
}

/**
 * Core storyboard server Vite plugin.
 */
export default function storyboardServer() {
  let root = ''
  let base = '/'
  let config = {}
  let isDev = false

  // Route handler registry — plugins register here during setup
  const routeHandlers = new Map()
  const clientScripts = []

  return {
    name: 'storyboard-server',

    configResolved(viteConfig) {
      root = viteConfig.root
      base = viteConfig.base || '/'
      config = readConfig(root)
      isDev = viteConfig.command === 'serve'
    },

    configureServer(server) {
      const workshopConfig = config.workshop || {}
      const enabledFeatures = workshopConfig.features || {}

      // Wire workshop API routes — compose handlers from all enabled features
      const workshopHandlers = []
      for (const [featureName, featureModule] of Object.entries(workshopFeatures)) {
        if (enabledFeatures[featureName] === false) continue
        if (featureModule.serverSetup) {
          workshopHandlers.push(featureModule.serverSetup({ root, sendJson, workshopConfig }))
        }
      }
      if (workshopHandlers.length > 0) {
        routeHandlers.set('workshop', async (req, res, ctx) => {
          for (const handler of workshopHandlers) {
            await handler(req, res, ctx)
            if (res.writableEnded) return
          }
          sendJson(res, 404, { error: `Unknown workshop route: ${ctx.method} ${ctx.path}` })
        })
      }

      // Wire docs API routes (always enabled — serves README + source files)
      routeHandlers.set('docs', docsHandler({ root, sendJson }))

      // Wire canvas API routes (always enabled — CRUD for .canvas.jsonl files)
      routeHandlers.set('canvas', createCanvasHandler({ root, sendJson }))

      // Watch toolbar.config.json for changes — trigger full reload so
      // CoreUIBar.svelte picks up menu/mode config changes during dev
      const toolbarConfigPath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../toolbar.config.json'
      )
      server.watcher.add(toolbarConfigPath)
      server.watcher.on('change', (filePath) => {
        if (path.resolve(filePath) === toolbarConfigPath) {
          // Invalidate the cached JSON module so Vite re-reads from disk
          const mods = server.moduleGraph.getModulesByFile(toolbarConfigPath)
          if (mods) {
            for (const mod of mods) {
              server.moduleGraph.invalidateModule(mod)
            }
          }
          server.ws.send({ type: 'full-reload' })
        }
      })

      // Workshop client UI is now mounted by mountStoryboardCore() via the
      // compiled UI bundle. No script injection needed.

      // Plugin registry for external plugins (future use).
      // Plugins call registerRoutes/registerClientScript in their setup().
      // const pluginCtx = { server, root, config, registerRoutes, registerClientScript }
      // Future: auto-discover and initialize plugins from pluginsConfig here

      // Mount the /_storyboard/ middleware router
      // Vite's dev server strips the base path from req.url for middleware,
      // but the base-redirect plugin may redirect bare URLs first.
      // We check both with and without base prefix.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        // Strip base path if present to normalize the URL
        let url = req.url
        const baseNoTrail = base.replace(/\/$/, '')
        if (baseNoTrail && url.startsWith(baseNoTrail)) {
          url = url.slice(baseNoTrail.length) || '/'
        }

        if (!url.startsWith(API_PREFIX)) return next()

        // Parse: /_storyboard/{prefix}/{rest}
        const pathAfterPrefix = url.slice(API_PREFIX.length)
        const slashIndex = pathAfterPrefix.indexOf('/')
        const prefix = slashIndex === -1 ? pathAfterPrefix : pathAfterPrefix.slice(0, slashIndex)
        const restPath = slashIndex === -1 ? '/' : pathAfterPrefix.slice(slashIndex)

        const handler = routeHandlers.get(prefix)
        if (!handler) {
          sendJson(res, 404, { error: `No handler registered for prefix: ${prefix}` })
          return
        }

        try {
          let body = {}
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
            body = await parseJsonBody(req)
          }
          await handler(req, res, { body, path: restPath, method: req.method })
        } catch (err) {
          console.error(`[storyboard-server] Error in ${prefix}:`, err)
          sendJson(res, 500, { error: err.message || 'Internal server error' })
        }
      })
    },

    transformIndexHtml() {
      const tags = []

      // Inject local dev flag only during dev server (not production builds)
      if (isDev) {
        tags.push({
          tag: 'script',
          children: 'window.__SB_LOCAL_DEV__=true',
          injectTo: 'head',
        })
      }

      // Inject base path so the inspector UI can resolve static assets
      // (e.g. inspector.json) when deployed under a subpath
      tags.push({
        tag: 'script',
        children: `window.__STORYBOARD_BASE_PATH__=${JSON.stringify(base)}`,
        injectTo: 'head',
      })

      for (const src of clientScripts) {
        tags.push({
          tag: 'script',
          attrs: { type: 'module', src: base + src.replace(/^\//, '') },
          injectTo: 'body',
        })
      }

      return tags
    },

    // Build-time: emit a static JSON with source files so the inspector
    // works in deployed environments without the dev middleware.
    async generateBundle() {
      const srcDir = path.join(root, 'src')
      const prototypesDir = path.join(root, 'src', 'prototypes')

      // Collect file lists (prototypes for the files index, all src/ for sources)
      const [prototypeFiles, allSrcFiles] = await Promise.all([
        collectFiles(prototypesDir, root),
        collectFiles(srcDir, root),
      ])

      // Read all source file contents
      const sources = {}
      await Promise.all(
        allSrcFiles.map(async (relPath) => {
          try {
            sources[relPath] = await fs.promises.readFile(
              path.join(root, relPath),
              'utf-8'
            )
          } catch { /* skip unreadable files */ }
        })
      )

      // Resolve repo info (same logic as docs-handler)
      let repo = null
      try {
        const { execSync } = await import('node:child_process')
        const remote = execSync('git remote get-url origin', {
          cwd: root,
          encoding: 'utf-8',
        }).trim()
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
        if (match) repo = { owner: match[1], name: match[2] }
      } catch { /* no git or no remote */ }

      if (!repo) {
        const configPath = path.join(root, 'storyboard.config.json')
        try {
          const raw = await fs.promises.readFile(configPath, 'utf-8')
          const cfg = JSON.parse(raw)
          if (cfg.repository?.owner && cfg.repository?.name) {
            repo = { owner: cfg.repository.owner, name: cfg.repository.name }
          }
        } catch { /* config not available */ }
      }

      this.emitFile({
        type: 'asset',
        fileName: '_storyboard/inspector.json',
        source: JSON.stringify({
          files: prototypeFiles.sort(),
          sources,
          repo,
        }),
      })

      // GitHub Pages uses Jekyll which ignores _-prefixed directories.
      // Emit .nojekyll to ensure _storyboard/ is served.
      this.emitFile({
        type: 'asset',
        fileName: '.nojekyll',
        source: '',
      })
    },
  }
}

export { sendJson }
