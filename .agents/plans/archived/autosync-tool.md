# Autosync Tool — Implementation Plan

## Problem

Storyboard needs a way to automatically commit and push changes at regular intervals while developing prototypes. This removes the friction of manual git workflows during design exploration, letting users stay focused on the work.

## Approach

Build a **toolbar tool** called "Autosync" that:
- Renders as a custom dropdown menu button in the main toolbar (`primer/sync` icon)
- Provides branch selection, an enable toggle, and server-side git automation
- Uses the existing tool system (config + handler + custom Svelte component) for the UI
- Adds a new server-side route handler (`/_storyboard/autosync/`) for git operations
- Runs a server-side interval watcher that commits + pull --rebase + pushes every 30s

## Architecture

```
toolbar.config.json                     ← Declare "autosync" tool
tools/handlers/autosync.js              ← Handler module (guard + component)
tools/registry.js                       ← Register handler lazy import
AutosyncMenuButton.svelte               ← Custom dropdown UI (branch select, toggle, status)
autosync/server.js                      ← Server-side git operations + push watcher
vite/server-plugin.js                   ← Mount autosync route handler
```

### Client ↔ Server API

All routes under `/_storyboard/autosync/`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/branches` | List local branches (excludes `main`/`master`) |
| `GET` | `/status` | Current branch, autosync enabled, last sync time, watcher state |
| `POST` | `/enable` | Enable autosync: stash → checkout branch → apply stash → start watcher |
| `POST` | `/disable` | Disable autosync: stop watcher (stays on current branch) |
| `POST` | `/sync` | Manual sync trigger: commit → pull --rebase → push |
| `POST` | `/cleanup` | **Stretch:** Squash autosync commits via copilot CLI |

### Push Watcher (server-side)

A `setInterval` running every 30s on the Vite dev server:

1. `git status --porcelain` — check for uncommitted changes
2. If changes exist:
   - `git add -A`
   - `git commit -m "<username> update at <human-readable time>"`
3. `git pull --rebase origin <branch>` — sync remote changes
4. `git push origin <branch>` — push to remote
5. Report status back to client via next `/status` poll

### Branch Switching Logic

When autosync is enabled and user selects a branch different from current:

1. `git stash` — save uncommitted work
2. `git checkout <target-branch>` — switch to selected branch
3. `git stash apply` — re-apply changes (NOT pop — keeps stash as safety net)

### Error Handling

- **Rebase conflicts**: Stop watcher, report conflict status to UI, let user resolve manually
- **Push failures**: Retry once, then report to UI
- **Network errors**: Skip cycle, retry next interval
- **Stash apply conflicts**: Report to UI, don't start watcher

---

## Todos

### 1. `config-and-handler` — Add tool config + handler module

**Files:**
- `packages/core/toolbar.config.json` — Add `autosync` entry
- `packages/core/src/tools/handlers/autosync.js` — Create handler (guard + component)
- `packages/core/src/tools/registry.js` — Register lazy import

**Config entry:**
```json
"autosync": {
  "ariaLabel": "Autosync",
  "icon": "primer/sync",
  "render": "menu",
  "surface": "main-toolbar",
  "handler": "core:autosync",
  "modes": ["*"],
  "localOnly": true,
  "label": "Autosync",
  "menuWidth": "320px"
}
```

**Handler:** Guard returns `true` only in dev (localOnly handles this). Component lazy-loads `AutosyncMenuButton.svelte`.

### 2. `server-module` — Create autosync server module

**File:** `packages/core/src/autosync/server.js`

Server-side module following the canvas server pattern:
- `createAutosyncHandler({ root, sendJson })` — factory returning route handler
- Git operations via `child_process.execSync` (same pattern as `docs-handler.js`)
- `GET /branches` — `git branch --list` parsed + filtered (no main/master)
- `GET /status` — current branch, dirty state, watcher running, last sync time
- `POST /enable` — validates branch, does stash/checkout/apply if needed, starts interval
- `POST /disable` — clears interval
- `POST /sync` — single commit+pull+push cycle
- Watcher state stored in module-level variables (singleton, survives page reloads)

### 3. `mount-server-routes` — Wire server routes into Vite plugin

**File:** `packages/core/src/vite/server-plugin.js`

Add `routeHandlers.set('autosync', createAutosyncHandler({ root, sendJson }))` alongside the existing canvas/docs/workshop handlers.

### 4. `svelte-component` — Build AutosyncMenuButton.svelte

**File:** `packages/core/src/AutosyncMenuButton.svelte`

Custom dropdown menu component following `ThemeMenuButton.svelte` pattern:

```
DropdownMenu.Root
  DropdownMenu.Trigger → TriggerButton + Icon (primer/sync)
  DropdownMenu.Content
    DropdownMenu.Label → "Autosync"
    <p> description text
    DropdownMenu.Separator
    DropdownMenu.Group
      Branch <select> dropdown (current as default, main excluded)
    DropdownMenu.Separator
    DropdownMenu.CheckboxItem → "Enable autosync"
    (status indicator: last sync time, error state)
```

**Behavior:**
- On mount: fetch `/branches` and `/status` to populate state
- Branch change: just updates local state (actual switch happens on enable)
- Enable toggle: POST `/enable` or `/disable`
- Polls `/status` every 5s while menu is open to show live sync status
- Shows spinning sync icon or status text when watcher is active
- Error states shown inline (rebase conflict, push failure)

### 5. `ui-build` — Rebuild storyboard-ui bundle

Run `npx vite build --config vite.ui.config.js` in `packages/core/` to include the new Svelte component in the pre-compiled UI bundle. Externalize any core imports as needed.

### 6. `stretch-cleanup` — (Exploration) "Clean up timeline" button

> **Note:** This is an exploration item — included for design reference but NOT for implementation alongside the core todos above. To be revisited after the core feature ships.

**Additional UI:** A `DropdownMenu.Item` button "Clean up timeline" visible when autosync is active and there are autosync commits.

**Server endpoint:** `POST /cleanup`
- Find autosync commits: `git log --oneline --grep="update at" <branch>`
- Run `copilot -p "Squash these commits into a single meaningful commit: <commit list>"` to generate commit message
- Interactive rebase to squash: `git rebase -i` with `fixup` for all autosync commits
- Force push: `git push --force-with-lease origin <branch>`

**Risks to explore:**
- `copilot` CLI may not be installed — needs detection guard
- Force push can cause issues for others on the branch
- Rebase failures need manual resolution
- How to identify autosync commits reliably (grep pattern in commit message?)
- Could this use `git reset --soft` instead of rebase for simpler squashing?

---

## Open Questions / Decisions

1. **Username source**: Use `git config user.name` for commit messages? Or a config value?
   → Default: `git config user.name`

2. **Disable behavior**: On disable, should the tool switch back to the original branch?
   → Default: No, stay on current branch. User can switch manually.

3. **Watcher persistence**: The server-side watcher survives page reloads (module-level state). Should it survive Vite server restarts?
   → No — restarting Vite is intentional; user re-enables manually.

4. **Conflict resolution UI**: When rebase conflicts occur, should the tool show a "resolve" flow?
   → V1: Just show error status + "Disable autosync" option. Manual resolution.

5. **Commit message format**: `<git username> update at <human-readable time>` (e.g. `dfosco update at Apr 10, 3:25 PM`)

6. **Remote name**: Hardcode `origin` or detect?
   → Default: `origin`
