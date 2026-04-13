# Cross-Scene State: Problem Space Exploration

## The Scenario

You're on Scene A (`/Overview#user.name=Alice&sidebar.open=true`). You click a link that takes you to Scene B (`/Settings`). What happens?

---

## Current Behavior (verified from code)

### 1. Hash state carries forward — always

The `hashPreserver.js` intercepts every `<a>` click and every `router.navigate()` call. If the target link has no hash of its own, the current hash is appended wholesale:

```
/Overview#user.name=Alice&sidebar.open=true
  → click <a href="/Settings">
  → /Settings#user.name=Alice&sidebar.open=true
```

The hash travels with you. It's indiscriminate — it doesn't know or care what scene you're going to.

### 2. Scene data swaps, but the hash doesn't know

`StoryboardProvider` re-runs `loadScene()` based on the new route. So Scene B's JSON replaces Scene A's JSON in context. But the hash params (`user.name=Alice`, `sidebar.open=true`) are still sitting in the URL.

### 3. Override resolution against the new scene

Here's where it gets interesting. `useOverride('user.name')` on Scene B will:
- Check hash → finds `Alice` → returns `Alice`
- It **never even looks** at Scene B's default for `user.name`

And `useSceneData('user')` will:
- Check for exact hash match on `user` → none
- Check for child overrides under `user.*` → finds `user.name=Alice`
- Deep-clone Scene B's `user` object and overlay `name=Alice` onto it

**So the override applies to Scene B's data shape, not Scene A's.**

### 4. Scene A's un-overridden defaults are gone

Correct. `loadScene('overview')` is no longer called. Scene A's data is garbage-collected from context. Only Scene B's defaults exist now, plus whatever hash overrides survived the transition.

---

## The Tension Points

### A. Orphaned overrides (noise problem)

Scene A had `sidebar.open=true` as a meaningful override. Scene B might not have a `sidebar` key at all. Now `sidebar.open=true` is a zombie param — it sits in the hash doing nothing, cluttering the URL. If Scene B happens to also have a `sidebar.open` field, the override silently applies even though the user set it in a completely different context.

**Risk**: Unintentional cross-contamination. A value set for one purpose accidentally affects another scene.

### B. Intentional cross-scene state (the stitching use case)

Sometimes you *want* state to carry forward. Imagine a multi-step flow:

- Scene A: User picks a repo → `#repo.name=primer-react`
- Scene B: User configures settings for that repo → needs `repo.name` to display context
- Scene C: Confirmation page → also needs `repo.name`

The current behavior supports this *by accident* — the hash carries forward, and if Scene B/C have a `repo.name` path in their scene data, the override applies. If they don't have it in scene data, components can still read it with `useOverride('repo.name')` and get the hash value (with `undefined` as the scene default fallback).

**This works, but it's implicit.** There's no declaration that "this flow needs `repo.name` to persist." It just happens because nothing clears it.

### C. The "clean slate" question

When should state be cleared? Options:

1. **Never (current behavior)**: Hash persists until the user manually clears it or a link specifies its own hash. Simple, predictable, but accumulates noise.

2. **On scene change**: Clear the hash when `activeSceneName` changes. Clean, but breaks multi-scene flows entirely.

3. **Selective clearing — scene-scoped vs. flow-scoped params**: Some params belong to a scene, others belong to a flow. This is the most powerful but requires a new concept (param scoping/namespacing).

4. **Opt-in carry-forward**: Default to clearing, but let scene files or links declare which params should survive. E.g., `<a href="/Settings" data-carry="repo.name,user.id">`.

### D. Scene default data as "context loss"

You correctly identified this: Scene A's *un-overridden* defaults vanish. If Scene A had `user.avatar=https://...` and Scene B doesn't have a `user` object at all, then on Scene B, `useSceneData('user.avatar')` returns `{}` (with a console warning). The override for `user.name=Alice` survives, but `user.avatar` is gone.

This is the core of the stitching problem: **overrides are fragments, not complete objects**. They only carry the deltas, not the full context from the previous scene.

---

## Deep Dive: Angle 7 — Scene Export (Composition Model)

### The Core Idea (revised from discussion)

