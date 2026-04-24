# `packages/core/src/bodyClasses.test.js`

<!--
source: packages/core/src/bodyClasses.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the body class management system that synchronizes URL hash overrides, flow names, and hide mode shadows into `sb-*` CSS classes on `document.body`. These tests ensure the DOM class list stays in sync with storyboard state — critical for CSS-driven theming and layout switching.

## Composition

**Override body classes** — verifies `syncOverrideClasses()` adds `sb-{key}--{value}` classes from hash params, removes stale classes, sanitizes dots/special chars, and skips empty values:
```js
window.location.hash = '#theme=dark&sidebar=collapsed'
syncOverrideClasses()
expect(getSbClasses()).toContain('sb-theme--dark')
```

**Non-override sb-\* classes** — ensures non-override classes like `sb-comment-mode` and `sb-ff-*` feature flags survive sync cycles.

**Flow body classes** — tests `setFlowClass()` adds/replaces `sb-scene--{name}` classes without interfering with overrides.

**setSceneClass (deprecated alias)** — confirms `setSceneClass === setFlowClass`.

**Hide mode body classes** — verifies shadow overrides reflect as body classes.

**installBodyClassSync** — tests initial sync on install and unsubscribe teardown.

## Dependencies

- `./bodyClasses.js` (`syncOverrideClasses`, `setFlowClass`, `setSceneClass`, `installBodyClassSync`)
- `./hideMode.js` (`activateHideMode`, `deactivateHideMode`, `setShadow`)

## Dependents

None (test file).
