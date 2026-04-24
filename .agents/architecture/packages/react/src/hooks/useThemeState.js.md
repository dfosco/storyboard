# `packages/react/src/hooks/useThemeState.js`

<!--
source: packages/react/src/hooks/useThemeState.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hooks for the global storyboard theme system. `useThemeState` returns the current theme (`"system"`, `"dark"`, etc.) and its resolved concrete value. `useThemeSyncTargets` returns which UI surfaces (prototype, toolbar, codeBoxes, canvas) follow the global theme.

## Composition

```js
export function useThemeState() → { theme: string, resolved: string }
export function useThemeSyncTargets() → { prototype, toolbar, codeBoxes, canvas }
```

Both use `useSyncExternalStore` with module-level snapshot caches that subscribe to core's `themeState` and `themeSyncState` stores at import time.

Pattern:
```js
let _themeSnapshot = null
themeState.subscribe((s) => { _themeSnapshot = s })
function getThemeSnapshot() { return _themeSnapshot }
```

## Dependencies

- `react` (useSyncExternalStore)
- `@dfosco/storyboard-core` — themeState, themeSyncState

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports both hooks