When you navigate away from Scene A, its **fully resolved data** (scene defaults + hash overrides applied) is flattened into the URL hash under a scene-name prefix. No new hooks, no new stores. The exported data flows through the existing system — it's readable with  and , overridable like anything else, and shareable via URL.

It's composition: the previous scene's data becomes a namespaced object in the hash, just like  or  would be if they were data objects. It's just named after the scene it came from.

Key properties:
- **Automatic on departure**: Resolved scene data is flattened into the hash under the scene name prefix.
- **Namespaced**: Scene A's  becomes  in the hash.
- **No new APIs**:  and  work as-is.
- **Opt-out via **:  prevents export. Default is .

### Walkthrough



### Why This Is Composition

There's no parent/child relationship, no class hierarchy. Scene A's data was exported as a namespaced object in the hash. Scene B (or any scene) reads it using existing data access patterns. It's the same as if you had a  object named  — except this one was created dynamically from the previous scene's resolved state.

### The  Flag



 is scene metadata — stripped during  resolution (like  is today). declare -x COLORTERM="truecolor"
declare -x COMMAND_MODE="unix2003"
declare -x CURRENT_HUE_INDEX="7"
declare -x EDITOR="nvim"
declare -x GHOSTTY_BIN_DIR="/Applications/Ghostty.app/Contents/MacOS"
declare -x GHOSTTY_RESOURCES_DIR="/Applications/Ghostty.app/Contents/Resources/ghostty"
declare -x GHOSTTY_SHELL_FEATURES="path,title"
declare -x HOME="/Users/dfosco"
declare -x HOMEBREW_CELLAR="/opt/homebrew/Cellar"
declare -x HOMEBREW_PREFIX="/opt/homebrew"
declare -x HOMEBREW_REPOSITORY="/opt/homebrew"
declare -x INFOPATH="/opt/homebrew/share/info:"
declare -x LANG="en_US.UTF-8"
declare -x LOGNAME="dfosco"
declare -x LaunchInstanceID="C6BE26C1-ABC0-4C86-9EEF-6FC0453F8C39"
declare -x MANPATH=":/usr/share/man:/usr/local/share/man:/Applications/Ghostty.app/Contents/Resources/ghostty/../man:"
declare -x OLDPWD="/Users/dfosco/Workspace/storyboard-core"
declare -x OSLogRateLimit="64"
declare -x PATH="/Users/dfosco/.local/bin:/Users/dfosco/.bun/bin:/usr/local/opt/python/libexec/bin:/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/opt/pmk/env/global/bin:/Applications/VMware Fusion.app/Contents/Public:/Applications/Ghostty.app/Contents/MacOS"
declare -x PWD="/Users/dfosco/workspace/storyboard-core"
declare -x SECURITYSESSIONID="18754"
declare -x SHELL="/bin/zsh"
declare -x SHLVL="2"
declare -x SP_BG_DARK="#604839"
declare -x SP_BG_DARKER="#362b21"
declare -x SP_BG_DARKEST="#221c18"
declare -x SP_PRIMARY="#d2b8a3"
declare -x SP_SECONDARY="#f09d76"
declare -x SSH_AUTH_SOCK="/private/tmp/com.apple.launchd.7e924LnXUG/Listeners"
declare -x STARSHIP_CONFIG="/tmp/starship-503-94292.toml"
declare -x STARSHIP_SESSION_KEY="1784747125171156"
declare -x STARSHIP_SHELL="zsh"
declare -x TERM="xterm-color"
declare -x TERMINFO="/Applications/Ghostty.app/Contents/Resources/terminfo"
declare -x TERM_PROGRAM="ghostty"
declare -x TERM_PROGRAM_VERSION="1.2.3"
declare -x TMPDIR="/var/folders/5b/kbp7_tjs7l5d3c1wv8y05hvm0000gq/T/"
declare -x USER="dfosco"
declare -x VISUAL="nvim"
declare -x XDG_DATA_DIRS="/usr/local/share:/usr/share:/Applications/Ghostty.app/Contents/Resources/ghostty/.."
declare -x XPC_FLAGS="0x0"
declare -x XPC_SERVICE_NAME="0"
declare -x __CFBundleIdentifier="com.mitchellh.ghostty"
declare -x __CF_USER_TEXT_ENCODING="0x1F7:0x0:0x0" defaults to . Set to  for:
- Scenes with sensitive mock data
- Dead-end scenes (error pages)
- Scenes whose data is meaningless elsewhere

