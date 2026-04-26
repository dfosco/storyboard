# `packages/core/src/devtools.test.js`

<!--
source: packages/core/src/devtools.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the command menu (devtools) mount/unmount lifecycle. Mocks the React component to avoid jsdom issues and verifies DOM element creation, custom containers, idempotent mounting, and cleanup on unmount.

## Composition

**mountDevTools** — creates `#sb-command-menu` wrapper in DOM, appends to `document.body` by default, accepts custom container, is idempotent (no double-mount).

**unmountDevTools** — removes the wrapper element from DOM.

```js
await mountDevTools()
expect(document.getElementById('sb-command-menu')).not.toBeNull()
await unmountDevTools()
expect(document.getElementById('sb-command-menu')).toBeNull()
```

Uses `vi.doMock` with `vi.resetModules()` per test for fresh module state.

## Dependencies

- [`./devtools.js`](./devtools.js.md) (`mountDevTools`, `unmountDevTools`)
- Mocked: `react` (`createElement`), `react-dom/client` (`createRoot`), `./CommandMenu.jsx`

## Dependents

None (test file).
