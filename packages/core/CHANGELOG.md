# @dfosco/storyboard-core

## 4.0.0-beta.36

### Patch Changes

-   Remove all snapshot code from StoryWidget, fix prototype titles

    -   StoryWidget cleaned of snapshot system (490 → 276 lines)
    -   Prototype titles show "PrototypeName · FlowName" instead of URLs
    -   Removed refresh-thumbnail action from prototype and story configs
    -   Deleted useSnapshotCapture.js and refreshQueue.js

## 4.0.0-beta.35

### Minor Changes

-   Remove snapshot capture system — iframes load directly like pre-beta.24

    -   Removed useSnapshotCapture, refreshQueue, theme-change auto-refresh
    -   741 → 421 lines in PrototypeEmbed (320 lines of complexity removed)
    -   Eliminates iframe auto-mount cascades, re-render storms, and capture timeouts
    -   Prototype embeds now load instantly on click with no intermediate states

## 4.0.0-beta.34

### Patch Changes

-   Fix iframe auto-mount cascade on canvas page load

    -   Replace double-mount-vulnerable canvasThemeInitRef with 3s mount-time guard
    -   Clear broken snapshot URLs from widget data on 404
    -   hasSnapRef defense-in-depth for stale closure protection

## 4.0.0-beta.33

### Patch Changes

-   Add comprehensive iframe lifecycle logging for embed widget debugging

## 4.0.0-beta.32

### Patch Changes

-   Fix iframe auto-mount when snapshot images are missing from disk

    -   Use ref to check hasSnap at callback time instead of stale closure value
    -   Prevents 404'd snapshots from triggering iframe mount cascade

## 4.0.0-beta.31

### Patch Changes

-   Fix iframe auto-mount on canvas load when snapshots are missing

    -   Don't auto-mount iframes for snapshot refresh when no snapshot exists
    -   Hide rename-watcher startup notice from dev server output

## 4.0.0-beta.30

### Patch Changes

-   Canvas JSONL compaction to prevent performance degradation

    -   `storyboard compact` command to compact bloated canvas JSONL files
    -   Auto-compacts on `storyboard dev` startup and every 15 minutes
    -   Threshold: 500KB — eliminates redundant `widgets_replaced` history

## 4.0.0-beta.29

### Minor Changes

-   Add CodePen embed widget for canvas

    -   Paste any CodePen pen URL onto a canvas to create an interactive embed
    -   Same behavior as Figma embeds: click-to-interact, expand modal, open-external
    -   Header bar shows pen title and author name via CodePen oEmbed API
    -   Paste rule matches codepen.io pen/full/details/embed URLs

## 4.0.0-beta.28

### Minor Changes

-   GitHub embeds, canvas snapshot improvements, and story route cleanup

    -   **feat:** GitHub embed hydration — paste issue/PR/discussion/comment URLs for rich cards with full markdown, signed images, videos, author avatars
    -   **feat:** Collapse/expand height for GitHub embeds with viewport pan
    -   **feat:** Title bar with GitHub mark icon, clickable title and author links
    -   **feat:** Pull Request URL support for embeds
    -   **feat:** Widget chrome actions — refresh data, open in new tab, copy markdown
    -   **feat:** Canvas embed snapshot wave-refresh with theme-aware captures
    -   **feat:** Keep Figma embeds alive for 2min after deselect
    -   **fix:** Signed image URLs via body_html (JWT tokens, no broken proxy)
    -   **fix:** Video blinking, checkbox accent color, clickable links in body
    -   **refactor:** Strip layout chrome from story routes

## 4.0.0-beta.27

### Patch Changes

-   Fix hooks ordering crash on canvas page (useCallback after early return)

## 4.0.0-beta.26

### Patch Changes

-   Performance: eliminate zoom re-render cascade and optimize snapshot capture

    -   Replace `flushSync(setZoom)` with imperative DOM mutation for smooth canvas zoom
    -   Pipeline dual-theme snapshot capture with non-blocking widget exit
    -   Memoize widget subtrees to prevent unnecessary re-renders
    -   Reduce snapshot pixelRatio from 2→1 for faster captures

## 4.0.0-beta.25

### Patch Changes

-   Flash-free snapshot hotswap with dual-theme layering

    -   Both themed snapshot images always in DOM, CSS-swapped for instant theme switching
    -   Iframe stays mounted until snapshots captured and preloaded — no flash on exit
    -   Intermediate snapshot publish before alt-theme capture prevents placeholder flash
    -   Shared resolveCanvasTheme() fixes StoryWidget theme resolution
    -   Exit session tracking prevents stale capture callbacks from closing reopened iframes

