# Plan: Migrate Core UI from Svelte to React

## Problem

The Svelte UI layer in `@dfosco/storyboard-core` (~119 `.svelte` files) has been consistently degrading. The team's primary expertise is React, and running two frameworks in the same Vite config adds complexity without benefits. The Svelte layer brings a heavy dependency chain (svelte, bits-ui, shadcn-svelte, tailwind-variants, @lucide/svelte, etc.) that maps directly to React equivalents (Radix UI, shadcn/ui, lucide-react).

## Decided Architecture

Based on discussion:
- **UI stays in `@dfosco/storyboard-core`** — react/react-dom added as peerDependencies
- **Portal-based mounting from the React tree** — breaking consumer API is acceptable
- **shadcn/ui React replaces shadcn-svelte** — same design system, React implementation
- **Tailwind CSS stays** — used by shadcn/ui React

## Current Architecture

```
@dfosco/storyboard-core
├── src/index.js                    ← Pure JS engine (loader, session, modes, etc.)
├── src/devtools.js                 ← Imperatively mounts CoreUIBar via Svelte mount()
├── src/mountStoryboardCore.js      ← Consumer entry point: init systems + mount UI
├── src/ui-entry.js                 ← Entry for pre-compiled Svelte UI bundle
├── src/CoreUIBar.svelte            ← Main toolbar (orchestrator)
├── src/CommandMenu.svelte          ← Command palette
├── src/SidePanel.svelte            ← Resizable side/bottom panel
├── src/DocPanel.svelte             ← Docs panel
├── src/InspectorPanel.svelte       ← Element inspector
├── src/ActionMenuButton.svelte     ← Config-driven action menu
├── src/ThemeMenuButton.svelte      ← Theme picker
├── src/CommentsMenuButton.svelte   ← Comments toggle
├── src/CreateMenuButton.svelte     ← Create menu trigger
├── src/CanvasCreateMenu.svelte     ← Canvas widget menu
├── src/comments/ui/*.svelte        ← 4 comment UI components
├── src/workshop/ui/*.svelte        ← 1 panel + 3 create forms
├── src/svelte-plugin-ui/           ← 4 plugin components (ModeSwitch, Viewfinder, etc.)
├── src/lib/components/ui/          ← ~90 shadcn/bits-ui primitive wrappers
├── vite.ui.config.js               ← Vite library build → dist/storyboard-ui.js
└── toolbar.config.json             ← Declarative toolbar config

@dfosco/storyboard-react
├── src/index.js                    ← React hooks, context, provider
├── src/context.jsx                 ← StoryboardProvider
├── src/hooks/                      ← useFlowData, useOverride, useObject, useRecord, etc.
├── src/Viewfinder.jsx              ← React Viewfinder (already exists!)
├── src/canvas/                     ← CanvasPage, widgets
└── src/vite/data-plugin.js         ← Vite data discovery plugin
```

### How Svelte UI ships today

1. `vite.ui.config.js` builds all Svelte components into `dist/storyboard-ui.js` + `.css` (Vite library mode)
2. Svelte runtime, bits-ui, Tailwind CSS all bundled in — consumers need zero Svelte toolchain
3. `mountStoryboardCore()` dynamically imports the bundle and calls `mountDevTools()`, `mountComments()`
4. In source repo, Vite aliases resolve to source for HMR; in consumer repos, exports resolve to `dist/`

### Svelte file inventory

| Category | Files | Migration effort |
|----------|-------|-----------------|
| shadcn/bits-ui primitives (dialog, dropdown, button, etc.) | ~90 | **Replaced** wholesale by shadcn/ui React (`npx shadcn@latest add`) |
| Core chrome (CoreUIBar, CommandMenu, SidePanel, etc.) | ~10 | High — complex orchestration, keyboard nav, side panels |
| Comments UI (AuthModal, CommentWindow, Composer, Drawer) | ~4 | Medium — GitHub PAT auth, rich text, reactions |
| Workshop UI (WorkshopPanel + 3 create forms) | ~4 | Medium — API calls, form validation |
| Plugin UI (ModeSwitch, ToolbarShell, Viewfinder, Icon) | ~4 | Low-Med — Viewfinder already has React version |
| Mount utilities (mount.ts, design-modes.ts, viewfinder.ts) | ~5 | Low — become React wrappers |

