# `packages/core/src/plugins.js`

<!--
source: packages/core/src/plugins.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Plugin configuration module — controls enable/disable state for storyboard plugins. Plugins are enabled by default unless explicitly disabled in `storyboard.config.json` under the `"plugins"` key. The config is injected at build time by the Vite data plugin.

## Composition

**`initPlugins(config)`** — Seeds plugin configuration. Called by the Vite data plugin's generated virtual module.

```js
export function initPlugins(config) {
  _plugins = { ...config }
}
```

**`isPluginEnabled(name)`** — Returns `true` by default for unconfigured plugins, `false` only when explicitly disabled.

```js
export function isPluginEnabled(name) {
  if (name in _plugins) return Boolean(_plugins[name])
  return true  // enabled by default
}
```

**`getPluginsConfig()`** — Returns a copy of the full config (for diagnostics/testing).

## Dependencies

No external dependencies. Pure JavaScript module.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all functions
- [`packages/core/src/plugins.test.js`](./plugins.test.js.md) — Test file
- [`packages/core/src/devtools.js`](./devtools.js.md) — Imports `isPluginEnabled`, `initPlugins` to gate devtools mounting
