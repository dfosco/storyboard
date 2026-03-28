# Migrate Comments UI from Alpine.js to Svelte

## Problem

The comments system UI (`packages/core/src/comments/ui/`) is built with Alpine.js — inline HTML templates, `x-data`, `x-model`, `window.Alpine.data()`, and `Alpine.initTree()`. The workshop was already migrated to Svelte. This plan migrates the remaining Alpine UI to Svelte components while preserving all behavior and the existing imperative API surface.

## Current Architecture

```
comments/
├── index.js          — barrel exports (unchanged)
├── config.js         — comments config (unchanged)
├── auth.js           — PAT storage, validation (unchanged)
├── commentMode.js    — toggle state, subscribers (unchanged)
├── commentCache.js   — localStorage cache (unchanged)
├── api.js            — GraphQL CRUD operations (unchanged)
├── graphql.js        — GraphQL client (unchanged)
├── metadata.js       — metadata parsing (unchanged)
├── queries.js        — GraphQL query strings (unchanged)
└── ui/
    ├── mount.js          — Alpine.js init, keyboard shortcuts, overlay, pin rendering
    ├── authModal.js      — PAT entry modal (Alpine)
    ├── composer.js       — inline comment textarea (Alpine)
    ├── commentWindow.js  — thread viewer with replies/reactions (Alpine, ~550 lines)
    ├── commentsDrawer.js — right-side drawer listing all comments (Alpine)
    ├── CommentOverlay.js — DevTools menu items (vanilla JS, no Alpine)
    ├── comments.css      — all comments styles
    ├── comment-cursor.svg / comment-cursor-dark.svg
    ├── mount.test.js
    └── authModal.test.js
```

### Key Constraints

1. **Imperative API must be preserved** — `openAuthModal()`, `showComposer()`, `showCommentWindow()`, `openCommentsDrawer()`, `closeCommentWindow()`, `closeCommentsDrawer()`, and `mountComments()` are all called imperatively from non-Svelte code (mount.js, CommentOverlay.js, tool actions).

2. **Dynamic DOM mounting** — Components are created/destroyed on demand at arbitrary positions (pins at x/y%, composer at click position, window next to pins). They are NOT statically rendered in a component tree.

3. **mount.js is mostly vanilla JS** — The overlay, pins, banner, keyboard shortcuts, and click handling are all imperative DOM manipulation. Alpine is only used for the 4 form/modal components.

## Approach

Replace Alpine.js usage in the 4 UI components with Svelte. Keep the imperative mount pattern using Svelte's `mount()`/`unmount()` API (same pattern as `mountSveltePlugin()`). The orchestration layer (`mount.js`) stays as vanilla JS with Alpine references removed.

### What changes

| File | Action |
|------|--------|
| `ui/AuthModal.svelte` | **New** — replaces Alpine template in `authModal.js` |
| `ui/Composer.svelte` | **New** — replaces Alpine template in `composer.js` |
| `ui/CommentWindow.svelte` | **New** — replaces Alpine template in `commentWindow.js` |
| `ui/CommentsDrawer.svelte` | **New** — replaces Alpine template in `commentsDrawer.js` |
| `ui/authModal.js` | **Rewrite** — imperative `openAuthModal()` mounts Svelte instead of Alpine |
| `ui/composer.js` | **Rewrite** — imperative `showComposer()` mounts Svelte instead of Alpine |
| `ui/commentWindow.js` | **Rewrite** — imperative `showCommentWindow()` mounts Svelte instead of Alpine |
| `ui/commentsDrawer.js` | **Rewrite** — imperative `openCommentsDrawer()` mounts Svelte instead of Alpine |
| `ui/mount.js` | **Modify** — remove `Alpine` import, `Alpine.start()`, `window.Alpine = Alpine`. All other logic (overlay, pins, banner, keyboard, click handling) stays unchanged. |
| `ui/mount.test.js` | **Modify** — remove Alpine mock, test structure stays the same |
| `ui/authModal.test.js` | **Modify** — remove Alpine mock, test against Svelte mount behavior |
| `ui/CommentOverlay.js` | **Unchanged** — vanilla JS, no Alpine dependency |
| `ui/comments.css` | **Unchanged** — class-based styles work with any framework |

### What does NOT change

- `config.js`, `auth.js`, `commentMode.js`, `commentCache.js`, `api.js`, `graphql.js`, `metadata.js`, `queries.js` — all framework-agnostic, untouched
- `comments/index.js` — barrel exports stay the same
- `CommentOverlay.js` — already vanilla JS
- `comments.css` — class-based, framework-agnostic
- Pin rendering in `mount.js` — remains vanilla DOM (pins are simple divs with drag handlers, not worth componentizing)
- The imperative function signatures — `openAuthModal()`, `showComposer()`, etc. stay identical

## Component Details

### 1. AuthModal.svelte

Replaces the Alpine `x-data="sbAuthModal"` template in `authModal.js`.

