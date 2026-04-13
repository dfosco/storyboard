# Storyboard Workshop — Implementation Plan

## Problem

Designers and developers currently need a code editor to create pages, upload assets, and edit data files for their storyboard prototypes. We want to expose these capabilities directly in the browser during development, making the tool more accessible and interactive.

## Approach

This plan has **two layers**:

1. **Core dev-server infrastructure** (always-on, not toggleable) — a Vite plugin in `@dfosco/storyboard-react` that provides a dev middleware backbone. It mounts a base router at `/_storyboard/`, reads `storyboard.config.json` → `plugins`, and gives each enabled plugin a server context to register API routes and spawn subprocesses. This is the foundation that Workshop (and future plugins, and potentially core features) build on.

2. **Workshop plugin** (opt-in via `plugins.workshop`) — the first consumer of the core infrastructure. Registers its API routes (page creation, etc.) and injects a Dev Panel UI into the browser.

### Key design principles

1. **Core infrastructure is always-on**: The dev-server plugin is part of the storyboard core. It cannot be disabled — it's just plumbing. If no plugins are enabled, it simply mounts nothing.
2. **Plugin architecture**: All storyboard plugins live under `storyboard.config.json` → `plugins`. Removing a plugin entry + its package folder = fully removed.
3. **Feature flags within plugins**: Each capability within Workshop (page creation, file upload, data editor) is individually togglable.
4. **Dev-only**: Both the core middleware and plugin UI only exist during `vite dev`. Production builds are unaffected.
5. **Alpine.js + Tachyons**: Workshop's Dev Panel UI follows the comments system pattern — Alpine.js for reactivity, Tachyons for utility CSS, `sb-*` custom properties for theming.
6. **Separation from DevTools**: Workshop gets its own floating trigger button (separate from the beaker). This begins the Command Panel (deployed features) vs. Dev Panel (local-only features) split.

---

## Architecture

### Layer 1: Core Dev-Server Plugin

Lives in the existing `@dfosco/storyboard-react` package alongside the data plugin:

```
packages/react/src/vite/
  ├─ data-plugin.js              ← existing data discovery plugin
  └─ server-plugin.js            ← NEW: dev middleware backbone
```

**`server-plugin.js`** exports `storyboardServer()` — a Vite plugin that:

- Reads `storyboard.config.json` → `plugins` at startup
- In `configureServer()`, mounts a base middleware router under `/_storyboard/`
- Provides a **plugin registry** — a simple API that Workshop (or any plugin) calls to register:
  - **API routes**: `registerRoutes(prefix, handler)` → mounts under `/_storyboard/{prefix}/`
  - **Client scripts**: `registerClientScript(url)` → injected via `transformIndexHtml`
- Handles common middleware concerns: JSON body parsing, error responses, CORS (same-origin only)
- Passes each plugin a **server context**: `{ server, root, config, features }`

```js
// vite.config.js — registration
import storyboardData from '@dfosco/storyboard-react/vite'
import storyboardServer from '@dfosco/storyboard-react/vite/server'
import workshop from '@dfosco/storyboard-workshop'

export default defineConfig({
  plugins: [
    storyboardData(),
    storyboardServer({ plugins: [workshop()] }),  // core infra + plugin registration
    react(),
    generouted(),
  ],
})
```

### Layer 2: Workshop Plugin

```
packages/workshop/               ← new workspace package: @dfosco/storyboard-workshop
  ├─ src/
  │   ├─ index.js                ← plugin entry — returns { name, setup(ctx) }
  │   ├─ api/                    ← server-side route handlers
  │   │   └─ pages.js            ← page creation + listing
  │   ├─ client/                 ← browser-side UI (Alpine.js + Tachyons)
  │   │   ├─ mount.js            ← Dev Panel (floating button + menu)
  │   │   ├─ workshop.css        ← Workshop-specific styles (extends sb-* tokens)
  │   │   └─ createPage.js       ← page creation form (Alpine component)
  │   └─ templates/              ← page scaffolding templates
  │       └─ blank.jsx.tpl       ← default blank page template
  └─ package.json
```

