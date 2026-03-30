# Keyboard Navigation — CoreUIBar

## Problem

The CoreUIBar floating toolbar has several keyboard accessibility issues:

1. **Double tab stops** — `Tooltip.Trigger` renders its own `<button>` wrapper around each `TriggerButton`, creating nested `<button><button>` — invalid HTML with two tab stops per control.
2. **No skip-to-controls link** — keyboard users must tab through the entire page to reach the toolbar.
3. **No toolbar keyboard pattern** — buttons aren't navigable with arrow keys as a single group; each is an independent tab stop.
4. **Focus outline doesn't match superellipse corners** — `focus-visible:ring-*` draws rectangular/rounded rings that clash with smooth-corners shape.
5. **Menus/panels don't capture focus** — opening a SidePanel or submenu doesn't move focus into the opened surface.

## Approach

Implement a proper [WAI-ARIA Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) with roving tabindex, skip link, and focus management.

---

## Todos

### 1. Fix Tooltip.Trigger double tab stops
**Files:** `packages/core/src/lib/components/ui/tooltip/tooltip-trigger.svelte`

Switch to using the Bits UI `child` snippet API so the tooltip trigger merges its props into the child element instead of creating a wrapper `<button>`. This eliminates the nested buttons and the double tab stop.

### 2. Replace focus ring with accent border/gap on focus
**Files:** `packages/core/src/lib/components/ui/trigger-button/trigger-button.svelte`, `packages/core/src/lib/components/ui/button/button.svelte`

- Remove `focus-visible:ring-*` from trigger variant buttons
- Instead, change `--sc-border-color` (the superellipse gap/border) to `--accent` color on `:focus-visible`
- This makes focus indication follow the smooth-corners shape perfectly

### 3. Add `role="toolbar"` with roving tabindex to CoreUIBar
**Files:** `packages/core/src/CoreUIBar.svelte`

- Add `role="toolbar"` and `aria-label="Storyboard controls"` to the bar container
- Make only one button tabbable at a time (`tabindex="0"`), all others `tabindex="-1"`
- Track active index in state
- Left/Right arrow keys move focus between toolbar buttons
- Home/End jump to first/last button
- Down arrow on a menu button opens its menu
- When a menu closes, focus returns to the originating toolbar button

### 4. Add "Skip to controls" link
**Files:** `packages/core/src/CoreUIBar.svelte`

- Add a visually-hidden skip link as the first focusable element on the page (injected at top of `<body>` or via a portal)
- On activation, focuses the toolbar's first button
- Only visible on pages that have the CoreUIBar (i.e. when command menu is present)
- Standard sr-only + focus-visible pattern: invisible until focused, then appears briefly

### 5. Focus management for SidePanel
**Files:** `packages/core/src/SidePanel.svelte`

- On open, auto-focus the panel's close button (or first interactive element)
- On Escape (already handled), return focus to the toolbar button that opened it

### 6. Focus management for menus (Up/Down from toolbar)
**Files:** `packages/core/src/CoreUIBar.svelte`, `packages/core/src/CommandMenu.svelte`

- Down arrow on a toolbar button with a dropdown opens the menu (Bits UI already supports `ArrowDown` on triggers)
- When a menu closes via Escape, Bits UI already returns focus to the trigger — verify this works with roving tabindex
- Up arrow while the first menu item is focused should close the menu and return focus to the toolbar button

---

## Notes

- Bits UI DropdownMenu already handles arrow key navigation within menus, typeahead, and focus restoration on close. We just need to wire the toolbar ↔ menu boundary correctly.
- The `child` snippet API pattern (already used correctly in `CommandMenu.svelte`'s `DropdownMenu.Trigger`) is the proven approach for prop-merging without wrapper elements.
- The ToolbarShell component (`svelte-plugin-ui/components/ToolbarShell.svelte`) already uses `role="toolbar"` but doesn't implement roving tabindex — it's a simpler widget. CoreUIBar needs the full pattern since it has heterogeneous children (plain buttons, dropdown triggers, menu triggers).
