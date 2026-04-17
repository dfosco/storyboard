---
"@dfosco/storyboard-core": minor
---

Multi-repo dev server support, branch switching API, and link-preview redesign

- feat: scope storyboard server by devDomain — multiple repos can run simultaneously
- feat: BranchBar uses switch-branch API in dev mode
- feat: redesign plain link-preview card with editable title and OG image
- fix: always fetch live branch list from API
- fix: add @base-ui/react dependency to storyboard-react package
- fix: duplicate SERVER_PORT export, add disabled tool support
