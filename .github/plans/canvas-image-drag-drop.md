# Canvas Image Drag & Drop

## Problem Statement

Users cannot drag images from macOS Finder (or other file managers) into the canvas. Currently, adding images requires copying to clipboard and pasting. Drag-and-drop is a more intuitive workflow for many users.

## Approach

Extend the existing image paste infrastructure to also handle file drag-and-drop events. The same upload logic and widget creation code will be reused — only the event source differs.

**Key insight:** The existing `handleImagePaste` function does the heavy lifting:
1. Converts blob to data URL
2. Gets image dimensions  
3. Uploads via `/image` endpoint
4. Creates image widget at viewport center

For drag-and-drop, we need to:
1. Handle `dragover` and `drop` events on the canvas scroll container
2. Extract image files from `dataTransfer.files`
3. Position widget at drop location (not viewport center)
4. Reuse the same upload + widget creation logic

## Files to Change

| File | Change |
|------|--------|
| `packages/react/src/canvas/CanvasPage.jsx` | Add drag/drop handlers, extract shared image processing logic |

## Implementation Steps

### Step 1: Refactor shared image processing

Extract the image processing logic from `handleImagePaste` into a reusable function:
- `processImageFile(file, position)` — converts file to data URL, gets dimensions, uploads, creates widget

### Step 2: Add drag-and-drop event handlers

In the paste/drop useEffect:
- `handleDragOver(e)` — prevent default to allow drop, set visual feedback
- `handleDrop(e)` — extract files, filter images, process each
- `handleDragLeave(e)` — clear visual feedback

### Step 3: Calculate drop position

Convert mouse coordinates from drop event to canvas coordinates:
- Account for scroll position (`scrollRef.current.scrollLeft/Top`)
- Account for zoom level (`zoomRef.current`)
- Snap to grid

### Step 4: Attach event listeners

Add event listeners to the scroll container element:
```js
scrollRef.current.addEventListener('dragover', handleDragOver)
scrollRef.current.addEventListener('drop', handleDrop)
scrollRef.current.addEventListener('dragleave', handleDragLeave)
```

### Step 5: Visual drop feedback (optional)

Add a CSS class or overlay when dragging over the canvas to indicate drop is allowed.

## Edge Cases & Risks

1. **Multiple files dropped** — Process each image sequentially; place them in a row
2. **Non-image files dropped** — Silently ignore (only process image/* MIME types)
3. **Very large images** — Same 5MB limit as paste (server enforces)
4. **Drop position outside visible area** — Use event coordinates, not clamped viewport
5. **Zoom level affects position** — Must divide by scale factor
6. **Production mode** — Drop should only work when `isLocalDev` is true (same as paste)
