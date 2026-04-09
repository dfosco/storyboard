---
name: ship
description: Dual-mode feature shipping — fast lite mode (default) or thorough critical mode with adversarial review.
metadata:
  author: Daniel Fosco
  version: "2026.4.09"
---

# Ship Skill

This skill has two modes:

| Mode | Triggers | Best for |
|------|----------|----------|
| **Lite** (default) | `ship`, `ship this`, `ship it`, `ship a feature` | Docs, config, small fixes, non-critical features |
| **Critical** | `ship-critical`, `[ship-critical]`, `ship thoroughly`, `ship with full review` | Core logic, security-sensitive, public API changes |

> **⚠️ This skill MUST be invoked whenever the user says "ship". Do NOT implement changes directly — always go through this workflow.**

---

## Mode Comparison

| Aspect | `ship` (lite) | `ship-critical` |
|--------|---------------|-----------------|
| Token cost | ~30-50% of critical | 100% |
| Time | Fast | Thorough |
| Review quality | Lint/build/test only | Adversarial agent pass |
| clips integration | No | Yes |
| Separate test step | No (inline) | Yes (vitest skill) |
| No-PR option | ✅ Supported | ❌ Not supported |

---

## Parameters

| Parameter | Applies to | Description |
|-----------|------------|-------------|
| **no-pr** | `ship` (lite only) | Skip opening a Pull Request. The branch is still pushed to the remote. Use for draft work or when you'll open the PR manually later. |

**How to activate no-PR mode (lite only):**
- Verbal: *"ship this but don't create a PR"*, *"ship without PR"*
- Short-form: *"ship-no-pr"*, *"[ship-no-pr]"*
- Combined: *"ship a feature to add X — no PR"*

> **Note:** `ship-critical` always opens a PR. The no-PR option is not available for critical mode because thorough review warrants a PR for visibility.

---

# Lite Mode (`ship`)

> Triggered by: `ship`, `ship this`, `ship it`, `ship a feature`, `ship a change`

Fast path for non-critical changes. Worktree isolation + validation + PR, without the heavyweight review loop.

## Steps

### Step 1: Create a worktree

Invoke the **worktree** skill to create a git worktree for the feature branch.

- Derive a kebab-case branch name from the user's feature description (e.g., "add dark mode toggle" → `add-dark-mode-toggle`).
- If the user provided an explicit branch name, use that instead.
- Use `ask_user` to confirm the branch name before creating the worktree.

After the worktree is created, all subsequent work happens inside `.worktrees/<branch-name>`.

### Step 2: Plan the feature

Generate an implementation plan for the requested feature:

1. Explore the codebase to understand the relevant areas.
2. Write a structured plan to `.github/plans/<branch-name>.md` (inside the worktree).
3. The plan must include:
   - **Problem statement** — what the feature does and why
   - **Approach** — high-level strategy
   - **Files to change** — list of files to create, modify, or delete
   - **Steps** — ordered implementation steps
   - **Edge cases & risks** — anything that could go wrong
4. Present a summary of the plan to the user.
5. Use `ask_user` to confirm:
   > Does this plan look good? Should I proceed with implementation?

Do NOT proceed until the user confirms.

### Step 3: Implement and commit

Execute the plan:

1. Implement the changes following the plan.
2. Write tests inline if the change includes testable logic (optional but encouraged).
3. Run validation: `npm run lint && npm run build && npm run test`
4. Fix any issues that arise.
5. Stage and commit with a descriptive message:

```bash
git add -A
git commit -m "<type>: <description>

<body if needed>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Use conventional commit types (`feat`, `fix`, `refactor`, `docs`, `chore`, etc.).

### Step 4: Push to remote

```bash
git push -u origin <branch-name>
```

If the push fails due to permissions or remote issues, inform the user and suggest manual steps.

### Step 5: Open a PR

> **⏭️ Skip this step if no-PR mode is active.** After pushing, inform the user that the branch is available at `origin/<branch-name>` and they can open a PR manually when ready.

Use the GitHub CLI to create a pull request:

```bash
gh pr create \
  --title "<PR title>" \
  --body "<PR body>" \
  --base main \
  --head <branch-name>
```

The PR body must include:
- **Summary** — what this PR does (from the plan)
- **Changes** — bullet list of files changed and why
- **Testing** — what was validated (lint, build, test results)

Use `ask_user` to confirm the PR title and description before creating.

### Step 6: Start dev server

Run the dev server in the worktree so the user can immediately preview changes:

```bash
npm run dev
```

---

# Critical Mode (`ship-critical`)

> Triggered by: `ship-critical`, `[ship-critical]`, `ship thoroughly`, `ship with full review`, `ship careful`

Thorough path for critical changes. Includes clips integration, dedicated test writing, and adversarial rubber-duck review.

## Steps

### Step 1: Create a worktree

Same as lite mode — invoke the **worktree** skill to create a git worktree.

### Step 2: Plan the feature

Same as lite mode — write plan to `.github/plans/<branch-name>.md` and get user confirmation.

### Step 3: Create clips goal/tasks

**If the `clips` skill is available** (check for `.clips/` directory or `clips` CLI), create tracking issues before implementation begins:

1. Run `clips view` to check for a relevant existing goal.
2. If a matching goal exists, create tasks under it for the planned work.
3. If no matching goal exists, create a new goal with tasks derived from the plan.
4. **Save the goal ID and issue number** — you will need these for the PR body.

If clips is not available, skip this step silently.

### Step 4: Implement and commit

Execute the plan:

1. Implement the changes following the plan.
2. Run validation: `npm run lint && npm run build && npm run test`
3. Fix any issues that arise.
4. Stage and commit with a descriptive message:

```bash
git add -A
git commit -m "<type>: <description>

