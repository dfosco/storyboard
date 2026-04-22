# Notification Success System

## Problem

After creating a canvas or prototype, Vite triggers a full-reload (new files = new routes). The current canvas creation uses a `?redirect=` URL param + `index.jsx` handler to navigate after reload. Prototype creation uses a naive `setTimeout` redirect. Both are fragile.

## Approach

Create a lightweight notification system using a `?created=` URL param that:
1. Survives Vite's full-reload (it's in the URL)  
2. Redirects to the new route after reload  
3. Shows a brief success toast once the page loads at the new route  

The system is general-purpose — any workshop feature can use it.

## Implementation

### 1. Shared redirect utility

Create `packages/core/src/workshop/redirect.js`:
- `setCreatedRedirect(route)` — sets `?created=<route>` on the current URL via `replaceState`
- Used by both `CreateCanvasForm` and `CreatePrototypeForm`

### 2. Update `src/index.jsx` redirect handler

- Rename `?redirect=` → `?created=` for consistency
- After redirecting, set a `?created-success=1` param on the target URL so the app knows to show a toast

### 3. Create a `SuccessToast` Svelte component

Create `packages/core/src/workshop/ui/SuccessToast.svelte`:
- A small fixed-position toast at the bottom-center
- Reads `?created-success=1` from URL, shows "Canvas created" or "Prototype created" message
- Auto-dismisses after 3 seconds with a fade-out
- Cleans the param from URL on mount

### 4. Mount the toast in the server plugin

Add `SuccessToast` to the HTML injection in `server-plugin.js transformIndexHtml`, or mount it alongside the CoreUIBar.

### 5. Update creation forms

- **CreateCanvasForm**: replace current `?redirect=` logic with `setCreatedRedirect(data.route)`
- **CreatePrototypeForm**: replace `setTimeout` redirect with `setCreatedRedirect(data.route)`

## Files to change

| File | Change |
|------|--------|
| `packages/core/src/workshop/redirect.js` | **New** — shared redirect utility |
| `packages/core/src/workshop/ui/SuccessToast.svelte` | **New** — toast component |
| `packages/core/src/workshop/ui/mount.ts` | Mount SuccessToast |
| `packages/core/src/workshop/features/createCanvas/CreateCanvasForm.svelte` | Use `setCreatedRedirect()` |
| `packages/core/src/workshop/features/createPrototype/CreatePrototypeForm.svelte` | Use `setCreatedRedirect()` instead of setTimeout |
| `src/index.jsx` | Read `?created=`, redirect, pass success signal |
