# `packages/core/src/session.js`

<!--
source: packages/core/src/session.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

URL hash-based session state utilities. Override params are stored in the hash fragment (`#key=value&key2=value2`) rather than search params to avoid triggering React Router re-renders. React Router (via generouted) patches `history.replaceState`/`pushState`, so search-param changes cause full route tree re-renders. The hash is invisible to the router, making it the ideal location for storyboard override state.

## Composition

- `getParam(key)` — read a single hash param
- `setParam(key, value)` — write a hash param (uses `window.location.hash` assignment, not `replaceState`)
- `getAllParams()` — all hash params as a plain object
- `removeParam(key)` — delete a hash param

```js
import { setParam, getParam } from './session.js'
setParam('user.name', 'Alice')
getParam('user.name') // → 'Alice'
// URL: /page#user.name=Alice
```

**Internal helpers:**
- `parseHash()` — parses `window.location.hash` into `URLSearchParams`
- `writeHash(params)` — writes `URLSearchParams` back to hash via direct assignment

## Dependencies

None (browser `window.location.hash` only).

## Dependents

- [`./hideMode.js`](./hideMode.js.md) — uses `setParam` to restore hash on deactivate
- `packages/core/src/bodyClasses.js` — reads session params
- `packages/core/src/index.js` — re-exports

## Notes

- Uses `window.location.hash = str` (not `history.replaceState`) deliberately — generouted patches `replaceState` and would trigger a full re-render. Native hash assignment only fires `hashchange` which React Router ignores.
