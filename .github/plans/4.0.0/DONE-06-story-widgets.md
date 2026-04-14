# Slice 06 — Story-Format Widgets (`4.0.0--story-widgets`)

## Goal

Revamp component widgets to consume `.story.jsx/.tsx` exports directly, render at their own routable URLs, and embed on canvas via iframe.

## What was built

### Story Discovery & Indexing
- Vite data plugin discovers `**/*.story.{jsx,tsx}` files alongside flows, objects, records, and canvases
- Stories are indexed with `_storyModule` (path), `_storyImport()` (dynamic import), and `_route` (inferred URL)
- All stories route under `/components/` regardless of source directory (avoids collision with canvas JSONL routes)
- Core loader: `getStoryData(name)`, `listStories()`, `stories` in `init()` data index
- `/_storyboard/stories/list` API endpoint for CLI/UI story discovery

### Story Routes
- `StoryboardProvider` intercepts `/components/*` routes (same pattern as canvas)
- `StoryPage` renders story exports in gallery mode (all exports) or single-export mode (`?export=Name&_sb_embed`)
- 404 fallback for unmatched `/components/` routes
- `stripBasePath()` handles apps deployed under sub-paths (e.g. `/storyboard/`)

### Story Widget on Canvas
- `story` JSON widget type (`{ storyId, exportName, width, height }`) iframes the story route URL
- Title bar showing `📖 storyId / exportName` (like Figma embed header)
- **Show code** toolbar action toggles between iframe and syntax-highlighted source view
  - Label toggles to "Show component" when code is visible
  - Source loaded via `import(?raw)` for clean raw text
  - Syntax highlighting via inspector highlighter (highlight.js) following Code Box theme
  - Ioskeley Mono 400 typography matching Inspector panel
  - Text freely selectable without triggering widget drag
- **Copy code** overflow menu action copies story source to clipboard
- **Open in new tab** toolbar action opens story route URL
- **Duplicate**, **Copy link**, **Delete** in overflow menu
- Paste detection: pasting a story URL on canvas creates a story widget

### Create Component (CLI + Skill + UI)
- `storyboard create component` — interactive CLI with name + directory picker, scaffolds `.story.jsx`
- `storyboard canvas add story` — adds story widget to canvas with interactive story/export picker
- Canvas "Add widget" menu → "Component" option with inline story picker
- Create skill updated with Component path (Steps C1–C4)

### File Migration
- `button-patterns.canvas.jsx` → `button-patterns.story.jsx` (renders at `/components/button-patterns`)
- New `text-input.story.jsx` and `textarea.story.jsx` component stories

### Markdown Widget Improvements
- GitHub Flavored Markdown: bullet lists render with proper `list-style-type`
- Fenced code blocks (```` ```jsx ````) get syntax highlighting via inspector highlighter
- Code blocks follow Code Box theme, use Ioskeley Mono 400, have border and text wrapping
- Resize enabled in both directions (width + height)
- **Copy text** action in overflow menu (UnwrapIcon, `prod: true`)

### Sticky Note Widget
- **Copy text** action in overflow menu (UnwrapIcon, `prod: true`)

### Embed Widget Fixes
- ESC key closes expanded PrototypeEmbed/FigmaEmbed modals (focusable backdrop with direct keydown handler)

### Toolbar / Config
- `/components/` excluded from "New flow", "New page", and Inspector in toolbar config
- `CodeIcon`, `UnwrapIcon` added to WidgetChrome icon registry
- `componentIsolate.jsx` generalized to accept `.story.jsx/.tsx` modules
- Inspector highlighter exported from `@dfosco/storyboard-core/inspector/highlighter`

## Key files changed

| Area | Files |
|------|-------|
| Discovery | `packages/react/src/vite/data-plugin.js` |
| Core loader | `packages/core/src/loader.js`, `packages/core/src/index.js` |
| Routing | `packages/react/src/context.jsx` |
| Story page | `packages/react/src/story/StoryPage.jsx`, `.module.css` |
| Story widget | `packages/react/src/canvas/widgets/StoryWidget.jsx`, `.module.css` |
| Widget chrome | `packages/react/src/canvas/widgets/WidgetChrome.jsx` |
| Widget config | `packages/core/widgets.config.json` |
| Toolbar config | `packages/core/toolbar.config.json` |
| Markdown | `packages/react/src/canvas/widgets/MarkdownBlock.jsx`, `.module.css` |
| Canvas controls | `packages/react/src/canvas/CanvasControls.jsx`, `.module.css` |
| Canvas page | `packages/react/src/canvas/CanvasPage.jsx` |
| Isolate | `packages/react/src/canvas/componentIsolate.jsx` |
| Embeds | `packages/react/src/canvas/widgets/PrototypeEmbed.jsx`, `FigmaEmbed.jsx` |
| CLI | `packages/core/src/cli/create.js`, `canvasAdd.js`, `schemas.js`, `intro.js` |
| Skill | `.github/skills/create/SKILL.md` |
| Vite config | `vite.config.js` |
| Package | `packages/core/package.json` |

## Verification

### Automated
- [x] Story index discovery tests (6 tests)
- [x] Story route inference tests (3 tests)
- [x] Core loader story accessor tests (5 tests)
- [x] All 848 tests pass, build succeeds, lint clean

### Manual
- [x] Story page renders at `/components/textarea` with all exports
- [x] Pasting story URL on canvas creates story widget
- [x] Show code / copy code actions work
- [x] Code box theme follows Inspector setting
- [x] Markdown code blocks render with syntax highlighting
- [x] ESC closes expanded embeds
