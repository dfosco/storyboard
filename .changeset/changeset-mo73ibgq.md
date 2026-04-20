---
"@dfosco/storyboard-core": patch
---

Fix terminal widgets not connecting in client repos

- Move ghostty-web from optional peerDependency to regular dependency in @dfosco/storyboard-react
- Remove @vite-ignore from dynamic import so Vite resolves ghostty-web normally
- Terminal widgets now work out of the box without clients manually installing ghostty-web
