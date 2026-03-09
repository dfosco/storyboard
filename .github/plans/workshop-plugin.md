# Storyboard Workshop — Implementation Plan

## Problem

Designers and developers currently need a code editor to create pages, upload assets, and edit data files for their storyboard prototypes. We want to expose these capabilities directly in the browser during development, making the tool more accessible and interactive.

## Approach

This plan has **two layers**:

1. **Core dev-server infrastructure** (always-on, not toggleable) — a Vite plugin in `@dfosco/storyboard-core` that provides a dev middleware backbone. It mounts a base router at `/_storyboard/`, reads `storyboard.config.json`, and gives each enabled plugin a server context to register API routes and spawn subprocesses. Workshop's server-side capabilities (API routes for page creation, etc.) live here — they always run during dev.

2. **Workshop UI** (opt-in via `workshop` config) — the browser-side Dev Panel that exposes Workshop capabilities to users. Controlled by the top-level `workshop` key in `storyboard.config.json`. Disabling it hides the UI but the vite server routes remain available.

### Key design principles

1. **Core infrastructure is always-on**: The dev-server plugin is part of the storyboard core. It cannot be disabled — it's just plumbing. Workshop API routes are part of this layer and always run during dev.
2. **Workshop is core, not a plugin**: Workshop provides source-editing capabilities (page creation, file upload, data editing) that are too low-level to be a plugin. The `workshop` config is a top-level key that controls which Dev Panel UIs are shown in the browser — disabling it hides the UI, but the server routes remain.
3. **Single config interface**: `storyboard.config.json` is the only dev-facing configuration file. `vite.config.js` imports the server plugin but does not configure plugins — the server plugin reads `storyboard.config.json` and auto-discovers everything.
4. **Plugin architecture**: Storyboard plugins (devtools, comments, future extensions) live under `storyboard.config.json` → `plugins`. Removing a plugin entry + its package folder = fully removed.
5. **Feature flags within Workshop**: Each capability (page creation, file upload, data editor) is individually togglable via `workshop.features`.
6. **Dev-only**: Both the core middleware and Workshop UI only exist during `vite dev`. Production builds are unaffected.
7. **Alpine.js + Tachyons**: Workshop's Dev Panel UI follows the comments system pattern — Alpine.js for reactivity, Tachyons for utility CSS, `sb-*` custom properties for theming.
8. **Separation from DevTools**: Workshop gets its own floating trigger button (separate from the beaker). This begins the Command Panel (deployed features) vs. Dev Panel (local-only features) split.

---

## Architecture

### Layer 1: Core Dev-Server Plugin

Lives in `@dfosco/storyboard-core` — the server plugin, workshop, and all framework-agnostic infrastructure belong here (alongside devtools and comments):

```
packages/core/src/vite/
  └─ server-plugin.js            ← NEW: dev middleware backbone
```

**`server-plugin.js`** exports `storyboardServer()` — a Vite plugin that:

- Reads `storyboard.config.json` at startup (workshop config + plugins)
- In `configureServer()`, mounts a base middleware router under `/_storyboard/`
- Wires Workshop API routes directly based on `workshop.features`
- Provides a **plugin registry** — a simple API that plugins call to register:
  - **API routes**: `registerRoutes(prefix, handler)` → mounts under `/_storyboard/{prefix}/`
  - **Client scripts**: `registerClientScript(url)` → injected via `transformIndexHtml`
- Handles common middleware concerns: JSON body parsing, error responses, CORS (same-origin only)
- Passes each plugin a **server context**: `{ server, root, config, features }`

```js
// vite.config.js — no plugin configuration needed, reads storyboard.config.json
import storyboardData from '@dfosco/storyboard-react/vite'
import storyboardServer from '@dfosco/storyboard-core/vite/server'

export default defineConfig({
  plugins: [
    storyboardData(),
    storyboardServer(),  // reads storyboard.config.json, mounts workshop routes + plugins
    react(),
    generouted(),
  ],
})
```

### Layer 2: Workshop

Workshop is core infrastructure, not a plugin. Everything lives in `packages/core/` — the server-side API routes alongside the server plugin, and the client-side UI alongside devtools and comments:

```
packages/core/src/
  ├─ vite/
  │   ├─ server-plugin.js         ← dev middleware backbone
  │   └─ workshop/
  │       └─ pages.js             ← page creation + listing API handlers
  └─ workshop/
      ├─ ui/
      │   ├─ mount.js             ← Dev Panel (floating button + menu)
      │   ├─ workshop.css         ← Workshop-specific styles (extends sb-* tokens)
      │   └─ createPage.js        ← page creation form (Alpine component)
      └─ templates/
          └─ blank.html           ← default blank page template
```

The server plugin reads `storyboard.config.json` → `workshop.features` to decide which API routes to mount, and injects the Workshop client script when any feature is enabled:

