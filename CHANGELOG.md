# storyboard

## 4.0.0-beta.5

### Features
- **cli**: Add optional branch argument to `storyboard dev` command

### Fixes
- **canvas**: Make "Copy file path" an alt of "Copy as PNG" on images
- **canvas**: Prevent line breaks in widget overflow menu items
- **dev**: Detect branch name for base path when not in a worktree
- **autosync**: Fix string spread bug in `listChangedFiles`

## Unreleased

### Bug Fixes

- **Canvas dev no-reload sync**: Hardened `.canvas.jsonl` live updates in local development by handling canvas hot updates through custom WS events, suppressing default Vite fallback reloads for canvas edits, and guarding against editor atomic-save watcher patterns (`unlink`/`add`) that were still causing full refreshes in `storyboard-core`.
- **Canvas sticky dark themes**: Sticky notes now switch to a dark-friendly palette (note surface, text, editor text, and picker popup) whenever the app is in dark mode (`data-color-mode='dark'` or `data-sb-theme^='dark'`).
- **Canvas drag polish**: Widget tilt now uses a subtler `1.5deg` rotation, only activates after 10px of movement, and keeps smooth 150ms transitions while preserving click/double-click edit behavior.
- **Core UI isolation**: Replaced the Shadow DOM approach with scoped Core UI token names (`--sb--*`) across toolbar, inspector, side panel, comments, and related UI surfaces to avoid style collisions with prototype CSS while preserving existing UI behavior.
- **Popover/menu colors in linked clients**: Restored Tailwind-compatible `--color-*` aliases alongside `--sb--*` tokens so utilities like `bg-popover` and `text-popover-foreground` resolve correctly instead of falling back to Primer defaults in npm-linked consumers.
- **Inspector source scrolling**: Updated highlighted-line scroll behavior to align near the top of the code viewport with a 24px offset, making long snippets land at a readable starting position.
- **Branch preview deploys**: Fix preview `base` path in GitHub Actions so branch URLs resolve static inspector assets at `/{branch-folder}/_storyboard/*` and avoid `inspector.json` 404s.
- **Flows**: Fix flow loading `baseURL` handling for branch deploys.
- **Inspector**: Normalize configured highlight theme names before palette lookup so aliases like `night owl` / `night owl light` resolve to supported dark/light palettes instead of falling back to dark.
- **Theme sync targets**: Apply theme independently per target. Prototype now respects the Prototype toggle, code boxes follow `Code boxes`, and toolbar remains controlled by `Toolbar`.
- **Theme sync bootstrap**: Apply persisted `sb-theme-sync` target settings during early mount so prototype, toolbar, and code theme attributes initialize consistently before UI render.
- **tiny-canvas queue recovery**: Guard drag-position persistence against malformed `tiny-canvas-queue` localStorage values by resetting invalid JSON to an empty queue instead of throwing during drag saves.
- **Prototype embeds flow param**: Avoid re-scoping already scoped `flow` query values (e.g. `Proto/flow`) so embedded prototypes no longer resolve to invalid doubled names like `Proto/Proto/flow`.
- **Theme target mapping**: Canvas background now follows the `Toolbar` theme target, while prototype embeds explicitly force `Prototype` theme via `_sb_theme_target=prototype` in embed URLs.
- **Embed theme controls**: Hide prototype-local theme switchers in `_sb_embed` views so embeds follow host-managed theme targeting instead of exposing competing in-embed toggles.
- **Canvas JSONL materialization**: Parse concatenated canvas event objects in `.canvas.jsonl` (not just newline-delimited lines), so `canvas_created` metadata like title/description is preserved and Viewfinder/canvas headers stay in sync.
- **Canvas dark theme parity**: Restore distinct toolbar-driven canvas backgrounds for `dark` vs `dark_dimmed` instead of collapsing both to the same dark token.
- **Canvas theme target**: Added a dedicated `Canvas` theme sync target that controls canvas background/widget chrome independently, shows only on canvas pages in Theme settings, and refreshes prototype-embed iframes when canvas theme changes.
- **Side panel**: Keep toolbar offset rules applied in side/bottom panel modes by forcing `right`/`bottom` offsets with `!important`.
- **Comments auth UX**: Route token-related failures to the sign-in modal with a top inline alert instead of leaving the user in comment submission flow.
- **Comments auth UX**: Treat invalid/expired PATs, missing PATs, insufficient token scope/access, and repository access mismatch as re-auth flows that exit comment mode and open sign-in with a specific guidance message.

