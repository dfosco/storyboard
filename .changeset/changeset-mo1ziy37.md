---
"@dfosco/storyboard-core": patch
---

Fix iframe auto-mount on canvas load when snapshots are missing

- Don't auto-mount iframes for snapshot refresh when no snapshot exists
- Hide rename-watcher startup notice from dev server output
