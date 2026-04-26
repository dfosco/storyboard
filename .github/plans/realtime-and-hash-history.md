# Realtime collaboration + hash history

Plan for two related features:

1. **Hash history** — undo/redo + time-travel for the URL hash session (overrides, scene, etc.)
2. **Realtime sync** — shared prototype state (hash), canvas state (widgets), and cursors

This plan consolidates prior session decisions on signaling/encryption (see "Transport
& security" section) and assumes a Y.js-based CRDT layer comparable to the `dfosco/d6`
shared-cursor implementation.

> ⚠️ Open verification items
> - Session log at `tasks/0a08f652-...` was not accessible from the planning environment.
> - `dfosco/d6` is private; the cursor implementation referenced here is the standard
>   `y-protocols/awareness` pattern. Confirm against d6 before implementation.

---

## Phase 0 — Foundations

### 0.1 Stand up a Y.js doc per "session room"

- Add `yjs`, `y-protocols`, `y-webrtc` (or chosen transport) to `packages/core`.
- New module `packages/core/src/realtime/yDoc.js` exposing:
  - `getDoc(roomName)` — singleton Y.Doc per room.
  - `getAwareness(roomName)` — singleton awareness instance.
  - `getProvider(roomName, opts)` — lazy WebRTC provider, started on first call.
- Room name = `prototype:{slug}` by default; never reuse short, guessable names
  (see Transport & security below).

### 0.2 Identity & local user

- New `packages/core/src/realtime/localUser.js`:
  - Stable per-browser ID in localStorage (`sb-user-id`, UUID v4).
  - Display name from `sb-user-name` (fallback "Anonymous · {color}").
  - Stable color picked from a fixed palette, hashed off the ID.
- Awareness state shape (used by all realtime features):
  ```
  { user: { id, name, color }, cursor: {...}, selection: {...}, route: '/...' }
  ```

### 0.3 Feature flag

- Add `realtime` flag to `storyboard.config.json` (default `false`).
- Plumb through `featureFlags.js` so the provider is never instantiated when off.

---

## Phase 1 — Hash history (undo/redo + time travel)

This is independent of realtime and ships first. It also gives us a clean state model
to layer Y.js onto in Phase 2.

### 1.1 Model the hash as an event log

- New `packages/core/src/sessionHistory.js`:
  - Internal ring buffer of snapshots `[{ timestamp, hash, source }]`.
  - `record(hash, source)` — push a snapshot; coalesce within a debounce window
    (~300 ms) to avoid one entry per keystroke when an override is being typed.
  - `undo()` / `redo()` — move the cursor; write `window.location.hash` directly
    (matching `session.js` rationale: bypass router via native hash assignment).
  - `entries()` — read-only snapshot list for a UI (DevTools, palette).
  - Capped (e.g. 200 entries) with FIFO eviction.

### 1.2 Wire it to existing hash writes

- `setParam`/`removeParam` in `session.js` already centralize all hash writes from
  `useOverride`. Add an internal hook there to call `sessionHistory.record(...)` on
  every write, tagged with `source: 'override'`.
- Also subscribe to `hashchange` so external writes (back/forward, paste-in-URL,
  hash preserver navigation) are recorded with `source: 'navigation'`.

### 1.3 Distinguish navigation from session edits

- The browser already gives us back/forward for hash changes. Sessjon history is
  *additive* on top — it lets a user undo an override change without losing route.
- Record both pathname+hash. On undo, if pathname differs, do a
  `router.navigate(pathname + hash)`; otherwise just rewrite the hash.

### 1.4 React hook + DevTools UI

- New `packages/react/src/hooks/useSessionHistory.js`:
  - Returns `{ entries, canUndo, canRedo, undo, redo, jumpTo(index) }`.
  - Backed by `useSyncExternalStore` over a small subscription on the history store.
- Extend `react-primer/src/DevTools/DevTools.jsx`:
  - New "History" tab listing entries (relative time, summary of changed keys).
  - Click an entry to `jumpTo`.
  - `⌘Z` / `⌘⇧Z` keybindings while DevTools is mounted (gated, no global hijack).

### 1.5 Tests

- `sessionHistory.test.js` (vitest) — record/undo/redo/coalesce/cap.
- `useSessionHistory.test.jsx` — hook reactivity.
- Extend `useOverride.test.js` to assert history recording on writes.

### 1.6 Acceptance

- Toggling theme override 5 times → undo walks back through all 5.
- Navigating between pages does not pollute the override-undo stack.
- DevTools History tab reflects writes in real time.

---

## Phase 2 — Realtime: shared prototype state (hash overrides)

### 2.1 Y.Map mirror of the hash

- `packages/core/src/realtime/sharedSession.js`:
  - Y.Map `session` inside the room's Y.Doc.
  - On local hash write (hook from 1.2), set the corresponding key on the Y.Map.
  - On Y.Map observer event from a remote peer, write through to the hash via
    `setParam` *with a flag* that suppresses the re-broadcast (avoid feedback loop).
- This makes every override into a CRDT key. Last-writer-wins per key is fine;
  Y.Map handles it.

### 2.2 Suppression + history interaction

- Remote-applied writes must be tagged so `sessionHistory` records them with
  `source: 'remote'` — useful for UI but excluded from local undo by default.
- Local undo of a value broadcasts the prior value (it just goes through `setParam`
  again, so the existing path Just Works).

### 2.3 Hide-mode interaction

- `useOverride` already skips hash writes in hide mode and only writes the shadow.
  Shared sessions should not run while hide mode is on (per-user privacy). Gate
  the provider startup on `!isHideMode()` and disconnect when hide mode toggles.

### 2.4 Acceptance

- Two browsers join the same prototype URL → toggling a theme override on A
  flips it on B within ~100 ms.
- Disconnecting one peer does not roll back the other's state.
- Hide mode on one peer cleanly disconnects them; their local hide-mode shadow
  is unchanged.

---

## Phase 3 — Realtime: shared canvas state

Canvas state (widgets, sources, settings) is currently server-persisted via
`/_storyboard/canvas/`. Realtime needs a CRDT layer that doesn't lose the server
as the source of truth.

### 3.1 Architecture choice

Two options, pick one in implementation:

- **A. CRDT-first, server polls.** Y.Doc holds widgets as a Y.Array of Y.Maps;
  one designated peer (or a small worker) flushes to `/update` on change. Lower
  latency, more moving parts.
- **B. Server-first, CRDT for live ops.** Y.Doc only carries in-flight ops and
  awareness. Persistence stays via `updateCanvas`; we just broadcast the same
  payload over Y to short-circuit the round trip.

Recommend **B** — it preserves the existing canvas API contract, keeps all the
existing tests passing, and limits CRDT scope to the live-collab surface.

### 3.2 Implementation

- New `packages/react/src/canvas/useCanvasRealtime.js`:
  - Subscribes to widget mutations from `useCanvas`.
  - Mirrors mutations to a Y.Map (`canvas:{name}`) on the room doc.
  - On remote events, applies them through the same `useCanvas` reducer (not
    by setting React state directly) so undo/redo/local persistence keep working.
- Debounce the server flush (existing) by an extra ~500 ms when realtime is on;
  remote peers see ops before they're persisted.

### 3.3 Conflict policy

- Widget add/remove → CRDT (Y.Array.insert / delete).
- Widget prop edits → Y.Map per widget; LWW per prop is acceptable.
- Position/size → Y.Map; LWW (the user moving most recently wins, which is
  what users expect in collab tools).

### 3.4 Acceptance

- Two peers editing the same canvas: drag a widget on A, B sees it move live.
- Server JSON on disk eventually matches CRDT after debounce.
- Reload on either side reproduces final state from server JSON alone (no Y.Doc
  required for cold start).

---

## Phase 4 — Cursors & presence

### 4.1 Awareness payload

Per-user awareness state (already defined in 0.2). Update on:

- `pointermove` on the canvas surface (throttled to ~30 Hz).
- Selection changes (already tracked in `useCanvas`).
- Route changes (so the presence list can show "Alice is on /Settings").

### 4.2 Render

- `packages/react/src/canvas/Cursors.jsx`:
  - Reads the awareness states map; renders a `<Cursor name color x y />` for
    each remote peer whose `route` matches the current page.
  - Coordinate space: store cursor in **canvas space** (not viewport), so zoom
    and scroll on each peer's machine still render the cursor at the right spot.
  - Smoothing: lerp at 60 Hz toward the latest received position.
- `Avatars.jsx` for a top-bar presence list (route-aware: dim peers on other pages).

### 4.3 Selection mirroring

- Remote selections drawn as a thin outlined rectangle in the peer's color
  around their selected widget(s). Read-only on this side.

### 4.4 Acceptance

- Two peers see each other's cursor smoothly across pan/zoom changes.
- Peer disconnect removes their cursor within ~5 s (awareness timeout).
- Selecting a widget on A shows a colored outline on B.

---

## Transport & security

Consolidating from the prior signaling discussion:

- **Default transport:** `y-webrtc` with:
  - Room name = high-entropy random ID (UUID v4) derived from `prototypeId`,
    *not* the human-readable slug.
  - `password` option set to a per-prototype shared secret (env or workshop UI).
- **Corporate-safe mode:** ship a tiny self-hosted signaling server in
  `packages/core/scripts/signaling.js` (the y-webrtc reference server, ~100 LOC)
  and point `signaling: [...]` at it. No third party in the data path.
- **Encryption:** `password` enables end-to-end AES-GCM on signaling payloads;
  WebRTC data channel is DTLS by default. Public signaling sees only metadata.
- **Fallback:** if `realtime.signaling` is empty in config, realtime is disabled
  with a clear console warning. No silent fallback to public infra.

---

## Rollout order

1. Phase 0 + Phase 1 ship together behind the `realtime` flag *off* — Phase 1 is
   useful on its own (undo/redo for overrides) and exercises the history store.
2. Phase 2 behind the flag, opt-in per prototype via a workshop button
   ("Share this session").
3. Phase 3 once Phase 2 is stable for ≥1 week of dogfooding.
4. Phase 4 last — cursors are the most visible but the least load-bearing,
   and benefit from the awareness plumbing being shaken out by phases 2–3.

---

## Open questions for the user

- Should hash history be available outside DevTools (e.g. global `⌘Z`)?
  Default in this plan: DevTools-only, no global hotkey hijack.
- For shared canvas, do we want presence-without-edit (read-only viewers)?
  Easy to add via an awareness `role` field, but needs UI affordance.
- Confirm signaling preference: public `signaling.yjs.dev` with random room +
  password (zero infra) vs. self-hosted (zero third-party)? The plan keeps
  both as switchable config; we just need to pick the default.
- Please point me at d6's cursor code if/when accessible — I want to match
  its smoothing/throttling defaults rather than reinvent.