```js
// Inside server-plugin.js — workshop is wired directly, not via plugin registry
if (workshopConfig?.features?.pages) {
  mountRoute('/_storyboard/workshop/pages', pagesHandler)
}
if (hasAnyWorkshopFeature(workshopConfig)) {
  injectClientScript('/@dfosco/storyboard-core/workshop/ui/mount.js')
}
```

### Config schema (storyboard.config.json)

`workshop` is a top-level key (core infrastructure). Plugins live under `plugins`. The server plugin reads the entire config — `storyboard.config.json` is the single dev-facing configuration interface.

```jsonc
{
  "repository": { "owner": "dfosco", "name": "storyboard-source" },
  "workshop": {
    "features": {
      "pages": true,      // page creation + optional scene
      "upload": false,     // file upload (future)
      "dataEditor": false  // data file editor (future)
    }
  },
  "plugins": {
    "devtools": {
      "enabled": true
    },
    "comments": {
      "enabled": true,
      "discussions": { "category": "General" }
    }
  }
}
```

### How it works end-to-end

1. `storyboardServer()` reads `storyboard.config.json`, mounts Workshop API routes under `/_storyboard/workshop/` (always-on), and loads enabled plugins.
2. If any `workshop.features` are enabled, the server plugin injects the Workshop client script via `transformIndexHtml`.
3. In the browser, Workshop's `mount.js` renders the Dev Panel button + menu (only showing enabled features).
4. User clicks "Create page" → form calls `POST /_storyboard/workshop/pages` → server writes files → Vite HMR picks them up.

---

## MVP Scope: Page Creation Feature

### Server-side (`api/pages.js`)

- `POST /_storyboard/workshop/pages` — body: `{ name: string, template?: string, createScene?: boolean }`
  - Validates name (no duplicates, valid filename chars, PascalCase conversion)
  - Writes `src/pages/{Name}.jsx` using a template
  - If `createScene: true`, also writes `src/data/{Name}.scene.json` with a minimal skeleton
  - Returns `{ success: true, path, route, scenePath? }` or `{ error }` with appropriate status
- `GET /_storyboard/workshop/pages` — lists existing pages (reads `src/pages/`)

### Client-side (`client/mount.js` + `client/createPage.js`)

- **Dev Panel button**: floating trigger button (bottom-right, next to the beaker) with a wrench icon
- **Menu**: opens on click, lists enabled features — "Create page" for MVP
- **"Create page" form** (Alpine.js component):
  - Page name text input (auto-previews the resulting route path)
  - "Create scene file" checkbox (default checked)
  - Template selector (just "Blank" for now)
  - Submit → calls API → shows success/error toast → navigates to new page

### Templates (`templates/blank.html`)

A minimal Alpine.js + Tachyons page scaffold (matching the comments system pattern):

```html
<div x-data="sb{{PageName}}()" class="pa4">
  <h1 class="f3 sb-fg">{{PageName}}</h1>
</div>
```

### Scene template (created when `createScene: true`)

```json
{
  "$global": []
}
```

---

## Todos

### Core Infrastructure
1. **Implement `server-plugin.js`** — core Vite plugin in `packages/core/src/vite/`. Reads `storyboard.config.json`, mounts `/_storyboard/` middleware, provides plugin registry API (`registerRoutes`, `registerClientScript`), JSON body parsing, `transformIndexHtml` injection. Workshop API routes are wired directly here.
2. **Export from `@dfosco/storyboard-core/vite/server`** — add package.json exports entry + vite.config.js alias.

### Workshop
3. **Implement page creation API** — `packages/core/src/vite/workshop/pages.js` (page + optional scene file write, validation, listing).
4. **Implement Dev Panel UI** — `packages/core/src/workshop/ui/mount.js` (floating button, menu) + `workshop.css` (Alpine.js + Tachyons + sb-* tokens).
5. **Implement page creation form** — `packages/core/src/workshop/ui/createPage.js` (Alpine.js component with form, API call, navigation).
6. **Add page templates** — `packages/core/src/workshop/templates/blank.html` + scene skeleton.

### Integration
8. **Update `storyboard.config.json`** — add top-level `workshop` config block with features.
9. **Update `vite.config.js`** — add `storyboardServer()` to plugins array.
10. **Test end-to-end** — create a page (with and without scene) from the browser, verify HMR + route generation + scene loading.

## Notes

- The core server-plugin is always-on plumbing — it reads `storyboard.config.json` as the single configuration interface.
- Workshop is core infrastructure, not a plugin. Its API routes always run during dev; only the browser UI is togglable via `workshop.features`.
- The `/_storyboard/` URL prefix namespaces all API routes (workshop + plugins) and avoids collision with app routes.
- Workshop client UI uses Alpine.js + Tachyons + `sb-*` custom properties, matching the comments system pattern.
- generouted watches `src/pages/` and auto-regenerates routes on file changes — no extra wiring needed.
- The storyboard data plugin already watches for `.scene.json` changes — scene files trigger automatic HMR reload.
- Plugins (devtools, comments, future extensions) follow the `{ name, setup(ctx) }` factory pattern and are auto-discovered from `storyboard.config.json` → `plugins`.
