# `packages/react/src/hooks/useObject.js`

<!--
source: packages/react/src/hooks/useObject.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Loads an object data file directly by name (e.g. `useObject('jane-doe')`) without going through a flow. Supports dot-notation path access, URL hash overrides (convention: `object.{name}.{field}=value`), hide-mode shadow overrides, and prototype-scoped name resolution.

## Composition

```js
export function useObject(objectName, path) → any
```

- Reads `prototypeName` from [`StoryboardContext`](../StoryboardContext.js.md) (optional — works without provider)
- Resolves scoped name via `resolveObjectName(prototypeName, objectName)`
- Loads data via `loadObject(resolvedName)`
- Applies hash overrides matching both `object.{resolvedName}.` and `object.{plainName}.` prefixes
- If `path` is given, returns the sub-value (with exact and child override merging)
- Returns deep clones to prevent mutation of source data

Subscribes to both hash and localStorage for reactivity.

## Dependencies

- `react` (useContext, useMemo, useSyncExternalStore)
- `@dfosco/storyboard-core` — loadObject, resolveObjectName, getByPath, deepClone, setByPath, getParam, getAllParams, isHideMode, getShadow, getAllShadows, subscribeToHash/Storage
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports

## Notes

Override matching checks both the resolved (scoped) prefix and the plain (unscoped) prefix so overrides work whether written with bare or scoped names.
