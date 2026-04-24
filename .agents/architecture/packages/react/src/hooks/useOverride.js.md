# `packages/react/src/hooks/useOverride.js`

<!--
source: packages/react/src/hooks/useOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The primary hook for reading and writing overrides on top of flow/object data. In normal mode, overrides live in the URL hash; in hide mode, they live in localStorage shadow keys. Every write also mirrors to localStorage shadow so hide mode can hot-swap without data loss.

## Composition

```js
export function useOverride(path) → [value, setValue, clearValue]
```

- **Normal mode:** read priority is hash → flow default → undefined. Writes go to URL hash + shadow.
- **Hide mode:** read priority is shadow → flow default → undefined. Writes go to shadow only.
- Works without `<StoryboardProvider>` (context is optional — flow fallback is skipped)
- `setValue(newValue)` writes to hash or shadow depending on mode
- `clearValue()` removes override, reverting to flow default

Uses path-specific `getParam(path)` as the `getSnapshot` for `useSyncExternalStore`, so only re-renders when this specific path's hash param changes.

## Dependencies

- `react` (useCallback, useContext, useSyncExternalStore)
- `@dfosco/storyboard-core` — getByPath, getParam, setParam, removeParam, subscribeToHash, isHideMode, getShadow, setShadow, removeShadow, subscribeToStorage, getStorageSnapshot
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
- [`packages/react/src/hooks/useSession.js`](./useSession.js.md) — deprecated re-export
- `packages/react-primer/src/SceneDataDemo.jsx`
