# `packages/tiny-canvas/package.json`

<!--
source: packages/tiny-canvas/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Package manifest for `@dfosco/tiny-canvas` — a lightweight React canvas component with draggable elements and persistent positions. This is the rendering engine behind Storyboard's canvas pages, providing the infinite-canvas surface, pan/zoom, and drag interactions that canvas widgets are rendered onto.

Unlike the other packages that ship source, tiny-canvas ships a **pre-compiled bundle** (`dist/tiny-canvas.js`) built by its own Vite config.

## Composition

### Identity

- **name:** `@dfosco/tiny-canvas`
- **version:** `4.2.0-beta.17`
- **type:** `module`
- **license:** MIT
- **description:** "A lightweight React canvas with draggable elements and persistent positions"

### Exports Map

```json
"exports": {
    ".": {
        "import": "./dist/tiny-canvas.js",
        "types": "./src/index.d.ts"
    },
    "./style.css": "./dist/tiny-canvas.css"
}
```

Two exports: the compiled JS bundle and its CSS.

### Published Files

```json
"files": ["dist", "src/index.d.ts"]
```

Only the compiled bundle and TypeScript declarations are published — source is NOT shipped (unlike the other packages).

### Dependencies

```json
"dependencies": {
    "@neodrag/react": "^2.3.0"
}
```

Single runtime dependency for drag interaction.

### Peer Dependencies

```json
"peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
}
```

### Build Scripts

| Script | Purpose |
|--------|---------|
| `build` | `vite build` — Compile the canvas library |
| `prepublishOnly` | Runs build before npm publish |

## Dependencies

No internal workspace dependencies — this is a standalone canvas library.

## Dependents

- [`@dfosco/storyboard-react`](../react/package.json.md) — depends on `@dfosco/tiny-canvas` (version `4.2.0-beta.17`)
- [`packages/react/src/canvas/CanvasPage.jsx`](../react/src/canvas/CanvasPage.jsx.md) — imports the canvas component
- [`vite.config.js`](../../vite.config.js.md) — aliases `@dfosco/tiny-canvas` to local `packages/tiny-canvas/src/index.js` for development

## Notes

- In development, [`vite.config.js`](../../vite.config.js.md) aliases `@dfosco/tiny-canvas` to the **source** entry (`packages/tiny-canvas/src/index.js`) rather than the compiled `dist/` bundle, enabling HMR during development.
- The `dist/` directory is the publish artifact, built by a separate `vite.config.js` inside the package.
