# `packages/react/package.json`

<!--
source: packages/react/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Package manifest for `@dfosco/storyboard-react` — the React integration layer for Storyboard. This package provides the `StoryboardProvider` context, all data hooks (`useFlowData`, `useOverride`, `useObject`, `useRecord`, `useRecords`, `useFlowLoading`), the Vite data discovery plugin, the hash preserver for client-side routing, the `Viewfinder` navigation component, the `CommandPalette`, the `CanvasPage` component, and canvas widget implementations.

This is the primary package consumed by prototype pages and components. It depends on `@dfosco/storyboard-core` for framework-agnostic data loading and on `@dfosco/tiny-canvas` for the canvas rendering engine.

## Composition

### Identity

- **name:** `@dfosco/storyboard-react`
- **version:** `4.2.0-beta.17`
- **type:** `module`
- **license:** MIT

### Exports Map

```json
"exports": {
    ".": "./src/index.js",
    "./vite": "./src/vite/data-plugin.js",
    "./hash-preserver": "./src/hashPreserver.js",
    "./canvas/CanvasPage": "./src/canvas/CanvasPage.jsx"
}
```

| Export | Purpose |
|--------|---------|
| `.` | Main entry — Provider, hooks, utilities |
| `./vite` | Vite data discovery plugin for `.flow.json`, `.object.json`, etc. |
| `./hash-preserver` | Preserves URL hash across React Router navigations |
| `./canvas/CanvasPage` | Full canvas page component with widget rendering |

### Dependencies

| Package | Purpose |
|---------|---------|
| `@dfosco/storyboard-core` | `4.2.0-beta.17` — Core data loading, hash session |
| `@dfosco/tiny-canvas` | `4.2.0-beta.17` — Canvas rendering engine |
| `@base-ui/react` | ^1.4.0 — Base UI primitives |
| `@neodrag/react` | ^2.3.1 — Drag interaction |
| `glob` | ^11.0.0 — File pattern matching (data plugin) |
| `jsonc-parser` | ^3.3.1 — JSONC parsing |
| `remark` / `remark-gfm` / `remark-html` | Markdown processing for canvas widgets |
| `ansi-to-html` | ANSI escape code to HTML conversion |
| `ghostty-web` | ^0.4.0 — Terminal emulation in canvas |

### Peer Dependencies

```json
"peerDependencies": {
    "@primer/octicons-react": ">=19",
    "react": ">=18",
    "react-router-dom": ">=6",
    "vite": ">=5"
}
```

### Published Files

```json
"files": ["src"]
```

Source is shipped directly — no build step.

## Dependencies

- [`@dfosco/storyboard-core`](../core/package.json.md) — framework-agnostic foundation
- [`@dfosco/tiny-canvas`](../tiny-canvas/package.json.md) — canvas rendering engine

## Dependents

- [`@dfosco/storyboard-react-primer`](../react-primer/package.json.md) — depends on this for hooks
- [`@dfosco/storyboard-react-reshaped`](../react-reshaped/package.json.md) — depends on this for hooks
- [`vite.config.js`](../../vite.config.js.md) — aliases all `@dfosco/storyboard-react/*` imports and uses `data-plugin.js` directly
- [`src/index.jsx`](../../src/index.jsx.md) — imports `installHashPreserver`
- Dozens of files in `src/prototypes/`, `src/components/`, and `packages/react-primer/src/` import hooks and components from this package

## Notes

- `ghostty-web` is listed as a direct dependency but should be treated as optional — the `TerminalWidget` dynamically imports it with `@vite-ignore` and `.catch()` fallback per the project convention for optional/heavy dependencies.
- The `vite` peer dependency (`>=5`) reflects that the data plugin runs as a Vite plugin at build time.