### Build & Tooling

- **Dev link script**: `npm run link` now starts `dev:ui` after rebuilding and linking, keeping the UI bundle watcher running during local linking workflows.
- **Toolbar config**: Refresh default inspector highlighting config to explicit supported palette IDs (`github-dark-dimmed` and `github`).

## 3.7.0

Workshop creation flow polish across Flow/Page/Prototype creation, with scoped template discovery and clearer page setup behavior.

### Features

- **Create Page**: Added a dedicated Create Page form in the Create menu so page creation no longer reuses the Create Flow overlay.
- **Scoped template/recipe index**: Template selectors now include both global entries and prototype-local entries discovered from each prototype's `templates/` and `recipes/` folders.
- **Prototype-aware template groups**: Template/recipe pickers show local entries grouped under the selected prototype heading.
- **Template picker parity**: New Page now uses the same dropdown component style as New Prototype for template/recipe selection.
- **Create Flow UX**: Flows are always prototype-scoped, "Global prototype" is removed, and flow-copy options are scoped to the selected prototype.
- **Starting page controls**: Create Flow now supports selecting an existing starting route or choosing "Create new page" inline with path + template inputs.

### Bug Fixes

- **Workshop routes**: Fixed malformed server template-string blocks that prevented workshop handlers from mounting and caused `/_storyboard/workshop/pages` 404s.
- **Comments auth modal**: Fixed sign-in modal focus crash (`focus is not a function`) by binding focus to the underlying input ref.

## 3.5.0

Surface-based tool system, canvas toolbar, theme sync targets, highlight.js migration, and deployed docs panel support.

### Features

- **Per-prototype toolbar overrides** — Prototypes can now include a `toolbarConfig` key in their `.prototype.json` to override toolbar settings (tool visibility, labels, etc.) on a per-prototype basis (`7b9388d`)
- **Theme sync targets** — New "Theme settings" submenu in the theme switcher with toggles for prototype, code boxes, and canvas. Each target can independently follow or ignore the global theme (`81b3587`)
- **Canvas viewfinder styling** — Canvas entries in the viewfinder now render with the same card structure as prototypes, including a default 🎨 icon and folder organization support (`49ee33f`)
- **Tool state store** — New `toolStateStore.js` with five states per tool: active, inactive, hidden, dimmed, disabled. Tools default to active unless config or `localOnly` gating overrides (`952e0ce`)
- **Surface-based tool config** — Renamed `toolbar` to `surface` in tool config for clarity. Three surfaces: `main-toolbar`, `canvas-toolbar`, `command-list`. Any tool can target any surface (`cb9fac0`)
- **Declarative canvas toolbar** — Canvas add-widget and zoom controls promoted from hardcoded components to declarative tools with `surface: "canvas-toolbar"` (`cb9fac0`)
- **Toolbar separators** — New `render: "separator"` tool type for visual grouping in toolbars (`cb9fac0`)
- **Tool handler directory** — Tool handlers moved to `src/tools/handlers/` with surface resolvers in `src/tools/surfaces/` (`cb9fac0`)
- **Inspector line numbers** — CSS counter-based line numbers on both highlighted and plain-text code views (`76a61e6`)
- **Deployed docs panel** — README.md and repo info are now emitted as static JSON files during production builds, so the documentation side panel works on GitHub Pages and other static hosts (`cd79f0c`)
- **Local-only menu footer dot** — Green dot indicator added before "Supported in local development" footer text in create menus (`4216503`)

