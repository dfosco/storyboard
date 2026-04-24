# `packages/core/src/modes.test.js`

<!--
source: packages/core/src/modes.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the modes system — a state machine for switching between app modes (prototype, present, inspect, etc.) with a tool registry, event bus, locked mode support, and URL `?mode=` param synchronization. This is one of the largest test files, covering the full modes lifecycle.

## Composition

**Registry** — `registerMode`/`unregisterMode`, insertion order, overwrite warnings, cannot unregister default mode.

**getCurrentMode** — defaults to `"prototype"`, reads `?mode=` URL param, ignores unregistered modes.

**activateMode** — updates URL param, calls `onDeactivate`/`onActivate` hooks, no-op for already-active, warns for unregistered.

**deactivateMode** — returns to prototype, removes `?mode=` param.

**subscribeToMode / getModeSnapshot** — reactive subscriptions, snapshot changes on mode/registry changes.

**Event bus** — `on`/`off`/`emit` with error isolation.

**Modes config** — `initModesConfig` enable/disable, `_resetModes`.

**Locked mode** — `getLockedMode`, `activateMode` no-op when locked, `isModeSwitcherVisible`.

**Tool registry** — `initTools` seeds from config, wildcard `*` tools in all modes, mode-specific tools scoped, default tool state, `setToolAction`/`setToolState`, `getToolsForMode` sorting (group then order), hidden tool exclusion, `subscribeToTools`/`getToolsSnapshot`.

```js
registerMode('present', { label: 'Present' })
activateMode('present')
expect(getCurrentMode()).toBe('present')
```

## Dependencies

- `./modes.js` (all exports: `registerMode`, `unregisterMode`, `getRegisteredModes`, `getCurrentMode`, `activateMode`, `deactivateMode`, `subscribeToMode`, `getModeSnapshot`, `on`, `off`, `emit`, `initTools`, `setToolAction`, `setToolState`, `getToolState`, `getToolsForMode`, `subscribeToTools`, `getToolsSnapshot`, `initModesConfig`, `isModesEnabled`, `getLockedMode`, `isModeSwitcherVisible`, `_resetModes`)

## Dependents

None (test file).
