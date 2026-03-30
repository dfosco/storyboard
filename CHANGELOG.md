# storyboard

## 3.1.0

Canvas, external prototypes, and polish. This release adds the full canvas system — an infinite, zoomable workspace for arranging widgets and embedding prototypes — along with external prototype support for linking to apps hosted elsewhere. Includes a wave of bug fixes across comments, inspector, and accessibility.

### Features

- **External prototypes** — Link to prototypes hosted at external URLs; they appear in the viewfinder and open in a new tab (`2b6bc63`)
- **Canvas system** — Full canvas implementation with widgets, zoom controls, panning, and prototype embeds (`1ac085e`)
  - Smooth zoom with Cmd+scroll / pinch, with finer 5% steps under 75% (`87d43a1`, `4aac1f5`)
  - Space + click-drag to pan the canvas (`a18fc0e`)
  - Prototype double-click editing, resize handle, auto-detect pasted URLs (`34a9f3d`)
  - Add widgets at viewport center without page refresh (`d13c2cd`)
  - Zoom controls toolbar with frosted-glass styling (`44876a4`, `fe1c00d`)
  - Per-widget prototype zoom (`fae1922`)
  - Editable canvas title, drag-only rotation, new canvas menu (`4d48559`)
  - Unified controls in Svelte left toolbar (`faea176`)
  - Keep command button visible when toolbar is hidden (`8370d3c`)
- **Inspector panel** — Side/bottom dock toggle with localStorage persistence (`1e56e9d`)
  - Generate static JSON for deployed environments (`59b4702`)
- **Release pipeline** — Changelog-github integration and GH release hardening (`0c93c0f`)

### Bug Fixes

- **Comments**: Validate PAT has discussion access at sign-in time (`c6d66e2`)
- **Comments**: Prevent body class sync from stripping `sb-comment-mode` (`6effe33`)
- **Canvas**: Fix cmd+scroll zoom for Magic Mouse and trackpad (`caab0ec`)
- **Canvas**: Make prototype iframe interactive on double-click (`b01ba41`)
- **Canvas**: Add drag overlay to prototype embed iframe (`32eb2b9`)
- **Canvas**: Make link preview widgets draggable (`f898992`)
- **Canvas**: Stop widget edits from triggering full page reload (`3c16a88`)
- **Canvas**: Register canvas API handler in server plugin (`e71768b`)
- **Canvas**: Ensure background covers full viewport when zoomed out (`d1b61a0`)
- **Canvas**: Remove leftover scale reference in PrototypeEmbed (`3f95843`)
- **Server**: Parse JSON body for DELETE requests (`debeda1`)
- **Inspector**: Reposition highlight overlay after scroll (`54aab93`)
- **Inspector**: Lower overlay z-index below panel (`d68e761`)
- **Inspector**: Ignore sidepanel elements during selection (`e6a611d`)
- **Inspector**: Use lightweight shiki bundle for production (`85a3752`)
- **Inspector**: Add `.nojekyll` to build output for GitHub Pages (`74f00c1`)
- **React**: Use npm registry for `@dfosco/tiny-canvas` dep (`35644b3`)
- **Core**: Resolve `$lib/` errors for non-SvelteKit consumers (`009fb80`)
- **A11y**: Add tabindex to toolbar role element (`aa620a1`)
- **A11y**: Resolve all Svelte a11y and reactivity warnings (`999dcc2`)
- Match sticky note textarea styles with view mode (`8a105e9`)
- Add `@internationalized/date` for bits-ui peer dep (`bc20672`)
- Fix ESLint errors in CanvasPage and PrototypeEmbed (`5889bfb`)
- Fix ESLint warnings: missing deps and fast refresh suppression (`ed2bf09`)

### Style

- Canvas zoom controls: frosted-glass backdrop, slate colors, border refinements (`33a9b5b`, `4dbf65c`, `070856b`, `d066908`)
- Use Primer pencil icon on prototype edit button (`04febe0`)
- Use grid-plus icon and remove emojis from canvas menu (`731d13e`)
- Show success + link after canvas creation instead of redirecting (`76a2415`)

### Chores

- Rename `src/canvases` to `src/canvas` (`06a406c`)
- Remove clips CI dependency (`dce2d2f`)

## 3.0.0

The Core UI release. Introduces the CoreUIBar — a floating toolbar with config-driven menus, a command palette, and a panel system for inspector and documentation. Adds a multi-source icon system, the `useFlows()` hook for flow discovery, and migrates the workshop UI from Alpine.js to Svelte.

### Major Changes

- **Core UI with commands and menus** — Introduces the CoreUIBar floating toolbar system for storyboard

### Features

#### Config-Driven Menu System

