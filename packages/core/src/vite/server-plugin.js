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
import { getConfig } from '../configSchema.js'
import { serverFeatures as workshopFeatures } from '../workshop/features/registry-server.js'
import { docsHandler, collectFiles } from './docs-handler.js'
import { createCanvasHandler } from '../canvas/server.js'
import { setupSelectedWidgets } from '../canvas/selectedWidgets.js'
import { createAutosyncHandler } from '../autosync/server.js'
import { setupTerminalServer } from '../canvas/terminal-server.js'
import { listSessions, detachSession, killSession } from '../canvas/terminal-registry.js'
import { execSync as cpExecSync } from 'node:child_process'

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
 * Read storyboard.config.json from the project root and apply defaults.
 */
function readConfig(root) {
  const configPath = path.join(root, 'storyboard.config.json')
  if (!fs.existsSync(configPath)) return getConfig({})
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return getConfig(parseJsonc(raw) || {})
  } catch {
    return getConfig({})
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

    config() {
      return {
        optimizeDeps: {
          include: [
            'highlight.js/lib/core',
            'highlight.js/lib/languages/javascript',
            'highlight.js/lib/languages/typescript',
            'highlight.js/lib/languages/xml',
          ],
        },
      }
    },

    configResolved(viteConfig) {
      root = viteConfig.root
      base = viteConfig.base || '/'
      config = readConfig(root)
      isDev = viteConfig.command === 'serve'
    },

    configureServer(server) {
      // --- Canvas reload guard ---------------------------------------------------
      // Suppress full-reloads and HMR updates for clients on canvas routes.
      // Canvas pages send heartbeats via import.meta.hot; the guard auto-expires
      // 5s after the last heartbeat so closed tabs never leave it stuck.
      // Opt out with ?canvas-hmr in the URL when developing canvas UI code.
      {
        let recentCanvasMutationAt = 0
        const CANVAS_WINDOW_MS = 1500
        const GUARD_TTL_MS = 5000
        const isCanvasFile = (file = '') => /\.canvas\.jsonl$/i.test(file.replace(/\\/g, '/'))

        const markCanvasMutation = (file = '') => {
          if (isCanvasFile(file)) recentCanvasMutationAt = Date.now()
        }

        server.watcher.on('change', markCanvasMutation)
        server.watcher.on('add', markCanvasMutation)
        server.watcher.on('unlink', markCanvasMutation)

        const guardedClients = new Map()

        server.hot.on('storyboard:canvas-hmr-guard', (data, client) => {
          if (data.active && !data.hmrEnabled) {
            guardedClients.set(client, Date.now() + GUARD_TTL_MS)
          } else {
            guardedClients.delete(client)
          }
        })

        const cleanup = setInterval(() => {
          const now = Date.now()
          for (const [client, until] of guardedClients) {
            if (now > until || !server.ws.clients.has(client)) {
              guardedClients.delete(client)
            }
          }
        }, 10000)
        server.httpServer?.on('close', () => clearInterval(cleanup))

        function isClientGuarded(client) {
          const until = guardedClients.get(client)
          return until != null && Date.now() < until
        }

        const originalSend = server.ws.send.bind(server.ws)
        server.ws.send = (payload, ...rest) => {
          // Suppress broadcast reloads within the canvas mutation window
          if (
            payload &&
            payload.type === 'full-reload' &&
            Date.now() - recentCanvasMutationAt < CANVAS_WINDOW_MS
          ) {
            return
          }

          // No guarded clients → broadcast normally
          if (guardedClients.size === 0) {
            return originalSend(payload, ...rest)
          }

          // For reload/update payloads, send only to unguarded clients
          if (payload && (payload.type === 'full-reload' || payload.type === 'update')) {
            for (const client of server.ws.clients) {
              if (!isClientGuarded(client)) {
                client.send(payload)
              }
            }
            return
          }

          // Everything else (custom events, errors) broadcasts normally
          return originalSend(payload, ...rest)
        }
      }
      // --- End canvas reload guard -----------------------------------------------

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

      // Selected widgets bridge — writes .selectedwidgets.json for Copilot context
      setupSelectedWidgets(server, root)

      // Terminal WebSocket server — PTY backend for terminal canvas widgets
      if (server.httpServer) {
        let branch = 'unknown'
        try {
          branch = cpExecSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch {}
        setupTerminalServer(server.httpServer, base, branch)
      }

      // Ignore assets/canvas/ so image/snapshot writes don't trigger reloads
      server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'images'))
      server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'snapshots'))

      // Wire autosync API routes (always enabled — git automation for dev)
      routeHandlers.set('autosync', createAutosyncHandler({ root, sendJson }))

      // Terminal sessions API — list, detach, kill sessions
      routeHandlers.set('terminal', async (req, res, ctx) => {
        const subpath = (ctx.path || '/').replace(/^\//, '')

        // GET /sessions — list all sessions (optional ?branch= filter)
        if (ctx.method === 'GET' && (subpath === 'sessions' || subpath === 'sessions/')) {
          const url = new URL(req.url, 'http://localhost')
          const filterBranch = url.searchParams.get('branch') || null
          sendJson(res, 200, { sessions: listSessions(filterBranch) })
          return
        }

        // POST /sessions/:name/detach — detach a session
        const detachMatch = subpath.match(/^sessions\/(.+)\/detach$/)
        if (ctx.method === 'POST' && detachMatch) {
          const tmuxName = decodeURIComponent(detachMatch[1])
          const entry = detachSession(tmuxName)
          if (!entry) {
            sendJson(res, 404, { error: 'Session not found' })
            return
          }
          sendJson(res, 200, { success: true, session: entry })
          return
        }

        // DELETE /sessions/:name — kill a session immediately
        const deleteMatch = subpath.match(/^sessions\/(.+)$/)
        if (ctx.method === 'DELETE' && deleteMatch) {
          const tmuxName = decodeURIComponent(deleteMatch[1])
          killSession(tmuxName)
          sendJson(res, 200, { success: true })
          return
        }

        sendJson(res, 404, { error: 'Not found' })
      })

      // Worktrees API — lists available worktrees/branches from ports.json
      routeHandlers.set('worktrees', async (req, res) => {
        try {
          // Walk up from root to find the repo root's .worktrees/ports.json
          let dir = root
          let portsPath = null
          for (let i = 0; i < 10; i++) {
            const candidate = path.join(dir, '.worktrees', 'ports.json')
            if (fs.existsSync(candidate)) { portsPath = candidate; break }
            // Check if ports.json is a sibling (we're inside a worktree)
            const parentCandidate = path.join(path.dirname(dir), 'ports.json')
            if (fs.existsSync(parentCandidate)) { portsPath = parentCandidate; break }
            const parent = path.dirname(dir)
            if (parent === dir) break
            dir = parent
          }
          if (!portsPath) { sendJson(res, 200, []); return }
          const ports = JSON.parse(fs.readFileSync(portsPath, 'utf8'))
          const branches = Object.keys(ports).map(name => ({
            branch: name,
            folder: name === 'main' ? '' : `branch--${name}/`,
          }))
          sendJson(res, 200, branches)
        } catch { sendJson(res, 200, []) }
      })

      // Switch branch — proxy to storyboard server which manages worktree
      // dev servers. The server port is derived from the devDomain.
      routeHandlers.set('switch-branch', async (req, res, ctx) => {
        if (ctx.method !== 'POST') {
          sendJson(res, 405, { error: 'POST required' })
          return
        }
        try {
          // Derive storyboard server port (same algorithm as server/index.js)
          // readDevDomain() returns "{devDomain}.localhost"
          const domain = `${config.devDomain || 'storyboard'}.localhost`
          let h = 0
          for (let i = 0; i < domain.length; i++) {
            h = ((h << 5) - h + domain.charCodeAt(i)) | 0
          }
          const serverPort = 4100 + (Math.abs(h) % 100)

          const proxyRes = await fetch(`http://localhost:${serverPort}/_storyboard/switch-branch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ctx.body),
          })
          const data = await proxyRes.json()
          sendJson(res, proxyRes.status, data)
        } catch {
          sendJson(res, 502, {
            error: 'Storyboard server not running. Start it with: npx storyboard server',
          })
        }
      })

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
          // Proxy to standalone storyboard server for unhandled prefixes
          try {
            const proxyReq = await import('node:http')
            const proxyUrl = `http://localhost:4100${url}`
            const proxy = proxyReq.default.request(proxyUrl, { method: req.method, headers: req.headers }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, proxyRes.headers)
              proxyRes.pipe(res)
            })
            proxy.on('error', () => {
              sendJson(res, 502, { error: `Storyboard server not running. Start it with: npx storyboard server` })
            })
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              req.pipe(proxy)
            } else {
              proxy.end()
            }
          } catch {
            sendJson(res, 502, { error: 'Storyboard server not running' })
          }
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

      // Emit README as static JSON so the docs panel works in deployed builds.
      // Dev server serves this dynamically; production needs the static file.
      let readmeContent = null
      for (const candidate of ['README.md', 'readme.md', 'Readme.md']) {
        try {
          readmeContent = await fs.promises.readFile(path.join(root, candidate), 'utf-8')
          break
        } catch { /* try next */ }
      }
      if (readmeContent) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/docs/readme',
          source: JSON.stringify({ content: readmeContent, path: 'README.md' }),
        })
      }

      // Emit repo info so the docs panel GitHub link works in deployed builds.
      if (repo) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/docs/repo',
          source: JSON.stringify(repo),
        })
      }

      // Emit story sources JSON so the "show code" widget action works in
      // deployed builds. In dev, StoryWidget uses Vite's ?raw import; in prod
      // it fetches this static JSON instead.
      const storySources = {}
      const storyExts = ['.story.jsx', '.story.tsx', '.story.js', '.story.ts']
      for (const relPath of allSrcFiles) {
        if (storyExts.some(ext => relPath.endsWith(ext))) {
          storySources[relPath] = sources[relPath] || ''
        }
      }
      if (Object.keys(storySources).length > 0) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/stories/sources.json',
          source: JSON.stringify(storySources),
        })
      }

      // Emit canvas images so they're available in deployed (static) builds.
      // Dev server serves these dynamically; production needs the static files.
      // Private images (prefixed with _) are excluded from the build.
      for (const dir of [
        path.join(root, 'assets', 'canvas', 'images'),
        path.join(root, 'assets', 'canvas', 'snapshots'),
      ]) {
        try {
          const imageFiles = await fs.promises.readdir(dir)
          const subdir = dir.endsWith('snapshots') ? 'snapshots' : 'images'
          for (const file of imageFiles) {
            if (file.startsWith('_') || file.startsWith('.')) continue
            try {
              const data = await fs.promises.readFile(path.join(dir, file))
              this.emitFile({
                type: 'asset',
                fileName: `_storyboard/canvas/${subdir}/${file}`,
                source: data,
              })
            } catch { /* skip unreadable files */ }
          }
        } catch { /* directory doesn't exist */ }
      }

      // GitHub Pages uses Jekyll which ignores _-prefixed directories.
      // Emit .nojekyll to ensure _storyboard/ is served.
      this.emitFile({
        type: 'asset',
        fileName: '.nojekyll',
        source: '',
      })

      // Emit CNAME for GitHub Pages custom domain if configured.
      // Without this, deploy scripts that clean the gh-pages root will
      // delete the CNAME on every push, causing intermittent 404s.
      const customDomain = (config.customDomain || '').trim()
      if (customDomain && !customDomain.includes('/') && !customDomain.includes(':') && !customDomain.includes(' ')) {
        this.emitFile({
          type: 'asset',
          fileName: 'CNAME',
          source: customDomain + '\n',
        })
      }
    },
  }
}

export { sendJson }
