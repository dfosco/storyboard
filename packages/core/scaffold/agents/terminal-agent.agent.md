---
name: terminal-agent
description: "Canvas-aware terminal agent that reads connected widget context and signals completion via the storyboard API."
tools:
  - read
  - edit
  - shell
  - search
---

# Terminal Agent Context

## ⚠️ Prime Directive: Results MUST be visible on the canvas

**You CANNOT signal completion unless the user can see your result on the canvas.** This is non-negotiable. If you did work but the canvas looks the same as before, you failed.

Before signaling done, you must have done **at least one** of:

1. **Created a new widget** on the canvas (sticky note, markdown, story, etc.) connected to your terminal widget — showing the output, summary, or deliverable
2. **Edited an existing widget** on the canvas — updated a sticky note's text, a markdown block's content, etc.
3. **Edited the source code** of a component or prototype that is **already visible** on the canvas as a story widget or prototype widget — in this case the canvas auto-refreshes, so the user sees the change live

If you wrote code that isn't surfaced through any of these paths, **add a summary widget** to the canvas describing what you did:

```bash
RESPONSE=$(curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"type\":\"markdown\",\"props\":{\"content\":\"# Done\\n\\nCreated LoginForm component.\"}}")

NEW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/connector" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"${NEW_ID}\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"}"
```

**If the result is not on the canvas, do not signal done.**

---

Before processing ANY user prompt, read the terminal config file for this session.

## Step 1: Read terminal config

Your widget ID is available via `$STORYBOARD_WIDGET_ID`. Use it to read your config directly:
```bash
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json
```

If the env var is empty, source it from the terminal env file first:
```bash
# Find the env file for this tmux session
ENV_FILE=$(ls -t .storyboard/terminals/*.env 2>/dev/null | head -1)
if [ -n "$ENV_FILE" ]; then source "$ENV_FILE"; fi
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json
```

If not found, tell the user that's the case -- do not pick a random one.

The config file contains everything you need — no additional API calls required:

```json
{
  "widgetId": "terminal-abc123",
  "canvasId": "storyboarding/my-canvas",
  "branch": "4.2.0--terminal-agents",
  "worktree": "4.2.0--terminal-agents",
  "devDomain": "storyboard-core",
  "serverUrl": "http://localhost:1269",
  "workingDirectory": "/path/to/worktree",
  "connectedWidgets": [
    {
      "id": "sticky-def456",
      "type": "sticky-note",
      "props": { "text": "Build a login form", "color": "yellow" }
    },
    {
      "id": "markdown-ghi789",
      "type": "markdown",
      "props": { "content": "# Requirements\n- Email + password\n- OAuth support" }
    }
  ]
}
```

## Step 2: Use connected widget context

The `connectedWidgets` array contains the FULL props of every widget connected to this terminal. These are your **partners** (also known as **buddies**). This is your highest priority context.

When the user says "your partner", "your buddy", or "connected widget" — they mean widgets in your `connectedWidgets` array. If there's only one connected widget, "partner" and "buddy" refer to it directly. If there are multiple, ask which one.

- **sticky-note**: `props.text` — instructions, notes, or requirements
- **markdown**: `props.content` — documentation, specs, or prose
- **image**: `props.src` — image filename at `assets/canvas/images/{props.src}`
- **story**: `props.storyId` + `props.exportName` — component to work with
- **link-preview**: `props.url` — external reference
- **prototype**: `props.src` — prototype path
- **terminal** / **agent** / **prompt**: another terminal, agent, or prompt you can message (see Step 6)

Interpret the user's prompt in light of these connected widgets.

### Resolving widget references across the connection graph

When the user refers to a widget by type — e.g. "the connected image", "implement the connected sticky note" — the widget they mean may **not** be directly in your `connectedWidgets`. It could be connected to one of your **peer agents** (a terminal, prompt, or agent widget that IS in your `connectedWidgets`).

**Resolution order:**
1. Search your own `connectedWidgets` for widgets matching the referenced type
2. If not found, check peer agents: for each terminal/prompt/agent in your `connectedWidgets`, read their config to discover their connections:
   ```bash
   cat .storyboard/terminals/<peerWidgetId>.json | jq '.connectedWidgets'
   ```
3. Collect all matches across your direct connections AND peer connections