## 4.0.0-beta.24

### Patch Changes

-   Remove local snapshot generation from scaffold pre-push hook

    -   Scaffold pre-push hook still had stage_snapshots in STAGES array, causing client repos to run local snapshot generation on push
    -   Snapshot generation is now CI-only via snapshots.yml workflow

## 4.0.0-beta.23

### Patch Changes

-   Dev logs toggle, click-to-jump-queue, and scaffold workflow fixes

    -   Dev Logs toggle in Devtools toolbar — logs iframe queue and snapshot state transitions (gated behind feature flag)
    -   Clicking to interact on a queued embed now immediately starts its iframe and releases the queue slot
    -   Scaffold now includes preview.yml and snapshots.yml workflows for client repos
    -   Scaffold workflows updated to match client repo patterns (actions v6, node 22, .nojekyll)

## 4.0.0-beta.22

### Patch Changes

-   Sequential iframe queue for canvas embeds and CI snapshot generation

    -   Canvas embeds without snapshots now load one at a time via a sequential queue, preventing browser jams
    -   Snapshot generation moved to CI with stable naming and dirty detection
    -   Undo history cap reverted to 100

## 4.0.0-beta.21

### Patch Changes

-   Fix snapshot generation and add server-side widget filtering

    -   Fix snapshot screenshots using unsupported webp format — now uses png
    -   Add server-side widget filtering for canvas read API

## 4.0.0-beta.20

### Patch Changes

-   Fix story code view loading stuck in production builds

    -   Fix source code loading effect getting stuck on "Loading…" under StrictMode double-mount
    -   Install playwright as local devDependency for snapshot generation

## 4.0.0-beta.19

### Minor Changes

-   Mobile experience and canvas improvements

    -   **Mobile toolbar**: On viewports narrower than 500px, main-toolbar tools move into the ⌘ command menu (flows, theme, comments, inspector). Canvas toolbar stays visible.
    -   **Pinch-to-zoom on canvas**: Two-finger pinch gesture zooms canvas widgets on mobile. Browser-level zoom is disabled so only the canvas responds.
    -   **Pull-to-refresh prevention**: Added `overscroll-behavior-y: contain` to prevent pull-to-refresh interference.
    -   **PWA install prompt**: Mobile-only "Add to Home Screen" banner using `beforeinstallprompt` API with localStorage dismiss.
    -   **Canvas viewport persistence**: Zoom level and scroll position saved per-canvas in localStorage, with time-gated restore (15 min) and zoom-to-fit fallback.
    -   **Figma embed snapshots**: Canvas Figma embeds now generate preview snapshots.
    -   **Snapshots CLI**: New `storyboard snapshots` command for batch canvas preview generation.
    -   **Setup improvements**: `storyboard setup` now scaffolds git hooks and installs Playwright for snapshot generation.
    -   **Story source in prod**: Deploy story source as JSON endpoint for production builds.

## 4.0.0-beta.18

### Patch Changes

-   Fix highlight.js build failure in CI

    -   Use highlight.js/lib/_ export specifiers instead of ./es/_ internal paths

## 4.0.0-beta.17

### Patch Changes

-   Fixes highlight.js bundling for Vite consumers

    -   Use highlight.js ESM entry points for Vite compatibility
    -   Add highlight.js and html-to-image to core package dependencies

## 4.0.0-beta.16

### Patch Changes

-   Fix broken monorepo-relative imports

    -   Replace monorepo-relative imports with proper package imports for correct resolution in published packages

## 4.0.0-beta.15

### Minor Changes

-   Story widgets, canvas snapshots, and component menu

    -   Story-format widget system with iframe embedding, snapshot lazy-loading, and code view
    -   Canvas component menu with story picker and creation form
    -   Multi-page canvas with path-based IDs and page selector
    -   Config-driven paste rule engine
    -   Canvas folder .meta.json support
    -   Snapshot-to-iframe swap with delayed spinner and retina capture
    -   Cmd+click to open flow in new tab
    -   Persistent show-code state, resize handles on markdown widgets
    -   Dynamic document.title reflecting current artifact
    -   Numerous canvas widget, grid, zoom, and code view fixes

## 4.0.0-beta.14

### Minor Changes

