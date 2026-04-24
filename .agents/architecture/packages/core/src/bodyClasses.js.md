# `packages/core/src/bodyClasses.js`

<!--
source: packages/core/src/bodyClasses.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Synchronizes `<body>` CSS classes with the current storyboard override state and active flow. Override key/value pairs become `sb-{key}--{value}` classes; the active flow becomes `sb-scene--{name}`. Works in both normal mode (URL hash) and hide mode (localStorage shadows). This enables CSS-only conditional styling based on storyboard state.

## Composition

```js
export function syncOverrideClasses()        // Diff + sync sb-{key}--{value} classes on <body>
export function setFlowClass(name)           // Set sb-scene--{name} on <body>, removing previous
export function installBodyClassSync()       // Subscribe to hash + storage changes; returns unsubscribe
export const setSceneClass = setFlowClass    // Deprecated alias
```

Internal helpers: `sanitize(str)` for CSS-safe names, `overrideClass(key, value)` for class construction, `getCurrentOverrideClasses()` to read existing sb- classes from the DOM.

`installBodyClassSync()` runs an initial sync, then subscribes to both `hashchange` and storage events. Also calls `syncFlagBodyClasses()` from the feature flags module on each change.

## Dependencies

- `session.js` — `getAllParams`
- `hideMode.js` — `isHideMode`, `getAllShadows`
- [`hashSubscribe.js`](./hashSubscribe.js.md) — `subscribeToHash`
- `localStorage.js` — `subscribeToStorage`
- [`featureFlags.js`](./featureFlags.js.md) — `syncFlagBodyClasses`

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- `mountStoryboardCore.js` — calls `installBodyClassSync()`
- `bodyClasses.test.js`

## Notes

Override classes use a double-dash separator (`sb-key--value`) to distinguish them from other `sb-` prefixed classes like feature flags (`sb-ff-*`) or flow classes (`sb-scene--*`). The diff algorithm minimizes DOM mutations by comparing desired vs. current class sets.
