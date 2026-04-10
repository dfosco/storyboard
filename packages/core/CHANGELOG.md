# @dfosco/storyboard-core

## 3.11.0-beta.5

### Patch Changes

-   Canvas toolbar and visual refinements

    -   Adjust toolbar separator width (2px) and height (40px) in CanvasUndoRedo
    -   Normalize border width to 2px in CanvasZoomControl
    -   Add strokeWeight/scale meta to zoom-to-objects and snap-to-grid tools
    -   Reorder canvas toolbar: snap before undo-redo
    -   Fix canvas title input auto-sizing to content
    -   Pass config.meta to Icon for strokeWeight/scale on canvas tools
    -   Fix Primer icon name (apps-icon → apps)
    -   Split canvas-toolbar into individual tool entries
    -   Canvas read-only in prod, local editing label, blue dev dots
    -   Config-driven dropdown menus, widget URLs, copy-link, copy-widget
    -   Snap-to-grid toggle, undo/redo queue, zoom-to-fit
    -   Prototype embed navigation with undo/redo
    -   Image paste, Figma embed widget, viewport persistence
    -   HMR suppression while canvas is active
    -   Automatic commit and push tool (autosync)

## 3.11.0-beta.4

### Minor Changes

-   Snap-to-grid and viewfinder tab persistence

    -   Snap-to-grid toggle in canvas toolbar — snaps widget positions and resize to grid (default 40px)
    -   Persisted as snapToGrid in canvas settings, configurable via gridSize
    -   Viewfinder canvas/prototype tab now stored in localStorage instead of URL hash

## 3.11.0-beta.3

### Minor Changes

-   Config-driven dropdown menus and image widget actions

    -   New `dropdown` feature type — renders a chevron button with a menu of actions, fully config-driven
    -   Image widget dropdown: Download image, Copy as PNG, Copy file path
    -   Component widgets now have "Copy link to widget" in overflow menu
    -   Widget URL centering supports JSX source widgets (jsx-\* IDs)

## 3.11.0-beta.2

### Minor Changes

-   Widget URLs, overflow menu, and config-driven widget tools

    -   Each widget has a unique URL (?widget=id) that centers the viewport on load
    -   Widget toolbar "..." overflow menu with "Copy link to widget" and "Delete widget"
    -   Widget tools (icons, labels, menu placement) fully driven by widgets.config.json
    -   Config variables system ($label:duplicate, etc.) for shared text
    -   Fix: comment deep links (?comment=id) now open the comment box on cache hit
    -   Prototype embed navigation persisted with undo/redo support

## 3.11.0-beta.1

### Minor Changes

-   Canvas tooling: zoom-to-fit, copy widget, undo/redo, and embed navigation

    -   Zoom to objects button frames all widgets in the viewport
    -   Copy widget tool duplicates any widget at cascading +40px offsets
    -   Full undo/redo system for canvas operations (⌘Z / ⌘⇧Z)
    -   Prototype embed navigation is now persisted and undoable
    -   Canvas toolbar moved to Svelte CoreUIBar (zoom, undo/redo, zoom-to-objects)
    -   Default sizes: sticky note 270×170, markdown 530×240
    -   Tooltip delay reduced to 50ms

## 3.11.0-beta.0

### Minor Changes

-   Canvas editing improvements and image paste support

    -   Paste images directly onto the canvas — retina-aware sizing, privacy toggle, aspect-ratio-correct rendering
    -   Figma embed widget for pasted Figma URLs
    -   Persist viewport position (scroll x/y) and zoom across sessions via localStorage
    -   Per-client HMR guard — canvas pages suppress reloads while editing, other tabs unaffected
    -   Color picker renders below trigger with seamless hover bridge
    -   Widget toolbar improvements: Primer Tooltips, Octicon icons, ESC to deselect, open-in-new-tab for prototype embeds
    -   Fix: use relative imports for Vite plugins so worktrees load their own source

