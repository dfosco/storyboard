# `packages/react/src/hashPreserver.js`

<!--
source: packages/react/src/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Preserves URL hash parameters across all client-side navigations — both `<a>` link clicks and programmatic `router.navigate()` calls. Hash params carry storyboard override state (`#user.name=Alice`), so losing them on navigation would reset all overrides. Also intercepts `?hide` and `?show` query params on every navigation via core's `interceptHideParams`.

## Composition

**Named export:** `installHashPreserver(router, basename = '')`

Two interception strategies:

1. **Click handler** (document-level): Intercepts `<a>` clicks on same-origin links, prevents default navigation, calls `router.navigate()` with the current hash carried forward. Skips external links, `_blank` targets, and modifier-key clicks.

2. **Navigate monkey-patch**: Wraps `router.navigate` to append the current hash to any target string that doesn't already contain a `#` fragment.

```js
// Click handler carries hash forward
router.navigate(pathname + targetUrl.search + hash)

// Programmatic navigate appends hash
router.navigate = (to, opts) => {
  if (hasCurrentHash && typeof to === 'string' && !to.includes('#')) {
    to = to + currentHash
  }
  return originalNavigate(to, opts)
}
```

## Dependencies

- `@dfosco/storyboard-core` — `interceptHideParams`

## Dependents

- [`packages/react/src/index.js`](./index.js.md) — re-exports `installHashPreserver`
- `src/index.jsx` — calls it at app startup with the router instance

## Notes

Hash is NOT preserved when the target already has its own `#` fragment. The basename stripping ensures correct path resolution under branch deploys (e.g. `/branch--feature/storyboard/`).