Workshop exports a **plugin factory** that the core server-plugin calls:

```js
// packages/workshop/src/index.js
export default function workshop() {
  return {
    name: 'workshop',
    setup(ctx) {
      // ctx = { server, root, config, features, registerRoutes, registerClientScript }
      if (ctx.features.pages) {
        ctx.registerRoutes('workshop', pagesHandler)
      }
      ctx.registerClientScript('/@dfosco/storyboard-workshop/client/mount.js')
    }
  }
}
```

### Config schema (storyboard.config.json)

```jsonc
{
  "repository": { "owner": "dfosco", "name": "storyboard-source" },
  "comments": { ... },
  "plugins": {
    "workshop": {
      "enabled": true,
      "features": {
        "pages": true,      // page creation + optional scene
        "upload": false,     // file upload (future)
        "dataEditor": false  // data file editor (future)
      }
    }
    // future: "comments": { "enabled": true, ... }
  }
}
```

### How it works end-to-end

1. `storyboardServer()` reads config, finds `plugins.workshop.enabled === true`, calls `workshop().setup(ctx)`.
2. Workshop registers its API routes under `/_storyboard/workshop/` and its client script.
3. Core plugin's `transformIndexHtml` injects all registered client scripts as `<script type="module">` tags.
4. In the browser, Workshop's `mount.js` renders the Dev Panel button + menu.
5. User clicks "Create page" → form calls `POST /_storyboard/workshop/pages` → server writes files → Vite HMR picks them up.

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

### Templates (`templates/blank.jsx.tpl`)

A minimal Primer-ready page scaffold:

```jsx
import { useSceneData } from '@dfosco/storyboard-react'

export default function {{PageName}}() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{{PageName}}</h1>
    </div>
  )
}
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
1. **Implement `server-plugin.js`** — core Vite plugin in `packages/react/src/vite/`. Reads config, mounts `/_storyboard/` middleware, provides plugin registry API (`registerRoutes`, `registerClientScript`), JSON body parsing, `transformIndexHtml` injection.
2. **Export from `@dfosco/storyboard-react/vite/server`** — add package.json exports entry + vite.config.js alias.

### Workshop Plugin
3. **Create `packages/workshop/` workspace package** — `package.json` with alpinejs + tachyons deps, plugin factory entry point.
4. **Implement page creation API** — `api/pages.js` (page + optional scene file write, validation, listing).
5. **Implement Dev Panel UI** — `client/mount.js` (floating button, menu) + `client/workshop.css` (Alpine.js + Tachyons + sb-* tokens).
6. **Implement page creation form** — `client/createPage.js` (Alpine.js component with form, API call, navigation).
7. **Add page templates** — `templates/blank.jsx.tpl` + scene skeleton.

### Integration
8. **Update `storyboard.config.json`** — add `plugins.workshop` config block.
9. **Update `vite.config.js`** — add `storyboardServer({ plugins: [workshop()] })` to plugins array.
10. **Test end-to-end** — create a page (with and without scene) from the browser, verify HMR + route generation + scene loading.

## Notes

- The core server-plugin is always-on plumbing — it doesn't appear in config and can't be disabled. It's just the backbone.
- The `/_storyboard/` URL prefix namespaces all plugin API routes and avoids collision with app routes.
- Workshop client UI uses Alpine.js + Tachyons + `sb-*` custom properties, matching the comments system pattern.
- generouted watches `src/pages/` and auto-regenerates routes on file changes — no extra wiring needed.
- The storyboard data plugin already watches for `.scene.json` changes — scene files trigger automatic HMR reload.
- Future plugins follow the same pattern: export a `{ name, setup(ctx) }` factory, register routes + client scripts via the context.
- The `plugins` config key establishes the pattern for all future storyboard plugins (comments will migrate here too).
