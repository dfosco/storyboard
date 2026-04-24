# `packages/core/src/canvasConfig.js`

<!--
source: packages/core/src/canvasConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Runtime store for canvas-specific configuration from `storyboard.config.json`'s `"canvas"` key. Holds paste rules (URL-to-widget conversion) and terminal widget settings. Framework-agnostic with zero npm dependencies.

## Composition

```js
export function initCanvasConfig(config = {})  // Seed from storyboard.config.json canvas key
export function getPasteRules()                 // Get configured paste rule objects
export function getTerminalConfig()             // Get terminal widget config (theme, fontSize, etc.)
export function _resetCanvasConfig()            // Test-only reset
```

Internal state: `_pasteRules` (array) and `_terminal` (object).

## Dependencies

None.

## Dependents

- [`index.js`](./index.js.md) — re-exports `initCanvasConfig`, `getPasteRules`, `getTerminalConfig`
- `mountStoryboardCore.js` — calls `initCanvasConfig()` at startup
- `canvasConfig.test.js`
