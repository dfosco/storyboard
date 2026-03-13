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
  useSyncExternalStore(subscribeToHash, getHashSnapshot)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  return getFlag(key)
}
```

Subscribes to both hash and storage changes since flags can be set in either location (hash for user overrides, localStorage for config defaults).

## Dependencies

- [`packages/core/src/featureFlags.js`](../../../core/src/featureFlags.js.md) — `getFlag` for reading flag values
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot` for hash reactivity
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot` for storage reactivity

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useFeatureFlag`
