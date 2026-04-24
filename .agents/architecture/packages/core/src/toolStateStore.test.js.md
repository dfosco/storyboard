# `packages/core/src/toolStateStore.test.js`

<!--
source: packages/core/src/toolStateStore.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the toolbar tool state store — manages visibility states (active/inactive/hidden/dimmed/disabled) for toolbar tools, with dev-only vs prod tool distinction, subscription support, and snapshot-based reactivity.

## Composition

**TOOL_STATES** — exports 5 constants: active, inactive, hidden, dimmed, disabled.

**getToolbarToolState** — returns "active" for unknown tools, defaults to active after init.

**initToolbarToolStates** — seeds states from config, defaults to active, dev-only tools disabled in non-local env, legacy `localOnly` support, replaces previous state.

**setToolbarToolState** — updates known/unknown tools, warns on invalid state, notifies subscribers.

**isToolbarToolLocalOnly** — true for dev-only (no prod flag), false for prod/unknown tools.

**subscribeToToolbarToolStates** — fires on state changes, unsubscribe works, multiple subscribers.

**getToolbarToolStatesSnapshot** — string snapshot, changes on mutation, stable without mutation.

**_resetToolbarToolStates** — clears all state and listeners.

```js
initToolbarToolStates({ inspector: { state: 'hidden', prod: true } })
expect(getToolbarToolState('inspector')).toBe('hidden')
```

## Dependencies

- `./toolStateStore.js` (`TOOL_STATES`, `initToolbarToolStates`, `setToolbarToolState`, `getToolbarToolState`, `isToolbarToolLocalOnly`, `subscribeToToolbarToolStates`, `getToolbarToolStatesSnapshot`, `_resetToolbarToolStates`)

## Dependents

None (test file).
