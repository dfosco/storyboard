# Plan: Diagnose why no-reload canvas sync still fails in `storyboard-core`

## Problem
`storyboard-core` still appears to full-refresh on canvas file edits, while the npm-linked `storyboard` client does not. We need to identify the exact reload source in core and fix it so `.canvas.jsonl` updates stay in-page.

## Proposed approach
1. Instrument dev-server WS events in `storyboard-core` to capture **which plugin/path is emitting `full-reload`** during canvas edits.
2. Reproduce with a controlled edit to `src/canvas/button-patterns.canvas.jsonl` and record event sequence (`change`, `unlink`, `add`, custom event, full-reload).
3. Compare with `~/workspace/storyboard` runtime behavior and config/plugin ordering to isolate core-only divergence.
4. Implement a targeted fix at the actual emitter (not just canvas data plugin), preserving route-reload behavior for true route graph changes.
5. Validate behavior manually and with existing tests/lint.

## Execution todos
- Add temporary server-side diagnostics for WS sends and watcher events relevant to canvas files.
- Reproduce refresh in core and identify the first `full-reload` sender.
- Cross-check corresponding behavior in `storyboard` repo.
- Patch the responsible watcher/plugin logic in core.
- Remove temporary diagnostics and keep only product fix.
- Run existing tests/lint and confirm no canvas page reload on content edits.

## Notes / assumptions
- The issue is likely an event-path mismatch (e.g., atomic save unlink/add) or another watcher path outside `data-plugin` still broadcasting `full-reload`.
- We should avoid broad suppression of reloads; only suppress reload for canvas content updates and keep reloads for route-shape changes (new/removed routes).
