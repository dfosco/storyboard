# `packages/react/src/hooks/useMode.js`

<!--
source: packages/react/src/hooks/useMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for the design-mode system. Exposes the current active mode, the list of registered modes, and a `switchMode` function. Re-renders when modes change.

## Composition

```js
export function useMode() → { mode, modes, switchMode, currentModeConfig }
```

- `mode` — current active mode name (string)
- `modes` — array of `{ name, label, icon? }` registered mode configs
- `switchMode(name, options?)` — calls core's `activateMode`
- `currentModeConfig` — the config object for the active mode

Uses `useSyncExternalStore(subscribeToMode, getModeSnapshot)` for reactivity.

## Dependencies

- `react` (useCallback, useSyncExternalStore)
- `@dfosco/storyboard-core` — getCurrentMode, getRegisteredModes, activateMode, subscribeToMode, getModeSnapshot

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
