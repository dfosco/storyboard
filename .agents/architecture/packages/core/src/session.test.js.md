# `packages/core/src/session.test.js`

<!--
source: packages/core/src/session.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the URL hash session module — the CRUD interface for reading and writing key-value params stored in `window.location.hash`. This is the foundation of storyboard's state management (all state lives in the URL hash).

## Composition

**getParam** — returns null for empty hash/missing param, reads existing params, handles URL-encoded values.

**setParam** — sets new params, updates existing, preserves other params, converts values to string.

**getAllParams** — returns empty object for empty hash, returns all params.

**removeParam** — removes existing param, preserves others, no-ops for missing param.

```js
window.location.hash = 'a=1&b=2'
setParam('c', '3')
expect(getParam('a')).toBe('1')
expect(getParam('c')).toBe('3')
```

## Dependencies

- `./session.js` (`getParam`, `setParam`, `getAllParams`, `removeParam`)

## Dependents

None (test file).
