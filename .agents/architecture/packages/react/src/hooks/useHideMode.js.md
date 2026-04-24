# `packages/react/src/hooks/useHideMode.js`

<!--
source: packages/react/src/hooks/useHideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Read and control hide mode. Hide mode moves all URL hash overrides into localStorage so the URL stays clean — useful when sharing storyboards with customers. Returns `{ isHidden, hide, show }`.

## Composition

```js
export function useHideMode() → { isHidden: boolean, hide: () => void, show: () => void }
```

Subscribes to localStorage changes via `useSyncExternalStore` for reactivity. `hide()` calls `activateHideMode()` (copies hash → localStorage, cleans URL). `show()` calls `deactivateHideMode()` (restores localStorage → hash).

## Dependencies

- `react` (useCallback, useSyncExternalStore)
- `@dfosco/storyboard-core` — isHideMode, activateHideMode, deactivateHideMode, subscribeToStorage, getStorageSnapshot

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
