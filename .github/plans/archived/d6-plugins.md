# Potential Storyboard-Core Plugins from d6

> Extracted from [d6](https://github.com/dfosco/d6) — a portfolio site with draggable objects, pen tool, and canvas utilities.

## Plugin Candidates

Ordered from most self-contained to most complex.

### 1. Glitch Effect (`@dfosco/storyboard-plugin-glitch`)

Pure visual transition function — shake, flicker, fade with content-swap callback. Zero dependencies, already a standalone function in d6. Could enhance scene transitions or override animations in storyboard.

- **Source:** `js/glitch.js`
- **Dependencies:** None
- **State:** Stateless (accepts a state object + options per call)
- **Config:** `spread` (px shake range), `steps` (animation ticks)

### 2. Draggable Elements (`@dfosco/storyboard-plugin-draggable`)

Make any storyboard element draggable with position persistence. d6 has two variants:

- **Full:** snap-to-grid, boundary restriction, inertial throw
- **Lite:** drag + animate-back-to-origin, localStorage persistence

State fits naturally into storyboard's hash/localStorage override system instead of raw `data-x`/`data-y` attributes.

- **Source:** `js/draggable.js`, `js/draggable-lite.js`
- **Dependencies:** `interact.js`
- **State:** Position stored as overrides (hash or localStorage)
- **Config:** Grid size, snap toggle, lock toggle, boundary element

### 3. Toolbar / Tool Switcher (`@dfosco/storyboard-plugin-toolbar`)

Floating toolbar with active-tool state management. In d6 it drives cursor/pen/lock/snap/dark-mode/clear. In storyboard, it could be a generic tool-mode switcher that other plugins register tools into (e.g., draggable registers a "move" tool, pen registers a "draw" tool).

- **Source:** `_includes/components/toolbar.liquid`, `_includes/components/toolbutton.liquid`
- **Dependencies:** None (UI only)
- **State:** `current-tool` attribute on body, `toolbutton--active` class
- **Config:** Array of tool definitions (id, icon, tooltip, toggle behavior)

### 4. Dark Mode Toggle (`@dfosco/storyboard-plugin-theme`)

Theme switching (dark/light) with class-based application. Could layer on top of storyboard's existing scene data to persist theme choice as an override.

- **Source:** `js/draggable.js` (dark mode handler within)
- **Dependencies:** None
- **State:** CSS class on body (`.dark-mode` / `.light-mode`)
- **Config:** Class names, default theme, persistence key

### 5. Canvas / Pen Tool (`@dfosco/storyboard-plugin-canvas`)

Paper.js-powered drawing overlay. In d6 it's toolbar-activated and draws on a full-page `<canvas>`. Would depend on the toolbar plugin for tool activation.

- **Source:** `_includes/components/paper-canvas.liquid`, `js/draggable.js` (canvas control)
- **Dependencies:** `paper.js`
- **State:** Canvas drawing state (in-memory); clear via toolbar
- **Config:** Stroke color, stroke width, canvas z-index

### 6. Live Cursors (`@dfosco/storyboard-plugin-cursors`)

Real-time collaborative cursor sharing via Yjs/WebSocket CRDT. Shows other visitors' mouse positions with idle timeout, sparkle effects, and debug modes. Heaviest dependency footprint but self-contained logic. Could make any storyboard prototype feel "multiplayer."

- **Source:** `js/cursors.js`, `css/cursors.css`
- **Dependencies:** `yjs`, `y-websocket`
- **State:** Yjs awareness (CRDT); per-peer cursor map
- **Config:** Room name, WebSocket URL, max visible cursors, idle timeout, throttle interval

## Cross-Cutting Observations

- **Plugins 1–4** are low-dependency and map cleanly to storyboard's existing state model (hash overrides, localStorage).
- **Plugin 5** (canvas) needs an external lib (Paper.js) and a toolbar integration point.
- **Plugin 6** (cursors) is standalone but needs WebSocket infrastructure.
- The **toolbar** could serve as a plugin registry — other plugins register their tools into it, aligning with the planned `setup(ctx)` plugin factory pattern in storyboard's workshop-plugin spec.
