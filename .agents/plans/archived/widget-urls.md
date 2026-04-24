# Widget URLs & Overflow Menu

## Changes

### 1. Widget overflow menu (`...`) in WidgetChrome
- Replace the `delete` feature button with a `...` overflow menu button (rightmost before select handle)
- Menu contains: "Copy link to widget", "Delete widget"
- All other feature buttons (copy, color-picker, open-external, zoom, edit, toggle-private) stay inline

### 2. Widget URLs (`?widget=<id>`)
- Each widget gets a URL: `<canvas-path>?widget=<widget-id>`
- "Copy link to widget" copies this URL to clipboard
- On canvas load, if `?widget=` param exists, center viewport on that widget

### 3. Fix comment URL
- In `mount.js`, when cache hit occurs, still call `autoOpenCommentFromUrl()`

## Files
- `WidgetChrome.jsx` + `.module.css` — overflow menu with `...` trigger
- `CanvasPage.jsx` — widget URL centering on load
- `widgets.config.json` — no change needed (delete stays in features, handled specially in chrome)
- `mount.js` — comment URL fix
