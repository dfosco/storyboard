---
"@dfosco/storyboard-core": patch
---

Deterministic server URL for terminal agents and setup scaffolding

- Terminal server uses actual httpServer port instead of ports.json
- `storyboard setup` scaffolds .storyboard/terminals/ and .github/agents/
- ghostty-web moved from optional peer dep to regular dependency
