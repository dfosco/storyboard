---
"@dfosco/storyboard-core": patch
---

Faster dev server startup (~14.5s → ~7s)

- Batch git metadata calls into 1-2 subprocesses instead of per-file
- Scope glob ignore to skip .worktrees/ and public/ during data file discovery
