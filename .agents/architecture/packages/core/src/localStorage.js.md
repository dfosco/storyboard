# `packages/core/src/localStorage.js`

<!--
source: packages/core/src/localStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides a namespaced localStorage API for persistent storyboard overrides. All keys are prefixed with `storyboard:` to avoid collisions with other applications. Includes a reactivity layer with both cross-tab (native `storage` event) and intra-tab (custom `storyboard-storage` event) change notification, making it compatible with React's `useSyncExternalStore`.

## Composition

**CRUD operations:**
- `getLocal(key)` — read a prefixed key, returns `string | null`
- `setLocal(key, value)` — write + notify
- `removeLocal(key)` — delete + notify
- `getAllLocal()` — returns all `storyboard:`-prefixed entries as an unprefixed object

**Reactivity:**
- `subscribeToStorage(callback)` — subscribes to both cross-tab and intra-tab changes; returns unsubscribe function
- `getStorageSnapshot()` — cached serialized snapshot of all entries (for `useSyncExternalStore`)
- `notifyChange()` — fires custom `storyboard-storage` event and invalidates snapshot cache

```js
import { getLocal, setLocal, subscribeToStorage, getStorageSnapshot } from './localStorage.js'
const unsub = subscribeToStorage(() => console.log('changed'))
setLocal('theme', 'dark') // triggers notification
```

## Dependencies

None (uses browser `localStorage` and `window` events directly).

## Dependents

- [`./hideMode.js`](./hideMode.js.md) — uses `getLocal`, `setLocal`, `removeLocal`, `notifyChange` for history stack
- `packages/react/src/hooks/useOverride.js` — subscribes for reactive override reads
- `packages/react/src/hooks/useHideMode.js` — subscribes for hide mode state
- `packages/react/src/hooks/useLocalStorage.js` — generic React hook wrapper
- `packages/react/src/hooks/useSceneData.js`, `packages/react/src/hooks/useRecord.js`, `packages/react/src/hooks/useFeatureFlag.js`
- `packages/react/src/CommandPalette/CommandPalette.jsx`, `packages/react/src/Viewfinder.jsx`
- `packages/tiny-canvas/src/useResetCanvas.js`, `packages/tiny-canvas/src/utils.js`

## Notes

- All read/write operations are wrapped in try/catch for graceful degradation when localStorage is unavailable or full.
- The snapshot cache (`_snapshotCache`) is invalidated on every write or storage event to ensure `useSyncExternalStore` detects changes.
