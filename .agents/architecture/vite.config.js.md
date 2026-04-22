# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

Root Vite configuration for the Storyboard prototyping app. Configures the entire dev/build pipeline: React + Svelte compilation, file-based routing via generouted, storyboard data discovery, PostCSS processing with Primer Design Tokens, Tailwind CSS, and production chunk splitting. Critically, it maps all `@dfosco/storyboard-*` package imports to local source paths so that git worktrees resolve to their own source rather than the main worktree's `node_modules`.

This file is the single source of truth for how the app is served in development (`port 1234`) and how it is built for production, including manual vendor chunk splitting for React, Primer, Octicons, and Reshaped.

## Composition

### Resolve Aliases

The `resolve.alias` map is the largest section (~40 entries). It redirects every `@dfosco/storyboard-*` sub-path import to its local `packages/*/src/` source file. This is essential for git worktree isolation — without it, npm workspace symlinks resolve to the main worktree.

```js
alias: {
    '@': path.resolve(__dirname, './src'),
    '@dfosco/storyboard-core': path.resolve(__dirname, 'packages/core/src/index.js'),
    '@dfosco/storyboard-react': path.resolve(__dirname, 'packages/react/src/index.js'),
    // ... ~35 more sub-path aliases
}
```

**Important:** Sub-path aliases (e.g. `@dfosco/storyboard-core/canvas/materializer`) must come BEFORE base package aliases (e.g. `@dfosco/storyboard-core`) for correct resolution.

### Plugins

1. **`tailwindcss()`** — Tailwind CSS v4 Vite plugin
2. **`storyboardData()`** — Custom Vite plugin from [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) that discovers `.flow.json`, `.object.json`, `.record.json`, `.canvas.jsonl` files and generates a virtual module
3. **`storyboardServer()`** — Custom Vite plugin from [`packages/core/src/vite/server-plugin.js`](./packages/core/src/vite/server-plugin.js.md) that adds WebSocket and middleware to the dev server
4. **`svelte()`** — Svelte compiler for core UI components
5. **`react()`** — React Fast Refresh
6. **`generouted()`** — File-based routing scanning `src/prototypes/**/*.{jsx,tsx,mdx}`
7. **`prototypes-watcher`** (inline) — Sends full-reload on prototype file add/unlink since generouted only watches `/src/pages/`
8. **`base-redirect`** (inline) — Redirects requests that don't include the `base` prefix

### Server Config

```js
server: {
    port: 1234,
    fs: { allow: ['..'] },
    warmup: { clientFiles: ['src/index.jsx', 'src/prototypes/**/*.jsx', ...] },
}
```

### Build Config

- **`chunkSizeWarningLimit: 700`** — Raised from default 500 KB to accommodate `@primer/react` barrel export
- **`manualChunks`** — Splits `vendor-react`, `vendor-primer`, `vendor-octicons`, `vendor-reshaped` into separate cacheable chunks

### CSS / PostCSS

- **`postcssGlobalData`** — Injects Primer Design Token CSS custom properties globally
- **`postcssPresetEnv`** — Stage 2 CSS features with `nesting-rules` enabled, targeted at `@github/browserslist-config`

## Dependencies

| Import | Purpose |
|--------|---------|
| `@vitejs/plugin-react` | React Fast Refresh + JSX transform |
| `@sveltejs/vite-plugin-svelte` | Svelte component compilation |
| `@tailwindcss/vite` | Tailwind CSS v4 plugin |
| `@generouted/react-router/plugin` | File-based routing generation |
| [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) | Storyboard data discovery (relative import) |
| [`packages/core/src/vite/server-plugin.js`](./packages/core/src/vite/server-plugin.js.md) | Storyboard dev server WebSocket/middleware (relative import) |
| `@csstools/postcss-global-data` | Primer CSS custom properties injection |
| `postcss-preset-env` | Modern CSS transpilation |
| `@github/browserslist-config` | Browser targets |
| `storyboard.config.json` | Repository config (read via `fs` to avoid Vite config dependency) |

## Dependents

- Referenced by [`eslint.config.js`](./eslint.config.js.md) (linting config)
- Used implicitly by all `npm run dev`, `npm run build`, `npm run preview` scripts in [`package.json`](./package.json.md)
- [`packages/core/src/vite/server-plugin.js`](./packages/core/src/vite/server-plugin.js.md) — configures server within this config
- [`packages/react/src/canvas/canvasReloadGuard.js`](./packages/react/src/canvas/canvasReloadGuard.js.md) — references vite config context

## Notes

- The `storyboard.config.json` is intentionally read with `fs.readFileSync` instead of a static import to prevent Vite from treating it as a config dependency (which would restart the entire server on every edit instead of hot-reloading).
- The `esbuild.keepNames: true` setting preserves function names so the storyboard inspector displays real component names.
- The `VITE_BASE_PATH` env var controls the base path, enabling branch deploys at `/branch--{name}/`.
