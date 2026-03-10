import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import generouted from '@generouted/react-router/plugin'
import storyboardData from '@dfosco/storyboard-react/vite'
import storyboardServer from '@dfosco/storyboard-core/vite/server'
import postcssGlobalData from '@csstools/postcss-global-data'
import postcssPresetEnv from 'postcss-preset-env'
import browsers from '@github/browserslist-config'
import fs from 'node:fs'
import { globSync } from 'glob'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Read config with fs instead of a static import so Vite doesn't treat
// storyboard.config.json as a config dependency (which would restart the
// entire server on every edit instead of just hot-reloading).
const { repository } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'storyboard.config.json'), 'utf-8'))

export default defineConfig(() => {
    const base = process.env.VITE_BASE_PATH || `/${repository.name}/`

    return {
    base,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // In git worktrees, npm resolves workspace packages to the main
            // worktree. Force local resolution so edits here take effect.
            // NOTE: Sub-path aliases must come BEFORE base package aliases.
            '@dfosco/storyboard-core/svelte-plugin-ui/design-modes': path.resolve(__dirname, 'packages/core/src/svelte-plugin-ui/plugins/design-modes.ts'),
            '@dfosco/storyboard-core/svelte-plugin-ui/styles/base.css': path.resolve(__dirname, 'packages/core/src/svelte-plugin-ui/styles/base.css'),
            '@dfosco/storyboard-core/svelte-plugin-ui': path.resolve(__dirname, 'packages/core/src/svelte-plugin-ui/index.ts'),
            '@dfosco/storyboard-core/vite/server': path.resolve(__dirname, 'packages/core/src/vite/server-plugin.js'),
            '@dfosco/storyboard-core/workshop/ui/mount.js': path.resolve(__dirname, 'packages/core/src/workshop/ui/mount.js'),
            '@dfosco/storyboard-core/comments/ui/comments.css': path.resolve(__dirname, 'packages/core/src/comments/ui/comments.css'),
            '@dfosco/storyboard-core/modes.css': path.resolve(__dirname, 'packages/core/src/modes.css'),
            '@dfosco/storyboard-core/comments': path.resolve(__dirname, 'packages/core/src/comments/index.js'),
            '@dfosco/storyboard-core': path.resolve(__dirname, 'packages/core/src/index.js'),
            '@dfosco/storyboard-react/vite': path.resolve(__dirname, 'packages/react/src/vite/data-plugin.js'),
            '@dfosco/storyboard-react/hash-preserver': path.resolve(__dirname, 'packages/react/src/hashPreserver.js'),
            '@dfosco/storyboard-react': path.resolve(__dirname, 'packages/react/src/index.js'),
            '@dfosco/storyboard-react-primer': path.resolve(__dirname, 'packages/react-primer/src/index.js'),
            '@dfosco/storyboard-react-reshaped': path.resolve(__dirname, 'packages/react-reshaped/src/index.js'),
        },
    },
    plugins: [
        storyboardData(),
        storyboardServer(),
        svelte(),
        react(),
        generouted({
            source: {
                routes: './src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}',
                modals: './src/prototypes/**/[+]*.{jsx,tsx,mdx}',
            },
        }),
        // generouted's built-in watcher only listens for /src/pages/ changes.
        // This plugin triggers a full reload when prototypes are added/removed.
        {
            name: 'prototypes-watcher',
            configureServer(server) {
                const listener = (file = '') => {
                    if (file.includes(path.normalize('/src/prototypes/'))) {
                        server.ws.send({ type: 'full-reload' })
                    }
                }
                server.watcher.on('add', listener)
                server.watcher.on('unlink', listener)
            },
        },
        {
            name: 'base-redirect',
            configureServer(server) {
                const baseNoTrail = base.replace(/\/$/, '')
                server.middlewares.use((req, res, next) => {
                    if (req.url === baseNoTrail) {
                        res.writeHead(302, { Location: base })
                        res.end()
                        return
                    }
                    if (req.url && req.url !== baseNoTrail && !req.url.startsWith(base) && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/')) {
                        const newUrl = baseNoTrail + req.url
                        res.writeHead(302, { Location: newUrl })
                        res.end()
                        return
                    }
                    next()
                })
            },
        },
    ],
    server: {
        port: 1234,
        fs: { allow: ['..'] },
        watch: {
            // Don't ignore .worktrees — this project may run inside one
        },
        warmup: {
            clientFiles: [
                'src/index.jsx',
                'src/prototypes/**/*.jsx',
                'src/components/**/*.jsx',
                'src/templates/**/*.jsx',
                'packages/react/src/**/*.{js,jsx}',
                'packages/react-primer/src/**/*.{js,jsx}',
                'packages/core/src/**/*.js',
            ],
        },
    },
    optimizeDeps: {
        include: ['reshaped', '@primer/react', '@primer/octicons-react', 'prop-types'],
    },
    build: {
        // @primer/react barrel export can't be tree-shaken below ~664 KB.
        // Raised from 500 KB default to suppress the warning for that chunk.
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                // Split heavy vendor deps into separate, long-lived cacheable chunks.
                // Page code stays in small per-route chunks via generouted lazy routes.
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-primer': ['@primer/react'],
                    'vendor-octicons': ['@primer/octicons-react'],
                    'vendor-reshaped': ['reshaped'],
                },
            },
        },
    },
    css: {
        postcss: {
            plugins: [
                postcssGlobalData({
                    files: globSync(
                        'node_modules/@primer/primitives/dist/css/**/*.css',
                        { ignore: ['**/themes/**'] }
                    ),
                }),
                postcssPresetEnv({
                    stage: 2,
                    browsers,
                    // https://preset-env.cssdb.org/features/#stage-2
                    features: {
                        'nesting-rules': {
                            noIsPseudoSelector: true,
                        },
                        'focus-visible-pseudo-class': false,
                        'logical-properties-and-values': false,
                    },
                }),
            ],
        },
    },
}})
