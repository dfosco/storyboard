# Terminal Agent Context

Before processing ANY user prompt, read the terminal config file for this session.

## Step 1: Read terminal config

The config file is in `.storyboard/terminals/`. Find it using:
```bash
ls .storyboard/terminals/*.json
```

Or use environment variables to identify your session:
- `$STORYBOARD_WIDGET_ID` — your terminal widget ID
- `$STORYBOARD_CANVAS_ID` — the canvas you're on
- `$STORYBOARD_BRANCH` — the current git branch
- `$STORYBOARD_SERVER_URL` — the dev server base URL

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

## Step 3: Use context

- Connected sticky notes and markdown are likely instructions or requirements
- Connected images are likely designs, screenshots, or references
- Connected stories/components are likely code to modify or iterate on
- The user's prompt should be interpreted in light of these connected widgets

## Step 4: Signal completion

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
- NEVER write directly to `.canvas.jsonl` files — use the canvas server API instead
- Use `$STORYBOARD_SERVER_URL` for all API calls to the dev server
