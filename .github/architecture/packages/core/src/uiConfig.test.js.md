# `packages/core/src/uiConfig.test.js`

<!--
source: packages/core/src/uiConfig.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Test suite for [`uiConfig.js`](./uiConfig.js.md), validating the UI visibility configuration system that controls which storyboard chrome elements are shown or hidden. The tests cover initialization with various inputs, the `isMenuHidden()` check, and state reset behavior.

This suite ensures that consumer repos can safely declare hidden menus in `storyboard.config.json` and have them correctly suppressed in the CoreUIBar, including edge cases like empty configs, missing args, and re-initialization.

## Composition

Uses Vitest with `_resetUIConfig()` for test isolation:

```js
afterEach(() => {
  _resetUIConfig()
})
```

**`initUIConfig` tests** — Cover the main initialization paths:

```js
it('accepts a hide array', () => {
  initUIConfig({ hide: ['docs', 'comments'] })
  expect(getHiddenItems()).toEqual(['docs', 'comments'])
})

it('replaces previous config on re-init', () => {
  initUIConfig({ hide: ['docs'] })
  initUIConfig({ hide: ['inspector'] })
  expect(getHiddenItems()).toEqual(['inspector'])
})
```

Also tests empty config (`{}`), no arguments, and default empty state.

**`isMenuHidden` tests** — Validate the boolean check for various menu keys:

```js
it('returns true for hidden menus', () => {
  initUIConfig({ hide: ['docs', 'comments'] })
  expect(isMenuHidden('docs')).toBe(true)
  expect(isMenuHidden('comments')).toBe(true)
})

it('can hide the command menu', () => {
  initUIConfig({ hide: ['command'] })
  expect(isMenuHidden('command')).toBe(true)
})
```

**`_resetUIConfig` tests** — Confirm that reset clears all hidden items:

```js
it('clears all hidden items', () => {
  initUIConfig({ hide: ['docs', 'inspector', 'create'] })
  _resetUIConfig()
  expect(getHiddenItems()).toEqual([])
  expect(isMenuHidden('docs')).toBe(false)
})
```

## Dependencies

- [`packages/core/src/uiConfig.js`](./uiConfig.js.md) — The module under test

## Dependents

None (test file).
