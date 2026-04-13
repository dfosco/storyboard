---
"@dfosco/storyboard-core": minor
---

Fix GH Pages 404s caused by CNAME deletion on deploy

- Emit CNAME file during Vite build when `customDomain` is set in storyboard.config.json
- Scaffold deploy.yml and customDomain config field for new client repos
- Expanded CLI: create commands with flag support, canvas skill, getting-started help
- Autosync refactored to direct commit strategy (no worktree)
- Caddy proxy uses admin API for multi-repo route isolation
- Rename watcher for canvas embed URL sync
- Default hideFlows to true for flow files
