# Canvas Persistence Improvements

## Problem

The canvas persistence model has two architectural concerns:

### 1. HMR Echo — the browser re-processes its own writes

When the user edits a widget in the browser:

1. UI updates local React state **immediately** (optimistic)
2. Debounced/queued API call hits `PUT /update` (or `PATCH /widget`, `DELETE /widget`)
3. Server appends event to `.canvas.jsonl`
4. Server calls `pushCanvasUpdate()` → re-reads the **entire file from disk** (`readCanvas(filePath)`) → sends full materialized state via Vite WebSocket
5. Browser receives `storyboard:canvas-file-changed` HMR event → `useCanvas` merges server data back into state

Step 5 is redundant for the client that initiated the write — it already has the correct state from step 1. This means:
- Every save triggers a full state re-read from disk on the server
- The full canvas payload travels over WebSocket back to the same browser
- `useCanvas` runs a merge (`setCanvas(prev => ({ ...prev, ...fresh }))`) that produces the same state

For a canvas with many widgets, this is wasted I/O, serialization, and React reconciliation on every edit.

### 2. No conflict detection — last-write-wins silently

There's no versioning, ETags, or sequence numbers on canvas writes. If two sources (e.g., two browser tabs, or a browser + CLI agent) edit the same canvas:
- Both read the same state
- Both write their changes
- The second write silently overwrites the first
- No error, no merge, no notification

The `widgets_replaced` endpoint has a safety check (refuses >50% widget count reduction unless `replaceAll: true`), but this only catches bulk wipes — not field-level conflicts.

---

## Current Architecture Reference

| Layer | File | Role |
|-------|------|------|
| UI state | `packages/react/src/canvas/CanvasPage.jsx` | Local-first React state, debounced saves, write queue |
| Canvas hook | `packages/react/src/canvas/useCanvas.js` | Fetches fresh data on mount, listens to HMR updates |
| Server API | `packages/core/src/canvas/server.js` | CRUD routes, `appendEvent()`, `pushCanvasUpdate()` |
| Data plugin | `packages/react/src/vite/data-plugin.js` | Build-time materialization, HMR plumbing |

Key code paths:
- **Widget edit**: `handleWidgetUpdate` (line 698) → `debouncedSave` (2s) → `queueWrite` → `updateCanvas(canvasId, { widgets })` → `PUT /update`
- **Widget move**: `handleItemDragEnd` (line 1026) → immediate `queueWrite` → `updateCanvas` → `PUT /update`
- **Widget delete**: `handleWidgetRemove` (line 716) → cancel debounce → `queueWrite` → `removeWidgetApi` → `DELETE /widget`
- **Server push**: every mutating endpoint calls `pushCanvasUpdate()` → `readCanvas(filePath)` → `viteWs.send(...)` → `useCanvas` HMR handler merges

---

## Proposed Improvements

### Phase 1: HMR Echo Suppression

**Goal:** Prevent the originating browser from re-processing its own write.

**Approach — Client-side write token:**

1. **Client generates a write token** (e.g., a random ID) and includes it in API requests as a header or body field (`_writeToken`).
2. **Server includes the token in the HMR push** — `pushCanvasUpdate()` passes it through in the WebSocket event data.
3. **`useCanvas` HMR handler skips events matching a recent write token** — maintains a small set of "pending tokens" that get cleared after receipt.

This is lightweight, requires no server-side session tracking, and cleanly separates "my writes" from "external writes" (other tabs, CLI, agents).

**Files to change:**
- `packages/react/src/canvas/CanvasPage.jsx` — generate token per save, include in API calls
- `packages/react/src/canvas/useCanvas.js` — track pending tokens, skip matching HMR events
- `packages/core/src/canvas/server.js` — pass `_writeToken` through to `pushCanvasUpdate()` event data
- Canvas API client functions (wherever `updateCanvas`, `removeWidgetApi`, etc. are defined) — accept and forward write token

### Phase 2: Optimistic Versioning (Conflict Detection)

**Goal:** Detect when a write is based on stale state and surface it to the user.

**Approach — Sequence counter per canvas:**

1. **Server maintains a monotonic sequence number per canvas** — incremented on every `appendEvent()`. Stored as the last field in the JSONL stream or in a lightweight sidecar.
2. **Every API response returns the current sequence number** — client stores it as "last known version."
3. **Every write includes the client's last known version** — server compares: if `client.version < server.version`, the canvas was modified by another source since the client last synced.
4. **On conflict:** server still applies the write (last-write-wins remains the default) but returns a `409 Conflict` status with both the client's version and the current version. The client can then show a toast ("Canvas was modified elsewhere") and optionally re-fetch.

This is non-breaking — existing clients that don't send a version just get normal 200s. Conflict detection is opt-in.

**Files to change:**
- `packages/core/src/canvas/server.js` — add sequence tracking to `appendEvent()`, return version in responses, compare on writes
- `packages/react/src/canvas/CanvasPage.jsx` — track version from API responses, send with writes, handle 409
- `packages/react/src/canvas/useCanvas.js` — expose current version from HMR events

### Phase 3: Write Coalescing (Optional)

**Goal:** Reduce the number of API calls during rapid interaction (e.g., typing in a text widget).

Currently, `debouncedSave` fires 2s after the last keystroke and sends the **full widget array**. If the user types for 10 seconds, only one save fires (good). But if they pause briefly mid-sentence, two saves fire — each sending the full array.

**Approach — Dirty-field tracking:**

1. Track which widget IDs are dirty since last save
2. On save, use `PATCH /widget` for single-widget edits instead of `PUT /update` with full array replacement
3. This reduces payload size and avoids the `widgets_replaced` event (which replaces ALL widgets in the JSONL stream)

This is lower priority — the current debounce is already reasonable, and the JSONL compaction handles the append bloat.

---

## Implementation Order

1. **Phase 1 (HMR echo suppression)** — highest impact, lowest risk. Eliminates redundant disk reads, WebSocket traffic, and React reconciliation on every save.
2. **Phase 2 (conflict detection)** — medium impact, medium risk. Adds safety for multi-client scenarios (agent + browser, two tabs).
3. **Phase 3 (write coalescing)** — lowest priority, can be deferred. Current debounce is adequate for single-user prototyping.

---

## Risks & Considerations

- **Phase 1** must handle edge cases: what if the WebSocket message arrives before the API response? Token cleanup must be time-based, not just response-based.
- **Phase 2** sequence numbers must survive JSONL compaction — the compactor needs to preserve the latest sequence.
- **Phase 2** "conflict" in a prototyping tool is different from a database — showing a toast may be sufficient vs. blocking the write.
- All changes are in `packages/core` and `packages/react` — both are npm-published packages, so semver matters.
