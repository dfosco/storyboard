# Slice 05 — Story-Format Widgets (`t06`)

## Goal

Revamp component widgets to consume story exports directly and align with `.story` format conventions.

## Scope

- Add story indexing for story source files.
- Allow canvas widgets to reference/render selected stories.
- Preserve compatibility path for legacy `.canvas.jsx` component widget data.

## Key files

- story index generation surfaces (Vite/plugin paths)
- canvas component widget renderer
- docs/readme sections for story-backed widget references

## Implementation checklist

- [ ] Implement story discovery and metadata indexing.
- [ ] Define widget reference shape (`storyId` or file/export tuple).
- [ ] Render selected story exports in widget runtime.
- [ ] Keep compatibility fallback for existing component widgets.

## Acceptance criteria

- Story-backed widgets render reliably from indexed stories.
- Legacy component widget data still loads (or has explicit migration path).

## Verification

### Automated
- [ ] Story index discovery tests
- [ ] Story selection/render tests
- [ ] Legacy compatibility-path tests

### Agent-browser
- [ ] Insert/select story widget and validate render + drag/select stability

### Manual
- [ ] Story render failures are isolated and user-visible without crashing canvas