-   Workshop UX improvements and autocommit fix

    -   feat: hide New Flow and New Page actions on canvas routes
    -   feat: add optional description field to canvas creation
    -   fix: autocommit in storyboard update stages files individually

## 4.0.0-beta.13

### Minor Changes

-   useFlowData optional flag, advanced copy-paste, and workshop branch-deploy fixes

    -   feat: add { optional } flag to useFlowData to suppress missing-path warnings
    -   feat: advanced copy-paste with canvasName/widgetId clipboard format
    -   fix: workshop create forms now work on branch deploys (use **STORYBOARD_BASE_PATH**)
    -   fix: snap-to-grid race condition between React and Svelte toolbar
    -   fix: sync snapToGrid and gridSize when canvas data loads
    -   fix: elevate stacking context of hovered/selected canvas widgets
    -   refactor: remove redundant Shift+C shortcut

## 4.0.0-beta.12

### Patch Changes

-   Canvas dark mode fixes, widget menu alignment, and HMR reliability improvements.

    -   ComponentWidget now uses theme background color in dark mode
    -   Overflow menu properly aligned to button edge
    -   Fix nested $variable resolution in dropdown alt labels
    -   Canvas file changes correctly invalidate for fresh page loads
    -   Suppress noisy console errors (branches.json, smooth-corners)

## 4.0.0-beta.11

### Patch Changes

-   Canvas interaction and styling improvements

    -   Embed click-to-interact overlay for better canvas UX
    -   Primer CSS and ThemeProvider support in component iframes
    -   Prod-flagged widget features now visible in production mode
    -   Multi-select and space-pan conflict fixes
    -   Remark ESM/CJS interop fix for Vite optimizeDeps

## 4.0.0-beta.10

## 4.0.0-beta.9

### Patch Changes

-   Fix debug ESM/CJS interop error in dev mode.

    -   fix: add `debug` to Vite `optimizeDeps.include` so micromark's development build resolves correctly

## 4.0.0-beta.8

### Minor Changes

-   Canvas collision detection, copy-path shortcut, and dev server fixes.

    -   feat(canvas): add collision detection utility for widget positioning
    -   feat(canvas): Shift+C copies file path for image widgets
    -   fix(cli): resolve dev server port from Caddy instead of ports.json
    -   fix(canvas): fix copy shortcut keybinding

## 4.0.0-beta.7

### Patch Changes

-   Canvas widget copy shortcuts

    -   Add ⌘/Ctrl+C to copy selected widget's URL/content to clipboard
    -   Add ⌥⌘/Alt+Ctrl+C to copy selected widget's ID to clipboard

## 4.0.0-beta.6

### Minor Changes

