# @dfosco/storyboard-react

## 3.10.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.1
    -   @dfosco/tiny-canvas@3.10.0-beta.1

## 3.10.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.0
    -   @dfosco/tiny-canvas@3.10.0-beta.0

## 3.9.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.1
    -   @dfosco/tiny-canvas@3.9.1

## 3.9.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.0

## 3.8.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.2

## 3.8.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.1

## 3.8.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.0

## 3.7.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.7.0

## 3.6.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.1

## 3.6.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.0

## 3.5.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.5.0

## 3.4.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.4.0

## 3.3.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.2

## 3.3.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.1

## 3.3.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.0

## 3.2.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.2.0

## 3.1.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.2

## 3.1.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.1

## 3.1.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.0

## 3.0.0

### Major Changes

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

### Patch Changes

-   Updated dependencies
-   Updated dependencies [a00140e]
    -   @dfosco/storyboard-core@3.0.0

## 2.7.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.1

## 2.7.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.0

## 2.6.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.6.0

## 2.5.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.5.0

## 2.4.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.4.0

## 2.3.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.3.0

## 2.2.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.2.0

## 2.1.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.1.0

## 2.0.0

### Patch Changes

-   Updated dependencies [fd0a4a9]
-   Updated dependencies [7861e32]
-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0

## 2.0.0-beta.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.0

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.24.0

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactice for now)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.23.0

## 1.22.0

### Minor Changes

-   Iterate FF system and add dedicated `sb-ff-name` class on body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.22.0

## 1.21.0

### Minor Changes

-   Add useRecord hooks

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.21.0

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.20.0

## 1.19.0

### Minor Changes

-   Add devtools on/off config flag

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.19.0

## 1.18.0

### Minor Changes

-   Add feature-flag module

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.18.0

## 1.17.3

### Patch Changes

-   Fix comment overlay and optimistic submission, fix link to PAT generation
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.3

## 1.17.2

### Patch Changes

-   Fixup title case on scene names in Viewfinder
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.2

## 1.17.1

### Patch Changes

-   Fix and improve viewfinder design
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.1

## 1.17.0

### Minor Changes

-   Update Storyboard index page customization

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.0

## 1.16.0

### Minor Changes

-   Improve design and customization on viewfinder home

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.16.0

## 1.15.2

### Patch Changes

-   Update release pipeline
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.2

## 1.15.1

### Patch Changes

-   Fix bug in hide mode, add dark-mode comment cursor
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.1

## 1.15.0

### Minor Changes

-   -   Fix bug in comment mode
    -   Improve and increase test surface
    -   Improve release script
    -   Adjust linter

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.0

## 1.14.0

### Minor Changes

-   Fix state class being added to body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.14.0

## 1.13.0

### Minor Changes

-   Change viewfinder to display branches as a dropdown

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.13.0

## 1.12.0

### Minor Changes

-   States represented via classes on DOM

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.12.0

## 1.11.3

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.3

## 1.11.2

### Patch Changes

-   8f3c8bc: Add state-based classes to body tag
-   Updated dependencies [7a24fd0]
-   Updated dependencies [8f3c8bc]
    -   @dfosco/storyboard-core@1.11.2

## 1.11.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.1

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

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.0

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.10.0

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.9.0

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.8.0

## 1.7.1

### Patch Changes

-   Fix Vite optimizeDeps error by auto-excluding @dfosco/storyboard-react from esbuild pre-bundling
    -   @dfosco/storyboard-core@1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.7.0

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.6.0

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

### Patch Changes

-   Updated dependencies [f7061c5]
    -   @dfosco/storyboard-core@1.1.0

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
-   Updated dependencies
    -   @dfosco/storyboard-core@1.0.1
