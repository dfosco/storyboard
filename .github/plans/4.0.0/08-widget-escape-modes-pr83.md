# Slice 08 — Widget Escape Modes (PR #83 Carryover)

## Source

- PR: https://github.com/dfosco/storyboard/pull/83
- Title: `feat: system-level Escape to exit widget edit/interactive modes`
- Status reviewed for 4.0 planning: **closed, not merged**
- Current repo check: `useWidgetEscape` hook and wiring are **not present**

## Goal

Add system-level Escape handling so widgets in edit/interactive mode can exit with Escape consistently, without bespoke per-widget implementations.

## Scope

- Add shared hook: `useWidgetEscape(active, exitFn)`
- Wire into:
  - `StickyNote` (editing)
  - `MarkdownBlock` (editing)
  - `ComponentWidget` (interactive)
  - `PrototypeEmbed` (interactive + editing)
- Keep iframe limitation explicit: Escape from inside iframe focus may not bubble; click-outside fallback remains required.

## Key files

- `packages/react/src/canvas/widgets/useWidgetEscape.js` (new)
- `packages/react/src/canvas/widgets/useWidgetEscape.test.js` (new)
- `packages/react/src/canvas/widgets/StickyNote.jsx`
- `packages/react/src/canvas/widgets/MarkdownBlock.jsx`
- `packages/react/src/canvas/widgets/ComponentWidget.jsx`
- `packages/react/src/canvas/widgets/PrototypeEmbed.jsx`

## Implementation checklist

- [ ] Implement `useWidgetEscape(active, exitFn)` with document-level `keydown` listener.
- [ ] Trigger `exitFn` only on Escape, only while active.
- [ ] Ensure listener lifecycle cleanup on deactivation/unmount.
- [ ] Replace ad-hoc inline Escape handlers where redundant.
- [ ] Keep click-outside fallback behavior for iframe-based widgets.

## Acceptance criteria

- Escape exits active edit/interactive mode for all targeted widgets.
- Inactive widgets do not react to Escape.
- Listener is cleaned up reliably and does not leak.
- iframe-focused edge case is documented and fallback still works.

## Verification

### Automated
- [ ] Hook unit tests: active/inactive, key filtering, cleanup, propagation behavior
- [ ] Widget-level tests for mode exit behavior

### Agent-browser
- [ ] Enter each widget mode and verify Escape exits as expected
- [ ] Confirm prototype iframe path still has click-outside fallback

### Manual
- [ ] No regressions to existing canvas Escape/key handling
