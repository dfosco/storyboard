# `packages/react-primer/src/DevTools/DevTools.jsx`

<!--
source: packages/react-primer/src/DevTools/DevTools.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Storyboard DevTools — a floating toolbar rendered during development. Provides quick actions: viewing the current flow's data as JSON, resetting all URL hash params, navigating to the viewfinder, and toggling feature flags. Uses a custom dropdown menu (not Primer ActionMenu) so view-swapping and flag toggling don't auto-close the panel.

The toolbar is toggled with `Cmd+.` and renders as a fixed-position beaker icon in the corner. It is **not** exported from the package barrel (`index.js`) — it's imported directly from the sub-path.

## Composition

```jsx
export default function DevTools() { ... }
```

**State:** `visible`, `menuOpen`, `panelOpen`, `flagsPanelOpen`, `sceneData`, `sceneError` — all via `useState`.

**Key behaviors:**

- `Cmd+.` keyboard shortcut toggles toolbar visibility
- Outside-click closes the dropdown (via `mousedown` listener)
- "Show flow info" loads the current flow with `loadFlow()` and displays as formatted JSON in an overlay panel
- "Reset all params" clears `window.location.hash`
- "See viewfinder" navigates to the viewfinder page
- "Feature Flags" opens a `FeatureFlagsPanel` (shown only when flags exist via `getFlagKeys()`)

**Helper:**

```js
function getFlowName() {
  const p = new URLSearchParams(window.location.search)
  return p.get('flow') || p.get('scene') || 'default'
}
```

## Dependencies

- `@dfosco/storyboard-core` — `loadFlow`, `getFlagKeys`
- `@primer/octicons-react` — `BeakerIcon`, `InfoIcon`, `SyncIcon`, `XIcon`, `ScreenFullIcon`, `ZapIcon`
- `./DevTools.module.css` — CSS Modules styles
- `./FeatureFlagsPanel.jsx` — feature flags sub-panel

## Dependents

- Not exported from the package barrel. Imported directly by consumers needing the DevTools overlay (currently internal/prototype use only).
- `./FeatureFlagsPanel.jsx` shares the `DevTools.module.css` styles.

## Notes

- Uses `mousedown` (not `click`) for outside-click detection to fire before React re-renders remove DOM elements.
- The `?scene=` query param is supported as a legacy alias for `?flow=`.
