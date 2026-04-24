# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Vite configuration for the storyboard prototyping app. Configures plugins (storyboard data discovery, React, file-based routing, base path redirect), dev server settings, build optimization (vendor chunk splitting for React, Primer, Octicons, Reshaped), and PostCSS processing (Primer Primitives CSS custom properties, CSS nesting, browser compatibility).

## Composition

Plugins (in order):
1. `canvas-reload-guard` — Custom plugin that suppresses Vite full-reloads triggered by `.canvas.jsonl` file changes within a 1500ms window, relying on canvas custom events instead
2. `tailwindcss()` — Tailwind CSS v4 integration via `@tailwindcss/vite`
3. `storyboardData()` — Data file discovery from [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md)
4. `storyboardServer()` — Workshop server plugin from [`packages/core/src/vite/server-plugin.js`](./packages/core/src/vite/server-plugin.js.md)
5. `svelte()` — Svelte component support (for plugin UIs)
6. `react()` — React JSX transform
7. `generouted()` — File-based routing from `src/prototypes/`
8. `prototypes-watcher` — Custom plugin triggering full reload when prototypes are added/removed
9. `base-redirect` — Custom middleware redirecting root requests to the configured base path

Key configuration:
```js
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || `/${repository.name}/`
  return {
    base,
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Sub-path aliases MUST come BEFORE base package aliases
        '@dfosco/storyboard-core/ui-runtime': path.resolve(__dirname, 'packages/core/src/ui-entry.js'),
        '@dfosco/storyboard-core/ui/design-modes': path.resolve(__dirname, 'packages/core/src/ui/design-modes.ts'),
        '@dfosco/storyboard-core/ui/viewfinder': path.resolve(__dirname, 'packages/core/src/ui/viewfinder.ts'),
        '@dfosco/storyboard-core/canvas/materializer': path.resolve(__dirname, 'packages/core/src/canvas/materializer.js'),
        '@dfosco/storyboard-core/comments': path.resolve(__dirname, 'packages/core/src/comments/index.js'),
        '@dfosco/storyboard-core': path.resolve(__dirname, 'packages/core/src/index.js'),
        '@dfosco/storyboard-react/vite': path.resolve(__dirname, 'packages/react/src/vite/data-plugin.js'),
        '@dfosco/storyboard-react': path.resolve(__dirname, 'packages/react/src/index.js'),
        // ...additional sub-path aliases for svelte-plugin-ui, workshop, comments, tiny-canvas, etc.
      },
    },
    server: { port: 1234, fs: { allow: ['..'] } },
    optimizeDeps: {
      include: ['reshaped', '@primer/react', '@primer/octicons-react', 'prop-types'],
    },
    esbuild: { keepNames: true },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-primer': ['@primer/react'],
            'vendor-octicons': ['@primer/octicons-react'],
            'vendor-reshaped': ['reshaped'],
          },
        },
      },
    },
    css: { postcss: { plugins: [postcssGlobalData(...), postcssPresetEnv(...)] } },
  }
})
```

## Dependencies

- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — `storyboardData` plugin
- [`packages/core/src/vite/server-plugin.js`](./packages/core/src/vite/server-plugin.js.md) — `storyboardServer` plugin
- `@vitejs/plugin-react` — React support
- `@sveltejs/vite-plugin-svelte` — Svelte support for plugin UIs
- `@tailwindcss/vite` — Tailwind CSS v4
- `@generouted/react-router/plugin` — File-based routing
- `@csstools/postcss-global-data` — Injects Primer Primitives CSS custom properties
- `postcss-preset-env` — CSS nesting and modern CSS features
- `@github/browserslist-config` — GitHub's browser support targets

## Dependents

- Used by `vite` CLI commands (`npm run dev`, `npm run build`)

## Notes

- The `chunkSizeWarningLimit` is raised to 700KB because `@primer/react` barrel export can't be tree-shaken below ~664KB.
- The base path is read from `storyboard.config.json` via `fs.readFileSync` (not static import) so config edits trigger hot-reload instead of full server restart.
- Resolve aliases force local workspace package resolution — critical in git worktrees where npm may resolve to the main worktree.
- Sub-path aliases (e.g., `@dfosco/storyboard-core/ui/design-modes`) must come BEFORE base package aliases.
- `resolve.dedupe` ensures only one copy of `react` and `react-dom` is loaded.
- `esbuild.keepNames` preserves function names so the storyboard inspector shows real component names instead of minified identifiers.
- `optimizeDeps.include` pre-bundles heavy dependencies (`reshaped`, `@primer/react`, `@primer/octicons-react`, `prop-types`) for faster cold starts.
- The `canvas-reload-guard` plugin prevents full-reloads caused by `.canvas.jsonl` writes from editors — suppresses reloads within 1500ms of a canvas file mutation.
- Rollup `onwarn` suppresses `IMPORT_IS_DEFINED` warnings from intentional dual static/dynamic imports of core UI modules.
- Client file warmup includes all source directories for faster HMR.
