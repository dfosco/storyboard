# `packages/core/src/featureFlags.js`

<!--
source: packages/core/src/featureFlags.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Feature flag system for storyboard. Flags are defined in `storyboard.config.json` under `"featureFlags"` and initialized at app startup. Read priority: localStorage → config defaults. Write target: localStorage (persistent per-browser). All localStorage keys are prefixed with `flag.` to avoid collisions with overrides.

Also syncs body classes (`sb-ff-{name}`) for CSS-driven feature gating.

## Composition

```js
export function initFeatureFlags(defaults = {})  // Seed defaults, write to localStorage if missing
export function getFlag(key)                      // Read flag (localStorage → default)
export function setFlag(key, value)               // Write flag to localStorage
export function toggleFlag(key)                   // Toggle current value
export function getAllFlags()                      // All flags with default + current values
export function resetFlags()                      // Remove all localStorage overrides
export function getFlagKeys()                     // All registered flag keys
export function syncFlagBodyClasses()             // Sync sb-ff-* classes on <body>
```

## Dependencies

- `localStorage.js` — `getLocal`, `setLocal`, `removeLocal`, `getAllLocal`

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- [`bodyClasses.js`](./bodyClasses.js.md) — calls `syncFlagBodyClasses()` on hash/storage changes
- `mountStoryboardCore.js` — calls `initFeatureFlags()` at startup
