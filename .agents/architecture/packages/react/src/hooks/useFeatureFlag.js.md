# `packages/react/src/hooks/useFeatureFlag.js`

<!--
source: packages/react/src/hooks/useFeatureFlag.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for reading a feature flag value from localStorage. Re-renders when the flag changes. Flags are stored with a `flag.` prefix in the storyboard localStorage namespace.

## Composition

```js
export function useFeatureFlag(key) {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  return getFlag(key)
}
```

Subscribes to storage changes for reactivity, then reads the flag synchronously via core's `getFlag`.

## Dependencies

- `react` (useSyncExternalStore)
- `@dfosco/storyboard-core` — getFlag, subscribeToStorage, getStorageSnapshot

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
- `src/prototypes/_app.jsx`