### Bug Fixes

- **Toolbar**: Show custom-component menus (Theme, Create) — visibility filter was gating all menu-type tools on `getActionChildren().length > 0`, hiding tools that render their own dropdown content. Added `hasChildrenProvider()` to distinguish them (`255a48e`)
- **Toolbar**: Fix infinite effect loop in toolStateStore init — `initToolbarToolStates()` synchronous `_notify()` was creating a read/write cycle on `toolStateVersion` in Svelte's `$effect`. Fixed with `untrack()` (`5424400`)
- **Toolbar**: Fix docs panel not opening from ⌘K — the docs tool had `surface: "command-list"` but no handler was registered for it. Added `handler()` export to `tools/handlers/docs.js` (`6b44575`)
- **Toolbar**: Align submenu trigger padding to match regular menu items — changed from `px-1.5 py-1` to `px-2.5 py-2` (`5fbbbc9`)
- **Canvas**: Prevent page scroll while holding space — `preventDefault()` was only called on the first space keydown, letting repeat events trigger browser default scroll (`8f81468`)
- **Inspector**: Resolve Svelte empty block warning in code view (`952e0ce`)
- **Build**: Preserve component names in production — added `esbuild.keepNames: true` so the inspector shows real component names instead of minified identifiers (`ac8b014`)
- **Build**: Rebuild UI bundle before linking — merged `link:build` into `link` script so Svelte source changes are always compiled before `npm link` (`2abfbb3`)
- **Build**: Fix shiki Vite warnings — preserved `@vite-ignore` comment in computed import specifiers (now superseded by highlight.js migration) (`7b9388d`)

### Breaking Changes

- **Shiki → highlight.js** — Replaced shiki (WASM-based) with highlight.js/core for inspector syntax highlighting. Consumers no longer need to externalize shiki in their Vite config. Remove any `external: (id) => id === 'shiki' || id.startsWith('shiki/')` from consumer `vite.config.js` (`a30cc52`)

## 3.4.0

Declarative tool system for the toolbar. Every tool is now defined in `toolbar.config.json` with a standard shape — code is only a nugget of execution. Tools declare where they render, how they render, and their visibility rules.

### Features

- **Declarative tool config** — New `tools` key in `toolbar.config.json` replaces `menus`. Each tool declares `toolbar` target (`main-toolbar`, `secondary-toolbar`, or `command-list`) and `render` type (`button`, `menu`, `sidepanel`, `submenu`, `link`). Moving a tool between targets requires only a config change (`5e40fda`)
- **Tool registry** — New `toolRegistry.js` module provides `initToolRegistry`, `registerToolModule`, `getToolsForToolbar`, and reactive subscription API. Externalized as shared state module so the UI bundle and consumer share one instance (`1e1d566`)
- **Tool modules** — Each tool extracted into its own module under `src/tools/` with a standard interface: `{ component?, handler?, setup?, guard? }`. Modules: create, theme, comments, flows, docs, inspector, devtools, featureFlags (`1273f9b`)
- **First-class command-list tools** — Devtools, Feature Flags, Viewfinder, and Repository promoted from hardcoded command menu actions to declarative tools with `toolbar: "command-list"` (`5e40fda`)
- **Config-driven keyboard shortcuts** — Tool shortcuts (e.g. `⌘D` for docs, `⌘I` for inspector) are now declared via a `shortcut` field on each tool, replacing hardcoded keybindings (`1d40b06`)
- **`localOnly` gating** — Tools with `"localOnly": true` are hidden in production. The Vite server plugin injects `window.__SB_LOCAL_DEV__` only during dev (`33f185a`)

### Bug Fixes

