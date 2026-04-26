# `packages/core/src/canvasConfig.test.js`

<!--
source: packages/core/src/canvasConfig.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the canvas configuration module — paste rules, terminal resizability, and terminal dimensions with agent-level overrides. Ensures `initCanvasConfig` handles valid configs, missing/undefined/non-array paste rules gracefully, and that `_resetCanvasConfig` clears state.

## Composition

Three describe blocks:

**`canvasConfig`** (6 tests) — paste rule storage:
- Default empty array return from `getPasteRules()`
- Storing paste rules from config
- Graceful handling of missing, undefined, and non-array `pasteRules`
- Reset behavior via `_resetCanvasConfig`

**`isTerminalResizable`** (5 tests) — resizable flag with agent override cascade:
- Defaults to `false` when no config
- Returns `terminal.resizable` when set
- Agent overrides terminal (both enable and disable directions)
- Falls back to terminal config for unknown agent IDs

**`getTerminalDimensions`** (6 tests) — dimension resolution cascade:
- Returns hardcoded fallback defaults (`800×450`) when no config
- Returns terminal-level `defaultWidth`/`defaultHeight`
- Agent overrides terminal dimensions (full and partial)
- Falls back to terminal config for unknown agents
- Custom fallback object support

```js
initCanvasConfig({
  terminal: { defaultWidth: 1000, defaultHeight: 600 },
  agents: { wideAgent: { defaultWidth: 1400 } },
})
expect(getTerminalDimensions('wideAgent')).toEqual({ width: 1400, height: 600 })
```

## Dependencies

- [`./canvasConfig.js`](./canvasConfig.js.md) (`initCanvasConfig`, `getPasteRules`, `isTerminalResizable`, `getTerminalDimensions`, `_resetCanvasConfig`)

## Dependents

None (test file).
