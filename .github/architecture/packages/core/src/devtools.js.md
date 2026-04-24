# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Implements the Storyboard Core UI Bar — a Svelte-based floating toolbar for development. Mounts the `CoreUIBar` Svelte component into the DOM via dynamic `import()` to avoid breaking non-Svelte test environments. Contains the command menu and mode-specific buttons (workshop, etc.). Also injects an accessible skip-link as the first child of `<body>` for keyboard navigation to the toolbar controls. Respects embed mode — skips mounting when `?_sb_embed` is present.

## Composition

**`mountDevTools(options?)`** — Mount the Core UI Bar to the DOM. Idempotent (safe to call multiple times). Accepts `{ container, basePath, toolbarConfig, customHandlers }` options. Skips mounting inside prototype embed iframes.

```js
export async function mountDevTools(options = {}) {
  const container = options.container || document.body
  const basePath = options.basePath || '/'
  if (wrapper) return  // prevent double-mount
  if (new URLSearchParams(window.location.search).has('_sb_embed')) return

  const { mount } = await import('svelte')
  const { default: CoreUIBar } = await import('./CoreUIBar.svelte')

  // Inject accessible skip link as first child of <body>
  skipLink = document.createElement('a')
  skipLink.href = '#storyboard-controls'
  // ...inline focus/blur styles for framework-agnostic styling

  wrapper = document.createElement('div')
  wrapper.id = 'sb-core-ui'
  container.appendChild(wrapper)

  instance = mount(CoreUIBar, {
    target: wrapper,
    props: { basePath, toolbarConfig: options.toolbarConfig, customHandlers: options.customHandlers },
  })
}
```

**`unmountDevTools()`** — Removes the Core UI Bar, skip link, and Svelte instance from the DOM.

**`mountFlowDebug(options?)`** / **`mountSceneDebug(options?)`** — Deprecated aliases for `mountDevTools`.

The skip link uses inline styles (no CSS framework dependency) with focus/blur handlers that toggle visibility — hidden by default via `clip-path: inset(50%)`, visible on focus with a styled card appearance.

## Dependencies

- `svelte` — Dynamic import for `mount`/`unmount` lifecycle
- `./CoreUIBar.svelte` — The Svelte toolbar component (dynamically imported)

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountDevTools` (note: via `devtools-consumer.js`, not directly)
- [`packages/core/src/devtools-consumer.js`](./devtools-consumer.js.md) — Consumer wrapper that delegates to this module
- [`src/index.jsx`](../../../src/index.jsx.md) — Indirectly used via `mountStoryboardCore`

## Notes

- Uses dynamic `import()` for Svelte and CoreUIBar.svelte to avoid breaking non-Svelte test environments (jsdom).
- The skip link is injected as the very first child of `<body>` to ensure it's first in tab order, regardless of where the toolbar wrapper is mounted.
- Skip link inline styles avoid depending on any CSS framework — works in both the source repo and consumer repos.
- The `_sb_embed` query parameter check prevents toolbar mounting inside prototype embed iframes.
