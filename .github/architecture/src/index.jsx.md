# `src/index.jsx`

<!--
source: src/index.jsx
category: entry
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

Application entry point. Creates the React root, sets up the browser router with `import.meta.env.BASE_URL` as basename, installs the hash preserver, mounts the storyboard core UI (toolbar, devtools, body class sync, etc.) via `mountStoryboardCore`, and renders the app wrapped in Primer's `ThemeProvider` with `colorMode="auto"`. Handles post-canvas-creation redirects via a `?redirect=` URL parameter that survives Vite full-reloads.

## Composition

```jsx
// Canvas creation redirect — survives Vite full-reloads
const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  window.location.replace(base + redirectParam)
}

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })

installHashPreserver(router, import.meta.env.BASE_URL)
mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })

root.render(
  <StrictMode>
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        <ThemeSync />
        <RouterProvider router={router} />
      </BaseStyles>
    </ThemeProvider>
  </StrictMode>
)
```

`mountStoryboardCore` is the single entry point that orchestrates all core integrations (hide param listener, history sync, body class sync, devtools, comments, etc.). `ThemeSync` from `@dfosco/storyboard-react-primer` synchronizes Primer's color mode with the storyboard system.

## Dependencies

- [`packages/react/src/hashPreserver.js`](../packages/react/src/hashPreserver.js.md) — `installHashPreserver`
- [`packages/core/src/mountStoryboardCore.js`](../packages/core/src/mountStoryboardCore.js.md) — `mountStoryboardCore` (single entry point for all core integrations)
- [`packages/react-primer/src/index.js`](../packages/react-primer/src/index.js.md) — `ThemeSync`
- `@generouted/react-router` — `routes` for file-based routing
- `@primer/react` — `ThemeProvider`, `BaseStyles`
- `react-router-dom` — `RouterProvider`, `createBrowserRouter`
- `storyboard.config.json` — Storyboard project configuration
- Global CSS: `reset.css`, `fonts.css`, `globals.css`, `tailwind.css`
- `@dfosco/storyboard-core/comments/ui/comment-layout.css` — Comment layout styles

## Dependents

- [`index.html`](../index.html) — Script entry point (`<script type="module" src="/src/index.jsx">`)
