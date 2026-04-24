# `packages/react/src/vite/data-plugin.js`

<!--
source: packages/react/src/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vite plugin that discovers all storyboard data files (`*.flow.json`, `*.scene.json` (compat), `*.object.json`, `*.record.json`, `*.prototype.json`, `*.folder.json`, `*.canvas.jsonl`) at build time, validates uniqueness, and generates a virtual module (`virtual:storyboard-data-index`) that pre-parses all JSON/JSONC data and calls `init()` to seed the core data index. This eliminates runtime file I/O and parsing — all data is available as JavaScript objects at import time.

The plugin also reads `storyboard.config.json` to initialize feature flags, plugin configuration, design modes, UI config, tool registry, and mode CSS. Prototype-scoped flows, records, and objects are automatically prefixed with their prototype directory name (e.g., `Dashboard/default`). Canvas files (`*.canvas.jsonl`) are parsed via the `materializeFromText` function from the core canvas materializer and support JSX companion files.

In dev mode, the plugin watches for file additions, removals, and changes (including config changes), rebuilding the index and triggering a full reload. Canvas file changes emit custom HMR events (`storyboard:canvas-file-changed`) instead of full reloads to avoid feedback loops during editing.

## Composition

**`storyboardDataPlugin()`** — Returns a Vite plugin object with:

- `config` — Excludes `@dfosco/storyboard-react` from `optimizeDeps` to ensure the virtual module is always freshly generated
- `configResolved` — Captures the project root
- `resolveId` / `load` — Resolves the `virtual:storyboard-data-index` module ID and generates its source code
- `configureServer` — Watches for data file changes in dev mode with smart invalidation: canvas `.jsonl` changes emit custom HMR events (`storyboard:canvas-file-changed`) instead of full reloads; `toolbar.config.json` changes inside prototypes trigger rebuild; `storyboard.config.json` changes trigger full reload
- `handleHotUpdate` — Intercepts canvas `.jsonl` HMR to prevent Vite's default full-reload fallback, emitting custom WS events instead
- `buildStart` — Resets the index on each build

Internal helpers:
- `parseDataFile(filePath)` — Extracts `{ name, suffix, ext, inferredRoute, folder }` from a file path. Normalizes `.scene` → `.flow` for backward compat. Scopes flows, records, and objects inside `src/prototypes/{Name}/` with a prefix. Handles `.canvas.jsonl` files with route inference. Skips `_`-prefixed files and directories.
- `buildIndex(root)` — Scans the repo with glob for both standard data files and canvas `.jsonl` files. Validates no duplicate name+suffix combinations and no nested `.folder/` directories. Returns `{ index, protoFolders, flowRoutes, canvasRoutes }`.
- `generateModule(index, root)` — Reads each data file, parses JSONC (or uses `materializeFromText` for canvases), auto-fills `gitAuthor` and `lastModified` from git history for prototypes/canvases, injects folder associations and toolbar configs, resolves template variables (`${currentDir}`, `${currentProto}`, `${currentProtoDir}`), infers routes for flows and canvases, resolves JSX companion files for canvases, and generates JavaScript source.
- `resolveTemplateVars(obj, vars)` — Recursively replaces `${varName}` in string values
- `computeTemplateVars(absPath, root)` — Computes `currentDir`, `currentProto`, `currentProtoDir` from file location
- `readConfig(root)` — Reads `storyboard.config.json`, handles malformed JSON gracefully
- `readModesConfig(root)` — Reads `toolbar.config.json` from the core package (local workspace or node_modules) with hardcoded fallback defaults
- `getGitAuthor(root, filePath)` — Looks up git author who first created a file
- `getLastModified(root, dirPath)` — Looks up most recent commit date for files in a directory

Generated virtual module shape:
```js
import { init } from '@dfosco/storyboard-core'
import { initFeatureFlags } from '@dfosco/storyboard-core'
import { initPlugins } from '@dfosco/storyboard-core'
import { initModesConfig, registerMode, syncModeClasses, initTools } from '@dfosco/storyboard-core'
import { initUIConfig } from '@dfosco/storyboard-core'

const _d0 = { /* parsed JSON */ }
const flows = { "default": _d0 }
const objects = { ... }
const records = { ... }
const prototypes = { ... }
const folders = { ... }
const canvases = { ... }
const scenes = flows // backward-compatible alias

init({ flows, objects, records, prototypes, folders, canvases })
initFeatureFlags({ ... })
initPlugins({ ... })
initModesConfig({ enabled: true })
registerMode('prototype', { label: 'Navigate' })
syncModeClasses()
initUIConfig({ ... })

export { flows, scenes, objects, records, prototypes, folders, canvases }
export const index = { flows, scenes, objects, records, prototypes, folders, canvases }
export default index
```

## Dependencies

- `node:fs`, `node:path`, `node:child_process` — File system and git access
- `glob` — File discovery (`globSync`)
- `jsonc-parser` — JSONC parsing (supports comments in JSON)
- `@dfosco/storyboard-core/canvas/materializer` — `materializeFromText` for parsing `.canvas.jsonl` files
- [`packages/core/src/index.js`](../../core/src/index.js.md) — The generated module imports `init`, `initFeatureFlags`, `initPlugins`, `initModesConfig`, `registerMode`, `syncModeClasses`, `initTools`, `initUIConfig` from `@dfosco/storyboard-core`

## Dependents

- [`packages/react/src/context.jsx`](../context.jsx.md) — Side-effect imports `virtual:storyboard-data-index`
- [`vite.config.js`](../../../../vite.config.js.md) — Registers the plugin as `storyboardData()`

## Notes

- Duplicate name+suffix combinations cause a hard build error with file paths shown.
- JSONC support allows comments in data files for documentation purposes.
- The plugin enforces uniqueness across the entire repo, not just within directories.
- Nested `.folder/` directories are detected and cause a hard build error — only one level deep inside `src/prototypes/` is allowed.
- Flows, records, and objects inside `src/prototypes/{Name}/` are auto-prefixed with the prototype name. `.folder/` segments are skipped when determining prototype scope.
- `storyboard.config.json` changes trigger a full reload in dev mode.
- Canvas `.jsonl` file changes use custom HMR events (`storyboard:canvas-file-changed`) instead of full reloads to prevent feedback loops during active canvas editing. The `handleHotUpdate` hook returns `[]` for canvas files to suppress Vite's default reload behavior.
- Canvas unlink+add pairs (from in-place saves) are debounced with a 1.5s timer to avoid unnecessary reloads.
- When multiple flows target the same inferred route, a console log is emitted; if multiple are marked `meta.default: true`, a warning is shown.
- Template variables (`${currentDir}`, `${currentProto}`, `${currentProtoDir}`) are resolved at build time with warnings for variables used outside their expected context.
- Also exports `resolveTemplateVars` and `computeTemplateVars` for testing.
