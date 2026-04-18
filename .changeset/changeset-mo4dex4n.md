---
"@dfosco/storyboard-core": minor
---

Fix canvas title bar and branch bar not rendering on client deployments

- Always show canvas title text regardless of sibling page count
- Mount Svelte BranchBar from CoreUIBar so branch indicator renders in production builds
