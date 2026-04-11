# `packages/core/src/modes.test.js`

<!--
source: packages/core/src/modes.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/modes.js`](./modes.js.md). Comprehensive test suite covering the mode registry (register, overwrite warning, insertion order, unregister, default mode protection), `getCurrentMode` (default fallback, URL param reading, unregistered mode rejection), `activateMode` (URL param update, lifecycle hooks, no-op when already active, unregistered mode warning), `deactivateMode` (return to prototype, URL param removal), subscriptions (callback on activate/register, unsubscribe), snapshot changes, event bus (on/emit/off, error catching), modes config (enabled/disabled, reset, default-enabled when no args), locked mode (locked mode getter, `getCurrentMode` with locked mode, fallback when locked mode not registered, `activateMode` no-op when locked, `isModeSwitcherVisible` visibility logic, reset clears locked state), and the full tool registry (initTools, wildcard/mode-specific tools, mode merging, state management with partial updates, actions, sorting by group and order, hidden tool exclusion, snapshots, undeclared tool warnings).

## Composition

Nine top-level `describe` blocks. Uses `_resetModes()` and URL cleanup in `afterEach`. Tool registry tests use sample tool configs with wildcard (`*`) and mode-specific declarations. Locked mode tests validate the interaction between `initModesConfig`, `getCurrentMode`, and `activateMode`.

## Dependencies

- [`packages/core/src/modes.js`](./modes.js.md) — Module under test

## Dependents

None — test file.