<body if needed>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Step 5: Write tests

**Invoke the `vitest` skill** to write tests for the implementation:

1. Identify all new or changed logic that is testable (utilities, data transformations, hooks, state management, etc.).
2. Write tests using Vitest, following existing test patterns in the codebase.
3. Run `npm run test` to verify all tests pass (new and existing).
4. Fix any failures.
5. Stage and commit tests separately:

```bash
git add -A
git commit -m "test: add tests for <feature>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

**Skip this step only if** the change is purely documentation, configuration, or markup with no testable logic.

### Step 6: Adversarial rubber-duck review

Launch a `rubber-duck` agent with an adversarial framing. Include the plan from Step 2, the diff of all changes (`git diff HEAD~1`), and the feature requirements from the user's original prompt. The prompt must include:

> You are an adversarial code reviewer. Your job is to BREAK this implementation. Assume nothing works correctly until proven otherwise. Specifically:
>
> 1. **Find bugs** — race conditions, off-by-one errors, null/undefined access, missing error handling
> 2. **Find security issues** — injection, XSS, data leaks, unsafe defaults
> 3. **Find logic errors** — incorrect assumptions, missing edge cases, broken invariants
> 4. **Find integration issues** — does this break existing behavior? Are imports/exports correct? Are types consistent?
> 5. **Find missing tests** — what scenarios are NOT covered?
>
> For each finding, rate severity as CRITICAL (must fix), HIGH (should fix), or LOW (nice to fix).
> Only report CRITICAL and HIGH findings. Ignore style, formatting, and naming.

#### Process findings

1. Apply all CRITICAL fixes immediately.
2. Apply HIGH fixes unless they significantly complicate the implementation without clear benefit.
3. Discard LOW findings.
4. If any changes were made, run lint/build/test again and commit:

```bash
git add -A
git commit -m "fix: address review findings

<summary of what was fixed>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

5. If no findings required changes, skip the commit.

### Step 7: Push to remote

```bash
git push -u origin <branch-name>
```

### Step 8: Open a PR

Use the GitHub CLI to create a pull request:

```bash
gh pr create \
  --title "<PR title>" \
  --body "<PR body>" \
  --base main \
  --head <branch-name>
```

The PR body must include:
- **Summary** — what this PR does (from the plan)
- **Changes** — bullet list of files changed and why
- **Testing** — what was validated (lint, build, test results)
- **Review notes** — summary of adversarial review findings and how they were addressed
- **Fixes** — if clips issues were created in Step 3, include `Fixes #<issue_number>` for each goal/task so they auto-close when the PR merges

Use `ask_user` to confirm the PR title and description before creating.

### Step 9: Close clips tasks

After the PR is opened, mark clips tasks as closed:

1. Run `clips view` to find the goal/tasks created in Step 3.
2. Mark them as closed (`clips task status ... closed` / `clips goal status ... closed`).

If clips was skipped in Step 3, skip this step too.

### Step 10: Start dev server

Run the dev server in the worktree:

```bash
npm run dev
```

---

## Rules (Both Modes)

- **Always create a worktree first** — invoke the worktree skill as Step 1, before any exploration or implementation. Never commit to `main`. The worktree IS the branch.
- **Always run lint/build/test** before committing — at minimum `npm run lint && npm run build && npm run test`.
- **Always use `ask_user`** for confirmations — branch name, plan approval, PR details.
- **Conventional commits** — use `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefixes.
- **Co-authored-by trailer** — every commit must include the Copilot co-author trailer.
- **If any step fails**, stop and inform the user with the error and suggested next steps. Do not silently continue.
- **Context inference** — if the user's prompt already provides the branch name, feature description, or other details, skip the corresponding `ask_user` question and use the provided value directly.

### Critical-mode specific rules

- **Never skip the adversarial review** — this is the quality gate. The adversarial rubber-duck pass is mandatory.
- **Always open a PR** — critical mode does not support no-PR. If `gh pr create` fails, inform the user immediately.

---

## Example Usage

### Lite Mode Example

User says: "ship a fix for the button alignment"

1. Creates worktree `fix-button-alignment`
2. Plans the fix, gets user confirmation
3. Implements fix with inline tests if needed, commits
4. Pushes to origin
5. Opens PR "fix: correct button alignment"
6. Starts dev server

### Lite Mode No-PR Example

User says: "[ship-no-pr] update the README"

1. Creates worktree `update-readme`
2. Plans the update, gets user confirmation
3. Implements changes, commits
4. Pushes to origin
5. **Skips PR** — informs user: "Branch pushed to `origin/update-readme`. Open a PR when ready."
6. Starts dev server

### Critical Mode Example

User says: "ship-critical: refactor the authentication flow"

1. Creates worktree `refactor-authentication-flow`
2. Plans the implementation (explores codebase, writes plan)
3. Creates clips goal + tasks for the work
4. Implements refactor, commits
5. Writes tests using vitest skill, commits
6. Runs adversarial rubber-duck review, fixes findings, commits
7. Pushes to origin
8. Opens PR "refactor: overhaul authentication flow" with `Fixes #<issue>` in body
9. Marks clips tasks as closed
10. Starts dev server