- **Inspector**: Eliminate 404 console noise in production — skip dev middleware endpoints entirely when `__SB_LOCAL_DEV__` is absent, go directly to static `inspector.json` (`33f185a`)
- **Inspector**: Fix `__SB_LOCAL_DEV__` leaking into production builds — flag is now only injected during `vite dev`, not `vite build` (`33f185a`)

### Refactors

- **CoreUIBar**: `onMount` reduced from ~180 to ~65 lines by loading tools from the module registry instead of 8 separate hardcoded import blocks (`1d40b06`)
- **CoreUIBar**: Backward-compatible `resolveMenus`/`resolveCommandConfig` compat layer derives legacy menu structures from the new `tools` schema (`5e40fda`)

## 3.3.2

### Bug Fixes

- **Core**: Fix `shiki/*` imports breaking consumer Rollup builds — import specifiers are now computed via template literals so bundlers skip them instead of erroring. Inspector syntax highlighting gracefully degrades when shiki is unavailable (`6fb9bb8`)
- **Canvas**: Fix spacebar scroll on keyup during pan — `preventDefault()` was missing from the `keyup` handler, causing the browser's default scroll behavior to fire on release (`3b64137`)
- **Workshop**: Accept directory name as-is from `storyboard.config.json` for partials — both singular (`template`/`recipe`) and plural (`templates`/`recipes`) forms now work for filesystem lookup and UI grouping (`22636c5`)

## 3.3.1

Fixes consumer build errors introduced in 3.3.0 where client repos without `svelte` or `shiki` installed would fail during Vite dependency optimization.

### Bug Fixes

- **Core**: Fix `import('svelte')` breaking consumer builds — `mountDevTools` in the public API now delegates to the compiled UI bundle via a lightweight proxy (`devtools-consumer.js`) instead of importing svelte directly (`88bf5d8`)
- **Core**: Fix `shiki/*` imports breaking consumer Rollup and esbuild — import specifiers are now computed via template literals so bundlers skip them instead of erroring. Inspector syntax highlighting gracefully degrades when shiki is unavailable (`88bf5d8`)
- **Core**: Make CoreUIBar toolbar config properties reactive with `$derived()` so runtime config changes propagate correctly (`88bf5d8`)
- **Core**: Remove unused `.inspector-toggle-active` CSS class from InspectorPanel (`88bf5d8`)
- **tiny-canvas**: Add `prepublishOnly` build step to ensure `dist/` is always present in published package (`88bf5d8`)

## 3.3.0

Client integration fixes, theme switching, inspector improvements, and canvas polish. This release makes the pre-compiled UI bundle fully functional in consumer repos and adds several new features.

### Features

- **Theme switcher** — Toolbar ThemeMenuButton sets Primer CSS attributes (`data-color-mode`, `data-light-theme`, `data-dark-theme`), dispatches `storyboard:theme:changed` events, persists to localStorage, and applies before React mount to prevent flash (`cf899b4`)
- **Inspector URL persistence** — Selecting an element writes `?inspect=<css-selector>` to the URL. Sharing the URL auto-opens the inspector panel and highlights the element with retry logic for async React rendering (`be836a4`, `124ca4e`)
- **Canvas auto-routing** — `StoryboardProvider` detects canvas URLs and lazy-loads `CanvasPage` automatically — consumers get canvas routing without explicit route setup (`e31f7a9`)
- **Prototype picker for canvas embeds** — Searchable list of prototypes and flows (powered by `buildPrototypeIndex()`) replaces the URL text input when adding prototype embeds. Includes "Custom URL" fallback (`5a245f6`)
- **Canvas experimental warning** — Warning banner at the top of the canvas tab in the viewfinder (`35ad1f4`)
- **Workshop creation toast** — Success notification with "Open" link survives Vite's full-reload via sessionStorage persistence (`d1b42cd`)

### Bug Fixes

