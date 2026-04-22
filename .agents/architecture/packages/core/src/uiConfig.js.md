# `packages/core/src/uiConfig.js`

<!--
source: packages/core/src/uiConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Project-level configuration for hiding specific storyboard chrome elements. Client repos use the `"ui"` key in `storyboard.config.json` with a `"hide"` array to suppress menus or UI sections from the CoreUIBar (e.g., `"docs"`, `"comments"`, `"inspector"`).

## Composition

- `initUIConfig(config?)` — seeds from `{ hide: string[] }`
- `isMenuHidden(key)` — returns `true` if the key is in the hidden set
- `getHiddenItems()` — returns the full array of hidden keys
- `_resetUIConfig()` — test helper

```js
import { isMenuHidden } from './uiConfig.js'
if (!isMenuHidden('comments')) showCommentsButton()
```

## Dependencies

None.

## Dependents

- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — calls `initUIConfig` at startup
- `packages/core/src/CoreUIBar.svelte` — checks visibility of menu items
- `packages/core/src/index.js` — re-exports
