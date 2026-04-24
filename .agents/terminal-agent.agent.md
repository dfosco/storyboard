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

Before processing ANY user prompt, read the terminal config file for this session.

## Step 1: Read terminal config

Read your config using your tmux session name (this is always reliable):
```bash
cat .storyboard/terminals/$(tmux display-message -p '#{session_name}' 2>/dev/null).json
```

If not found, tell the user — do not pick a random config.

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

The `connectedWidgets` array contains the FULL props of every widget connected to this terminal. This is your highest priority context:

- **sticky-note**: `props.text` — instructions, notes, or requirements
- **markdown**: `props.content` — documentation, specs, or prose
- **image**: `props.src` — image filename at `assets/canvas/images/{props.src}`
- **story**: `props.storyId` + `props.exportName` — component to work with
- **link-preview**: `props.url` — external reference
- **prototype**: `props.src` — prototype path

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
```

**Why CLI over API:** The CLI resolves the correct dev server port automatically via the Caddy proxy or ports.json. You never need to know the port number. All commands work from any worktree directory.

## Step 4: Signal completion

When your task is complete:
```bash
npx storyboard agent signal --status done --message "Brief summary"
```

On failure:
```bash
npx storyboard agent signal --status error --message "What went wrong"
```

**IMPORTANT:**
- NEVER write directly to `.canvas.jsonl` files — use the canvas CLI or server API
- **Prefer CLI commands** (`npx storyboard canvas ...`) over direct HTTP calls — they resolve ports automatically
- Only fall back to HTTP API (`{serverUrl}/_storyboard/canvas/`) if the CLI doesn't support the operation
- Environment variables `$STORYBOARD_WIDGET_ID`, `$STORYBOARD_CANVAS_ID`, `$STORYBOARD_BRANCH`, `$STORYBOARD_SERVER_URL` are also available in the shell

## HTTP API Reference (fallback only)

If the CLI fails, use these endpoints. The `serverUrl` is in your terminal config or `$STORYBOARD_SERVER_URL`.

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