## 3.10.0

### Minor Changes

-   [#62](https://github.com/dfosco/storyboard/pull/62) [`092c28c`](https://github.com/dfosco/storyboard/commit/092c28ca0a07bf49e1b55b546b248888af259c60) Thanks [@dfosco](https://github.com/dfosco)! - Widget Chrome API & Canvas Interaction Overhaul

    -   Config-driven widget chrome toolbar with hover trigger dot, feature buttons, and select handle
    -   Select handle is the only drag source — click/double-click never triggers drag
    -   Drag gate with 150ms delay + 8px distance threshold (bypasses neodrag's broken distance calc for positioned elements)
    -   StickyNote color picker and PrototypeEmbed zoom/edit controls extracted into chrome toolbar
    -   JSX source blocks wrapped in Component widget chrome with resize support
    -   ComponentWidget double-click-to-interact overlay for stateful markup
    -   Prototype embed URL matching supports branch deploy prefixes
    -   Vite alias for tiny-canvas source resolution
    -   widgets.config.json as single source of truth for widget definitions

-   Canvas zoom and widget placement improvements

    -   Cursor-anchored zoom — wheel/pinch keeps the canvas point under the cursor fixed
    -   Viewport-centered zoom — toolbar zoom buttons center on the current viewport
    -   Widget placement centered on viewport, aligned to widget visual center
    -   Zero-delay zoom via flushSync rendering

### Patch Changes

-   [#62](https://github.com/dfosco/storyboard/pull/62) [`8e0bd21`](https://github.com/dfosco/storyboard/commit/8e0bd21841db2fd0c231eed82c71f8e3cb7dbf1b) Thanks [@dfosco](https://github.com/dfosco)! - Widget Chrome beta.1: drag gate fix, ComponentWidget interactive overlay

## 3.10.0-beta.1

### Patch Changes

-   Widget Chrome beta.1: drag gate fix, ComponentWidget interactive overlay

## 3.10.0-beta.0

### Minor Changes

-   Widget Chrome API & Canvas Interaction Overhaul

    -   Config-driven widget chrome toolbar with hover trigger dot, feature buttons, and select handle
    -   Select handle is the only drag source — click/double-click never triggers drag
    -   Drag gate with 150ms delay + 8px distance threshold (bypasses neodrag's broken distance calc for positioned elements)
    -   StickyNote color picker and PrototypeEmbed zoom/edit controls extracted into chrome toolbar
    -   JSX source blocks wrapped in Component widget chrome with resize support
    -   ComponentWidget double-click-to-interact overlay for stateful markup
    -   Prototype embed URL matching supports branch deploy prefixes
    -   Vite alias for tiny-canvas source resolution
    -   widgets.config.json as single source of truth for widget definitions

## 3.9.1

### Patch Changes

-   Unify @dfosco/tiny-canvas into fixed version group — all storyboard packages now version together
-   Pin storyboard-react → tiny-canvas dependency to exact version (was ^1.1.0)

## 3.9.0

### Minor Changes

-   OIDC Trusted Publishing: CI publishes to npm without tokens or 2FA, with provenance attestation
-   New release skill for agent-driven releases
-   New ship skill for end-to-end feature shipping workflow
-   Canvas: lock widgets to non-negative positions and prevent drag during pan ([#53](https://github.com/dfosco/storyboard/pull/53))

### Patch Changes

-   Fix repository URLs in package.json for provenance validation
-   Bump @dfosco/tiny-canvas to 1.2.0

## 3.8.2

### Patch Changes

-   Fix canvas x,y position serving on prod, theme inconsistencies

## 3.8.1

### Patch Changes

-   Fix branch-deploy URL for canvases and canvas assets

## 3.8.0

### Minor Changes

-   Significant theme and canvas improvements and bugfixes

## 3.7.0

### Minor Changes

-   Large fixes across themes, style isolation, and canvas behavior

## 3.6.1

### Patch Changes

-   Fix hosting of JSON file for inspector on branch deploys
-   Comments auth UX: route token-related failures (invalid/expired token, missing token, insufficient access/scope, repository access mismatch) to the sign-in modal with a specific top alert and exit comment mode.

## 3.6.0

### Minor Changes

-   Fix flow tool on branch deploys, fix theme application targets

## 3.5.0

### Minor Changes

-   Fix inspector and sidepanel bugs

## 3.4.0

### Minor Changes

-   Surface-based tool system, canvas toolbar, theme sync targets, highlight.js migration, and deployed docs panel support.

## 3.3.2

### Patch Changes

-   Bug fixes for package <-> client interaction

## 3.3.1

### Patch Changes

-   Fixes consumer build errors introduced in 3.3.0 where client repos without `svelte` or `shiki` installed would fail during Vite dependency optimization.

## 3.3.0

### Minor Changes

-   Restores original client architecture overhaul. Ships a pre-compiled Svelte UI bundle so consumer repos need zero Svelte toolchain — just call `mountStoryboardCore()`. On 3.3.0 specifically: Client integration fixes, theme switching, inspector improvements, and canvas polish. This release makes the pre-compiled UI bundle fully functional in consumer repos and adds several new features.

## 3.2.0

### Minor Changes

-   Restores original client architecture overhaul. Ships a pre-compiled Svelte UI bundle so consumer repos need zero Svelte toolchain — just call `mountStoryboardCore()`. On 3.3.0 specifically: Client integration fixes, theme switching, inspector improvements, and canvas polish. This release makes the pre-compiled UI bundle fully functional in consumer repos and adds several new features.

## 3.1.2

### Patch Changes

-   Add `@lucide/svelte` and `marked` to package dependencies (were only declared in monorepo root, causing "Could not resolve" errors in consumers). Inline the `smooth-corners` paint worklet to avoid Vite-specific `?url` import that breaks when source is consumed from `node_modules`. Removes `smooth-corners` as a dependency.

## 3.1.2

### Patch Changes

-   Add `@lucide/svelte` and `marked` to package dependencies (were only declared in monorepo root, causing "Could not resolve" errors in consumers).
-   Inline the `smooth-corners` paint worklet to avoid Vite-specific `?url` import that breaks when source is consumed from `node_modules`. Removes `smooth-corners` as a dependency.

## 3.1.1

### Patch Changes

-   Fixes package resolution errors when consuming `@dfosco/storyboard-core` and `@dfosco/tiny-canvas` from npm.

## 3.1.0

### Minor Changes

-   3.1.0 -- Canvas, external prototypes, and polish. This release adds the full canvas system — an infinite, zoomable workspace for arranging widgets and embedding prototypes — along with external prototype support for linking to apps hosted elsewhere. Includes a wave of bug fixes across comments, inspector, and accessibility.

## 3.0.0

### Major Changes

-   Introduces Core UI with commands and menus for storyboard
-   a00140e: # Core UI Release — v3.0.0

    ## ✨ New Features

    ### Config-Driven Menu System

    -   **Command menu with structured action types** — actions support `toggle`, `link`, `separator`, `header`, and `footer` types with per-action mode visibility.
    -   **Config-driven menus** — all CoreUIBar menu buttons are declared in `core-ui.config.json` under the `menus` key, supporting sidepanel buttons and custom Svelte components.
    -   **Create Menu** — replaces the old Workshop menu with config-driven items and icon/character support.
    -   **Flow Switcher button** — new CoreUIBar button that lists all flows for the current prototype and allows switching between them.
    -   **Devtools submenu** — inspector deep-links, mode locking, and `ui.hide` config support.
    -   **Link action type** — URL-based menu items that navigate via `window.location.href`.

    ### Panel Component

    -   **New `Panel` UI component** — anchored side panel replacing modal dialogs, with proper portal handling so nested `DropdownMenu` components work correctly.
    -   **SidePanel system** — `sidePanelStore` manages panel state; panels for docs and inspector are included.
    -   **Inspector Panel** — component inspector with fiber walker and mouse-mode selection.
    -   **Doc Panel** — embedded documentation viewer via `docs-handler.js`.

    ### Icon System

    -   **Multi-source icon system** — supports Primer Octicons, Iconoir, and custom SVG icons through a unified `Icon` component.
    -   **Icon `meta` config** — menu config supports `meta` object for `strokeWeight`, `scale`, `rotate` props.
    -   **Iconoir support** — fill-based and stroke-based Iconoir icons registered as sources.

    ### Storyboard React

    -   **`useFlows()` hook** — lists all flows for the current prototype with `switchFlow()` navigation. Exported from `@dfosco/storyboard-react`.
    -   **`getFlowsForPrototype()` and `getFlowMeta()`** — new core loader utilities for flow discovery.

    ### Other

    -   **Ioskeley Mono font** — custom monospace font for core UI menus and mode selector.
    -   **Comment draft persistence** — composer saves drafts, repositions correctly, and autofocuses.
    -   **Mode hue colors** — modes now support a `hue` property for theming.
    -   **`ui.hide` config** — hide CoreUIBar and mode switcher via `storyboard.config.json`.
    -   **Toggle mode switcher with `Cmd+.`** alongside CoreUIBar.
    -   **`excludeRoutes` base path stripping** — route exclusion patterns are now portable across different base paths.

    ## 🐛 Bug Fixes

    -   Template dropdown placeholder is no longer a selectable option
    -   DropdownMenu z-index raised above Panel (`z-50` → `z-[10000]`)
    -   Panel no longer dismisses when clicking portaled children
    -   Focus trap disabled on Panel so nested portaled menus work
    -   Toggle actions execute correctly while keeping menu open
    -   Workshop features detected from registry, not DOM attribute
    -   Action menu visibility re-evaluated on SPA navigation
    -   `menuWidth` config properly applied to ActionMenuButton dropdown
    -   Button `wrapperVariants` and wrapper-aware sizing restored
    -   Viewfinder template errors repaired

    ## 📝 Documentation

    -   Renamed `scene` → `flow` across README and AGENTS.md
    -   Added storyboard-core skill for CoreUIBar menu buttons
    -   Documented new features (flow switcher, config-driven menus, panel system)

## 2.7.1

### Patch Changes

-   Change accordion defaults to closed

## 2.7.0

### Minor Changes

-   Persists open/closed state of accordions on /viewfinder in localStorage

## 2.6.0

### Minor Changes

-   Adds prototype-scoping by default for objects and improves 404 handling for missing flows.

## 2.5.0

### Minor Changes

-   Merged flow-route-inference to fix v 2.4.0

## 2.4.0

### Minor Changes

-   Add automatic flow routing per directory

## 2.3.0

### Minor Changes

-   Add folder-based separation of prototypes in viewfinder

## 2.2.0

### Minor Changes

-   Fix bug in applying recordOverrides. Add proper `?flow=` url param. Fix small issues with Viewfinder component.

## 2.1.0

### Minor Changes

-   Update storyboard internal structure to enable modes, plugins, and tools. Updates prototype folder and metadata structure to live under /prototypes. Renames scenes into flows.

## 2.0.0

### Major Changes

-   fd0a4a9: Add modes API in preparation for large breaking change refactor
-   Update storyboard internal structure to enable modes, plugins, and tools. Updates prototype folder and metadata structure to live under /prototypes. Renames scenes into flows

### Minor Changes

-   7861e32: Add prototype and flow restructure for 2.0 (breaking change)

## 2.0.0-beta.1

### Minor Changes

-   Add prototype and flow restructure for 2.0 (breaking change)

## 2.0.0-beta.0

### Major Changes

-   Add modes API in preparation for large breaking change refactor

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactice for now)

## 1.22.0

### Minor Changes

-   Iterate FF system and add dedicated `sb-ff-name` class on body

## 1.21.0

### Minor Changes

-   Add useRecord hooks

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

## 1.19.0

### Minor Changes

-   Add devtools on/off config flag

## 1.18.0

### Minor Changes

-   Add feature-flag module

## 1.17.3

### Patch Changes

-   Fix comment overlay and optimistic submission, fix link to PAT generation

## 1.17.2

### Patch Changes

-   Fixup title case on scene names in Viewfinder

## 1.17.1

### Patch Changes

-   Fix and improve viewfinder design

## 1.17.0

### Minor Changes

-   Update Storyboard index page customization

## 1.16.0

### Minor Changes

-   Improve design and customization on viewfinder home

## 1.15.2

### Patch Changes

-   Update release pipeline

## 1.15.1

### Patch Changes

-   Fix bug in hide mode, add dark-mode comment cursor

## 1.15.0

### Minor Changes

-   -   Fix bug in comment mode
    -   Improve and increase test surface
    -   Improve release script
    -   Adjust linter

## 1.14.0

### Minor Changes

-   Fix state class being added to body

## 1.13.0

### Minor Changes

-   Change viewfinder to display branches as a dropdown

## 1.12.0

### Minor Changes

-   States represented via classes on DOM

## 1.11.3

### Patch Changes

-   Republish: body class sync for overrides and scenes (v1.11.2 was a partial publish).

## 1.11.2

### Patch Changes

-   7a24fd0: Add body class sync: mirrors active overrides as `sb-{key}--{value}` and scene as `sb-scene--{name}` CSS classes on `<body>`. Classes update reactively on hash/storage changes and scene switches. Use `:global(.sb-theme--dark)` in CSS Modules to conditionally style components based on storyboard state.
-   8f3c8bc: Add state-based classes to body tag

## 1.11.1

### Patch Changes

-   Update auth modal PAT guidance: recommend fine-grained tokens with Discussions read/write permission, show minimum classic scope (repo), drop unnecessary read:user, pre-fill classic token creation form.

## 1.11.0

### Minor Changes

-   Comments UI refactor and improvements

    -   Refactor comments UI to Alpine.js templates, drop inline styles
    -   Make comment pins draggable to reposition
    -   Cache comments in localStorage with lazy-load and 2-min TTL
    -   Unify reaction trigger and indicator pill styles
    -   Add Tachyons-scale gap utility classes
    -   Move reply Edit/Delete inline with author heading
    -   Hide browser scrollbar in comment window
    -   Make window drag temporary, not persistent
    -   Add worktree skill

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

## 1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

## 1.1.0

### Minor Changes

-   f7061c5: feat: add comments system with GitHub Discussions backend

    Storyboard now includes an optional comments system backed by GitHub Discussions. Collaborators can place contextual comments pinned to specific positions on any page.

    Features:

    -   Press C to enter comment mode — click anywhere to place a comment
    -   Comments stored as GitHub Discussions (one discussion per route)
    -   Position-aware pins that appear where comments were placed
    -   Threaded replies, reactions, resolve/unresolve, drag-to-move
    -   Comments drawer listing all comments for the current page
    -   GitHub personal access token authentication
    -   DevTools integration with comment menu items

    Configure via `storyboard.config.json` with a `comments` key pointing to your GitHub repo and discussions category.

    New exports from `@dfosco/storyboard-core/comments`:

    -   `initCommentsConfig()`, `mountComments()`, `isCommentsEnabled()`
    -   `toggleCommentMode()`, `fetchRouteDiscussion()`, `createComment()`
    -   `replyToComment()`, `resolveComment()`, `moveComment()`, `deleteComment()`
    -   `addReaction()`, `removeReaction()`
    -   `openCommentsDrawer()`, `closeCommentsDrawer()`

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
