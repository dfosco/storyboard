# `packages/core/src/bodyClasses.test.js`

<!--
source: packages/core/src/bodyClasses.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md). Validates override body classes (adding, removing stale, clearing, sanitization of dot-notation keys and special characters, skipping empty values, updating on value change), flow body classes (setting, replacing, removing, non-interference with overrides), the deprecated `setSceneClass` alias, hide mode body classes, and `installBodyClassSync` (initial sync, unsubscribe function).

## Composition

Six `describe` blocks covering override classes, non-override `sb-*` class preservation (e.g. `sb-comment-mode`, `sb-ff-*`), flow classes, `setSceneClass` alias, hide mode, and `installBodyClassSync`. Uses a `getSbClasses()` helper to collect all `sb-` prefixed classes from `document.body`. `beforeEach` clears all body classes and resets hash/hide mode state.

## Dependencies

- [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md) — Module under test
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — `activateHideMode`, `deactivateHideMode`, `setShadow` for hide mode tests

## Dependents

None — test file.