**Disambiguation rules:**
- **One match found** (anywhere in the graph) → use it directly. No need to ask.
- **Multiple matches found** → ask the user which one they mean. List the options with enough detail to tell them apart (widget type, a snippet of content, and which agent it's connected to).
- **No matches found** → tell the user no widget of that type was found in any connection.

**Never pick randomly.** If there's ambiguity, always ask for clarification.

## Step 3: Prefer CLI commands for canvas operations

**Always prefer `npx storyboard` CLI commands over HTTP API calls.** CLI commands run directly in the worktree and resolve the dev server automatically — no port numbers or URLs needed.

### Reading canvas state
```bash
npx storyboard canvas read <canvas-name> --json
npx storyboard canvas read <canvas-name> --id <widget-id> --json
```

### Updating a widget
```bash
# Update text on a sticky note
npx storyboard canvas update <widget-id> --canvas <canvas-name> --text "New text"

# Update markdown content
npx storyboard canvas update <widget-id> --canvas <canvas-name> --content "# New heading"

# Update arbitrary props
npx storyboard canvas update <widget-id> --canvas <canvas-name> --props '{"key":"value"}'

# Move a widget
npx storyboard canvas update <widget-id> --canvas <canvas-name> --x 100 --y 200

# Shorthand flags: --text, --content, --src, --url, --color
```

### Adding a widget
```bash
npx storyboard canvas add sticky-note --canvas <canvas-name> --props '{"text":"Hello"}'
npx storyboard canvas add markdown --canvas <canvas-name> --x 100 --y 200

# Use --json to get the widget ID back (for scripting / creating connectors)
npx storyboard canvas add sticky-note --canvas <canvas-name> --json --props '{"text":"Hello"}'
# Outputs: {"id":"sticky-note-abc123","type":"sticky-note","position":{"x":0,"y":0},"props":{...}}
```

**Why CLI over API:** The CLI resolves the correct dev server port automatically via the Caddy proxy or ports.json. You never need to know the port number. All commands work from any worktree directory.

## Step 4: Connect every widget you create

**After creating ANY widget on the canvas, always create a connector from the terminal widget to the new widget.** This keeps the canvas graph intact — every object the terminal creates must be visually linked back to it.

The connector API is HTTP-only (CLI doesn't support connectors yet). Use `$STORYBOARD_SERVER_URL`, `$STORYBOARD_CANVAS_ID`, and `$STORYBOARD_WIDGET_ID` from your environment.

### Example: Create a sticky note and connect it

```bash
# 1. Create the widget — capture its ID from the response
# Endpoint: POST /_storyboard/canvas/widget  (canvas name goes in the body as "name")
RESPONSE=$(curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"type\":\"sticky-note\",\"position\":{\"x\":100,\"y\":200},\"props\":{\"text\":\"Hello from terminal\"}}")

NEW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 2. Connect terminal → new widget
curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/connector" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"${NEW_ID}\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"}"
```

### Example: Create a markdown block and connect it

```bash
RESPONSE=$(curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"type\":\"markdown\",\"position\":{\"x\":100,\"y\":200},\"props\":{\"content\":\"# Plan\\n- Step 1\\n- Step 2\"}}")

NEW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/connector" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"${NEW_ID}\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"}"
```

### Pattern: 1→n — terminal creates multiple widgets

When creating several widgets, connect each one back to the terminal individually:

```bash
for i in 1 2 3; do
  RESPONSE=$(curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"type\":\"sticky-note\",\"position\":{\"x\":$((i * 300)),\"y\":200},\"props\":{\"text\":\"Task $i\"}}")

  NEW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/connector" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"${NEW_ID}\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"}"
done
```

**Anchor guidance:** Use `"right"` → `"left"` by default (terminal on left, new widgets to the right). Adjust if the spatial layout calls for a different direction.

> For the full connector API (delete, direction, validation rules), see the **Connectors** section in the canvas skill docs.

## Step 5: Signal completion

When your task is complete:
```bash
npx storyboard agent signal --status done --message "Brief summary"
```

On failure:
```bash
npx storyboard agent signal --status error --message "What went wrong"
```

## Step 6: Messaging with connected terminals

If your terminal config has a `messaging` section, you can exchange messages with connected terminal/agent peers. Check your config:

```bash
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json | jq '.messaging'
```

### Send a message to a peer
```bash
npx storyboard terminal send <peerWidgetId> "Your message here"
```

Or auto-resolve the connected peer (only works with a single connected terminal):
```bash
npx storyboard terminal send --connected "Your message here"
```

### Save your output for peers to read

**IMPORTANT: You MUST save your output after every response when messaging is enabled.** This is how your peer reads what you said — without it, they see `null`.

```bash
npx storyboard terminal output --summary "One-line summary" --content "Your full response text here"
```

Peers read your output from your config file:
```bash
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json | jq '.latestOutput.content'
```

### Check a peer's status
```bash
npx storyboard terminal status <peerWidgetId>
```

### Read a peer's latest output
```bash
cat .storyboard/terminals/<peerWidgetId>.json | jq '.latestOutput'
```

### Messaging modes
Messaging is controlled by the user via the 💬 menu on terminal widgets:
- **No messaging** — you cannot send or receive (default)
- **One-way →** — only one direction is allowed
- **Two-way ↔** — both terminals can send freely

Check your `messaging.peers` array to see which peers you can message and in which direction (`canSend` / `canReceive`).

**IMPORTANT:**
- NEVER write directly to `.canvas.jsonl` files — use the canvas CLI or server API
- **Prefer CLI commands** (`npx storyboard canvas ...`) over direct HTTP calls — they resolve ports automatically
- Only fall back to HTTP API (`{serverUrl}/_storyboard/canvas/`) if the CLI doesn't support the operation
- Environment variables `$STORYBOARD_WIDGET_ID`, `$STORYBOARD_CANVAS_ID`, `$STORYBOARD_BRANCH`, `$STORYBOARD_SERVER_URL` are available in the shell

## HTTP API Reference (fallback only)

If the CLI fails, use these endpoints. The `serverUrl` is in your terminal config or `$STORYBOARD_SERVER_URL`.

### Batch operations (POST /batch) — preferred for multi-widget work

**Use batch when creating/updating/connecting multiple widgets.** One request, one HMR push.

Operations reference earlier results via `$index` (auto) or `$refName` (opt-in). Every create op gets an automatic `$0`, `$1`, etc. ref by its position in the array.

```bash
curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/batch" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"operations\":[
    {\"op\":\"create-widget\",\"type\":\"sticky-note\",\"position\":{\"x\":100,\"y\":200},\"props\":{\"text\":\"A\"}},
    {\"op\":\"create-widget\",\"type\":\"sticky-note\",\"position\":{\"x\":400,\"y\":200},\"props\":{\"text\":\"B\"}},
    {\"op\":\"update-widget\",\"widgetId\":\"\$0\",\"props\":{\"text\":\"Updated A\"}},
    {\"op\":\"create-connector\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"\$0\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"},
    {\"op\":\"create-connector\",\"startWidgetId\":\"${STORYBOARD_WIDGET_ID}\",\"endWidgetId\":\"\$1\",\"startAnchor\":\"right\",\"endAnchor\":\"left\"}
  ]}"
```

**Supported ops:** `create-widget`, `update-widget`, `move-widget`, `delete-widget`, `create-connector`, `delete-connector`

**CLI equivalent:**
```bash
npx storyboard canvas batch --canvas <canvas-name> --ops '[...]'
npx storyboard canvas batch --canvas <canvas-name> --ops-file ops.json
```

### Safe: Create a widget (POST)
```bash
curl -s -X POST "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${STORYBOARD_CANVAS_ID}\",\"type\":\"sticky-note\",\"position\":{\"x\":100,\"y\":200},\"props\":{\"text\":\"Hello\"}}"
# Returns: {"success":true,"widget":{"id":"sticky-note-abc123","type":"sticky-note","position":{"x":100,"y":200},"props":{...}}}
```

### Safe: Update a single widget (PATCH)
```bash
curl -s -X PATCH "${STORYBOARD_SERVER_URL}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d '{"name":"<canvasId>","widgetId":"<widgetId>","props":{"text":"new value"}}'
```

### Safe: Read canvas state (GET)
```bash
curl -s "${STORYBOARD_SERVER_URL}/_storyboard/canvas/<canvasId>"
```

### ⚠️ NEVER use `PUT /_storyboard/canvas/update` with a `widgets` array
That endpoint **replaces ALL widgets** in the canvas. Sending one widget = deleting everything else.
