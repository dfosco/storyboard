# `packages/core/src/featureFlags.js`

<!--
source: packages/core/src/featureFlags.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Feature flag system for storyboard. Flags are defined in `storyboard.config.json` under `"featureFlags"` and initialized at app startup. Read priority: localStorage → config defaults → builtin defaults. Write target: localStorage (persistent per-browser). All localStorage keys are prefixed with `flag.` to avoid collisions with overrides.

Also syncs body classes (`sb-ff-{name}`) for CSS-driven feature gating.

## Composition

```js
const BUILTIN_DEFAULTS = {                        // Always available even without initFeatureFlags
  'canvas-auto-reload': false,
  'prototype-auto-reload': true,
}

export function initFeatureFlags(defaults = {})  // Merge BUILTIN_DEFAULTS + user defaults, seed localStorage
export function getFlag(key)                      // Read flag (localStorage → _defaults → BUILTIN_DEFAULTS)
export function setFlag(key, value)               // Write flag to localStorage
export function toggleFlag(key)                   // Toggle current value
export function getAllFlags()                      // All flags (union of BUILTIN_DEFAULTS + _defaults keys)
export function resetFlags()                      // Remove all localStorage overrides
export function getFlagKeys()                     // Union of BUILTIN_DEFAULTS and _defaults keys
export function syncFlagBodyClasses()             // Sync sb-ff-* classes on <body>
```

`initFeatureFlags` spreads `BUILTIN_DEFAULTS` before user-provided defaults, so user config can override builtins. `getFlag` falls back through `_defaults` → `BUILTIN_DEFAULTS` → `false`. `getAllFlags` and `getFlagKeys` return keys from both sources.

## Dependencies

- `localStorage.js` — `getLocal`, `setLocal`, `removeLocal`, `getAllLocal`

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- [`bodyClasses.js`](./bodyClasses.js.md) — calls `syncFlagBodyClasses()` on hash/storage changes
- `mountStoryboardCore.js` — calls `initFeatureFlags()` at startup
