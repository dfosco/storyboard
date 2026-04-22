# `packages/core/src/paletteProviders.js`

<!--
source: packages/core/src/paletteProviders.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Adapters that produce searchable item datasets for the command palette. Each provider generates an array of `PaletteItem` objects (`{ id, label, category, icon?, action }`) from different data sources — commands, prototypes, canvases, stories, and recent artifacts. Datasets are built once per palette open and cached; only fuzzy scoring runs per keystroke.

## Composition

**Provider builders:**
- `buildCommandItems(mode, basePath)` — flattens action registry (submenus, toggles, links) into palette items
- `buildPrototypeItems(basePath)` — builds from viewfinder index (handles external prototypes)
- `buildCanvasItems(basePath)` — builds from viewfinder canvas index
- `buildStoryItems(basePath)` — builds from story data index
- `buildRecentItems(basePath)` — builds from localStorage recent artifacts

**Orchestration:**
- `buildAllItems(mode, basePath)` — returns `{ commands, prototypes, canvases, stories, recent }`
- `searchPalette(dataset, query)` — fuzzy-searches all cached datasets, returns grouped results

```js
const dataset = buildAllItems('prototype', '/')
const results = searchPalette(dataset, 'dash')
// → [{ category: 'Prototypes', items: [...] }]
```

## Dependencies

- [`./viewfinder.js`](./viewfinder.js.md) — `buildPrototypeIndex`
- `./loader.js` — `listStories`, `getStoryData`
- `./commandActions.js` — `getActionsForMode`, `executeAction`, `getActionChildren`
- [`./toolStateStore.js`](./toolStateStore.js.md) — `getToolbarToolState` (hides disabled tools)
- [`./recentArtifacts.js`](./recentArtifacts.js.md) — `getRecent`, `trackRecent`
- `./fuzzySearch.js` — `fuzzySearch`

## Dependents

No direct importers found outside tests — consumed internally by the command palette UI.

## Notes

- Empty query shows recent items (up to 5) followed by all commands.
- Per-category max results: commands 5, prototypes 8, canvases 8, stories 5.
- External prototypes open via `window.open` with `_blank` target.