## New Architecture (Target)

### Mounting: Portal from React tree

The current imperative mounting (`mountStoryboardCore()` → `svelte.mount()`) becomes component-based. The toolbar renders from within the consumer's React tree using `createPortal()`:

```jsx
// Before (current)
import { mountStoryboardCore } from '@dfosco/storyboard-core'
mountStoryboardCore(config, { basePath })

// After (new)
import { initStoryboard } from '@dfosco/storyboard-core'
import { StoryboardShell } from '@dfosco/storyboard-core/ui'

initStoryboard(config) // framework-agnostic init only (hide params, body classes, etc.)

<StoryboardProvider>
  <StoryboardShell basePath={basePath} config={config}>
    <RouterProvider router={router} />
  </StoryboardShell>
</StoryboardProvider>
```

Where `StoryboardShell` renders:
- `CoreUIBar` via `createPortal()` to a div on `document.body` (fixed-position toolbar)
- `CommentsProvider` if comments are configured
- `WorkshopPanel` if workshop is enabled
- Children (the app's routes)

Benefits:
- Single React tree — toolbar has access to StoryboardProvider context
- Composable — consumers can choose what to render
- No separate React root, no React duplication concerns
- Toolbar can use storyboard hooks (useFlowData, useOverride, etc.) directly

### shadcn/ui React primitives

The ~90 shadcn-svelte/bits-ui primitives map directly to shadcn/ui React equivalents:

| Svelte (current) | React (target) | Underlying library |
|---|---|---|
| `bits-ui` Dialog | `@radix-ui/react-dialog` | Radix UI |
| `bits-ui` DropdownMenu | `@radix-ui/react-dropdown-menu` | Radix UI |
| `bits-ui` Popover | `@radix-ui/react-popover` | Radix UI |
| `bits-ui` Select | `@radix-ui/react-select` | Radix UI |
| `bits-ui` Tooltip | `@radix-ui/react-tooltip` | Radix UI |
| `bits-ui` Checkbox | `@radix-ui/react-checkbox` | Radix UI |
| `bits-ui` Collapsible | `@radix-ui/react-collapsible` | Radix UI |
| `bits-ui` Toggle/ToggleGroup | `@radix-ui/react-toggle` + `react-toggle-group` | Radix UI |
| `tailwind-variants` (tv()) | `class-variance-authority` (cva()) | shadcn convention |
| `@lucide/svelte` | `lucide-react` | Lucide |

These can be scaffolded via `npx shadcn@latest add` and then customized to match current styling.

### Pre-compiled bundle changes

The `vite.ui.config.js` library build changes from:
- **Svelte plugin** → **React plugin** (`@vitejs/plugin-react`)
- **Externalizes**: `react`, `react-dom`, `react/jsx-runtime` (consumers already have them)
- **Bundles**: Radix UI, Tailwind CSS, lucide-react, core UI components
- **Output**: same `dist/storyboard-ui.js` + `dist/storyboard-ui.css`
- Tailwind stays (shadcn/ui React uses it)

### Package export changes

```js
// Keep (unchanged)
"."           → "./src/index.js"              // Pure JS engine
"./vite/server" → "./src/vite/server-plugin.js" // Vite dev server
"./comments"  → "./src/comments/index.js"     // Comments config (pure JS)
"./toolbar.config.json" → "./toolbar.config.json"
"./modes.css" → "./src/modes.css"
"./canvas/materializer" → "./src/canvas/materializer.js"

// Replace
"./ui-runtime"           → "./dist/storyboard-ui.js"     // React bundle (was Svelte)
"./ui-runtime/style.css" → "./dist/storyboard-ui.css"

// New
"./ui"        → "./src/ui/index.jsx"          // React component exports (StoryboardShell, CoreUIBar, etc.)
"./ui/hooks"  → "./src/ui/hooks/index.js"     // UI-specific hooks (useToolbarConfig, useSidePanel, etc.)

// Remove
"./svelte-plugin-ui"    // gone
"./svelte-plugin-ui/*"  // gone
"./comments/svelte"     // replaced by ./ui exports
"./workshop/ui/mount.js" // replaced by component-based mounting
```

## Migration Phases

### Phase 0: Infrastructure setup
- Initialize shadcn/ui React in `packages/core`:
  - `npx shadcn@latest init` (configure for React + Tailwind)
  - Add all needed Radix UI primitives: `npx shadcn@latest add dialog dropdown-menu popover select tooltip checkbox collapsible toggle toggle-group button input label textarea badge separator alert avatar sheet card`
- Add `react`, `react-dom` as peerDependencies to `packages/core/package.json`
- Add `@vitejs/plugin-react` as devDependency
- Replace `@lucide/svelte` with `lucide-react`
- Update `vite.ui.config.js`:
  - Replace `svelte()` plugin with `react()`
  - Externalize `react`, `react-dom`, `react/jsx-runtime`
  - Keep Tailwind plugin
- Update `components.json` from Svelte to React config
- Create `src/ui/` directory for the new React UI components

### Phase 1: Migrate mounting system
- Create `initStoryboard()` in `src/index.js` — a pure-JS init function (extracted from `mountStoryboardCore()` minus the UI mount)
- Create `StoryboardShell.jsx` in `src/ui/` — wraps children with CoreUIBar portal + comments + workshop
- Update `src/devtools.js` → use `createRoot()` + React render instead of Svelte `mount()`
- Create `src/ui/index.jsx` barrel export (StoryboardShell, CoreUIBar, etc.)
- Update `src/ui-entry.js` to re-export React mount functions
- Keep backward compat: `mountStoryboardCore()` can still work via `createRoot` for existing consumers during transition

### Phase 2: Migrate core chrome components
Largest and most complex phase. Each component gets a `.jsx` equivalent.

- `CoreUIBar.svelte` → `src/ui/CoreUIBar.jsx`
  - Keyboard navigation (roving tabindex)
  - Global shortcuts (Cmd+K, Cmd+., Cmd+D, Cmd+I)
  - Canvas toolbar mode
  - Dynamic menu loading from toolbar.config.json
  - Renders via `createPortal()` to `<div id="sb-core-ui">` on `document.body`
- `CommandMenu.svelte` → `src/ui/CommandMenu.jsx`
  - Uses shadcn DropdownMenu (Radix) instead of bits-ui
  - Action registry, search, keyboard nav
- `SidePanel.svelte` → `src/ui/SidePanel.jsx`
  - Resizable docked panel
  - Uses `sidePanelStore` (refactored to use `useSyncExternalStore`)
- `DocPanel.svelte` → `src/ui/DocPanel.jsx`
- `InspectorPanel.svelte` → `src/ui/InspectorPanel.jsx`
- `ActionMenuButton.svelte` → `src/ui/ActionMenuButton.jsx`
- `ThemeMenuButton.svelte` → `src/ui/ThemeMenuButton.jsx`
- `CommentsMenuButton.svelte` → `src/ui/CommentsMenuButton.jsx`
- `CreateMenuButton.svelte` → `src/ui/CreateMenuButton.jsx`
- `CanvasCreateMenu.svelte` → `src/ui/CanvasCreateMenu.jsx`

Svelte stores (`sidePanelStore.js`, `commandActions.js`) → React hooks wrapping `useSyncExternalStore` over the same core JS APIs.

### Phase 3: Migrate plugin UI components
- `ModeSwitch.svelte` → `src/ui/ModeSwitch.jsx`
  - Uses `useSyncExternalStore` to subscribe to `modes.js` API
- `ToolbarShell.svelte` → `src/ui/ToolbarShell.jsx`
- `Viewfinder.svelte` → consolidate with `packages/react/src/Viewfinder.jsx`
  - The React package already has a Viewfinder — merge any missing features from the Svelte version
- `Icon.svelte` → `src/ui/Icon.jsx`
  - Keep multi-library support (Primer Octicons, lucide-react, iconoir)
  - Use `lucide-react` instead of `@lucide/svelte`
  - Keep `@primer/octicons` for primer/ namespace icons

### Phase 4: Migrate comments UI
- `AuthModal.svelte` → `src/ui/comments/AuthModal.jsx` — GitHub PAT auth dialog
- `CommentsDrawer.svelte` → `src/ui/comments/CommentsDrawer.jsx` — comments list
- `CommentWindow.svelte` → `src/ui/comments/CommentWindow.jsx` — thread popup
- `Composer.svelte` → `src/ui/comments/Composer.jsx` — inline comment composer
- Delete imperative Svelte mount wrappers (`src/comments/ui/authModal.js`, etc.)
- Comments become React components rendered by `StoryboardShell`

### Phase 5: Migrate workshop UI
- `WorkshopPanel.svelte` → `src/ui/workshop/WorkshopPanel.jsx`
- `CreatePrototypeForm.svelte` → `src/ui/workshop/CreatePrototypeForm.jsx`
- `CreateFlowForm.svelte` → `src/ui/workshop/CreateFlowForm.jsx`
- `CreateCanvasForm.svelte` → `src/ui/workshop/CreateCanvasForm.jsx`
- Delete imperative mount wrapper (`src/workshop/ui/mount.ts`)

### Phase 6: Remove Svelte & cleanup

**Delete:**
- ALL `src/lib/components/ui/**/*.svelte` (~90 shadcn-svelte files + barrel index.js files)
- `src/svelte-plugin-ui/` directory (mount.ts, stores, components)
- `packages/svelte-ui/` directory (vitest config for Svelte tests)
- Old `components.json` (shadcn-svelte config — replaced by React config)
- All `.svelte` files in `src/` (CoreUIBar, CommandMenu, SidePanel, etc.)
- Old imperative mount wrappers (comments/ui/mount.js, workshop/ui/mount.ts)

**Remove from `packages/core/package.json`:**
- devDependencies: `svelte`, `@sveltejs/vite-plugin-svelte`, `bits-ui`, `shadcn-svelte`, `@lucide/svelte`, `tailwind-variants`

**Remove from root `package.json`:**
- devDependencies: `svelte`, `@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, `@lucide/svelte`
- scripts: `test:svelte`

**Remove from root `vite.config.js`:**
- `svelte()` plugin import and usage
- Svelte-specific aliases (`svelte-plugin-ui/*`, `comments/svelte`, `workshop/ui/mount.js`)

**Update `packages/core/package.json` exports:**
- Remove `./svelte-plugin-ui`, `./svelte-plugin-ui/*`, `./comments/svelte`, `./workshop/ui/mount.js`
- Add `./ui`, `./ui/hooks`

**Remove `check:imports` script** (was for `$lib/` Svelte alias detection)

### Phase 7: Update tests
- Rewrite Svelte component tests as React Testing Library tests
  - `packages/core/src/svelte-plugin-ui/__tests__/*.test.ts` → React equivalents
  - `packages/core/src/comments/ui/authModal.test.js` → React equivalent
  - `packages/core/src/devtools.test.js` → update for React mounting
- Delete `packages/svelte-ui/vitest.config.ts` and `vitest.setup.ts`
- Remove `test:svelte` script from root package.json
- All tests now run through the root vitest config (no separate Svelte config)
- Ensure all existing core JS tests still pass (they don't touch UI framework)

### Phase 8: Consumer migration & docs
- Document new consumer API:
  ```jsx
  // New consumer usage
  import { initStoryboard } from '@dfosco/storyboard-core'
  import { StoryboardShell } from '@dfosco/storyboard-core/ui'

  initStoryboard(config)

  <StoryboardProvider>
    <StoryboardShell basePath={basePath} config={config}>
      <RouterProvider router={router} />
    </StoryboardShell>
  </StoryboardProvider>
  ```
- Update source repo's `src/index.jsx` to use new API
- Update AGENTS.md to remove Svelte references, update conventions
- Update `.github/architecture/` docs
- Update scaffold templates (`packages/core/scaffold/`)
- Changeset for major version bump (breaking consumer API change)

## Dependency changes

### Removed
| Package | Location | Type |
|---------|----------|------|
| `svelte` | core + root | dev |
| `@sveltejs/vite-plugin-svelte` | core + root | dev |
| `bits-ui` | core | dev |
| `shadcn-svelte` | core | dev |
| `@lucide/svelte` | core + root | dev |
| `tailwind-variants` | core | dev |
| `@testing-library/svelte` | root | dev |

### Kept (used by shadcn/ui React)
| Package | Notes |
|---------|-------|
| `tailwindcss` | shadcn/ui React uses Tailwind |
| `@tailwindcss/vite` | Vite plugin for Tailwind |
| `tailwind-merge` | className merging for shadcn |
| `clsx` | className conditionals |

### Added
| Package | Location | Type |
|---------|----------|------|
| `react`, `react-dom` | core | peerDep |
| `@vitejs/plugin-react` | core | dev |
| `lucide-react` | core | dev (bundled in ui-runtime) |
| `class-variance-authority` | core | dev (bundled) |
| `@radix-ui/react-dialog` | core | dev (bundled) |
| `@radix-ui/react-dropdown-menu` | core | dev (bundled) |
| `@radix-ui/react-popover` | core | dev (bundled) |
| `@radix-ui/react-select` | core | dev (bundled) |
| `@radix-ui/react-tooltip` | core | dev (bundled) |
| `@radix-ui/react-checkbox` | core | dev (bundled) |
| `@radix-ui/react-collapsible` | core | dev (bundled) |
| `@radix-ui/react-toggle` | core | dev (bundled) |
| `@radix-ui/react-toggle-group` | core | dev (bundled) |
| `@radix-ui/react-separator` | core | dev (bundled) |

Note: All Radix UI packages are bundled INTO `dist/storyboard-ui.js` at build time. They're devDependencies of core, not consumer deps.

## Risks & mitigations

1. **Bundle size increase**: React components + Radix UI are larger than compiled Svelte. But `react`/`react-dom` are externalized (consumers already have them), and Radix UI tree-shakes well. The bundled size increase is modest.

2. **Breaking consumer API**: `mountStoryboardCore()` changes to `initStoryboard()` + `<StoryboardShell>`. Mitigation: keep `mountStoryboardCore()` as a deprecated compat wrapper during transition.

3. **Large migration scope**: ~23 component files to rewrite. Phases 2-5 can be done in parallel since components are independent. Each phase produces a working state.

4. **Feature parity**: Must preserve keyboard nav, shortcuts, accessibility. Each component should be tested against original behavior before the Svelte version is deleted.

5. **Tailwind in the React bundle**: The pre-compiled bundle includes Tailwind utilities. This is fine — same as today. The CSS is isolated in `dist/storyboard-ui.css`.

## Not in scope

- Merging storyboard-core and storyboard-react (separate decision, can happen later)
- Changing the pure JS engine layer (loader, session, modes, etc.)
- Changing the Vite data plugin or server plugin logic
- Changing prototype pages or the source repo's React app (beyond mount API)
- Changing react-primer or react-reshaped packages
- Changing tiny-canvas
