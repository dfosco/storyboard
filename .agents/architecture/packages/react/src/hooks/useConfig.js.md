# `packages/react/src/hooks/useConfig.js`

<!--
source: packages/react/src/hooks/useConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for reading from the unified config store (populated from `storyboard.config.json` and other config sources). Re-renders when config changes. Optionally scopes to a specific domain (e.g. `'toolbar'`, `'canvas'`).

## Composition

```js
export function useConfig(domain) {
  const snapshot = useSyncExternalStore(subscribeToConfig, getConfigSnapshot)
  return useCallback(() => getConfig(domain), [snapshot, domain])()
}
```

Uses `useSyncExternalStore` for tear-free reads from core's config store.

## Dependencies

- `react` (useSyncExternalStore, useCallback)
- `@dfosco/storyboard-core` — getConfig, subscribeToConfig, getConfigSnapshot

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
