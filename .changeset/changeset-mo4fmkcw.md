---
"@dfosco/storyboard-core": patch
---

Fix prod 404s for fonts, canvas API, and private images

- Fix font paths to resolve from repo root assets/fonts/
- Skip canvas server API fetch in production builds
- Hide private images in prod (not included in dist)
