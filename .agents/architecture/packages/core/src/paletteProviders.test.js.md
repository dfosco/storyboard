# `packages/core/src/paletteProviders.test.js`

<!--
source: packages/core/src/paletteProviders.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the command palette data providers that build categorized item lists (commands, prototypes, canvases, stories, recents) and the `searchPalette` function that filters/groups them. Heavily mocks the loader, workspace, commandActions, toolStateStore, and recentArtifacts modules. Mock command actions use `workspace` naming (e.g. `core/workspace`, `Go to Workspace`) — renamed from `viewfinder` in 4.3.0.

## Composition

**buildCommandItems** — produces items from resolved actions, skips structural items (header/footer), flattens submenu children, all items have executable actions.

**buildPrototypeItems** — includes prototypes and external prototypes, sets category to "Prototypes".

**buildCanvasItems** — includes canvases, sets category to "Canvases".

**buildStoryItems** — includes stories from data index, sets category to "Stories".

**buildRecentItems** — includes recent entries, sets category to "Recent".

**searchPalette** — shows Recent + Commands for empty query, filters by query, returns empty on no match.

```js
const groups = searchPalette(dataset, 'button')
const storyGroup = groups.find(g => g.category === 'Stories')
expect(storyGroup.items.some(i => i.label === 'button')).toBe(true)
```

## Dependencies

- `./paletteProviders.js` (`buildCommandItems`, `buildPrototypeItems`, `buildCanvasItems`, `buildStoryItems`, `buildRecentItems`, `buildAllItems`, `searchPalette`)
- Mocked: `./loader.js`, `./commandActions.js`, `./toolStateStore.js`, `./recentArtifacts.js`

## Dependents

None (test file).
