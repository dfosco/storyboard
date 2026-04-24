# `packages/core/src/toolStateStore.test.js`

<!--
source: packages/core/src/toolStateStore.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Comprehensive test suite for [`toolStateStore.js`](./toolStateStore.js.md), validating the five-state tool lifecycle, localOnly behavior, subscription reactivity, and snapshot versioning. The tests ensure that tool state initialization, runtime mutations, and edge cases (unknown IDs, invalid states, re-initialization) all behave correctly.

This is a critical test file because the tool state store drives toolbar UI rendering — bugs here would cause tools to appear/disappear incorrectly or become unclickable in production.

## Composition

The suite uses Vitest and resets state after each test via the `_resetToolbarToolStates()` test helper:

```js
afterEach(() => {
  _resetToolbarToolStates()
})
```

**TOOL_STATES constants** — Verifies all 5 states are exported correctly:

```js
it('exports all 5 state constants', () => {
  expect(TOOL_STATES.ACTIVE).toBe('active')
  expect(TOOL_STATES.INACTIVE).toBe('inactive')
  expect(TOOL_STATES.HIDDEN).toBe('hidden')
  expect(TOOL_STATES.DIMMED).toBe('dimmed')
  expect(TOOL_STATES.DISABLED).toBe('disabled')
})
```

**Initialization tests** — Cover seeding from config, default `active` state, config-declared states, `localOnly` + `isLocalDev` interactions, empty config, and re-initialization:

```js
it('localOnly + !isLocalDev → disabled (overrides config state)', () => {
  initToolbarToolStates(
    { devTool: { localOnly: true, state: 'active' } },
    { isLocalDev: false },
  )
  expect(getToolbarToolState('devTool')).toBe('disabled')
})
```

**Runtime mutation tests** — Validate state updates for known and unknown tools, invalid state rejection with console warning, and subscriber notification:

```js
it('warns on invalid state value', () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  setToolbarToolState('inspector', 'bogus')
  expect(spy).toHaveBeenCalledOnce()
})
```

**Subscription tests** — Verify callback invocation on changes, unsubscribe cleanup, and multiple simultaneous subscribers.

**Snapshot tests** — Confirm the snapshot version string changes on mutation and remains stable without mutation.

**Reset tests** — Ensure `_resetToolbarToolStates()` clears all state and listeners completely.

## Dependencies

- [`packages/core/src/toolStateStore.js`](./toolStateStore.js.md) — The module under test

## Dependents

None (test file).

## Notes

- Tests use `vi.spyOn(console, 'warn')` to verify warning behavior without polluting test output.
- The re-init test confirms that calling `initToolbarToolStates()` a second time fully replaces (not merges) the previous state.
