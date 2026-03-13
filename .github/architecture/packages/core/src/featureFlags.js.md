# `packages/core/src/featureFlags.js`

<!--
source: packages/core/src/featureFlags.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Feature flag system for Storyboard. Flags are defined in `storyboard.config.json` under `"featureFlags"` and initialized at app startup via the Vite data plugin. The system supports a three-tier read priority (URL hash → localStorage → config defaults) and writes to the URL hash for shareability. All flag keys in hash/localStorage are prefixed with `flag.` to avoid collisions with scene overrides. Active flags are also reflected as `sb-ff-{name}` CSS classes on `<body>`.

## Composition

**`initFeatureFlags(defaults)`** — Seeds the flag system with config defaults. Syncs localStorage with config defaults on every call (user overrides live in the URL hash, which is checked first).

```js
export function initFeatureFlags(defaults = {}) {
  _defaults = { ...defaults }
  for (const [key, value] of Object.entries(_defaults)) {
    setLocal(FLAG_PREFIX + key, String(value))
  }
  syncFlagBodyClasses()
}
```

**`getFlag(key)`** — Reads a flag value with priority: hash → localStorage → config default.

**`setFlag(key, value)`** — Writes a flag to URL hash and syncs body classes.

**`toggleFlag(key)`** — Reads current value and writes opposite.

**`getAllFlags()`** — Returns all flags with `{ default, current }` values.

**`resetFlags()`** — Removes all hash and localStorage overrides, reverting to config defaults.

**`getFlagKeys()`** — Returns all registered flag key names.

**`syncFlagBodyClasses()`** — Adds `sb-ff-{name}` for every true flag, removes for every false flag. Called by [`bodyClasses.js`](./bodyClasses.js.md) as part of the body class sync system.

## Dependencies

- [`packages/core/src/session.js`](./session.js.md) — `getParam`, `setParam`, `removeParam`, `getAllParams` for URL hash read/write
- [`packages/core/src/localStorage.js`](./localStorage.js.md) — `getLocal`, `setLocal`, `removeLocal`, `getAllLocal` for localStorage persistence

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md) — Imports `syncFlagBodyClasses` for the combined body class sync
- [`packages/core/src/devtools.js`](./devtools.js.md) — Imports `getAllFlags`, `toggleFlag`, `getFlagKeys` for the feature flags panel
