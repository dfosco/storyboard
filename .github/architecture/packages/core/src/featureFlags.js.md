# `packages/core/src/featureFlags.js`

<!--
source: packages/core/src/featureFlags.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Feature flag system for Storyboard. Flags are defined in `storyboard.config.json` under `"featureFlags"` and initialized at app startup via [`mountStoryboardCore.js`](./mountStoryboardCore.js.md). The system supports a two-tier read priority (localStorage → config defaults) and writes to localStorage for persistence. All flag keys in localStorage are prefixed with `flag.` to avoid collisions with scene overrides. Active flags are also reflected as `sb-ff-{name}` CSS classes on `<body>`.

## Composition

**`initFeatureFlags(defaults)`** — Seeds the flag system with config defaults. Only writes a default to localStorage when no user override exists yet, so toggled values survive across reloads.

```js
export function initFeatureFlags(defaults = {}) {
  _defaults = { ...defaults }
  for (const [key, value] of Object.entries(_defaults)) {
    if (getLocal(FLAG_PREFIX + key) === null) {
      setLocal(FLAG_PREFIX + key, String(value))
    }
  }
  syncFlagBodyClasses()
}
```

**`getFlag(key)`** — Reads a flag value with priority: localStorage → config default.

**`setFlag(key, value)`** — Writes a flag to localStorage and syncs body classes.

**`toggleFlag(key)`** — Reads current value and writes opposite.

**`getAllFlags()`** — Returns all flags with `{ default, current }` values.

**`resetFlags()`** — Removes all localStorage overrides, reverting to config defaults.

**`getFlagKeys()`** — Returns all registered flag key names.

**`syncFlagBodyClasses()`** — Adds `sb-ff-{name}` for every true flag, removes for every false flag. Called by [`bodyClasses.js`](./bodyClasses.js.md) as part of the body class sync system.

## Dependencies

- [`packages/core/src/localStorage.js`](./localStorage.js.md) — `getLocal`, `setLocal`, `removeLocal`, `getAllLocal` for localStorage persistence

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md) — Imports `syncFlagBodyClasses` for the combined body class sync
- [`packages/core/src/mountStoryboardCore.js`](./mountStoryboardCore.js.md) — Calls `initFeatureFlags` at app startup
- `packages/core/src/tools/handlers/featureFlags.js` — Feature flags tool handler
- `packages/core/src/tools/registry.js` — Tool registry references feature flags
