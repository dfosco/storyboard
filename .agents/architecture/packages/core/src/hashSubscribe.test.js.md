# `packages/core/src/hashSubscribe.test.js`

<!--
source: packages/core/src/hashSubscribe.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the hash change subscription system — the core reactive primitive that lets any framework subscribe to URL hash changes. Ensures callbacks fire on `hashchange`, unsubscribe works, multiple subscribers coexist, and `getHashSnapshot` returns the current hash string.

## Composition

**subscribeToHash** — returns unsubscribe function, fires on hashchange, stops after unsubscribe, supports multiple subscribers.

**getHashSnapshot** — returns current `window.location.hash`, empty string when no hash, reflects changes immediately.

```js
const unsub = subscribeToHash(cb)
window.dispatchEvent(new Event('hashchange'))
expect(cb).toHaveBeenCalledTimes(1)
```

## Dependencies

- `./hashSubscribe.js` (`subscribeToHash`, `getHashSnapshot`)

## Dependents

None (test file).
