# `packages/core/src/hashSubscribe.js`

<!--
source: packages/core/src/hashSubscribe.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Minimal helpers for subscribing to URL hash changes. Designed to be compatible with React's `useSyncExternalStore` pattern. Provides the reactive primitive that other modules (body classes, React hooks) build on to respond to hash-based state changes.

## Composition

```js
export function subscribeToHash(callback)  // Add hashchange listener, return unsubscribe fn
export function getHashSnapshot()          // Return window.location.hash (snapshot for useSyncExternalStore)
```

## Dependencies

None (uses browser `window` APIs only).

## Dependents

- [`index.js`](./index.js.md) — re-exports both functions
- [`bodyClasses.js`](./bodyClasses.js.md) — subscribes to hash changes for class sync
- `hashSubscribe.test.js`
