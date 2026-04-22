# `packages/core/package.json`

<!--
source: packages/core/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Package manifest for `@dfosco/storyboard-core` — the framework-agnostic foundation of the Storyboard system. This package provides the CLI (`storyboard` / `sb`), data loading (flows, objects, records), URL hash session management, canvas materialization, the core UI runtime (Svelte-based toolbar, viewfinder, design modes), comments system, inspector, workshop, and Vite server plugin. It has zero React dependencies and can be consumed by any frontend framework.

This is the largest and most central package in the monorepo, with ~20 export sub-paths covering everything from data utilities to visual tooling.

## Composition

### Identity

- **name:** `@dfosco/storyboard-core`
- **version:** `4.2.0-alpha.16`
- **type:** `module`
- **license:** MIT

### CLI Binaries

```json
"bin": {
    "storyboard-scaffold": "./src/scaffold.js",
    "storyboard": "./src/cli/index.js",
    "sb": "./src/cli/index.js"
}
```

The `storyboard` / `sb` CLI wraps Vite dev, proxy management, worktree support, and canvas operations.

### Exports Map

The package exposes ~20 sub-path exports:

| Export | Source | Purpose |
|--------|--------|---------|
| `.` | `./src/index.js` | Main entry — `mountStoryboardCore`, data loaders, hash session |
| `./toolbar.config.json` | Config | Toolbar tool definitions |
| `./widgets.config.json` | Config | Canvas widget type definitions |
| `./paste.config.json` | Config | Paste handler configuration |
| `./commandpalette.config.json` | Config | Command palette actions |
| `./ui-runtime` | `./dist/storyboard-ui.js` | Pre-compiled Svelte UI bundle |
| `./ui-runtime/style.css` | `./dist/storyboard-ui.css` | UI bundle styles |
| `./canvas/materializer` | `./src/canvas/materializer.js` | JSONL canvas state materializer |
| `./canvas/collision` | `./src/canvas/collision.js` | Widget collision detection |
| `./canvas/identity` | `./src/canvas/identity.js` | Widget ID generation |
| `./vite/server` | `./src/vite/server-plugin.js` | Vite dev server plugin |
| `./comments` | `./src/comments/index.js` | Comments system core |
| `./comments/svelte` | `./src/comments/ui/index.js` | Comments Svelte UI |
| `./comments/ui/comment-layout.css` | CSS | Comment layout styles |
| `./workshop/ui/mount.js` | `./src/workshop/ui/mount.ts` | Workshop UI mount point |
| `./modes.css` | `./src/modes.css` | Design mode CSS |
| `./svelte-plugin-ui` | `./src/svelte-plugin-ui/index.ts` | Svelte plugin UI entry |
| `./ui/design-modes` | `./src/ui/design-modes.ts` | Design mode switching |
| `./ui/viewfinder` | `./src/ui/viewfinder.ts` | Viewfinder navigation |
| `./config` | `./src/configSchema.js` | Config schema validation |
| `./inspector/highlighter` | `./src/inspector/highlighter.js` | DOM element highlighter |
| `./smooth-corners` | `./src/smoothCorners.js` | Smooth corner rendering |
| `./worktree/port` | `./src/worktree/port.js` | Worktree port allocation |

### Dependencies

| Package | Purpose |
|---------|---------|
| `@clack/prompts` | CLI interactive prompts |
| `@primer/octicons` | SVG icons (non-React, for Svelte UI) |
| `feather-icons` | Additional icon set |
| `highlight.js` | Code syntax highlighting |
| `html-to-image` | Canvas snapshot capture |
| `iconoir` | Icon set |
| `jsonc-parser` | JSONC parsing (comments in JSON) |
| `ws` | WebSocket server for dev tools |

### Dev Dependencies

Svelte toolchain (`svelte`, `@sveltejs/vite-plugin-svelte`), Tailwind CSS (`tailwindcss`, `@tailwindcss/cli`, `@tailwindcss/vite`), Svelte UI libraries (`bits-ui`, `shadcn-svelte`), and styling utilities (`clsx`, `tailwind-merge`, `tailwind-variants`).

### Optional Dependencies

```json
"optionalDependencies": {
    "node-pty": "^1.0.0"
}
```

Required only for terminal widget functionality — consumers without `node-pty` still get all other features.

### Build Scripts

| Script | Purpose |
|--------|---------|
| `build:css` | Compile Tailwind CSS to `dist/tailwind.css` |
| `build:ui` | Build externalized Svelte UI bundle via `vite.ui.config.js` |
| `prepublishOnly` | Runs both builds before npm publish |
| `check:imports` | Ensures no `$lib/` imports leaked into source |

## Dependencies

This package has no internal workspace dependencies — it is the foundation layer.

## Dependents

- [`@dfosco/storyboard-react`](../react/package.json.md) — depends on `@dfosco/storyboard-core` (version `4.2.0-alpha.16`)
- [`vite.config.js`](../../vite.config.js.md) — aliases all `@dfosco/storyboard-core/*` imports to local source
- [`src/index.jsx`](../../src/index.jsx.md) — imports `mountStoryboardCore` and comment layout CSS
- Dozens of files across `packages/react/src/`, `packages/react-primer/src/`, and `packages/core/src/` import from this package

## Notes

- The `files` array includes `src`, `dist`, `scaffold`, and JSON config files — source is shipped directly to npm (no compile step for JS, only for CSS and the externalized UI bundle).
- The `check:imports` script (`grep -r '$lib/' src`) prevents Svelte `$lib/` path aliases from leaking into the published source, since consumers won't have SvelteKit's alias resolution.
