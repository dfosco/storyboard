# Worktree Skill

> Triggered by: "create worktree", "new worktree", "worktree for", "worktree"

## What This Does

Creates a git worktree for a given branch name inside `.worktrees/` and switches into it.

---

## How to Execute

When the user asks for a worktree named `<branch-name>`:

### Step 1: Create the worktree

If the branch already exists locally or on the remote:

```bash
git worktree add .worktrees/<branch-name> <branch-name>
```

If the branch does NOT exist yet, create it from the current HEAD:

```bash
git worktree add .worktrees/<branch-name> -b <branch-name>
```

### Step 2: Change into the worktree directory

```bash
cd .worktrees/<branch-name>
```

All subsequent commands in the session should run from this directory.

### Step 3: Confirm

Print the current working directory and branch to confirm:

```bash
pwd && git branch --show-current
```

### Step 4: Start dev server

Run the dev server in the worktree:

```bash
npm run dev
```

**Skip this step if the worktree skill was invoked from the ship skill** — ship runs the dev server as its own final step to avoid starting it twice.

---

## Notes

- Worktrees live in `.worktrees/` at the repo root — this directory is already gitignored.
- The branch name comes from the user's request (e.g., "create worktree comments-redo" → branch is `comments-redo`).
- If the worktree already exists, inform the user and `cd` into it instead of recreating it.
