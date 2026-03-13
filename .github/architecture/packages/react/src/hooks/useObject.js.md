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
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    let data = loadObject(objectName)

    // Apply overrides scoped to this object (prefix: object.{name}.)
    const prefix = `object.${objectName}.`
    const allParams = readAllParams()
    const overrideKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))
    if (overrideKeys.length > 0) {
      data = deepClone(data)
      for (const key of overrideKeys) {
        setByPath(data, key.slice(prefix.length), allParams[key])
      }
    }

    if (!path) return data
    // Handle exact match, child overrides, or base value lookup
    // ...
  }, [objectName, path, hashString, storageString])
}
```

Key behaviors:
- Full object access: `useObject('jane-doe')` returns the entire object with overrides applied
- Path access: `useObject('jane-doe', 'profile.name')` returns a nested value
- Exact path override: hash `object.jane-doe.name=Alice` overrides the name field
- Child overrides under a sub-path are merged into the base value
- Returns `undefined` for missing objects or paths (with console warnings/errors)
- Supports hide mode — reads overrides from localStorage shadows when active

## Dependencies

- [`packages/core/src/loader.js`](../../../core/src/loader.js.md) — `loadObject` for loading object data
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath`, `setByPath`, `deepClone` for path resolution and data manipulation
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`, `getAllParams` for hash reading
- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `getShadow`, `getAllShadows` for hide mode support
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot` for reactivity
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot` for hide mode reactivity

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useObject`
- [`packages/react/src/hooks/useObject.test.js`](./useObject.test.js.md) — Test file
