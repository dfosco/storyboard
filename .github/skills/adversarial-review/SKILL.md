---
name: adversarial-review
description: Cross-model adversarial code review using a model from a different family than the current session.
metadata:
  author: Daniel Fosco
  version: "2026.4.09"
---

# Adversarial Review Skill

Launches a **cross-model adversarial code review** using a model from a different family than the current session. This catches blind spots that same-model review might miss.

## When to Use

- Security-sensitive changes
- Public API modifications
- Complex core logic
- Changes to authentication, authorization, or data handling
- Any change where finding bugs before merge is critical

This skill is automatically invoked by the **ship** skill in critical mode (`ship-critical`).

---

## Cross-Model Selection

The reviewer MUST use a model from a **different family** than the current session:

| If current session is... | Use adversarial model... |
|--------------------------|--------------------------|
| Claude (Opus, Sonnet, Haiku) | `gpt-5.4` or `gpt-5.1-codex` |
| GPT (any variant) | `claude-opus-4.6` or `claude-sonnet-4.6` |
| Gemini | `claude-opus-4.6` or `gpt-5.4` |

This ensures the review catches issues that the primary model's training might have blind spots for.

---

## How It Works

### Step 1: Gather context

Collect all necessary information for the review:

1. **The diff** — run `git diff main..HEAD` (or appropriate base branch)
2. **The plan** — if a `.github/plans/<branch-name>.md` exists, include it
3. **Feature requirements** — the original user prompt or task description

### Step 2: Launch cross-model task agent

Use the `task` tool with:
- `agent_type: "general-purpose"`
- `model`: Set to a model from a different family (see table above)

### Step 3: Adversarial prompt

The prompt MUST include the adversarial framing:

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

### Step 4: Process findings

After the adversarial review completes:

1. **CRITICAL findings** — Apply all fixes immediately. These are blockers.
2. **HIGH findings** — Apply fixes unless they significantly complicate the implementation without clear benefit.
3. **LOW findings** — Discard. The adversarial review focuses on real issues, not style.

### Step 5: Validate and commit

If any changes were made:

```bash
npm run lint && npm run build && npm run test
git add -A
git commit -m "fix: address adversarial review findings

<summary of what was fixed>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Example Usage

### Direct invocation

User says: "run an adversarial review on my changes"

1. Determine current model family (e.g., Claude Sonnet)
2. Select cross-model reviewer (e.g., `gpt-5.4`)
3. Gather diff and context
4. Launch task agent with adversarial prompt
5. Process findings, apply fixes
6. Commit if changes were made

### Via ship-critical

The **ship** skill automatically invokes this skill in Step 6 when running in critical mode.

---

## Rules

- **Never skip the cross-model requirement** — same-model review defeats the purpose
- **Never downgrade CRITICAL findings** — they must be fixed before merge
- **Report findings to the user** — summarize what was found and how it was addressed
- **Include review notes in PR body** — when used with ship-critical, add a "Review notes" section

---

## Output

After running, this skill should provide:

1. **Summary of findings** — how many CRITICAL, HIGH, LOW issues found
2. **What was fixed** — list of changes made to address findings
3. **What was deferred** — any HIGH findings that were intentionally skipped (with justification)
