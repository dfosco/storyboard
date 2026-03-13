# `packages/core/src/bodyClasses.js`

<!--
source: packages/core/src/bodyClasses.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Mirrors active overrides and the current scene/flow as CSS classes on `<body>`, enabling CSS-driven state styling. Override keys become `sb-{key}--{value}` classes, the active flow becomes `sb-scene--{name}`, and active feature flags become `sb-ff-{name}` classes. Works in both normal mode (URL hash) and hide mode (localStorage shadows). Diffs against existing classes to minimize DOM mutations.

## Composition

**`syncOverrideClasses()`** — Reads current overrides (from hash or localStorage shadows), computes desired `sb-{key}--{value}` classes, then diffs against existing body classes to add/remove only what changed.

```js
export function syncOverrideClasses() {
  const overrides = isHideMode() ? getAllShadows() : getAllParams()
  const desired = new Set()
  for (const [key, value] of Object.entries(overrides)) {
    if (key && value != null && value !== '') {
      desired.add(overrideClass(key, value))
    }
  }
  // Diff and apply...
}
```

**`setFlowClass(name)`** — Sets the `sb-scene--{name}` class on `<body>`, removing any previous flow class.

**`setSceneClass`** — Deprecated alias for `setFlowClass`.

**`installBodyClassSync()`** — Installs listeners on both hashchange and storage events to keep body classes in sync. Runs an initial sync immediately. Returns an unsubscribe function.

```js
export function installBodyClassSync() {
  syncOverrideClasses()
  syncFlagBodyClasses()
  const sync = () => { syncOverrideClasses(); syncFlagBodyClasses() }
  const unsubHash = subscribeToHash(sync)
  const unsubStorage = subscribeToStorage(sync)
  return () => { unsubHash(); unsubStorage() }
}
```

Internal helpers:
- `sanitize(str)` — Sanitizes strings for CSS class names (dots/spaces → dashes, lowercased, non-alphanumeric stripped)
- `overrideClass(key, value)` — Builds the `sb-{key}--{value}` class name
- `getCurrentOverrideClasses()` — Collects all existing `sb-` classes on body (excluding scene and feature-flag classes)

## Dependencies

- [`packages/core/src/session.js`](./session.js.md) — `getAllParams` for reading hash overrides
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — `isHideMode`, `getAllShadows` for hide mode support
- [`packages/core/src/hashSubscribe.js`](./hashSubscribe.js.md) — `subscribeToHash` for reactive sync
- [`packages/core/src/localStorage.js`](./localStorage.js.md) — `subscribeToStorage` for hide mode sync
- [`packages/core/src/featureFlags.js`](./featureFlags.js.md) — `syncFlagBodyClasses` for feature flag body classes

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `installBodyClassSync`, `setFlowClass`, `syncOverrideClasses`, `setSceneClass`
- [`packages/core/src/bodyClasses.test.js`](./bodyClasses.test.js.md) — Test file
