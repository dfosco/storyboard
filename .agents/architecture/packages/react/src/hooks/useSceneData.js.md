# `packages/react/src/hooks/useSceneData.js`

<!--
source: packages/react/src/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The primary hook for accessing flow data by dot-notation path. Merges URL hash overrides (or localStorage shadow overrides in hide mode) on top of flow JSON data. This is the most commonly used data-access hook in prototype pages.

## Composition

```js
export function useFlowData(path?, opts?) → any
export function useFlowLoading() → boolean
export const useSceneData = useFlowData      // deprecated alias
export const useSceneLoading = useFlowLoading // deprecated alias
```

**`useFlowData` behavior:**
- No path → returns entire flow object with all overrides merged via `deepClone` + `setByPath`
- With path → checks exact hash match first, then child overrides under `path.`, then raw flow value
- In hide mode, reads from shadow localStorage instead of URL hash
- Returns `{}` (not undefined) for missing paths (with console warning unless `opts.optional`)
- Throws if used outside `<StoryboardProvider>`

Subscribes to both hash and localStorage for reactivity.

## Dependencies

- `react` (useContext, useMemo, useSyncExternalStore)
- `@dfosco/storyboard-core` — getByPath, deepClone, setByPath, getParam, getAllParams, subscribeToHash, getHashSnapshot, isHideMode, getShadow, getAllShadows, subscribeToStorage, getStorageSnapshot
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports `useFlowData`, `useFlowLoading`, `useSceneData`, `useSceneLoading`

## Notes

Returns `{}` instead of `undefined` for missing paths to prevent crashes in destructuring patterns. The `optional` flag suppresses the console warning for intentionally missing data.