### How the Hash Transform Works

On navigation departure, the hash preserver:

1. **Reads the current scene name** (needs access to active scene context)
2. **Checks ** — if , skip
3. **Resolves full scene state**: scene defaults + hash overrides merged
4. **Flattens** the resolved object into hash params under the scene name prefix
5. **Strips unprefixed params** (they're now captured under the prefix)
6. **Keeps already-prefixed params** from earlier scenes (e.g., )
7. **Navigates** with the transformed hash

### The One Code Change Needed

 currently requires a scene default to exist before it will merge child overrides. When reading exported data from a previous scene (e.g., ), Scene B won't have an  key in its scene data — but the hash WILL have  params.

Current code bails out:


Fix: Build object from hash params alone when no scene default exists:


This is the **only change** to existing hooks. Everything else is new logic in the hash preserver.

### Lifecycle: Multiple Scene Exports



Each scene's export is namespaced — no collisions between  and .

### Navigate Back: What Happens?

If the user goes back to /Overview from /Settings:

1. Settings' resolved data gets exported as 
2. Overview loads fresh from its scene file
3. Hash still has  params from the first export
4.  checks hash for  → not found (it's  now)
5. Falls back to scene default → "Default"

**Correct behavior.** Coming back = fresh start. Previous state is archived under the prefix, accessible explicitly if needed, but doesn't auto-apply. If you navigate away again, the  slot is overwritten with the new export.

### Hash Size

Flattening entire scenes into the URL could produce long URLs. Mitigations:
- Most prototype scenes are small (5-15 keys)
- Modern browsers support ~64K URLs
-  lets authors opt out for large/irrelevant scenes
- Future:  for selective export (not V1)

### What This Model Solves

| Problem | Solved? |
|---------|---------|
| Context loss (previous scene defaults unavailable) | ✅ Full resolved data available via  |
| Orphaned overrides (unprefixed params from Scene A on Scene B) | ✅ Unprefixed params stripped on departure |
| Cross-contamination (Scene A override accidentally affects Scene B) | ✅ Everything namespaced |
| URL shareability | ✅ Everything in the hash |
| New APIs to learn | ✅ None — existing  and  |

### What This Doesn't Solve (yet)

- **Selective export**: Entire scene is exported. Future: partial export via array.
- **Type coercion**: Hash params are strings.  is string . Existing limitation, not new.

## Deep Dive: Angle 2 — Flow State vs. Scene State

### The Core Idea

Split URL hash params into two categories:
- **Scene-scoped**: Belong to the current scene. Cleared when navigating away.
- **Flow-scoped**: Belong to a multi-scene flow. Persist across scene transitions.

### How the System Currently Works (Mechanics)

The hash is a flat key-value store in `session.js` — `getParam(key)`, `setParam(key, value)`, `getAllParams()`. There is no metadata about params — no ownership, no scope, no origin. The `hashPreserver.js` carries all params forward indiscriminately.

In hide mode, the history stack in `hideMode.js` stores snapshots as `[position, route, paramString]`. It already tracks which route a snapshot belongs to — but only for undo/redo, not for scoping. This is an interesting existing primitive to build on.

### Sub-angle 2a: Naming Convention (`flow.` prefix)

The simplest approach: params prefixed with `flow.` persist, everything else is scene-scoped.

```
#sidebar.open=true&flow.repo.name=primer-react
  → navigate to /Settings
  → #flow.repo.name=primer-react  (sidebar.open stripped)
```

**Implementation**: Modify `hashPreserver.js` to filter params on navigation:

```js
// In the <a> click handler and router.navigate wrapper:
const currentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
const flowParams = new URLSearchParams()
for (const [key, value] of currentParams.entries()) {
  if (key.startsWith('flow.')) flowParams.set(key, value)
}
const hash = flowParams.toString() ? '#' + flowParams.toString() : ''
```

**Reading flow params**: `useOverride('flow.repo.name')` and `useSceneData('flow.repo.name')` would work as-is — the hash param exists, the resolution logic doesn't care about prefixes.

But there's a problem: scene data doesn't naturally have `flow.*` keys. So `useOverride('flow.repo.name')` would have no scene default to fall back to. The value is *purely* hash-driven. That's actually fine for flow state — it's inherently dynamic and doesn't come from a scene file.

**Authoring experience**: When building a page, you'd write:

```jsx
// Page A: set a flow param
const [, setRepo] = useOverride('flow.repo.name')
setRepo('primer-react')

// Page B: read the flow param
const [repoName] = useOverride('flow.repo.name')
// repoName = 'primer-react' (carried from Page A)
```

**Pros**:
- Zero new APIs. Works with existing `useOverride`.
- Visually obvious in the URL which params are flow-scoped.
- Trivial to implement — one filter in `hashPreserver.js`.
- Backwards compatible — existing prototypes with no `flow.` params behave identically.

**Cons**:
- Clutters the data model with a naming convention (`flow.repo.name` vs. `repo.name`).
- Scene data can't have defaults for flow params (unless scenes also use the `flow.` prefix in their JSON, which is weird).
- The convention is "invisible" — nothing enforces it. A typo (`flwo.repo.name`) silently becomes scene-scoped and gets cleared.

### Sub-angle 2b: Scene-Level Declaration (`$flow` key)

Scene files declare which params are flow-scoped:

```json
// overview.scene.json
{
  "$flow": ["repo.name", "user.id"],
  "sidebar": { "open": false },
  "repo": { "name": "default-repo" }
}
```

On navigation, `hashPreserver.js` reads the **current** scene's `$flow` declaration and only carries those params forward.

**Implementation**: More involved — the hash preserver needs access to the scene data index:

```js
// hashPreserver.js would need to import from core:
import { getCurrentSceneFlow } from '@dfosco/storyboard-core'

// On navigation:
const flowKeys = getCurrentSceneFlow() // reads $flow from active scene
const currentParams = getAllParams()
const carried = {}
for (const key of flowKeys) {
  if (currentParams[key] !== undefined) carried[key] = currentParams[key]
}
```

**This inverts the mental model**: instead of "what does the target accept?" (Angle 3 from the original), it's "what does the source emit?" The sending scene decides what's important enough to carry forward. This makes sense — the current scene knows what state the user has been building up.

**Pros**:
- Explicit and self-documenting.
- Scene files become contracts: "I produce these flow outputs."
- No naming convention pollution — `repo.name` is `repo.name` everywhere.
- Scene defaults work normally for flow params while on that scene.

**Cons**:
- Requires scene authors to think ahead about cross-scene flows.
- The hash preserver gains a dependency on the data index (currently it's framework-agnostic and doesn't know about scenes).
- What if both scenes declare `repo.name` as flow? Does it carry through Scene B → Scene C? Probably yes, but it needs to be clear.

### Sub-angle 2c: `useFlowState` Hook (New API)

Instead of overloading the hash, introduce a separate storage mechanism for flow state. Flow state lives in `sessionStorage` (or a dedicated localStorage namespace), not in the URL hash.

```jsx
// New hook:
const [repoName, setRepoName] = useFlowState('repo.name')

// vs. existing:
const [sidebarOpen, setSidebarOpen] = useOverride('sidebar.open')
```

Flow state doesn't need scene defaults — it's a pure key-value store across the session. It's not in the URL at all, so it never contaminates the hash and doesn't need filtering on navigation.

**Implementation**: A thin wrapper around `sessionStorage` with a subscription model (similar to `subscribeToHash` / `subscribeToStorage`):

```js
// core/flowState.js
export function getFlowParam(key) { ... }
export function setFlowParam(key, value) { ... }
export function clearFlow() { ... }  // wipe all flow state (start fresh)

// react/hooks/useFlowState.js
export function useFlowState(key) {
  // useSyncExternalStore with sessionStorage subscription
  // Returns [value, setValue, clearValue]
}
```

**Pros**:
- Clean separation of concerns — flow state and scene overrides are different things stored differently.
- URL hash stays clean and scene-specific.
- No scene-level declarations needed — flow state is purely a component/page concern.
- `clearFlow()` provides a natural "end of flow" boundary.

**Cons**:
- New concept and API to learn.
- Not visible in the URL — harder to debug. (Though DevTools could surface it.)
- Doesn't solve the "carry scene defaults forward" problem — it only carries explicit values.
- sessionStorage is tab-scoped, which is usually fine but differs from hash behavior.

### Sub-angle 2d: Hybrid — `useOverride` Gains a `scope` Option

Extend the existing `useOverride` API with an optional scope parameter:

```jsx
// Scene-scoped (default, current behavior)
const [sidebar, setSidebar] = useOverride('sidebar.open')

// Flow-scoped (persists across scenes)
const [repo, setRepo] = useOverride('repo.name', { scope: 'flow' })
```

Under the hood, flow-scoped params get a prefix or a separate storage bucket. The `hashPreserver` strips non-flow params on navigation. This is 2a with a nicer API.

**Implementation**: `useOverride` writes flow-scoped params with a `_flow:` prefix in the hash (or to sessionStorage). The prefix is stripped when reading:

```
URL: /Overview#sidebar.open=true&_flow:repo.name=primer-react
  → navigate to /Settings
  → /Settings#_flow:repo.name=primer-react
```

Or cleaner: two separate "zones" in the hash using a delimiter:

```
/Overview#sidebar.open=true||repo.name=primer-react
  ↑ scene-scoped           ↑ flow-scoped
```

**Pros**: Single API surface. Minimal new concepts.
**Cons**: Hash encoding gets more complex. Two zones in one hash string is fragile.

### Verdict on Angle 2

**2c (`useFlowState` hook) is the cleanest separation** but introduces a new concept and doesn't help with scene default carryover.

**2a (`flow.` prefix) is the simplest to implement** and requires zero API changes, but it's a naming convention — fragile and convention-dependent.

**2b (`$flow` in scene files) is the most intentional** but introduces coupling between the hash preserver and the data system.

**2d (scope option on `useOverride`) is the best DX** — it keeps one API surface and makes the distinction explicit in code without naming conventions.

The deeper question is: **should flow state live in the URL at all?** If it does, it's shareable (copy URL → paste → same flow state). If it doesn't (sessionStorage), it's cleaner but not shareable. For a prototyping tool, URL shareability might be important.

---

## Deep Dive: Angle 6 — Scene Stacking / Layered Context

### The Core Idea

Instead of replacing Scene A's data with Scene B's when navigating, **keep Scene A's data as a fallback layer**. Resolution becomes:

```
hash override → Scene B (current) → Scene A (previous) → Scene C (even earlier) → undefined
```

This directly solves the "context loss" problem: Scene A's `user.avatar` is still available on Scene B even though Scene B doesn't define it, because the scene stack remembers it.

### How It Would Work Mechanically

#### The Scene Stack

A new data structure — the **scene stack** — holds the ordered list of scenes the user has visited. Stored in sessionStorage or a module-level variable:

```js
// core/sceneStack.js
let stack = []  // ['overview', 'settings', 'confirmation']

export function pushScene(name) {
  if (stack[stack.length - 1] !== name) stack.push(name)
}
export function getStack() { return [...stack] }
export function resetStack() { stack = [] }
```

#### Modified Scene Loading

`StoryboardProvider` loads the current scene AND all stacked scenes, then merges them bottom-up:

```jsx
// context.jsx (modified)
const { data, error } = useMemo(() => {
  const stack = getStack()
  let mergedData = {}

  // Merge from oldest to newest — later scenes override earlier ones
  for (const sceneName of stack) {
    try {
      const sceneData = loadScene(sceneName)
      mergedData = deepMerge(mergedData, sceneData)
    } catch { /* skip missing scenes */ }
  }

  // Current scene always on top
  const currentData = loadScene(activeSceneName)
  mergedData = deepMerge(mergedData, currentData)

  return { data: mergedData, error: null }
}, [activeSceneName, /* stack hash */])
```

#### Resolution Example

```
Scene A (overview.scene.json):
  { user: { name: "Default", avatar: "https://avatar.jpg", role: "viewer" }, sidebar: { open: false } }

Scene B (settings.scene.json):
  { user: { name: "Default", role: "admin" }, theme: "dark" }

Stack after navigating A → B: ['overview', 'settings']

Merged data:
  {
    user: { name: "Default", avatar: "https://avatar.jpg", role: "admin" },  // ← avatar from A, role from B
    sidebar: { open: false },   // ← carried from A (B doesn't override it)
    theme: "dark"               // ← from B only
  }

Hash: #user.name=Alice

useSceneData('user') →
  { name: "Alice", avatar: "https://avatar.jpg", role: "admin" }
  // name from hash, avatar from stack (Scene A), role from Scene B
```

**This is powerful.** The user's journey accumulates context naturally.

### The Hard Problems

#### Problem 1: When Does the Stack Reset?

If the user visits 15 pages, are all 15 scenes stacked? That would be absurd — old scene data would leak into unrelated pages.

**Option A: Explicit flow boundaries.** A scene or link declares "start new flow" which resets the stack:

```json
// settings.scene.json
{ "$flowStart": true, "theme": "dark" }
```

Or on a link: `<a href="/Settings" data-sb-reset>`.

**Option B: Depth limit.** Only the last N scenes are stacked (e.g., N=3). Oldest scenes fall off.

**Option C: Route-tree scoping.** Only scenes within the same route subtree stack. `/repos/overview` and `/repos/settings` share a stack, but navigating to `/profile` resets it. This maps well to nested layouts.

**Option D: The stack is opt-in.** By default, scenes don't stack — you get current behavior. A scene declares `$extends: "overview"` to explicitly layer on top of another scene's data:

```json
// settings.scene.json
{
  "$extends": "overview",
  "theme": "dark",
  "user": { "role": "admin" }
}
```

This is like class inheritance — static, declared at authoring time, not dependent on the user's navigation path.

#### Problem 2: Conflicting Keys

Scene A: `{ user: { role: "viewer" } }`
Scene B: `{ user: { role: "admin" } }`

Deep merge gives Scene B priority ("admin"). But what if the user overrode `role` on Scene A to "editor" via the hash? Now we have:

- Hash: `user.role=editor` (set on Scene A)
- Scene B default: `user.role=admin`
- Scene A default: `user.role=viewer`

Current behavior: hash wins → "editor". With stacking, hash still wins → "editor". **No conflict here — hash always wins regardless of stacking.** The conflict only matters when there's no hash override, in which case Scene B (top of stack) wins. That's correct and intuitive.

But there's a subtler issue: what if the user set `user.role=editor` on Scene A, then navigated to Scene B where the *intended* default is "admin"? The hash override from Scene A is now masking Scene B's intentional default. This is the same cross-contamination problem from the original Tension Point A — stacking doesn't fix it, because hash overrides are still global.

**Stacking solves the defaults problem but NOT the overrides problem.** These are orthogonal.

#### Problem 3: Array Merging

Deep merge replaces arrays (per `loader.js` line 8: "Arrays are replaced, not concatenated"). So if Scene A has `repositories: [...]` and Scene B also has `repositories: [...]`, Scene B's array completely replaces Scene A's. This is probably the right behavior — you don't want repository lists concatenating across scenes.

But if Scene B doesn't have `repositories` at all, Scene A's list carries through. This is the desired behavior for the stitching use case.

#### Problem 4: The `$extends` Variant (Static Stacking)

Instead of runtime navigation-based stacking, scenes could declare inheritance statically:

```json
// settings.scene.json
{
  "$extends": "overview",
  "user": { "role": "admin" },
  "theme": "dark"
}
```

`loadScene('settings')` would:
1. Load `overview.scene.json` → resolve its `$global` and `$ref`
2. Load `settings.scene.json` → resolve its `$global` and `$ref`
3. Deep merge: `overview` as base, `settings` on top

**This is implementable entirely within `loadScene()` in `loader.js`.** No changes to the React layer, no stack management, no navigation concerns.

```js
// loader.js addition:
export function loadScene(sceneName = 'default') {
  let sceneData = structuredClone(loadDataFile(sceneName, 'scenes'))

  // Handle $extends: load parent scene(s) as base layer
  if (sceneData.$extends) {
    const parentName = sceneData.$extends
    delete sceneData.$extends
    const parentData = loadScene(parentName) // recursive — supports chains
    sceneData = deepMerge(parentData, sceneData)
  }

  // ... existing $global and $ref handling ...
}
```

**This is actually very close to how `$global` works**, but for entire scenes instead of objects. The difference:
- `$global` merges objects into the current scene (scene wins)
- `$extends` merges a parent scene under the current scene (current wins)

It's familiar, declarative, and doesn't require any runtime state management.

#### Problem 5: Navigation-Based vs. Authoring-Based

The original question was about what happens when a user *navigates* between scenes at runtime. `$extends` is an authoring-time solution — the scene author decides the inheritance chain when writing the JSON files.

Navigation-based stacking is more dynamic: the stack depends on how the user got to the current page. Going `/A → /B → /C` produces a different stack than going directly to `/C`.

**Do you need this dynamism?** For prototyping flows (wizard, onboarding, checkout), the steps are usually known in advance. `$extends` works fine — each step's scene explicitly builds on the previous one's data. The scene author controls the flow.

Navigation-based stacking would be needed if the same page can be reached from multiple paths and needs different context depending on the path. In a prototyping tool, this is rare — you typically control the navigation flow.

### Stacking Variants Summary

| Variant | Complexity | Solves Context Loss | Flow Control | Requires Runtime State |
|---------|-----------|--------------------|--------------|-----------------------|
| Navigation stack (auto) | High | Yes | Implicit (visit order) | Yes (sessionStorage) |
| Navigation stack + reset | High | Yes | Explicit boundaries | Yes |
| Route-tree scoping | Medium | Partially | Implicit (URL structure) | Yes |
| `$extends` (static) | Low | Yes | Explicit (authored) | No |

### Verdict on Angle 6

**`$extends` is the practical winner.** It solves the core problem (context loss between scenes) with minimal complexity:
- Pure data-layer change in `loader.js` — ~10 lines of code
- No runtime state, no stack management, no navigation changes
- Familiar pattern (like `$global` but for scenes)
- Scene authors explicitly control inheritance — no surprises
- Works with or without hash overrides
- Supports chains: `C extends B extends A`

The limitation is it's static — you author the inheritance, you don't get it "for free" by navigating. But for a prototyping tool where you control the data files, that's arguably a feature, not a bug. If Scene C needs data from Scene A, the scene author says so explicitly.

**Navigation-based stacking is more magical but harder to reason about.** The stack depends on the user's path, which makes it unpredictable in testing and debugging. For a prototyping tool, predictability is more valuable than magic.

---

## Synthesis

### The Scene Export model (Angle 7) is the primary direction

It solves the three core problems with zero new APIs:

| Problem | How Scene Export solves it |
|---------|--------------------------|
| **Context loss** | Full resolved scene data available via `sceneName.path` |
| **Orphaned overrides** | Unprefixed params stripped on departure — only namespaced exports persist |
| **Cross-contamination** | Everything namespaced by scene name — `overview.user.name` can't collide with Scene B's `user.name` |

The composition model is the right fit: no inheritance, no new hooks, no separate stores. Previous scene data is just another namespaced object in the hash, accessed with existing `useSceneData` and `useOverride`.

### Implementation scope

1. **`$meta` support in `loadScene()`** — strip `$meta` key during resolution, expose it for the hash preserver to check `export` flag
2. **Hash transform in `hashPreserver.js`** — on departure: resolve scene data + overrides, flatten under scene prefix, strip unprefixed params, navigate
3. **Fix `useSceneData`** — build objects from hash child params even when no scene default exists (~3 lines)
4. **Access to current resolved state** — the hash preserver needs to read the current scene's resolved data (module-level getter from context)

### Angles 2 and 6 are deferred

- **Angle 2 (flow state scoping)**: Scene Export already solves the orphaned override problem via prefixing/stripping. If a need for explicit flow-scoped params emerges beyond what scene export provides, revisit.
- **Angle 6 (`$extends` / scene stacking)**: Static scene inheritance could complement scene export for authored base data. Lower priority — scene export handles the runtime case which is more pressing.

---

## No Implementation Todos

This is a pure exploration document. No code changes proposed.