- **Command menu with structured action types** — actions support `toggle`, `link`, `separator`, `header`, and `footer` types with per-action mode visibility
- **Config-driven menus** — all CoreUIBar menu buttons are declared in `core-ui.config.json` under the `menus` key, supporting sidepanel buttons and custom Svelte components
- **Create Menu** — replaces the old Workshop menu with config-driven items and icon/character support
- **Flow Switcher button** — new CoreUIBar button that lists all flows for the current prototype and allows switching between them
- **Devtools submenu** — inspector deep-links, mode locking, and `ui.hide` config support
- **Link action type** — URL-based menu items that navigate via `window.location.href`

#### Panel Component

- **New `Panel` UI component** — anchored side panel replacing modal dialogs, with proper portal handling so nested `DropdownMenu` components work correctly
- **SidePanel system** — `sidePanelStore` manages panel state; panels for docs and inspector are included
- **Inspector Panel** — component inspector with fiber walker and mouse-mode selection
- **Doc Panel** — embedded documentation viewer via `docs-handler.js`

#### Icon System

- **Multi-source icon system** — supports Primer Octicons, Iconoir, and custom SVG icons through a unified `Icon` component
- **Icon `meta` config** — menu config supports `meta` object for `strokeWeight`, `scale`, `rotate` props
- **Iconoir support** — fill-based and stroke-based Iconoir icons registered as sources

#### Storyboard React

- **`useFlows()` hook** — lists all flows for the current prototype with `switchFlow()` navigation. Exported from `@dfosco/storyboard-react`
- **`getFlowsForPrototype()` and `getFlowMeta()`** — new core loader utilities for flow discovery

#### Other

- **Ioskeley Mono font** — custom monospace font for core UI menus and mode selector
- **Comment draft persistence** — composer saves drafts, repositions correctly, and autofocuses
- **Mode hue colors** — modes now support a `hue` property for theming
- **`ui.hide` config** — hide CoreUIBar and mode switcher via `storyboard.config.json`
- **Toggle mode switcher with `Cmd+.`** alongside CoreUIBar
- **`excludeRoutes` base path stripping** — route exclusion patterns are now portable across different base paths

### Bug Fixes

- Template dropdown placeholder is no longer a selectable option
- DropdownMenu z-index raised above Panel (`z-50` → `z-[10000]`)
- Panel no longer dismisses when clicking portaled children
- Focus trap disabled on Panel so nested portaled menus work
- Toggle actions execute correctly while keeping menu open
- Workshop features detected from registry, not DOM attribute
- Action menu visibility re-evaluated on SPA navigation
- `menuWidth` config properly applied to ActionMenuButton dropdown
- Button `wrapperVariants` and wrapper-aware sizing restored
- Viewfinder template errors repaired

### Documentation

- Renamed `scene` → `flow` across README and AGENTS.md
- Added storyboard-core skill for CoreUIBar menu buttons
- Documented new features (flow switcher, config-driven menus, panel system)

## 1.1.1

Quick patch to fix a case-sensitivity issue that broke CI on Linux.

### Patch Changes

-   fix: correct GlobalNavigation.module.css filename case for Linux CI

## 1.1.0

The architecture release. Splits the storyboard system into framework-agnostic core and React-specific layers, adds record overrides via URL hash parameters, and ships major bundle optimizations — cutting CSS from 714KB to 244KB.

### Minor Changes

-   8fe71a2: Performance improvements and major code splitting
-   a7e3049: Add record overrides from URL hash params

    Records can now be overridden and created via URL hash parameters using the `record.{name}.{entryId}.{field}=value` convention. Existing record entries get fields merged on top; unknown entry ids create new entries appended to the collection.

    New exports:

    -   `useRecordOverride(recordName, entryId, field)` — read/write hook for record hash overrides

    Also extracted shared utilities (`setByPath`, `deepClone`, `subscribeToHash`) into reusable modules.

-   Separate storyboard into core/ and internals/ layers

    Split the storyboard system into framework-agnostic and framework-specific layers, moved outside of `src/` to the repo root:

    -   **`storyboard/core/`** — Pure JavaScript data layer with zero framework dependencies. Exports `init()`, scene/record loaders, URL hash session state, dot-notation utilities, and hash change subscription. Can be consumed by any frontend framework.
    -   **`storyboard/internals/`** — React-specific plumbing: context providers, hooks (`useSceneData`, `useOverride`, `useRecord`, etc.), Primer React form components, DevTools, and React Router hash preservation. Replaceable when building non-React frontends.
    -   **`storyboard/vite/`** — Framework-agnostic Vite data plugin. Now calls `core.init()` to seed the data index instead of relying on a direct virtual module import in the loader.

    The `src/` directory now contains only user-facing prototype code (pages, components, templates, data files). All existing import paths updated; barrel `storyboard/index.js` re-exports from both layers for backwards compatibility.

-   4968cc5: Bundle optimizations: pre-parse data at build time, split vendor chunks (react, primer, octicons, reshaped), remove unused Primer theme CSS variants (714KB to 244KB), add changesets for versioning