- **Core**: Remove `node:fs`, `node:path` server imports from UI bundle — feature index files re-exported server handlers that got hoisted by `inlineDynamicImports` (`5cfc079`)
- **Core**: Convert shiki static imports to dynamic `import()` in highlighter.js to prevent top-level browser crashes (`5cfc079`)
- **Core**: Externalize stateful core modules (loader, modes, commandActions) from UI bundle so consumer and bundle share singleton state (`3272dbc`)
- **Core**: Bundle all CSS (Tailwind utilities, comments, modes) into single `storyboard-ui.css` (`b906b3d`)
- **Core**: Replace `import.meta.env.DEV` checks in InspectorPanel with runtime detection — compile-time evaluation eliminated the dev middleware code path (`33ba6e1`)
- **Core**: Inject repository URL from `storyboard.config.json` into toolbar command menu (`33ba6e1`)
- **Core**: Fix inspector code block to always use dark chrome independent of page theme (`be836a4`)
- **Core**: Remove duplicate source file path display in inspector panel (`909a641`)
- **Core**: Add CSS variable fallback chains for borders/colors in SidePanel and InspectorPanel (`bfe4807`, `1e28960`)
- **Core**: Hide toolbar and all core UI from prototype embeds via `?_sb_embed` early-return (`b6f8cc9`)
- **Core**: Fix workshop Create panel styles — add `tw-animate-css` for animations, `revert-layer` for Primer cascade conflict (`4ce6c75`)
- **Canvas**: Import `@dfosco/tiny-canvas/style.css` — missing CSS caused widgets to stretch full-width (`4ce6c75`)
- **Canvas**: Remove `overflow: hidden` from `.tc-draggable-inner` — was clipping sticky notes and color pickers (`ce4c909`)
- **Canvas**: Show success message with link after canvas creation (`03cf5fb`)
- **Canvas**: Add 3px border, border-radius, and soft shadow to prototype embed widgets (`5a245f6`)

### Style

- Rename "Add prototype" to "Prototype embed" in canvas menus (`ab4a804`)
- Toolbar toast positioned bottom-right above toolbar with popover styling (`d1b42cd`, `71ad492`)
- Reduced top padding on all workshop Create forms (`d1b42cd`)

## 3.2.0

The client architecture overhaul. Ships a pre-compiled Svelte UI bundle so consumer repos need zero Svelte toolchain — just call `mountStoryboardCore()`.

### Major Changes

- **Pre-compiled UI bundle** — Svelte components (CoreUIBar, comments, inspector, workshop) compiled into `dist/storyboard-ui.js` + `dist/storyboard-ui.css` via Vite library mode (`8d1a992`)
- **`mountStoryboardCore()` API** — Single entry point replaces 6+ individual imports (`8fb2688`)
- **Scaffold system** — `npx storyboard-scaffold` syncs files to consumer repos from manifest (`8fb2688`)

### Features

- **Toolbar config merge** — Client overrides in `storyboard.config.json` deep-merged with defaults (`8fb2688`)
- **Viewfinder and DesignModes** routed through compiled UI bundle (`4999a76`)
- **Package self-reference** for UI bundle import resolution (`2298684`)

### Bug Fixes

- Remove workshop `mount.ts` injection from server plugin (`3c1dd2c`)
- CSS injection via package export and `modes.css` import (`30fbf10`)
- Add `build:ui` and `dev:ui` convenience scripts (`35bfd76`)
- Lint config and `prepublishOnly` script (`13a2a52`)

### Chores

- Rename `core-ui.config.json` to `toolbar.config.json` (`162a800`)

## 3.1.1

Fixes package resolution errors when consuming `@dfosco/storyboard-core` and `@dfosco/tiny-canvas` from npm.

### Bug Fixes

- **Core**: Replace all `$lib/` SvelteKit-style import aliases with relative paths across 85 files — the alias only resolved inside the monorepo's Vite config, breaking every Svelte component for npm consumers (`62369de`)
- **tiny-canvas**: Fix package.json exports pointing to `src/index.js` which was excluded from the published tarball by the `files` field — exports now point to `dist/` (`62369de`)

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

