# `packages/core/src/toolRegistry.js`

<!--
source: packages/core/src/toolRegistry.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`toolRegistry.js` is the central registry that connects declarative tool configurations from `toolbar.config.json` with their runtime code modules. Every toolbar tool is first declared in config (specifying its toolbar target, render type, modes, and visibility), then code modules register themselves at runtime via `registerToolModule()` to provide components, handlers, setup functions, and guards.

This two-phase design decouples tool declaration from implementation: config drives what tools exist and where they appear, while code modules provide the behavior. The registry resolves tools for a given toolbar surface by filtering on target, mode, visibility, local-dev restrictions, and guard results — giving the UI layer a ready-to-render list of tools.

## Composition

**Internal state** — Four maps tracking different aspects of each tool:

```js
let _toolConfigs = {}                    // tool id → config from toolbar.config.json
const _modules = new Map()              // tool id → code module { component?, handler?, setup?, guard? }
const _components = new Map()           // tool id → resolved component (after lazy loading)
const _guardResults = new Map()         // tool id → boolean guard result
```

**Initialization** — Seeds config from the `tools` key of toolbar config:

```js
export function initToolRegistry(config) {
  if (config.tools) {
    _toolConfigs = { ...config.tools }
  }
  _notify()
}
```

**Module registration** — Code modules register themselves with component loaders, action handlers, setup functions, and guard functions:

```js
export function registerToolModule(id, mod) {
  _modules.set(id, mod)
  _notify()
}
```

**Tool resolution** — The primary query API filters tools by toolbar target, mode, local-dev flag, and guard results:

```js
export function getToolsForToolbar(toolbar, mode, options = {}) {
  const { isLocalDev = false } = options
  const results = []
  for (const [id, config] of Object.entries(_toolConfigs)) {
    if (config.toolbar !== toolbar) continue
    if (config.localOnly && !isLocalDev) continue
    if (!isToolVisibleInMode(config, mode)) continue
    if (_guardResults.has(id) && !_guardResults.get(id)) continue
    results.push({ id, config, module: _modules.get(id) || null, component: _components.get(id) || null })
  }
  return results
}
```

**Mode visibility** — Tools can declare which modes they appear in via a `modes` array. A wildcard `'*'` means all modes:

```js
function isToolVisibleInMode(config, mode) {
  const modes = config.modes
  if (!modes) return true
  return modes.includes('*') || modes.includes(mode)
}
```

**Reactivity** — `subscribeToToolRegistry(callback)` and `getToolRegistrySnapshot()` follow the same pattern as other core stores, compatible with `useSyncExternalStore`.

## Dependencies

None (zero npm dependencies, framework-agnostic).

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public APIs (`initToolRegistry`, `registerToolModule`, `setToolComponent`, `setToolGuardResult`, `getToolComponent`, `getToolModule`, `getToolsForToolbar`, `getToolConfig`, `getAllToolConfigs`, `subscribeToToolRegistry`, `getToolRegistrySnapshot`)

## Notes

- Tools with no `modes` array are visible in all modes by default.
- Guard results are stored separately from modules because guards may resolve asynchronously after the module registers.
- The `getToolsForToolbar()` return value includes both `module` and `component` — `component` is `null` until lazy loading completes via `setToolComponent()`.
- Unlike `toolbarConfigStore`, the subscribe callback receives no arguments — consumers should call `getToolsForToolbar()` or `getToolConfig()` to read current state.
