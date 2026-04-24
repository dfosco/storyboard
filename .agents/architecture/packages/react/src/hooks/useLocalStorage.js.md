# `packages/react/src/hooks/useLocalStorage.js`

<!--
source: packages/react/src/hooks/useLocalStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Persistent localStorage override on top of flow data. Unlike `useOverride` which writes to the URL hash (ephemeral), this hook writes to localStorage so values survive page refreshes (e.g. theme preference).

Read priority: URL hash param → localStorage → flow JSON value → undefined.

## Composition

```js
export function useLocalStorage(path) → [value, setValue, clearValue]
```

- Requires [`StoryboardContext`](../StoryboardContext.js.md) — throws outside `<StoryboardProvider>`
- Subscribes to both hash and localStorage changes for reactivity
- `setValue(newValue)` writes to localStorage via core's `setLocal`
- `clearValue()` removes from localStorage via core's `removeLocal`

## Dependencies

- `react` (useCallback, useContext, useSyncExternalStore)
- `@dfosco/storyboard-core` — getByPath, getParam, getLocal, setLocal, removeLocal, subscribeToStorage, getStorageSnapshot, subscribeToHash, getHashSnapshot
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
