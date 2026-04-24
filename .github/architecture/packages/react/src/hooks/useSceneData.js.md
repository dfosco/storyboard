# `packages/react/src/hooks/useSceneData.js`

<!--
source: packages/react/src/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides read-only access to flow data by dot-notation path, with hash/shadow overrides transparently merged. This is the primary hook for reading flow data in components. Supports exact path matches, child override merging (e.g., `#projects.0.name=Foo` overrides a nested field), and full-flow reads with all overrides applied.

Exports the preferred `useFlowData` and `useFlowLoading` names, plus deprecated `useSceneData` and `useSceneLoading` aliases for backward compatibility.

## Composition

**`useFlowData(path?)`** — Returns the resolved value at the given path, or the entire flow object if no path is given.

```js
export function useFlowData(path) {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useFlowData must be used within a <StoryboardProvider>')
  }
  const { data, loading, error } = context
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    if (loading || error || data == null) return undefined
    const hidden = isHideMode()
    const readParam = hidden ? getShadow : getParam
    const readAllParams = hidden ? getAllShadows : getAllParams
    // ... override resolution (exact match → child overrides → base value)
  }, [data, loading, error, path, hashString, storageString])
}
```

Override resolution:
1. Exact match: hash/shadow param directly for this path → return as-is
2. Child overrides: params that start with `path.` → deep clone flow value and merge overrides
3. No override: return flow value
4. Missing path with non-empty data → returns `{}` with a console warning

In hide mode, reads from shadow localStorage instead of URL hash.

**`useFlowLoading()`** — Returns `context.loading` (always `false` in current sync implementation).

**`useSceneData`** / **`useSceneLoading`** — Deprecated aliases pointing to `useFlowData` / `useFlowLoading`.

All hooks throw if used outside `<StoryboardProvider>`.

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — React context
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath`, `deepClone`, `setByPath`
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`, `getAllParams`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot`
- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `getShadow`, `getAllShadows`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useFlowData`, `useFlowLoading`, `useSceneData`, and `useSceneLoading`