**Props:** `onDone: (user) => void`, `onClose: () => void`

**State:** `token`, `submitting`, `error`, `user`

**Behavior:**
- Text input for PAT token
- Submit validates via `validateToken()`, stores via `setToken()`
- Shows user avatar/login on success
- "Done" button resolves with user
- Escape/backdrop-click resolves with null
- Auto-focuses input on mount

**Imperative wrapper (`authModal.js`):**
```js
export function openAuthModal() {
  return new Promise((resolve) => {
    // Create backdrop, mount AuthModal into it with Svelte mount()
    // onDone/onClose destroy and resolve
  })
}
```

### 2. Composer.svelte

Replaces the Alpine `x-data="sbComposer"` template in `composer.js`.

**Props:** `user`, `onCancel`, `onSubmit`

**State:** `text`, `error`

**Behavior:**
- Textarea with user avatar header
- Cmd/Ctrl+Enter to submit
- Escape to cancel
- Submit calls `onSubmit(text)` and self-destructs
- Auto-focuses textarea on mount
- Viewport adjustment (repositions to stay within viewport)

**Imperative wrapper (`composer.js`):**
```js
export function showComposer(container, xPct, yPct, route, callbacks) {
  // Create positioned div, mount Composer into it with Svelte mount()
  // Return { el, destroy }
}
```

### 3. CommentWindow.svelte

Replaces the Alpine `x-data="sbCommentWindow"` template in `commentWindow.js`. This is the largest component (~550 lines of Alpine → Svelte).

**Props:** `comment`, `discussion`, `user`, `onClose`, `onMove`

**State:** `resolved`, `resolving`, `copied`, `editing`, `editText`, `saving`, `replyText`, `submittingReply`, `editingReply`, `editReplyText`, `savingReply`, `pickerTarget`, `reactions`, `replyReactions`, `replyTexts`

**Behavior:**
- Header with author, date, resolve/unresolve, copy-link, close
- Comment body with inline edit
- Reaction bar with emoji picker
- Replies list with per-reply editing, deleting, reactions
- Reply textarea with Cmd/Ctrl+Enter
- Draggable header (view-only repositioning)
- Deep-link URL param (`?comment=`)
- Viewport adjustment positioning

**Imperative wrapper (`commentWindow.js`):**
```js
export function showCommentWindow(container, comment, discussion, callbacks) {
  // Destroy previous, create positioned div, mount CommentWindow with Svelte mount()
  // Return { el, destroy }
}
```

### 4. CommentsDrawer.svelte

Replaces the Alpine `x-data="sbCommentsDrawer"` template in `commentsDrawer.js`.

**Props:** `onClose`, `onNavigate`

**State:** `loading`, `error`, `groups`

**Behavior:**
- Fetches all discussions via `listDiscussions()` + `fetchRouteDiscussion()`
- Groups comments by route
- Shows loading/empty/error states
- Click navigates to route with `?comment=` param
- Escape to close
- Slide-in animation

**Imperative wrapper (`commentsDrawer.js`):**
```js
export function openCommentsDrawer() {
  // Create backdrop + drawer container, mount CommentsDrawer with Svelte mount()
  // Store reference for closeCommentsDrawer()
}
```

### 5. mount.js changes

Minimal — remove these 3 lines:
```js
import Alpine from 'alpinejs'
// ...
window.Alpine = Alpine
Alpine.start()
```

Everything else (overlay management, pin rendering, banner, keyboard shortcuts, click handling, `subscribeToCommentMode`) stays exactly as-is. The Alpine dependency was only needed because the 4 UI components used `window.Alpine.data()` and `Alpine.initTree()`.

## Todos

1. Create `AuthModal.svelte` + rewrite `authModal.js` wrapper
2. Create `Composer.svelte` + rewrite `composer.js` wrapper
3. Create `CommentWindow.svelte` + rewrite `commentWindow.js` wrapper
4. Create `CommentsDrawer.svelte` + rewrite `commentsDrawer.js` wrapper
5. Update `mount.js` — remove Alpine import/init (3 lines)
6. Update `mount.test.js` — remove Alpine mock
7. Update `authModal.test.js` — remove Alpine mock, adapt to Svelte mount
8. Verify build, lint, all tests pass
9. Verify Alpine can be removed from `packages/core/package.json` dependencies (only if comments was the last consumer — workshop already migrated)

## Notes

- Alpine.js can be fully removed from `packages/core/package.json` dependencies after this migration, since the workshop was already migrated and comments was the only other consumer
- `comments.css` imports Tachyons and defines `sb-*` tokens — these are duplicated in `base.css` for the Svelte plugin UI. Since both stylesheets are loaded independently (comments via its own CSS import, Svelte UI via `mountSveltePlugin`), the duplication is harmless. A future cleanup could deduplicate them.
- The Svelte components use `mount()`/`unmount()` from `svelte` directly (not `mountSveltePlugin()`) because they are mounted into arbitrary positioned containers, not `document.body`
