# `packages/core/src/canvasConfig.js`

<!--
source: packages/core/src/canvasConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Runtime store for canvas-specific configuration from `storyboard.config.json`'s `"canvas"` key. Holds paste rules (URL-to-widget conversion), terminal widget settings, and per-agent overrides (resizability, default dimensions). Framework-agnostic with zero npm dependencies.

## Composition

```js
export function initCanvasConfig(config = {})                      // Seed from canvas key (pasteRules, terminal, agents)
export function getPasteRules()                                     // Get configured paste rule objects
export function getTerminalConfig()                                 // Get terminal widget config (theme, fontSize, etc.)
export function getAgentsConfig()                                   // Get agent config object (keyed by agent ID)
export function isTerminalResizable(agentId = null)                 // Agent-level resizable overrides terminal.resizable
export function getTerminalDimensions(agentId = null, fallback?)    // Effective dimensions: agent > terminal > fallback
export function _resetCanvasConfig()                                // Test-only reset
```

Internal state: `_pasteRules` (array), `_terminal` (object), and `_agents` (object).

**Dimension cascade:** `getTerminalDimensions` resolves `defaultWidth`/`defaultHeight` through a three-layer cascade: agent config → terminal config → provided fallback (defaults `{ width: 800, height: 450 }`).

## Dependencies

None.

## Dependents

- [`index.js`](./index.js.md) — re-exports `initCanvasConfig`, `getPasteRules`, `getTerminalConfig`, `getAgentsConfig`, `isTerminalResizable`, `getTerminalDimensions`
- `mountStoryboardCore.js` — calls `initCanvasConfig()` at startup
- [`canvasConfig.test.js`](./canvasConfig.test.js.md)