## 2.8.0

Routing fix for viewport prototypes in deploy branches.

### Minor Changes

-   Fix routing for viewport prototypes in deploy branches

## 2.7.1

### Patch Changes

-   Change accordion defaults to closed

## 2.7.0

Persists open/closed state of accordions on the viewfinder in localStorage.

### Minor Changes

-   Persists open/closed state of accordions on /viewfinder in localStorage

## 2.6.0

Adds prototype-scoping by default for objects and improves 404 handling for missing flows.

### Minor Changes

-   Adds prototype-scoping by default for objects and improves 404 handling for missing flows

## 2.5.0

Hotfix release merging flow-route-inference to fix v2.4.0.

### Minor Changes

-   Merged flow-route-inference to fix v2.4.0

## 2.4.0

Adds automatic flow routing per directory — flows are now matched to pages based on their directory location.

### Minor Changes

-   Add automatic flow routing per directory

## 2.3.0

Adds folder-based separation of prototypes in the viewfinder, enabling `.folder/` directories to group related prototypes.

### Minor Changes

-   Add folder-based separation of prototypes in viewfinder

## 2.2.0

Bug fixes for record overrides, proper `?flow=` URL param support, and small viewfinder improvements.

### Minor Changes

-   Fix bug in applying recordOverrides. Add proper `?flow=` url param. Fix small issues with Viewfinder component.

## 2.1.0

Major internal restructure: introduces the modes system, plugins, and tools architecture. Moves prototype folders and metadata under `/prototypes` and renames scenes to flows.

### Minor Changes

-   Update storyboard internal structure to enable modes, plugins, and tools. Updates prototype folder and metadata structure to live under /prototypes. Renames scenes into flows.

## 2.0.0-beta.1

### Minor Changes

-   Add prototype and flow restructure for 2.0 (breaking change)

## 2.0.0-beta.0

### Major Changes

-   Add modes API in preparation for large breaking change refactor

## 2.0.0

The 2.0 stable release — consolidates the modes API, prototype/flow restructure, and plugin architecture from the beta series.

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactive for now)

## 1.22.0

### Minor Changes

-   Iterate feature-flag system and add dedicated `sb-ff-name` class on body

## 1.21.0

Adds the `useRecord` hooks for working with record collections in dynamic routes.

### Minor Changes

-   Add useRecord hooks

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

## 1.18.0

Adds a feature-flag module for toggling prototype behavior at runtime.

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

-   Fix bug in comment mode
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

## 1.11.1

### Patch Changes

-   Update auth modal PAT guidance: recommend fine-grained tokens with Discussions read/write permission, show minimum classic scope (repo), drop unnecessary read:user, pre-fill classic token creation form

## 1.11.0

Comments UI refactor — migrates to Alpine.js templates, adds draggable comment pins, localStorage caching, and unified reaction styles.

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

Fixes branch previews on the main deployment viewfinder, moves repository config to top-level, and derives Vite base path automatically.

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting

## 1.9.0

Major comments system overhaul with Alpine.js, Primer design tokens, and full light/dark mode support. Adds edit/delete replies, resolve/unresolve, viewport clamping, theme sync, and SPA navigation fixes.

### Minor Changes

-   Comments system, theme sync, and navigation fixes
    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

## 1.8.0

Introduces the Viewfinder component — a home page listing all prototypes with scene metadata (route and author) support.

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

## 1.7.1

### Patch Changes

-   Bug fixes

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

## 1.5.0

The comments release. Adds a full comments system backed by GitHub Discussions — place contextual, position-aware comments on any prototype page with threaded replies, reactions, and a comments drawer.

### Minor Changes

-   feat: add comments system with GitHub Discussions backend

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

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
