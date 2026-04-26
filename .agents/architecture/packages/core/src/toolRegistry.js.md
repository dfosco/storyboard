# `packages/core/src/toolRegistry.js`

<!--
source: packages/core/src/toolRegistry.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Config-driven state management for toolbar tools. Every tool is declared in `toolbar.config.json` under the `tools` key, specifying a `toolbar` target (`command-toolbar`, `canvas-toolbar`, `command-palette`) and a `render` type (`button`, `menu`, `sidepanel`, `submenu`, `link`). Code modules register themselves at runtime via `registerToolModule()` to provide component, handler, setup, and guard functions. This decouples tool declaration (config) from tool implementation (code).

## Composition

**Initialization:**
- `initToolRegistry(config)` — seeds from toolbar config's `tools` object

**Module registration:**
- `registerToolModule(id, mod)` — register `{ component?, handler?, setup?, guard? }` (e.g. `mod.component = () => import('./SomeComponent.jsx')`)
- `setToolComponent(id, component)` — store resolved lazy component
- `setToolGuardResult(id, result)` — store guard evaluation result

**Resolution:**
- `getToolsForToolbar(toolbar, mode, options?)` — returns tools for a target toolbar, filtered by mode, visibility, guards, and `prod`/`isLocalDev`
- `getToolConfig(id)` / `getAllToolConfigs()` — access tool configs
- `getToolModule(id)` / `getToolComponent(id)` — access registered modules/components

**Reactivity:**
- `subscribeToToolRegistry(callback)` / `getToolRegistrySnapshot()` — `useSyncExternalStore`-compatible

**Test helper:** `_resetToolRegistry()`

## Dependencies

None (framework-agnostic, zero npm dependencies).

## Dependents

- `packages/core/src/index.js` — re-exports
- `packages/core/vite.ui.config.js` — Vite build references
