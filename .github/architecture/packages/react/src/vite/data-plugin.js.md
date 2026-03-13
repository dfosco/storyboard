# `packages/react/src/vite/data-plugin.js`

<!--
source: packages/react/src/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vite plugin that discovers all storyboard data files (`*.flow.json`, `*.scene.json` (compat), `*.object.json`, `*.record.json`, `*.prototype.json`) at build time, validates uniqueness, and generates a virtual module (`virtual:storyboard-data-index`) that pre-parses all JSON/JSONC data and calls `init()` to seed the core data index. This eliminates runtime file I/O and parsing — all data is available as JavaScript objects at import time.

The plugin also reads `storyboard.config.json` to initialize feature flags, plugin configuration, design modes, tool registry, and mode CSS. Prototype-scoped flows and records are automatically prefixed with their prototype directory name (e.g., `Dashboard/default`). Objects are globally scoped even inside prototype directories.

In dev mode, the plugin watches for file additions, removals, and changes (including config changes), rebuilding the index and triggering a full reload.

## Composition

**`storyboardDataPlugin()`** — Returns a Vite plugin object with:

- `resolveId` / `load` — Resolves the `virtual:storyboard-data-index` module ID and generates its source code
- `configureServer` — Watches for data file changes in dev mode, invalidates the module graph and triggers full reload
- `buildStart` — Resets the index on each build

Internal helpers:
- `parseDataFile(filePath)` — Extracts `{ name, suffix, ext }` from a file path. Normalizes `.scene` → `.flow` for backward compat. Scopes flows/records inside `src/prototypes/{Name}/` with a prefix.
- `buildIndex(root)` — Scans the repo with glob, validates no duplicate name+suffix combinations, returns an index of absolute paths categorized by type (flow, object, record, prototype).
- `generateModule(index, root)` — Reads each data file, parses JSONC, auto-fills `gitAuthor` for prototypes, and generates JavaScript source with pre-parsed objects and init calls.
- `readConfig(root)` — Reads `storyboard.config.json`, handles malformed JSON gracefully.
- `readModesConfig(root)` — Reads `modes.config.json` from the core package with fallback defaults.
- `getGitAuthor(root, filePath)` — Looks up git author who first created a file.

Generated virtual module shape:
```js
import { init } from '@dfosco/storyboard-core'
import { initFeatureFlags } from '@dfosco/storyboard-core'
import { initPlugins } from '@dfosco/storyboard-core'
import { initModesConfig, registerMode, syncModeClasses, initTools } from '@dfosco/storyboard-core'

const _d0 = { /* parsed JSON */ }
const flows = { "default": _d0 }
const objects = { ... }
const records = { ... }
const prototypes = { ... }

init({ flows, objects, records, prototypes })
initFeatureFlags({ ... })
initPlugins({ ... })
initModesConfig({ enabled: true })
registerMode('prototype', { label: 'Navigate' })
// ...
syncModeClasses()

export { flows, scenes, objects, records, prototypes }
```

## Dependencies

- `node:fs`, `node:path`, `node:child_process` — File system and git access
- `glob` — File discovery
- `jsonc-parser` — JSONC parsing (supports comments in JSON)
- [`packages/core/src/index.js`](../../core/src/index.js.md) — The generated module imports `init`, `initFeatureFlags`, `initPlugins`, `initModesConfig`, `registerMode`, `syncModeClasses`, `initTools` from `@dfosco/storyboard-core`

## Dependents

- [`packages/react/src/context.jsx`](../context.jsx.md) — Side-effect imports `virtual:storyboard-data-index`
- [`vite.config.js`](../../../../vite.config.js.md) — Registers the plugin as `storyboardData()`

## Notes

- Duplicate name+suffix combinations cause a hard build error with file paths shown.
- JSONC support allows comments in data files for documentation purposes.
- The plugin enforces uniqueness across the entire repo, not just within directories.
- Objects are globally scoped (never prefixed), while flows and records inside `src/prototypes/{Name}/` are auto-prefixed.
- `storyboard.config.json` changes trigger a full reload in dev mode.
- The `config()` hook excludes `@dfosco/storyboard-react` from Vite's `optimizeDeps` to ensure the virtual module is always freshly generated.
