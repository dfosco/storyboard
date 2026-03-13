# `packages/react/src/hooks/useMode.js`

<!--
source: packages/react/src/hooks/useMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for the design-mode system. Wraps the core mode registry with `useSyncExternalStore` so the component re-renders whenever the active mode or the set of registered modes changes. Returns the current mode name, all registered modes, a `switchMode` function, and the current mode's config object.

## Composition

```js
export function useMode() {
  const snapshot = useSyncExternalStore(subscribeToMode, getModeSnapshot)
  void snapshot  // only used to trigger re-renders

  const mode = getCurrentMode()
  const modes = getRegisteredModes()
  const currentModeConfig = modes.find((m) => m.name === mode)

  const switchMode = useCallback((name, options) => {
    activateMode(name, options)
  }, [])

  return { mode, modes, switchMode, currentModeConfig }
}
```

## Dependencies

- [`packages/core/src/modes.js`](../../../core/src/modes.js.md) — `getCurrentMode`, `getRegisteredModes`, `activateMode`, `subscribeToMode`, `getModeSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useMode`
