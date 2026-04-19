# Phase 3: Session Browser UI — `storyboard sessions`

## Approach

Terminal-native Clack CLI that runs **inside** the tmux session. Triggered by:
- Toolbar "Sessions" button (writes `storyboard sessions\n` to the PTY)
- User typing `storyboard sessions` manually

Uses `@clack/prompts` (already a dependency in `packages/core`).

## Implementation

### 1. New CLI subcommand: `packages/core/src/cli/sessions.js`

```
storyboard sessions [--all]
```

**Flow:**
1. Detect current worktree port from `.worktrees/ports.json`
2. Fetch sessions from `GET http://localhost:{port}/_storyboard/terminal/sessions`
3. Group by scope: this canvas sessions first, then other canvases on this branch
4. Render Clack interactive select with formatted session rows
5. On selection: tell the server to attach the selected session to the current widget

**Display (matching mockups):**
- Columns: #, Status (Live/Background/Archived), Modified, Created, Summary
- Colors: Live=blue, Background=orange, Archived=dim
- Grouped by canvas with separators
- Tab to cycle: This canvas → All canvases → All branches
- Footer: `↑↓ navigate · Enter select · Esc cancel · t open tmux`

### 2. Wire into CLI dispatcher: `packages/core/src/cli/index.js`

Add `case 'sessions':` → `import('./sessions.js')`.

### 3. Toolbar button: `packages/react/src/canvas/widgets/TerminalWidget.jsx`

Add "Sessions" action button in TerminalWidget that writes `storyboard sessions\n` to the WebSocket (PTY stdin).

## Files

| File | Change |
|------|--------|
| `packages/core/src/cli/sessions.js` | New — Clack session picker CLI |
| `packages/core/src/cli/index.js` | Add `case 'sessions'` to switch |
| `packages/react/src/canvas/widgets/TerminalWidget.jsx` | Add Sessions toolbar button |
