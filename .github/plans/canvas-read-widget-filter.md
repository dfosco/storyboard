# Canvas Read: Server-side Widget Filtering

## Problem Statement

For large canvases (10k+ JSONL lines), `canvas read <name> --id <widgetID>` materializes the entire canvas and sends the full widget array over the wire, only to filter client-side. This is wasteful when you only need one widget.

## Changes Made

### Server: `?widget=` query param on `/read` endpoint

**File:** `packages/core/src/canvas/server.js`

The `/read` endpoint now accepts an optional `?widget=<id>` query parameter. When present, the response only includes the matching widget in the `widgets` array (all other canvas metadata like `title`, `settings`, `sources` are still included). Returns 404 if the widget doesn't exist.

Note: JSONL materialization still replays the full file — the filtering happens after materialization. The win is in **response payload size**, not materialization time. A future optimization could cache materialized state or index widget positions in the JSONL.

### CLI: Pass `?widget=` to server

**File:** `packages/core/src/cli/canvasRead.js`

When `--id` is provided, the CLI now appends `&widget=<id>` to the fetch URL so the server filters before responding. The client-side `.find()` is replaced by reading `widgets[0]` from the pre-filtered response.

## Not Changed

- No new positional syntax (`canvas read name widgetID`) — `--id` already does this and adding a positional variant adds ambiguity without functional benefit.
- JSONL materialization speed unchanged — would require a caching layer or indexed format, which is a separate effort.
