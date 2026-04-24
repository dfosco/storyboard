# `packages/core/src/devtools.test.js`

<!--
source: packages/core/src/devtools.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/devtools.js`](./devtools.js.md). Validates the Core UI Bar Svelte component mount lifecycle — wrapper element creation, container targeting, idempotency (double-mount prevention), and unmount cleanup. Mocks `svelte` and `./CommandMenu.svelte` to avoid jsdom lifecycle issues with Svelte components.

## Composition

Uses `vi.mock` to stub `svelte` (`mount`/`unmount`) and `./CommandMenu.svelte`. Each test uses `vi.resetModules()` and `vi.doMock()` in `beforeEach` for fresh module state. Tests cover:
- Wrapper element creation (`#sb-command-menu`)
- Default container (document.body) and custom container mounting
- Double-mount idempotency (only one wrapper created)
- `unmountDevTools` removes the wrapper element

```js
vi.mock('svelte', () => ({
  mount: vi.fn(() => ({})),
  unmount: vi.fn(),
}))
vi.mock('./CommandMenu.svelte', () => ({ default: {} }))
```

## Dependencies

- [`packages/core/src/devtools.js`](./devtools.js.md) — Module under test
- `vitest` — Test framework

## Dependents

None — test file.
