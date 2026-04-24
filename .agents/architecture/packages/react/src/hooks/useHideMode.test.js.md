# `packages/react/src/hooks/useHideMode.test.js`

<!--
source: packages/react/src/hooks/useHideMode.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useHideMode`](./useHideMode.js.md). Verifies the hook returns `{ isHidden, hide, show }`, starts as not hidden, and correctly toggles hide mode.

## Composition

- Returns correct shape `{ isHidden, hide, show }`
- `isHidden` is false initially
- Calling `hide()` sets `isHidden` to true
- Calling `show()` restores `isHidden` to false

## Dependencies

- [`useHideMode.js`](./useHideMode.js.md), test-utils

## Dependents

None (test file).
