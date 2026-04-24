# `packages/core/src/uiConfig.test.js`

<!--
source: packages/core/src/uiConfig.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the UI configuration module that controls which menu items are hidden in the storyboard chrome. Used to declutter the interface by hiding docs, comments, command menu, etc.

## Composition

**initUIConfig** — starts with no hidden items, accepts a `hide` array, handles empty/no-arg config, replaces previous config on re-init.

**isMenuHidden** — returns false for non-hidden menus, true for hidden ones, false when no config set.

**_resetUIConfig** — clears all hidden items.

```js
initUIConfig({ hide: ['docs', 'comments'] })
expect(isMenuHidden('docs')).toBe(true)
expect(isMenuHidden('inspector')).toBe(false)
```

## Dependencies

- `./uiConfig.js` (`initUIConfig`, `isMenuHidden`, `getHiddenItems`, `_resetUIConfig`)

## Dependents

None (test file).
