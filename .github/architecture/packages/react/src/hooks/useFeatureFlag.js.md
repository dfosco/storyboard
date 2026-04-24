# `packages/react/src/hooks/useFeatureFlag.js`

<!--
source: packages/react/src/hooks/useFeatureFlag.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for reading a feature flag value. Re-renders when the flag changes via URL hash or localStorage. Wraps the core [`getFlag`](../../../core/src/featureFlags.js.md) function with `useSyncExternalStore` subscriptions for reactivity.

## Composition

```js
export function useFeatureFlag(key) {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  return getFlag(key)
}
```

Subscribes to localStorage changes via `useSyncExternalStore` so the component re-renders when a flag value changes. The core `getFlag` function reads the resolved flag value using the `"flag."` prefix convention.

## Dependencies

- [`packages/core/src/featureFlags.js`](../../../core/src/featureFlags.js.md) — `getFlag` for reading flag values
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot` for storage reactivity

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useFeatureFlag`
