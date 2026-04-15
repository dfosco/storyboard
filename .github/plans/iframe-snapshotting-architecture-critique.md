# Updated critique (post `4-0-0--no-snapshots`)

## Executive summary

The latest merge removed snapshotting infrastructure end-to-end (runtime capture, CLI snapshot command, and snapshot workflow), which is the right reset away from a fragile multi-pipeline system. The remaining architectural issue is simpler and more direct: iframe widgets still mount heavy iframe content immediately, while the click overlay only gates interaction, not load. That means startup pressure from many iframes can still seize the page under dense canvases.

Given this new baseline, the priority should be **strict interaction-first loading** (load on explicit user activation only), and **not** a global iframe admission controller in this ship. Future snapshots can return only as optional CI-produced posters that never influence loading or interaction semantics.

## What improved after `4-0-0--no-snapshots`

1. Snapshot complexity is gone from runtime widget code.
2. `storyboard snapshots` command and snapshot workflow coupling were removed.
3. Behavior is easier to reason about because there is one less async subsystem.

## What is still problematic

## 1) Overlay still does not control load

Prototype, Story, Figma, and dev Component widgets render iframes directly, then overlay “Click to interact” on top. This blocks pointer access, but iframe documents still boot, fetch, and render at page load.

**Consequence:** original page-seizing risk remains in large canvases.

## 2) No common load policy across iframe widgets

Each widget has bespoke interaction logic, but none enforced a shared “do not mount until activated” contract. This makes regressions easy and hard to catch without explicit tests.

## 3) Strategy B (global budget scheduler) is high edge-case surface right now

You’re right to flag this. A global iframe budget introduces policy questions and racey boundaries:

- “How many iframes is safe?” per machine/page/widget mix.
- Viewport edge handling (partially visible, expanded modal, keyboard focus).
- Eviction semantics (state retention vs teardown).
- Complex integration with canvas drag/select/edit flows.

This is valuable later if needed, but it is a bigger state machine than the immediate problem requires.

## Updated recommendation

## Strategy A (ship now): strict interaction-first loading

1. Do not mount iframe content until explicit activation (click / Enter / Space).
2. Keep layout stable with placeholders.
3. Keep overlay behavior for selection ergonomics.
4. Ensure explicit toolbar actions (e.g., expand) can force-load iframe first.

This directly targets startup iframe pressure with minimal new state.

## Strategy C (future, progressive): CI-only optional snapshots

If snapshots return:

1. Single producer: CI only (no runtime capture, no local auto-commit loop).
2. Optional posters only.
3. Poster presence/absence never changes mounting policy.

That keeps snapshots as a visual enhancement, not a control plane.

## Strategy B (defer): canvas-level global iframe admission controller

Defer until strict interaction-first loading is shipped and measured. Only add a global budget if measured startup/interaction still regresses after deterministic gating.

## Success criteria for this ship

1. No iframe widget mounts iframe content before explicit activation.
2. Existing interaction affordances (overlay, modifier-click behavior, expand flows) remain intact.
3. Tests assert “no iframe before activation / iframe after activation.”
4. Docs/plans reflect snapshot-free baseline + future CI-only optional snapshot direction.
