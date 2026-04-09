# Ship Skill Iteration — Applying VDD Concepts

> Analysis of how [Verification-Driven Development (VDD)](https://gist.github.com/dollspace-gay/45c95ebfb5a3a3bae84d8bebd662cc25) concepts map to the Ship skill and concrete proposals for improvement.

---

## VDD Summary

Verification-Driven Development is an adversarial refinement framework with these core ideas:

| VDD Concept | Description |
|---|---|
| **Multi-model orchestration** | Builder AI implements, Adversary AI critiques, Human mediates |
| **Chainlink decomposition** | Goals → Epics → Issues → Sub-issues ("beads") for linear accountability |
| **Verification Loop** | Tests + human-in-the-loop validation *before* adversarial review |
| **Iterative Adversarial Refinement ("The Roast")** | Repeated adversarial passes, not a single-shot review |
| **Context Resetting** | Fresh context window for the adversary each pass to prevent "relationship drift" |
| **Hallucination-based Termination** | The cycle stops when the adversary invents non-existent problems ("Zero-Slop") |
| **Formal Verification / CI Gating** | Mathematical correctness proofs as CI gates |
| **Anti-Slop Bias** | Assumes the first "correct" version has hidden debt |
| **Entropy Resistance** | Cycling context windows to maintain critique quality |

---

## Current Ship Skill Mapping

Ship already implements several VDD concepts:

| Ship Step | VDD Parallel | Status |
|---|---|---|
| Step 2: Plan the feature | Chainlink decomposition (partial) | ✅ Has planning, but less granular |
| Step 3: Clips tracking | Chainlink "beads" (partial) | ✅ Goal + tasks, but flat structure |
| Steps 4–5: Implement + test | Verification Loop | ✅ Solid — lint/build/test before review |
| Step 6: Adversarial review | "The Roast" | ⚠️ **Single-pass only** |
| Step 8: Open PR | CI gating (if repo has checks) | ✅ PR opens, CI runs |

---

## Bug in Current Ship Skill

**Step 5 and Step 6 content is duplicated.** The vitest invocation text appears at the beginning of Step 6 (lines 120–135) before the actual adversarial review content. This is a copy-paste artifact that should be fixed.

---

## Proposed Changes

### 1. Iterative Adversarial Loop (High Impact)

**Current:** Step 6 runs a single adversarial review pass — one critique, fix findings, done.

**VDD insight:** The adversarial review should be a loop. The adversary reviews, the builder fixes, and the adversary reviews *again* with fresh context — until the critique quality degrades to hallucination.

**Proposal:** Replace the single-pass adversarial review with a loop:

```
while true:
  1. Launch adversarial agent with fresh context (new agent invocation)
  2. Feed it: plan, full diff, feature requirements
  3. Collect findings (CRITICAL / HIGH / LOW)
  4. If no CRITICAL or HIGH findings → exit loop
  5. If findings are hallucinated (not grounded in code) → exit loop ("Zero-Slop")
  6. Otherwise → fix findings, re-run tests, commit, loop back to (1)
  7. Cap at 3 iterations to prevent infinite loops
```

The key addition is **re-reviewing after fixes** — VDD's core insight is that fixes to adversarial findings can introduce new issues that a single-pass review misses.

### 2. Context Resetting / Fresh Agent Per Pass (High Impact)

**Current:** The adversarial review is a single agent invocation. No explicit guidance about context freshness.

**VDD insight:** "Context Resetting" — fresh context for each adversarial pass prevents the reviewer from becoming sympathetic to the builder's approach.

**Proposal:** Each iteration of the adversarial loop MUST use a new agent invocation (new `task` call with `agent_type: "general-purpose"`). The prompt should include only:
- The original feature requirements
- The current full diff (not the history of fixes)
- The plan

It should NOT include previous review findings or context about what was already fixed. This forces genuinely fresh critique each pass.

### 3. Hallucination-Based Termination (Medium Impact)

**Current:** No exit strategy for the adversarial review — it runs once and that's it.

**VDD insight:** "Maximum Viable Refinement" — when the adversary starts inventing problems that don't exist, the code is production-ready.

**Proposal:** Add an explicit check after each adversarial pass:

> After receiving adversarial findings, evaluate each one against the actual code. If the majority of CRITICAL/HIGH findings reference code patterns, behaviors, or bugs that don't exist in the diff, the adversary is hallucinating. Declare "Zero-Slop" and exit the loop.

This gives a principled exit signal beyond just "no findings."

### 4. Anti-Slop Bias in Planning (Medium Impact)

**Current:** Step 2 plans the feature but doesn't encode skepticism about the plan itself.

**VDD insight:** "Assumes that the first 'correct' version of code is likely the most dangerous."

**Proposal:** Add a "stress-test the plan" sub-step to Step 2:

> After generating the plan, before asking the user to confirm, run a quick adversarial pass *on the plan itself*:
> - What assumptions could be wrong?
> - What edge cases does this plan not account for?
> - What existing behavior could this break?
>
> Include these risks explicitly in the plan's "Edge cases & risks" section.

### 5. Linear Accountability via Clips (Low-Medium Impact)

**Current:** Step 3 creates a flat goal + tasks structure.

**VDD insight:** Chainlink's "bead-string" ensures every line of code maps to a tracked issue.

**Proposal:** Strengthen the clips integration:
- Each implementation step from the plan should become a task
- When committing (Step 4), reference the specific task ID in the commit message: `feat: add auth middleware (clips: g1#t2)`
- During adversarial review, the reviewer should verify that every significant code change maps back to a planned task
- If the adversarial review introduces new changes, create new tasks for those fixes

### 6. Fix Step 5/6 Duplication (Bug Fix)

**Current:** Step 5 content (vitest invocation) is duplicated at the top of Step 6.

**Proposal:** Remove the duplicated vitest content from Step 6, keeping only the adversarial review content.

---

## What NOT to Adopt

| VDD Concept | Why Skip |
|---|---|
| **Formal Verification (Kani, symbolic execution)** | Overkill for a prototyping app. The codebase is UI-heavy JavaScript — formal methods add no value here. |
| **Cryptographic testing (Wycheproof)** | Not relevant — no crypto in the codebase. |
| **Sarcasmotron persona** | The "cynical/sarcastic" framing is stylistic, not functional. Ship's existing adversarial prompt achieves the same goal with clearer severity ratings. |

---

## Priority Order

1. **Fix Step 5/6 duplication** — immediate bug fix
2. **Iterative adversarial loop** — highest-impact VDD concept
3. **Context resetting** — natural companion to the iterative loop
4. **Hallucination-based termination** — principled exit signal for the loop
5. **Anti-slop bias in planning** — improves plan quality
6. **Linear accountability via clips** — strengthens traceability

---

## Summary

The Ship skill already captures ~60% of VDD's philosophy (planning, verification-before-review, adversarial critique). The biggest gap is that Ship's adversarial review is **single-pass**, while VDD's core innovation is the **iterative adversarial loop with context resetting and hallucination-based termination**. Adopting the iterative loop (proposals 1–3) would be the highest-leverage improvement.
