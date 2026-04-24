# `packages/react/src/context.jsx`

<!--
source: packages/react/src/context.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The `StoryboardProvider` component — the top-level React context provider for the storyboard data system. It resolves which flow to load based on the current URL (query params, pathname, prototype scope), loads the flow data synchronously from the core data index, and provides it to the component tree via [`StoryboardContext`](./StoryboardContext.js.md).

Also handles canvas page routing, story page routing, document title updates, design modes UI mounting, and error/404 states for missing canvases and stories.

## Composition

**Default export:** `StoryboardProvider({ flowName, sceneName, recordName, recordParam, children })`

**Internal components & helpers:**
- `StoryboardProviderInner` — does the actual work (flow resolution, canvas/story detection)
- `stripBasePath(pathname)` — removes branch prefix + app sub-path from pathname
- `matchCanvasRoute(pathname)` / `matchStoryRoute(pathname)` — look up canvas/story by URL
- `getPrototypeName(pathname)` — extracts first path segment as prototype name
- `getPageFlowName(pathname)` — derives flow name from last path segment

**Module-level setup:** Builds `canvasRouteMap`, `canvasGroupMap`, and `storyRouteMap` at import time from `virtual:storyboard-data-index`.

**Flow resolution order** (in `activeFlowName` useMemo):
1. `?flow=` or `?scene=` query param → use as-is (or scope to prototype)
2. Page-specific flow (e.g. `Example/Forms`)
3. Prototype-named flow (e.g. `Example/example`)
4. Prototype-scoped default (e.g. `Example/default`)
5. Global `default` flow
6. `null` (no flow)

**Context value shape:**
```js
{ data, error, loading: false, flowName, sceneName, prototypeName }
```

## Dependencies

- `react`, `react-router-dom` (useParams, useLocation)
- `virtual:storyboard-data-index` — build-time data from [`data-plugin.js`](./vite/data-plugin.js.md)
- `@dfosco/storyboard-core` — loadFlow, flowExists, findRecord, deepMerge, setFlowClass, resolveFlowName, resolveRecordName, isModesEnabled, installBodyClassSync
- [`StoryboardContext`](./StoryboardContext.js.md)
- `@dfosco/storyboard-core/ui-runtime` (lazy, optional — design modes UI)

## Dependents

- [`packages/react/src/index.js`](./index.js.md) — re-exports as `StoryboardProvider`

## Notes

Canvas and story pages bypass flow loading entirely — they render `CanvasPageLazy` / `StoryPageLazy` with a null-data context. The `CommandPaletteLazy` is always rendered alongside children via `Suspense`. Flow loading is synchronous (no async/await) because the core data index is pre-loaded at build time.