-   [`2022d2f`](https://github.com/dfosco/storyboard/commit/2022d2f4cb154fa6263415f21b5bc4a0e5391cd5) Thanks [@dfosco](https://github.com/dfosco)! - ### Features

    -   **cli**: Add optional branch argument to `storyboard dev` command

    ### Fixes

    -   **canvas**: Make "Copy file path" an alt of "Copy as PNG" on images
    -   **canvas**: Prevent line breaks in widget overflow menu items
    -   **dev**: Detect branch name for base path when not in a worktree
    -   **autosync**: Fix string spread bug in `listChangedFiles`

-   Canvas CLI, component isolation, and GFM markdown

    -   Add `storyboard canvas read` CLI to query widget IDs, content, URLs, and file paths
    -   Iframe-isolate component widgets for better CSS/JS encapsulation
    -   Switch markdown rendering to remark with GitHub Flavored Markdown
    -   Auto-convert root branch to worktree when running `sb dev`
    -   Fix stale Caddy proxy route cleanup

## 4.0.0-beta.4

### Patch Changes

-   Faster dev server startup (~14.5s → ~7s)

    -   Batch git metadata calls into 1-2 subprocesses instead of per-file
    -   Scope glob ignore to skip .worktrees/ and public/ during data file discovery

## 4.0.0-beta.3

### Minor Changes

-   Fix GH Pages 404s caused by CNAME deletion on deploy

    -   Emit CNAME file during Vite build when `customDomain` is set in storyboard.config.json
    -   Scaffold deploy.yml and customDomain config field for new client repos
    -   Expanded CLI: create commands with flag support, canvas skill, getting-started help
    -   Autosync refactored to direct commit strategy (no worktree)
    -   Caddy proxy uses admin API for multi-repo route isolation
    -   Rename watcher for canvas embed URL sync
    -   Default hideFlows to true for flow files

## 4.0.0-beta.2

### Major Changes

-   CLI update commands and dev domain config

    -   **CLI update channels** — `storyboard update`, `update:beta`, `update:alpha`, and `update:<version>` shorthand
    -   **Dev domain config** — `devDomain` key in storyboard.config.json to customize dev server domain
    -   **Fix** — route any `update:*` command correctly instead of showing "Unknown command"

## 4.0.0-beta.1

### Major Changes

-   Canvas paste and CLI update command

    -   **Canvas paste** — pasting non-URL text on canvas creates a markdown widget
    -   **CLI** — replaced `update:flag` with `update:version` to update storyboard packages in client repos

## 4.0.0-beta.0

### Major Changes

-   Storyboard 4.0 — canvas system overhaul, CLI tooling, and production mode

    -   **Canvas undo/redo** — full undo/redo queue for widget moves, resizes, copies, and deletes
    -   **Canvas snap-to-grid** — toggle snap for widget positions and resize with configurable grid size
    -   **Canvas multi-select & drag** — shift+click multi-select, group drag with preview
    -   **Canvas widgets** — Figma embed, image paste, copy widget, expand modal, open-in-new-tab, config-driven dropdown menus and tools
    -   **Canvas zoom** — zoom-to-fit, persistent viewport across sessions
    -   **Canvas prototype embed** — persisted navigation with undo/redo, hash change tracking
    -   **Autosync** — scope modes (canvas/prototype), branch worktree isolation, automatic commit/push, stash external edits during sync
    -   **Storyboard CLI** — new `storyboard` CLI with Caddy proxy for clean dev URLs, worktree port registry, polished output with `@clack/prompts`, `storyboard exit` command
    -   **Production mode** — `prodMode` URL param, devtools toggle, read-only canvas, local editing indicators
    -   **Setup experience** — friendly welcome with mascot and getting started guide, turn-key setup (auto-install brew, caddy, gh)
    -   **Default base URL** changed from `/storyboard/` to `/`
    -   **Config-driven toolbar** — restructured `toolbar.config.json` with surfaces, tool entries, and widget configs
    -   **Branch preview** — `branch--<name>` prefix for worktree URLs matching deploy convention

## 3.11.0

### Minor Changes

-   [`3715731`](https://github.com/dfosco/storyboard/commit/3715731be4e7559b958af9e0f550f895ae759d85) Thanks [@dfosco](https://github.com/dfosco)! - Config-driven dropdown menus and image widget actions

    -   New `dropdown` feature type — renders a chevron button with a menu of actions, fully config-driven
    -   Image widget dropdown: Download image, Copy as PNG, Copy file path
    -   Component widgets now have "Copy link to widget" in overflow menu
    -   Widget URL centering supports JSX source widgets (jsx-\* IDs)

-   [`542d59d`](https://github.com/dfosco/storyboard/commit/542d59d5cb3028ea77d7b8a55b888cf19f7bbd7b) Thanks [@dfosco](https://github.com/dfosco)! - Canvas editing improvements and image paste support

    -   Paste images directly onto the canvas — retina-aware sizing, privacy toggle, aspect-ratio-correct rendering
    -   Figma embed widget for pasted Figma URLs
    -   Persist viewport position (scroll x/y) and zoom across sessions via localStorage
    -   Per-client HMR guard — canvas pages suppress reloads while editing, other tabs unaffected
    -   Color picker renders below trigger with seamless hover bridge
    -   Widget toolbar improvements: Primer Tooltips, Octicon icons, ESC to deselect, open-in-new-tab for prototype embeds
    -   Fix: use relative imports for Vite plugins so worktrees load their own source

-   [`917bd74`](https://github.com/dfosco/storyboard/commit/917bd74fdbc20ea29b4cf1ff73350056934f111a) Thanks [@dfosco](https://github.com/dfosco)! - Canvas tooling: zoom-to-fit, copy widget, undo/redo, and embed navigation

    -   Zoom to objects button frames all widgets in the viewport
    -   Copy widget tool duplicates any widget at cascading +40px offsets
    -   Full undo/redo system for canvas operations (⌘Z / ⌘⇧Z)
    -   Prototype embed navigation is now persisted and undoable
    -   Canvas toolbar moved to Svelte CoreUIBar (zoom, undo/redo, zoom-to-objects)
    -   Default sizes: sticky note 270×170, markdown 530×240
    -   Tooltip delay reduced to 50ms

-   [`709917c`](https://github.com/dfosco/storyboard/commit/709917c4d85fec150515882e4992e3b27034a18b) Thanks [@dfosco](https://github.com/dfosco)! - Config-driven widget resize and dark mode fix

    -   Widget resize is now controlled via `resize: { enabled, prod }` in widgets.config.json
    -   New `isResizable(type)` helper respects config + build environment + mutability
    -   Fix: select handle now shows correct accent color in dark mode

-   Storyboard 3.11.0

    Canvas

    -   Multi-select: shift+click widgets, group drag with animated peer transitions
    -   Undo/redo for widget moves, resizes, and component widgets
    -   Snap-to-grid toggle for widget positions and resize
    -   Zoom-to-fit button, viewport persistence across sessions
    -   Figma embed widget for pasted Figma URLs
    -   Paste images directly on canvas
    -   Widget URLs, copy widget, open-in-new-tab actions
    -   Config-driven widget resize, dropdown menus, and feature flags
    -   Expand modal for prototype and figma embed widgets
    -   Drag surface and improved widget selection
    -   Canvas route 404 fallback
    -   gridSize edge padding on canvas boundary
    -   Suppress HMR full-reloads while canvas is active

    Production mode

    -   ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Canvas title renders as static h1 in prod
    -   Default cursor on all widgets in locked/prod mode
    -   Markdown text selection and copy in prod, edit mode disabled
    -   Prod flag system for toolbar tools and widget chrome features

    Autosync

    -   Automatic commit and push tool
    -   Scope modes (all/branch), hide main branch from relay list
    -   Isolate sync in branch worktree
    -   Stash external edits during sync

    Canvas polish

    -   Faster multi-drag peer transition (150ms + 50ms delay)
    -   Accent color select handle in dark mode
    -   Solid outline for multi-selected widgets
    -   Drag boundary flicker fix with transform callback

-   [`3800568`](https://github.com/dfosco/storyboard/commit/3800568a0585ce61a7811d00b6c26c82aebab07c) Thanks [@dfosco](https://github.com/dfosco)! - Snap-to-grid and viewfinder tab persistence

    -   Snap-to-grid toggle in canvas toolbar — snaps widget positions and resize to grid (default 40px)
    -   Persisted as snapToGrid in canvas settings, configurable via gridSize
    -   Viewfinder canvas/prototype tab now stored in localStorage instead of URL hash

-   [`e97a4de`](https://github.com/dfosco/storyboard/commit/e97a4def7fc4cd1412aa3700ea727bfd99cb69b9) Thanks [@dfosco](https://github.com/dfosco)! - Widget URLs, overflow menu, and config-driven widget tools

    -   Each widget has a unique URL (?widget=id) that centers the viewport on load
    -   Widget toolbar "..." overflow menu with "Copy link to widget" and "Delete widget"
    -   Widget tools (icons, labels, menu placement) fully driven by widgets.config.json
    -   Config variables system ($label:duplicate, etc.) for shared text
    -   Fix: comment deep links (?comment=id) now open the comment box on cache hit
    -   Prototype embed navigation persisted with undo/redo support

### Patch Changes

-   [`62538dd`](https://github.com/dfosco/storyboard/commit/62538dd30dc7052a386be4729f214a5664758869) Thanks [@dfosco](https://github.com/dfosco)! - Add autosync tool entry to toolbar.config.json so the AutoSync button renders in the main toolbar (dev-only).

-   [`79b55bf`](https://github.com/dfosco/storyboard/commit/79b55bfe4ada902df569afbf2753d3cd6ebae276) Thanks [@dfosco](https://github.com/dfosco)! - Canvas expand modal, multi-select, and drag improvements

    -   feat: expand modal for prototype and figma embed widgets — iframe reparenting via moveBefore() for instant expand without reload
    -   feat: multi-select for canvas widgets with shift-click support
    -   feat: drag surface and improved widget selection UX
    -   feat: prod flag system for toolbar tool features
    -   fix: viewfinder FOUC from duplicate async CSS loading paths
    -   fix: drag boundary flicker eliminated via neodrag transform callback
    -   fix: canvas stuck on loading in production builds
    -   fix: drag handle detection supports multi-handle selectors
    -   fix: select handle uses onClick, better drag/select distinction
    -   fix: solid outline for multi-selected widgets

-   [`0bb755e`](https://github.com/dfosco/storyboard/commit/0bb755e23cd9d797ce2e09d5b55c148737732d43) Thanks [@dfosco](https://github.com/dfosco)! - Fix multi-select drag on canvas

    -   Any selected widget can now serve as the drag handler for the entire group
    -   Peers animate to new positions on drag end via delayed CSS transition
    -   Selection is preserved during and after drag (no longer collapses on click)
    -   Mixed selections of JSON + JSX component widgets now move together

-   [`c781179`](https://github.com/dfosco/storyboard/commit/c781179eb51ce0efed1f68af2265d82633a56740) Thanks [@dfosco](https://github.com/dfosco)! - Fix multi-select drag not applying to component widgets

    -   Pass multiSelected prop to component widget WidgetChrome so they participate in group drag operations

-   [`7994b34`](https://github.com/dfosco/storyboard/commit/7994b343bf2bc9a6160f3442c1b9944bdc55ca0b) Thanks [@dfosco](https://github.com/dfosco)! - Production mode simulation and canvas polish

    -   Add ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Add gridSize edge padding to canvas boundary
    -   Faster multi-drag peer transition (150ms duration + 50ms delay)
    -   Canvas title renders as static h1 in prod (no hover/edit)
    -   Default cursor on all widgets in prod/locked mode
    -   Markdown widgets: text selection and copy works in prod, edit mode disabled

-   [`444e732`](https://github.com/dfosco/storyboard/commit/444e73206abc444295d00e9a40cd682d92d8ac98) Thanks [@dfosco](https://github.com/dfosco)! - Autosync scope modes, canvas fallback, and polish

    -   Autosync: add scope modes (all/branch) and hide main branch from relay list
    -   Autosync: isolate sync in branch worktree, stash external edits during sync
    -   Autosync: refine enabled-state menu actions, show single relay last-sync time
    -   Add canvas route 404 fallback for unknown canvas names
    -   Fix border radius on embed widgets
    -   Update canvas and toolbar configs

## 3.11.0-beta.12

### Patch Changes

-   Autosync scope modes, canvas fallback, and polish

    -   Autosync: add scope modes (all/branch) and hide main branch from relay list
    -   Autosync: isolate sync in branch worktree, stash external edits during sync
    -   Autosync: refine enabled-state menu actions, show single relay last-sync time
    -   Add canvas route 404 fallback for unknown canvas names
    -   Fix border radius on embed widgets
    -   Update canvas and toolbar configs

## 3.11.0-beta.11

### Patch Changes

-   Production mode simulation and canvas polish

    -   Add ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Add gridSize edge padding to canvas boundary
    -   Faster multi-drag peer transition (150ms duration + 50ms delay)
    -   Canvas title renders as static h1 in prod (no hover/edit)
    -   Default cursor on all widgets in prod/locked mode
    -   Markdown widgets: text selection and copy works in prod, edit mode disabled

## 3.11.0-beta.10

### Patch Changes

-   Fix multi-select drag not applying to component widgets

    -   Pass multiSelected prop to component widget WidgetChrome so they participate in group drag operations

## 3.11.0-beta.9

### Patch Changes

-   Fix multi-select drag on canvas

    -   Any selected widget can now serve as the drag handler for the entire group
    -   Peers animate to new positions on drag end via delayed CSS transition
    -   Selection is preserved during and after drag (no longer collapses on click)
    -   Mixed selections of JSON + JSX component widgets now move together

## 3.11.0-beta.8

### Minor Changes

-   Config-driven widget resize and dark mode fix

    -   Widget resize is now controlled via `resize: { enabled, prod }` in widgets.config.json
    -   New `isResizable(type)` helper respects config + build environment + mutability
    -   Fix: select handle now shows correct accent color in dark mode

## 3.11.0-beta.7

### Patch Changes

-   Canvas expand modal, multi-select, and drag improvements

    -   feat: expand modal for prototype and figma embed widgets — iframe reparenting via moveBefore() for instant expand without reload
    -   feat: multi-select for canvas widgets with shift-click support
    -   feat: drag surface and improved widget selection UX
    -   feat: prod flag system for toolbar tool features
    -   fix: viewfinder FOUC from duplicate async CSS loading paths
    -   fix: drag boundary flicker eliminated via neodrag transform callback
    -   fix: canvas stuck on loading in production builds
    -   fix: drag handle detection supports multi-handle selectors
    -   fix: select handle uses onClick, better drag/select distinction
    -   fix: solid outline for multi-selected widgets

## 3.11.0-beta.6

### Patch Changes

-   Add autosync tool entry to toolbar.config.json so the AutoSync button renders in the main toolbar (dev-only).

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
