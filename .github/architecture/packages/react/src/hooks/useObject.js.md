# `packages/react/src/hooks/useObject.js`

<!--
source: packages/react/src/hooks/useObject.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for loading object data files directly by name, without going through a scene. Supports dot-notation path access and URL hash overrides. Works in both normal mode (URL hash) and hide mode (localStorage shadows). Override convention: `object.{objectName}.{field}=value`.

This hook is useful when a component needs standalone data that isn't part of any scene — for example, a user profile object or navigation configuration.

## Composition

```js
export function useObject(objectName, path) {
  const context = useContext(StoryboardContext)
  const prototypeName = context?.prototypeName ?? null
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    const resolvedName = resolveObjectName(prototypeName, objectName)
    let data = loadObject(resolvedName)

    const hidden = isHideMode()
    const readParam = hidden ? getShadow : getParam
    const readAllParams = hidden ? getAllShadows : getAllParams

    // Apply overrides — check both resolved (scoped) and plain (unscoped) prefixes
    const resolvedPrefix = `object.${resolvedName}.`
    const plainPrefix = objectName !== resolvedName ? `object.${objectName}.` : null
    const allParams = readAllParams()
    const overrideKeys = Object.keys(allParams).filter(k =>
      k.startsWith(resolvedPrefix) || (plainPrefix && k.startsWith(plainPrefix))
    )

    if (overrideKeys.length > 0) {
      data = deepClone(data)
      for (const key of overrideKeys) {
        const fieldPath = key.startsWith(resolvedPrefix)
          ? key.slice(resolvedPrefix.length)
          : key.slice(plainPrefix.length)
        setByPath(data, fieldPath, allParams[key])
      }
    }

    if (!path) return data
    // Handle exact match, child overrides, or base value lookup
    // ...
  }, [objectName, prototypeName, path, hashString, storageString])
}
```

Key behaviors:
- **Prototype scoping:** Reads `prototypeName` from `StoryboardContext` and uses `resolveObjectName()` to try scoped names first (e.g. `Dashboard/jane-doe`), falling back to global
- **Dual prefix override matching:** Checks both the resolved (scoped) and plain (unscoped) override prefixes so `#object.jane-doe.name=Alice` works regardless of scoping
- Full object access: `useObject('jane-doe')` returns the entire object with overrides applied
- Path access: `useObject('jane-doe', 'profile.name')` returns a nested value
- Child overrides under a sub-path are merged into the base value via `deepClone` + `setByPath`
- Returns `undefined` for missing objects or paths (with console warnings/errors)
- Supports hide mode — reads overrides from localStorage shadows when active

## Dependencies

- [`packages/core/src/loader.js`](../../../core/src/loader.js.md) — `loadObject`, `resolveObjectName` for loading and scoping object data
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath`, `setByPath`, `deepClone` for path resolution and data manipulation
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`, `getAllParams` for hash reading
- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `getShadow`, `getAllShadows` for hide mode support
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot` for reactivity
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot` for hide mode reactivity
- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — React context for `prototypeName`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useObject`
- [`packages/react/src/hooks/useObject.test.js`](./useObject.test.js.md) — Test file
