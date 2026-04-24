# `packages/react-primer/src/ThemeSync.jsx`

<!--
source: packages/react-primer/src/ThemeSync.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Invisible React component that bridges the storyboard-core theme store with Primer's `ThemeProvider` context. Subscribes to core theme changes and applies them to Primer's `setColorMode`/`setDayScheme`/`setNightScheme`.

## Composition

```jsx
export default function ThemeSync()
```

Reads theme via `useThemeState()` and sync targets via `useThemeSyncTargets()`. When prototype sync is disabled, forces `'light'`. Maps storyboard theme values to Primer's color mode API:

- `'system'` or falsy → `auto` mode with `light`/`dark` schemes
- Any other value → `day` mode with that value as both day and night scheme

## Dependencies

- `@primer/react` — `useTheme`
- `@dfosco/storyboard-react` — `useThemeState`, `useThemeSyncTargets`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `ThemeSync`
