# `packages/core/src/configStore.js`

<!--
source: packages/core/src/configStore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Unified reactive config store — single source of truth for all storyboard configuration at runtime. Replaces scattered init/store patterns. Supports domain-level prototype overrides that are deep-merged on top of the base config. Override priority: `core defaults → storyboard.config.json → prototype-level overrides`.

Domain-specific stores (`toolbarConfigStore`, `canvasConfig`, etc.) can delegate here for unified access.

## Composition

```js
export function initConfig(config)                           // Seed base config at startup
export function getConfig(domain?)                           // Get full config or a domain slice
export function setOverrides(domain, overrides)              // Set prototype-level overrides
export function clearOverrides(domain)                       // Clear overrides for a domain
export function clearAllOverrides()                          // Clear all prototype overrides
export function subscribeToConfig(callback)                  // Reactive subscription (Svelte-compatible)
export function getConfigSnapshot()                          // Snapshot version for useSyncExternalStore
```

Internal: `_recompute()` merges `_baseConfig` with `_prototypeOverrides` using `deepMerge` from [`loader.js`](./loader.js.md), then notifies all listeners.

## Dependencies

- [`loader.js`](./loader.js.md) — `deepMerge`

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- [`commandPaletteConfig.js`](./commandPaletteConfig.js.md) — `getConfig('commandPalette')` fallback
- `mountStoryboardCore.js` — calls `initConfig()` at startup

## Notes

Listeners receive the full merged config object on every change. The snapshot version is a monotonically increasing integer (as string) for `useSyncExternalStore` compatibility.
