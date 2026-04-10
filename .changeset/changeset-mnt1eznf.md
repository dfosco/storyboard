---
"@dfosco/storyboard-core": patch
---

Canvas toolbar and visual refinements

- Adjust toolbar separator width (2px) and height (40px) in CanvasUndoRedo
- Normalize border width to 2px in CanvasZoomControl
- Add strokeWeight/scale meta to zoom-to-objects and snap-to-grid tools
- Reorder canvas toolbar: snap before undo-redo
- Fix canvas title input auto-sizing to content
- Pass config.meta to Icon for strokeWeight/scale on canvas tools
- Fix Primer icon name (apps-icon → apps)
- Split canvas-toolbar into individual tool entries
- Canvas read-only in prod, local editing label, blue dev dots
- Config-driven dropdown menus, widget URLs, copy-link, copy-widget
- Snap-to-grid toggle, undo/redo queue, zoom-to-fit
- Prototype embed navigation with undo/redo
- Image paste, Figma embed widget, viewport persistence
- HMR suppression while canvas is active
- Automatic commit and push tool (autosync)
