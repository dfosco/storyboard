# `packages/core/src/modes.test.js`

<!--
source: packages/core/src/modes.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/modes.js`](./modes.js.md). Comprehensive test suite covering the mode registry (register, overwrite warning, insertion order, unregister, default mode protection), `getCurrentMode` (default fallback, URL param reading, unregistered mode rejection), `activateMode` (URL param update, lifecycle hooks, no-op when already active, unregistered mode warning), `deactivateMode` (return to prototype, URL param removal), subscriptions (callback on activate/register, unsubscribe), snapshot changes, event bus (on/emit/off, error catching), modes config (enabled/disabled, reset), and the full tool registry (initTools, wildcard/mode-specific tools, state management, actions, sorting, snapshots).

## Composition

Eight top-level `describe` blocks. Uses `_resetModes()` and URL cleanup in `afterEach`. Tool registry tests use sample tool configs with wildcard (`*`) and mode-specific declarations.

## Dependencies

- [`packages/core/src/modes.js`](./modes.js.md) — Module under test

## Dependents

None — test file.
