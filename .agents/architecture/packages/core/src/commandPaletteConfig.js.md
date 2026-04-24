# `packages/core/src/commandPaletteConfig.js`

<!--
source: packages/core/src/commandPaletteConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Runtime store for the `commandPalette` section of `storyboard.config.json`. Provides the palette's declarative section configuration (sections, items, sources). Falls back to the unified [`configStore.js`](./configStore.js.md) if the legacy store wasn't initialized.

## Composition

```js
export function initCommandPaletteConfig(config)  // Seed from storyboard.config.json commandPalette key
export function getCommandPaletteConfig()          // Get config, with configStore fallback
```

## Dependencies

- [`configStore.js`](./configStore.js.md) — `getConfig('commandPalette')` as fallback

## Dependents

- [`index.js`](./index.js.md) — re-exports `getCommandPaletteConfig`
- `mountStoryboardCore.js` — calls `initCommandPaletteConfig()` at startup
