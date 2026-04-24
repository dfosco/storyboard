# Migrate Svelte UI to shadcn-svelte

## Goal

Replace the hand-rolled Tachyons + `sb-*` custom property styling system across all Svelte components with [shadcn-svelte](https://www.shadcn-svelte.com/) components and Tailwind CSS. This gives us a consistent, accessible component library with built-in dark mode, keyboard navigation, and composable primitives — while keeping full ownership of the source code.

## Current State

### 10 Svelte components across 3 directories

**Workshop UI** (`packages/core/src/workshop/ui/`)
| Component | Description | shadcn candidates |
|-----------|-------------|-------------------|
| `WorkshopPanel.svelte` | Floating trigger button + dropdown menu + modal overlay | `Dropdown Menu`, `Dialog`, `Button` |
| `CreatePrototypeForm.svelte` | Multi-field form (text inputs, selects, checkbox) | `Input`, `Label`, `Select`, `Checkbox`, `Button`, `Field` |

**Comments UI** (`packages/core/src/comments/ui/`)
| Component | Description | shadcn candidates |
|-----------|-------------|-------------------|
| `AuthModal.svelte` | PAT entry modal with validation | `Dialog`, `Input`, `Label`, `Button`, `Alert` |
| `Composer.svelte` | Inline comment textarea | `Textarea`, `Button`, `Avatar` |
| `CommentWindow.svelte` | Thread viewer with replies, reactions, editing | `Card`, `Button`, `Textarea`, `Avatar`, `Badge`, `Popover`, `Separator` |
| `CommentsDrawer.svelte` | Right-side panel listing all comments | `Sheet` (side drawer), `Avatar`, `Badge`, `Separator`, `Spinner` |

**Svelte Plugin UI** (`packages/core/src/svelte-plugin-ui/components/`)
| Component | Description | shadcn candidates |
|-----------|-------------|-------------------|
| `ModeSwitch.svelte` | Bottom-center segmented toggle | `Toggle Group` |
| `ToolbarShell.svelte` | Right-side tools/dev toolbar | `Button`, `Badge`, `Separator` |
| `Octicon.svelte` | Icon renderer (Primer Octicons) | Keep as-is (icon utility, not a UI pattern) |
| `Viewfinder.svelte` | Full-page prototype index dashboard | `Collapsible`, `Button`, `Badge`, `Select`, `Separator`, `Card` |

### 3 CSS files to replace
- `packages/core/src/svelte-plugin-ui/styles/base.css` — Tachyons + `sb-*` tokens
- `packages/core/src/workshop/ui/workshop.css` — Workshop-specific styles
- `packages/core/src/comments/ui/comments.css` — Comments-specific styles (Tachyons + `sb-*` tokens + comment pins/overlay)

## Approach

### Phase 0: Setup shadcn-svelte + Tailwind CSS

1. Add Tailwind CSS v4 to the project (Vite plugin, not PostCSS)
2. Install shadcn-svelte CLI and initialize with `npx shadcn-svelte init`
3. Configure `components.json` for the `packages/core/` path structure
4. Add the shadcn-svelte components we need via the CLI
5. Configure dark mode to use the existing `[data-sb-theme]` attribute strategy
6. Set up `$lib` path alias in Vite config to point into `packages/core/src/`

### Phase 1: Workshop UI (lowest risk, fewest consumers)

- Migrate `WorkshopPanel.svelte` → shadcn `DropdownMenu` + `Dialog`
- Migrate `CreatePrototypeForm.svelte` → shadcn `Input`, `Label`, `Select`, `Checkbox`, `Button`
- Remove `workshop.css`

### Phase 2: Comments UI

- Migrate `AuthModal.svelte` → shadcn `Dialog` + `Input` + `Button` + `Alert`
- Migrate `Composer.svelte` → shadcn `Textarea` + `Button`
- Migrate `CommentWindow.svelte` → shadcn `Card`, `Button`, `Textarea`, `Popover`, `Badge`, `Separator`
- Migrate `CommentsDrawer.svelte` → shadcn `Sheet` + list items
- Preserve imperative mount wrappers (`authModal.js`, `composer.js`, etc.)
- Keep comment pin CSS (`.sb-comment-pin`, `.sb-comment-overlay`, `.sb-comment-mode` cursor) — these are positioning/animation styles not suited for component library replacement

### Phase 3: Svelte Plugin UI

- Migrate `ModeSwitch.svelte` → shadcn `ToggleGroup`
- Migrate `ToolbarShell.svelte` → shadcn `Button` + `Badge`
- Migrate `Viewfinder.svelte` → shadcn `Collapsible`, `Button`, `Badge`, `Select`
- Keep `Octicon.svelte` as-is (icon utility, not a UI pattern)
- Remove `base.css` (Tachyons + `sb-*` tokens fully replaced by Tailwind + shadcn)

### Phase 4: Cleanup

- Remove Tachyons dependency from `packages/core/package.json`
- Remove all `sb-*` custom property definitions and utility classes
- Remove `comments.css`, `workshop.css`, `base.css`
- Keep minimal CSS for comment-specific positioning (pins, overlay, cursor) — move to a small `comment-layout.css`
- Update `packages/core/package.json` exports to remove old CSS paths
- Verify no Tachyons classes remain in any `.svelte` or `.js` file

## shadcn-svelte Components Needed

Based on the mapping above, these components should be added via the CLI:

```
npx shadcn-svelte add button badge dialog dropdown-menu input label select
npx shadcn-svelte add checkbox textarea avatar alert separator popover
npx shadcn-svelte add sheet collapsible toggle-group spinner card field
```

## Notes

- shadcn-svelte copies component source into the project — we own the code and can customize freely
- The `sb-*` token system is replaced by Tailwind + shadcn's CSS variable theming (`--primary`, `--background`, etc.)
- Dark mode can be mapped to the existing `[data-sb-theme^="dark"]` attribute using Tailwind's `selector` dark mode strategy
- Imperative mount wrappers (`authModal.js`, `composer.js`, `commentWindow.js`, `commentsDrawer.js`) stay unchanged — they mount Svelte components into DOM elements, which works the same regardless of the styling approach
- The `mountSveltePlugin()` utility and its `injectStyles()` mechanism will need updating — instead of injecting `base.css`, it should inject the Tailwind stylesheet
- Comment pin rendering in `mount.js` uses vanilla DOM (not Svelte) — pin styles move to a small standalone CSS file
- `Octicon.svelte` stays as-is — it's an icon utility wrapping `@primer/octicons`, not a UI pattern
