# `packages/core/src/canvasConfig.test.js`

<!--
source: packages/core/src/canvasConfig.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the canvas configuration module that stores and retrieves paste rules for the canvas widget system. Ensures `initCanvasConfig` handles valid configs, missing/undefined/non-array paste rules gracefully, and that `_resetCanvasConfig` clears state.

## Composition

Single `canvasConfig` describe block covering:
- Default empty array return from `getPasteRules()`
- Storing paste rules from config
- Graceful handling of missing, undefined, and non-array `pasteRules`
- Reset behavior via `_resetCanvasConfig`

```js
initCanvasConfig({ pasteRules: rules })
expect(getPasteRules()).toEqual(rules)
```

## Dependencies

- `./canvasConfig.js` (`initCanvasConfig`, `getPasteRules`, `_resetCanvasConfig`)

## Dependents

None (test file).
