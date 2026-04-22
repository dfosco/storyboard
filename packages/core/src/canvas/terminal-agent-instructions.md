# Terminal Agent Context

Before processing ANY user prompt, read the terminal config file for this session.

## Step 1: Read terminal config

First, refresh your identity by sourcing the env file for this tmux session:
```bash
TMUX_NAME=$(tmux display-message -p '#{session_name}' 2>/dev/null)
source .storyboard/terminals/${TMUX_NAME}.env 2>/dev/null
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json
```

The tmux session name is stable and never changes — this always resolves to the correct widget identity, even after session reassignment.

If the env file doesn't exist, fall back to the session registry:
```bash
STORYBOARD_WIDGET_ID=$(node -e "const d=JSON.parse(require('fs').readFileSync('.storyboard/terminal-sessions.json','utf8')); const s=d.find(e=>e.tmuxName==='$TMUX_NAME'); if(s) console.log(s.widgetId)")
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json
```

If not found, tell the user — do not pick a random config.

## Step 2: Resolve connected widgets

The config file's `connectedWidgetIds` array lists widgets explicitly connected to this terminal via canvas connectors. These are your HIGHEST PRIORITY context.

To get full widget data, read the canvas:
```bash
npx storyboard canvas read {canvasId} --json
```

Then filter for your connected widget IDs.

### Widget type operations:
- **image**: Load the image file at `assets/canvas/images/{props.src}` for visual context
- **sticky-note**: Read `props.text` — these are instructions, notes, or requirements
- **markdown**: Read `props.content` — documentation, specs, or prose
- **story**: The story source is a component to review, edit, or iterate on
- **prototype**: Reference the prototype at `src/prototypes/{path}` — UI context
- **link-preview**: Read `props.url` — external reference to fetch/summarize

## Step 3: Prefer CLI commands for canvas operations

**Always prefer `npx storyboard` CLI commands over HTTP API calls.** CLI commands resolve the dev server port automatically — no URL/port guessing needed.

### Reading canvas state
```bash
npx storyboard canvas read {canvasId} --json
npx storyboard canvas read {canvasId} --id {widgetId} --json
```

### Updating a widget
```bash
# Sticky note text
npx storyboard canvas update {widgetId} --canvas {canvasId} --text "New text"

# Markdown content
npx storyboard canvas update {widgetId} --canvas {canvasId} --content "# Heading"

# Arbitrary props as JSON
npx storyboard canvas update {widgetId} --canvas {canvasId} --props '{"key":"val"}'

# Move widget position
npx storyboard canvas update {widgetId} --canvas {canvasId} --x 100 --y 200

# Shorthand flags: --text, --content, --src, --url, --color
```

### Adding a widget
```bash
npx storyboard canvas add sticky-note --canvas {canvasId} --props '{"text":"Hello"}'
```

**Why CLI over API:** The CLI resolves the correct dev server port automatically via the Caddy proxy or ports.json. You never need to know the port number.

## Step 4: Use context

- Connected sticky notes and markdown are likely instructions or requirements
- Connected images are likely designs, screenshots, or references
- Connected stories/components are likely code to modify or iterate on
- The user's prompt should be interpreted in light of these connected widgets

## Step 5: Signal completion

When your task is complete, signal the canvas:
```bash
npx storyboard agent signal --status done --message "Brief summary of what was done"
```

On failure:
```bash
npx storyboard agent signal --status error --message "Description of what went wrong"
```

**IMPORTANT:**
- Always call the signal command when done — the canvas widget is waiting for it
- NEVER write directly to `.canvas.jsonl` files — use the canvas CLI or server API
- **Prefer CLI commands** (`npx storyboard canvas ...`) over direct HTTP calls
- Only fall back to HTTP API (`$STORYBOARD_SERVER_URL/_storyboard/canvas/`) if CLI doesn't support the operation
- Use `$STORYBOARD_SERVER_URL` for any API calls that require the server URL
