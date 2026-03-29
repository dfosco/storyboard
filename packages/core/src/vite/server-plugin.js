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
import { docsHandler } from './docs-handler.js'

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
 * Check if any workshop feature is enabled.
 */
function hasAnyWorkshopFeature(workshopConfig) {
  if (!workshopConfig?.features) return false
  return Object.values(workshopConfig.features).some(Boolean)
}

/**
 * Core storyboard server Vite plugin.
 */
export default function storyboardServer() {
  let root = ''
  let base = '/'
  let config = {}

  // Route handler registry — plugins register here during setup
  const routeHandlers = new Map()
  const clientScripts = []

  return {
    name: 'storyboard-server',

    configResolved(viteConfig) {
      root = viteConfig.root
      base = viteConfig.base || '/'
      config = readConfig(root)
    },

    configureServer(server) {
      const workshopConfig = config.workshop || {}
      const enabledFeatures = workshopConfig.features || {}

      // Wire workshop API routes for each enabled feature
      for (const [featureName, featureModule] of Object.entries(workshopFeatures)) {
        if (enabledFeatures[featureName] === false) continue
        if (featureModule.serverSetup) {
          routeHandlers.set('workshop', featureModule.serverSetup({ root, sendJson, workshopConfig }))
        }
      }

<<<<<<< HEAD
      // Wire canvas CRUD API routes (always available)
      // Pass the Vite watcher so the canvas handler can unwatch files during writes
      routeHandlers.set('canvas', createCanvasHandler({ root, sendJson, watcher: server.watcher }))
=======
      // Wire docs API routes (always enabled — serves README + source files)
      routeHandlers.set('docs', docsHandler({ root, sendJson }))
>>>>>>> 11de212 (Config consolidation: mode locking, ui.hide, workshop cleanup)

      // Inject workshop client UI when any feature is enabled
      if (hasAnyWorkshopFeature(workshopConfig)) {
        // Resolve the actual filesystem path for the mount script.
        // Use /@fs/ prefix so Vite serves it through its module pipeline.
        const mountPath = path.resolve(
          path.dirname(new URL(import.meta.url).pathname),
          '../workshop/ui/mount.ts'
        )
        clientScripts.push('/@fs' + mountPath)
      }

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
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
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
      if (clientScripts.length === 0) return []

      return clientScripts.map((src) => ({
        tag: 'script',
        attrs: { type: 'module', src: base + src.replace(/^\//, '') },
        injectTo: 'body',
      }))
    },
  }
}

export { sendJson }
