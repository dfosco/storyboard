# Plan: `storyboard dev [branch]` — Remote Worktree Dev Server

## Problem

`storyboard dev` only works for the worktree you're `cd`'d into. There's no way to programmatically start a dev server for a different branch/worktree without manually `cd`-ing first. Copilot and other internal processes need to spin up dev servers for specific worktrees (and even create worktrees) from anywhere.

## Approach

Add an optional positional `[branch]` argument to `storyboard dev`:

```
npx storyboard dev              # current behavior — detect from cwd
npx storyboard dev main         # start dev for repo root (main)
npx storyboard dev 4.0.0        # start dev for existing worktree
npx storyboard dev my-feature   # auto-create worktree if branch exists, then start
```

**Resolution rules:**
1. No argument → current behavior (detect worktree from cwd)
2. `main` → target the repo root directory
3. Existing worktree (`.worktrees/<name>` exists) → target that directory
4. Existing git branch (local or remote) but no worktree → auto-create worktree + `npm install`, then start dev
5. Branch doesn't exist anywhere → **auto-create by default**. Interactive (TTY) users get a confirmation prompt; non-interactive callers (scripts, Copilot) auto-create without prompting. Use `--no-create` flag to disable creation entirely.

**Key safety property:** Never changes branches or git state in the *current* directory. Always spawns Vite with `cwd` set to the *target* worktree directory, so the caller's context is untouched.

## Files to Change

### 1. `packages/core/src/worktree/port.js` — Add utilities

Add two new exported functions:

- **`repoRoot(cwd?)`** — Resolve the repo root (the directory that *contains* `.worktrees/`). Already partly implemented inside `portsFilePath` but not exposed.
- **`worktreeDir(name, cwd?)`** — Resolve the full path to a worktree: `repoRoot()` for `main`, `.worktrees/<name>` otherwise.
- **`listWorktrees(cwd?)`** — List existing worktree directory names from `.worktrees/`.

### 2. `packages/core/src/cli/dev.js` — Core changes

Refactor `main()` to support the optional branch argument:

**a) Parse branch arg** — Extract the first positional (non-flag) argument as `branchArg`. It's `null` when omitted.

**b) Resolve target** — New `resolveDevTarget(branchArg)` function:
- Returns `{ worktreeName, targetCwd, created: boolean }`
- No arg: `{ detectWorktreeName(), process.cwd(), false }`
- `main`: `{ 'main', repoRoot(), false }`
- Existing worktree: `{ name, worktreeDir(name), false }`
- Existing branch: auto-create worktree + install deps → `{ name, worktreeDir(name), true }`
- Unknown branch (interactive TTY): prompt user "Branch X doesn't exist. Create it from HEAD?" via `@clack/prompts` confirm. If yes, create branch + worktree. If no, exit.
- Unknown branch (non-interactive / piped stdin): **auto-create** without prompting — this is the programmatic/Copilot path where things should just work.
- `--no-create` flag: disables all auto-creation (both worktree-from-branch and new-branch), errors out instead.

**c) Auto-create flow** (when branch exists but no worktree, OR user confirms creation of new branch):
1. `git worktree add .worktrees/<name> <name>` for existing branches, or `git worktree add .worktrees/<name> -b <name>` for new branches
2. `npm install --prefix <path>` in the new worktree
3. Register port via `getPort(name)`
4. Log creation to the user

**d) Spawn Vite with target cwd** — Pass `cwd: targetCwd` to the `spawn()` call. Resolve the local Vite binary relative to `targetCwd` (not `process.cwd()`).

**e) Rename watcher** — Pass `targetCwd` to `startRenameWatcher()` instead of `process.cwd()`.

### 3. `packages/core/src/cli/index.js` — Update help text

Update the help screen to show `dev [branch]` and add a description line.

### 4. `packages/core/src/worktree/port.test.js` — Add tests

Test the new `repoRoot()`, `worktreeDir()`, and `listWorktrees()` utilities.

### 5. `.github/skills/worktree/SKILL.md` — Update docs

Note that `storyboard dev <branch>` is now an alternative to the manual worktree creation + cd + dev workflow.

## Design Decisions

- **Auto-create worktrees for existing branches** — Most ergonomic for programmatic callers. The alternative (error + suggestion) adds friction that defeats the purpose. Creation is logged clearly so it's not surprising.
- **`npm install` during auto-create** — Required since `node_modules` isn't shared across worktrees. This makes auto-create slower but functional. We show a spinner/message during install.
- **Auto-create by default for unknown branches** — Non-interactive callers (Copilot, scripts) get auto-create. Interactive users get a confirmation prompt as a safety net. `--no-create` flag disables all creation for callers that want strict "existing worktree only" behavior.
- **Foreground process model** — Same as current behavior. The caller can background it themselves (`storyboard dev main &`). No `--detach` flag needed now.
- **No slugification of the branch argument** — The user/caller passes the exact worktree directory name (which may already be slugified). This matches the memory: "Do NOT slugify worktree directory names."

## Todos

- `add-worktree-utils` — Add `repoRoot()`, `worktreeDir()`, `listWorktrees()` to `packages/core/src/worktree/port.js`
- `resolve-dev-target` — Add `resolveDevTarget()` function and branch arg parsing to `packages/core/src/cli/dev.js`
- `auto-create-worktree` — Implement auto-create flow (git worktree add + npm install) in `dev.js`
- `spawn-with-target-cwd` — Update Vite spawn and rename watcher to use target cwd
- `update-help-text` — Update help screen in `packages/core/src/cli/index.js`
- `add-tests` — Add tests for new worktree utilities in `packages/core/src/worktree/port.test.js`
- `update-skill-docs` — Update worktree skill doc to reference `storyboard dev <branch>`
