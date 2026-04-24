---
"@dfosco/storyboard-core": patch
---

Fix command palette losing library-provided sections (like add-widget) when client overrides config

- Sections are now merged by `id` instead of replaced wholesale
- Client sections take priority, default sections not in client config are preserved
