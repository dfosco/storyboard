# `packages/core/src/hideMode.test.js`

<!--
source: packages/core/src/hideMode.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the hide mode system — a presentation feature that hides URL hash overrides from the browser bar while preserving them in a shadow history stack. Covers the toggle lifecycle, undo/redo history, shadow read/write, hash-to-history sync, and the install routine for page refreshes.

## Composition

**Hide mode toggle** — activate clears hash, deactivate restores it, round-trip preserves params.

**History stack** — `pushSnapshot` builds entries, duplicates are ignored, max 200 entries with FIFO trimming.

**Undo/redo** — `canUndo`/`canRedo` state transitions, returns `{route, params}` or null, new push after undo forks timeline.

**Shadow read/write** — `getShadow`/`setShadow`/`removeShadow`/`getAllShadows` operate on the current snapshot's params.

**syncHashToHistory** — skips in hide mode, pushes new snapshot when hash diverges, no-ops when matching.

**installHistorySync** — records initial state, preserves shadow data through hide→refresh→show cycles.

```js
activateHideMode()
setShadow('color', 'blue')
deactivateHideMode()
expect(window.location.hash).toContain('color=blue')
```

## Dependencies

- `./hideMode.js` (all exports: `isHideMode`, `activateHideMode`, `deactivateHideMode`, `pushSnapshot`, `undo`, `redo`, `getOverrideHistory`, `getCurrentIndex`, `canUndo`, `canRedo`, `getShadow`, `setShadow`, `removeShadow`, `getAllShadows`, `syncHashToHistory`, `installHistorySync`)

## Dependents

None (test file).
