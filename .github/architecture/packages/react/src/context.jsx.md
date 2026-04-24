# `packages/react/src/context.jsx`

<!--
source: packages/react/src/context.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The `StoryboardProvider` component is the top-level data provider for the storyboard system in React. It loads flow data into React context, making it available to all child components via hooks like `useSceneData`, `useOverride`, and `useRecord`. It handles flow name resolution with prototype scoping (from `?flow=` URL param, prop, page-matching, or default), record data merging for dynamic routes, automatic body class sync installation, and conditional design modes UI mounting.

This component is the bridge between the framework-agnostic core ([`packages/core/src/loader.js`](../../core/src/loader.js.md)) and the React rendering tree.

## Composition

```js
export default function StoryboardProvider({ flowName, sceneName, recordName, recordParam, children }) {
  const location = useLocation()
  const params = useParams()

  // Canvas route detection — matches current URL against registered canvas routes
  const canvasName = useMemo(() => matchCanvasRoute(location.pathname), [location.pathname])

  const searchParams = new URLSearchParams(location.search)
  const sceneParam = searchParams.get('flow') || searchParams.get('scene')
  const prototypeName = getPrototypeName(location.pathname)
  const pageFlow = getPageFlowName(location.pathname)

  // Resolve flow name with prototype scoping (skip for canvas pages)
  const activeFlowName = useMemo(() => {
    if (canvasName) return null
    const requested = sceneParam || flowName || sceneName
    if (requested) {
      // Allow fully-scoped flow names without re-prefixing
      if (requested.includes('/')) return requested
      return resolveFlowName(prototypeName, requested)
    }
    // 1. Page-specific flow (e.g., Example/Forms)
    // 2. Prototype flow — named after the prototype folder
    // 3. Prototype-scoped default (e.g. Example/default)
    // 4. Global default — or null if no flow exists
  }, [canvasName, sceneParam, flowName, sceneName, prototypeName, pageFlow])

  useEffect(() => installBodyClassSync(), [])

  // Mount design modes UI when enabled
  useEffect(() => {
    if (!isModesEnabled()) return
    import('@dfosco/storyboard-core/ui-runtime').then(({ mountDesignModes }) => {
      cleanup = mountDesignModes()
    })
    return () => cleanup?.()
  }, [])

  // Skip flow loading for canvas pages and flow-less pages
  const { data, error } = useMemo(() => {
    if (canvasName) return { data: null, error: null }
    if (!activeFlowName) return { data: {}, error: null }
    let flowData = loadFlow(activeFlowName)
    if (recordName && recordParam && params[recordParam]) {
      const resolvedRecord = resolveRecordName(prototypeName, recordName)
      const entry = findRecord(resolvedRecord, params[recordParam])
      if (entry) flowData = deepMerge(flowData, { record: entry })
    }
    setFlowClass(activeFlowName)
    return { data: flowData, error: null }
  }, [canvasName, activeFlowName, recordName, recordParam, params, prototypeName])
}
```

Internal helpers:
- `getPrototypeName(pathname)` — Derives prototype scope from pathname (`/Dashboard/sub` → `"Dashboard"`)
- `getPageFlowName(pathname)` — Derives flow name from pathname (`/Overview` → `"Overview"`, `/` → `"index"`)
- `matchCanvasRoute(pathname)` — Matches URL against registered canvas routes built from `virtual:storyboard-data-index` canvas entries
- `canvasRouteMap` — A `Map` built at module load from canvas data, mapping route paths to canvas names

**Canvas rendering path:** When `canvasName` is matched, the provider skips flow loading entirely and renders `<CanvasPageLazy>` (lazy-loaded) inside a `<Suspense>` boundary with a null context value for flow data.

Flow resolution priority (for non-canvas pages): `?flow=` param (with `?scene=` alias) → `flowName`/`sceneName` prop → page-matching flow → prototype-named flow → prototype-scoped `"default"` → global `"default"` → `null`. Fully-scoped flow names (containing `/`) are passed through without re-prefixing.

Side-effect import: `virtual:storyboard-data-index` seeds the core data index via `init()` and provides `canvases` data.

Context value includes `prototypeName` for scoped record/flow resolution in child hooks.

On error, renders an inline error banner with a link to the current URL and a homepage link.

## Dependencies

- [`packages/core/src/loader.js`](../../core/src/loader.js.md) — `loadFlow`, `flowExists`, `findRecord`, `deepMerge`, `resolveFlowName`, `resolveRecordName`
- [`packages/core/src/bodyClasses.js`](../../core/src/bodyClasses.js.md) — `setFlowClass`, `installBodyClassSync` for body class management
- [`packages/core/src/modes.js`](../../core/src/modes.js.md) — `isModesEnabled` for conditional modes UI mounting
- [`packages/react/src/StoryboardContext.js`](./StoryboardContext.js.md) — React context object
- [`packages/react/src/canvas/CanvasPage.jsx`](./canvas/CanvasPage.jsx.md) — Lazy-loaded canvas page component
- `virtual:storyboard-data-index` — Generated by [`packages/react/src/vite/data-plugin.js`](./vite/data-plugin.js.md); provides `canvases` for route matching
- `react-router-dom` — `useParams`, `useLocation` for routing

## Dependents

- [`packages/react/src/index.js`](./index.js.md) — Re-exports as `StoryboardProvider`
- [`src/pages/_app.jsx`](../../../src/pages/_app.jsx.md) — Wraps the entire app

## Notes

- Uses `useLocation()` from react-router-dom for pathname and search params.
- The `prototypeName` is derived from the pathname's first segment and passed into context for scoped name resolution in child hooks.
- Auto-installs body class sync (sb-key--value classes on `<body>`) via `useEffect`.
- Conditionally mounts the design modes UI via dynamic import of `@dfosco/storyboard-core/ui-runtime` when `isModesEnabled()` returns true, with graceful degradation if unavailable.
- The `pageFlow` auto-matching allows pages to have matching flow files without explicit configuration.
- Canvas pages are detected via a pre-built `canvasRouteMap` and receive a separate rendering path with `<Suspense>` + lazy-loaded `CanvasPage` — no flow data is loaded for canvas routes.
- Fully-scoped flow names (containing `/`) from URL params or widgets are passed through without re-prefixing to avoid double-scoping (e.g. `"Proto/flow"` does not become `"Proto/Proto/flow"`).
