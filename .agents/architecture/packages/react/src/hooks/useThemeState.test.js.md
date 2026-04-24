# `packages/react/src/hooks/useThemeState.test.js`

<!--
source: packages/react/src/hooks/useThemeState.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useThemeState`](./useThemeState.js.md) and `useThemeSyncTargets`. Verifies theme reading, updates via `setTheme`, and sync target toggling via `setThemeSyncTarget`.

## Composition

- `useThemeState`: returns `{ theme, resolved }`, defaults to system, updates on `setTheme`, reverts to system
- `useThemeSyncTargets`: returns default targets (prototype: true, toolbar: false, codeBoxes: true, canvas: true), updates on `setThemeSyncTarget`

## Dependencies

- [`useThemeState.js`](./useThemeState.js.md), `@dfosco/storyboard-core` (setTheme, setThemeSyncTarget)

## Dependents

None (test file).
