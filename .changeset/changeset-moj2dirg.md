---
"@dfosco/storyboard-core": patch
---

Fix leaked monorepo imports in storyboard-react

- Replace relative `../../../core/` imports in `data-plugin.js` with proper `@dfosco/storyboard-core/*` package imports
- Add missing dependencies: `cmdk`, `@radix-ui/react-dialog`, `@radix-ui/react-visually-hidden`, `feather-icons`
