# @dfosco/storyboard-core

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
