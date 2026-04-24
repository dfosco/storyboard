# `packages/core/src/hideMode.js`

<!--
source: packages/core/src/hideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Hide mode allows the storyboard UI to present a "clean" view by moving override state out of the URL hash and into localStorage. When activated, the URL hash is cleared (making URLs shareable without override clutter), while a parallel localStorage-backed history stack preserves full undo/redo capability. This is the core mechanism behind the `?hide` and `?show` URL param triggers.

The module maintains a localStorage mirror with three keys (`historyState`, `currentState`, `nextState`) that track a chronological stack of snapshots. Each snapshot records `[position, route, paramString]`. Undo/redo navigates this stack, and fresh writes fork the timeline (discarding any redo future). A max history of 200 entries prevents unbounded growth.

## Composition

### Exports

**Hide mode toggle:**
- `isHideMode()` — checks if `__hide__` flag is set in localStorage
- `activateHideMode()` — snapshots current state, sets flag, clears URL hash
- `deactivateHideMode()` — restores snapshot params to URL hash, removes flag

**History stack:**
- `pushSnapshot(paramString?, route?)` — appends a new entry, forks timeline
- `undo()` / `redo()` — navigate the history stack, return `{ route, params }` or `null`
- `canUndo()` / `canRedo()` — boolean availability checks
- `getOverrideHistory()` — full history array
- `getCurrentIndex()` / `getNextIndex()` — current and redo target indices
- `getCurrentSnapshot()` / `getCurrentRoute()` — current entry's params/route

**Shadow read/write (used by `useOverride` in hide mode):**
- `getShadow(key)` / `setShadow(key, value)` / `removeShadow(key)` / `getAllShadows()`

**Sync:**
- `syncHashToHistory()` — syncs localStorage when URL changes externally
- `installHistorySync()` — installs `hashchange`/`popstate` listeners at startup

```js
import { activateHideMode, isHideMode, undo, redo } from './hideMode.js'

if (isHideMode()) {
  const prev = undo()
  if (prev) navigate(prev.route)
}
```

## Dependencies

- [`./localStorage.js`](./localStorage.js.md) — `getLocal`, `setLocal`, `removeLocal`, `notifyChange`
- [`./session.js`](./session.js.md) — `setParam` (for restoring hash on deactivate)

## Dependents

- [`./interceptHideParams.js`](./interceptHideParams.js.md) — calls `activateHideMode`/`deactivateHideMode`
- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — calls `installHistorySync` at startup
- `packages/core/src/bodyClasses.js` — reads `isHideMode`
- `packages/core/src/tools/handlers/devtools.js` — toggles hide mode
- `packages/core/src/index.js` — re-exports
- `packages/core/src/interceptHideParams.test.js`, `packages/core/src/bodyClasses.test.js` — tests

## Notes

- History entries are `[position, route, paramString]` triples stored as JSON in localStorage.
- `MAX_HISTORY` is 200; when exceeded, oldest entries are trimmed and positions re-indexed.
- `syncHashToHistory()` handles adjacent moves (treated as undo/redo) and non-adjacent jumps (truncates history).
