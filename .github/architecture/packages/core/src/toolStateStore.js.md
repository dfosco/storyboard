# `packages/core/src/toolStateStore.js`

<!--
source: packages/core/src/toolStateStore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`toolStateStore.js` manages the runtime visual/interaction state of individual toolbar tools. Each tool can be in one of five states — `active`, `inactive`, `hidden`, `dimmed`, or `disabled` — that control its appearance and interactivity in the UI. Initial states come from `toolbar.config.json`, but application code can change them at runtime via `setToolbarToolState()`.

The store also handles the `localOnly` tool pattern: tools flagged `localOnly` are automatically forced to `disabled` when not running in a local dev environment, regardless of their declared config state. This is the runtime counterpart to the config-level `localOnly` filtering in the [`toolRegistry`](./toolRegistry.js.md).

## Composition

**State constants** — All five valid states exported as a frozen enum:

```js
export const TOOL_STATES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  HIDDEN: 'hidden',
  DIMMED: 'dimmed',
  DISABLED: 'disabled',
})
```

**Initialization** — Seeds states from the `tools` config object. Each tool defaults to `active` unless a `state` property is set in config, or `localOnly` forces `disabled`:

```js
export function initToolbarToolStates(toolsConfig, options = {}) {
  const { isLocalDev = false } = options
  for (const [id, tool] of Object.entries(toolsConfig)) {
    const isLocalOnly = tool.localOnly === true
    _localOnlyFlags.set(id, isLocalOnly)
    if (isLocalOnly && !isLocalDev) {
      _states.set(id, TOOL_STATES.DISABLED)
    } else {
      _states.set(id, tool.state || TOOL_STATES.ACTIVE)
    }
  }
  _notify()
}
```

**Runtime mutation** — Validates against the set of valid states before applying:

```js
export function setToolbarToolState(id, state) {
  if (!VALID_STATES.has(state)) {
    console.warn(`[storyboard] Invalid tool state "${state}" for tool "${id}".`)
    return
  }
  _states.set(id, state)
  _notify()
}
```

**Access** — `getToolbarToolState(id)` returns the current state, defaulting to `'active'` for unknown IDs. `isToolbarToolLocalOnly(id)` checks the localOnly flag.

**Reactivity** — Same pattern as other stores: `subscribeToToolbarToolStates(callback)` and `getToolbarToolStatesSnapshot()` for `useSyncExternalStore`.

## Dependencies

None (zero npm dependencies, framework-agnostic).

## Dependents

- [`packages/core/src/toolStateStore.test.js`](./toolStateStore.test.js.md) — Comprehensive test suite
- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public APIs (`TOOL_STATES`, `initToolbarToolStates`, `setToolbarToolState`, `getToolbarToolState`, `isToolbarToolLocalOnly`, `subscribeToToolbarToolStates`, `getToolbarToolStatesSnapshot`)

## Notes

- `getToolbarToolState()` returns `'active'` for unknown IDs as a safe default — this means tools not yet initialized are treated as visible and clickable.
- `setToolbarToolState()` silently accepts unknown tool IDs (creates an entry), but rejects invalid state values with a console warning.
- The `localOnly` → `disabled` mapping happens only at init time. If `setToolbarToolState()` is called later for a localOnly tool, the new state is accepted without checking the localOnly flag.
- Re-calling `initToolbarToolStates()` fully replaces all previous state (no incremental merge).
