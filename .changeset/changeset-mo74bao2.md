---
"@dfosco/storyboard-core": patch
---

Fix terminal crash on posix_spawnp failure

- Catch pty.spawn errors so they don't crash the dev server
- Auto-chmod node-pty spawn-helper at terminal server setup time
