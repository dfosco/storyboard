# `packages/core/src/localStorage.test.js`

<!--
source: packages/core/src/localStorage.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the namespaced localStorage wrapper that prefixes all keys with `storyboard:`, dispatches custom `storyboard-storage` events, and provides a cached snapshot for React `useSyncExternalStore` integration.

## Composition

**getLocal** — reads with `storyboard:` prefix, returns null for missing keys and on errors.

**setLocal** — stores with prefix, converts to string, dispatches `storyboard-storage` event.

**removeLocal** — removes prefixed key, dispatches event.

**getAllLocal** — returns all prefixed entries with prefix stripped, ignores non-storyboard keys.

**subscribeToStorage** — subscribes to both `storyboard-storage` and native `storage` events, returns working unsubscribe.

**getStorageSnapshot** — returns sorted serialized string, caches result, invalidates on storage event.

```js
setLocal('color', 'blue')
expect(localStorage.getItem('storyboard:color')).toBe('blue')
```

## Dependencies

- `./localStorage.js` (`getLocal`, `setLocal`, `removeLocal`, `getAllLocal`, `subscribeToStorage`, `getStorageSnapshot`)

## Dependents

None (test file).
