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
1. `storyboardData()` — Data file discovery from [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md)
2. `storyboardServer()` — Workshop server plugin from [`@dfosco/storyboard-core/vite/server`]
3. `svelte()` — Svelte component support (for plugin UIs)
4. `react()` — React JSX transform
5. `generouted()` — File-based routing from `src/prototypes/`
6. `prototypes-watcher` — Custom plugin triggering full reload when prototypes are added/removed
7. `base-redirect` — Custom middleware redirecting root requests to the configured base path

Key configuration:
```js
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || `/${repository.name}/`
  return {
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Workspace package aliases for worktree support
        '@dfosco/storyboard-core': path.resolve(__dirname, 'packages/core/src/index.js'),
        '@dfosco/storyboard-react': path.resolve(__dirname, 'packages/react/src/index.js'),
        // ...sub-path aliases for core UI, vite plugins, etc.
      },
    },
    server: { port: 1234, fs: { allow: ['..'] } },
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

## Dependencies

- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — `storyboardData` plugin
- `@dfosco/storyboard-core/vite/server` — Workshop server plugin
- `@vitejs/plugin-react` — React support
- `@sveltejs/vite-plugin-svelte` — Svelte support for plugin UIs
- `@generouted/react-router/plugin` — File-based routing
- `@csstools/postcss-global-data` — Injects Primer Primitives CSS custom properties
- `postcss-preset-env` — CSS nesting and modern CSS features

## Dependents

- Used by `vite` CLI commands (`npm run dev`, `npm run build`)

## Notes

- The `chunkSizeWarningLimit` is raised to 700KB because `@primer/react` barrel export can't be tree-shaken below ~664KB.
- The base path is read from `storyboard.config.json` via `fs.readFileSync` (not static import) so config edits trigger hot-reload instead of full server restart.
- Resolve aliases force local workspace package resolution — critical in git worktrees where npm may resolve to the main worktree.
- Sub-path aliases (e.g., `@dfosco/storyboard-core/ui/design-modes`) must come BEFORE base package aliases.
- Client file warmup includes all source directories for faster HMR.
