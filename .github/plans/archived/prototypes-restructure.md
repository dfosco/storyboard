# Prototypes Restructure

Prerequisite work that unlocks Workshop features and Modes. Establishes the canonical hierarchy: **Storyboard → Prototype → Flow**.

---

## Phase 1: Rename pages → prototypes ✅

- [x] Configure generouted to use `src/prototypes/` instead of `src/pages/`
- [x] Move all files from `src/pages/` to `src/prototypes/`
- [x] Update Viewfinder glob and path-stripping logic (`/src/pages/` → `/src/prototypes/`)
- [x] Update `vite.config.js` warmup glob
- [x] Update Workshop `createPage` server to write to `src/prototypes/`

## Phase 2: Rename scenes → flows ✅

- [x] Change data plugin suffixes: `.scene.json` → `.flow.json` (glob, regex, index keys)
- [x] Rename loader functions: `loadScene` → `loadFlow`, `sceneExists` → `flowExists`
- [x] Rename hooks: `useSceneData` → `useFlowData`, `useScene` → `useFlow`
- [x] Rename context: `sceneName` → `flowName`, `StoryboardProvider` scene props
- [x] Rename existing data files (`default.scene.json` → `default.flow.json`, etc.)
- [x] Keep supporting `name.scene.json` indefinitely as if it was `name.flow.json`
- [x] Update Workshop `createPage` to generate `.flow.json` instead of `.scene.json`
- [x] Update all core utilities (bodyClasses, sceneDebug, viewfinder, devtools)
- [x] Update public exports with new names + deprecated aliases
- [x] Update all 390 tests — pass with both new and deprecated APIs

## Phase 3: Scoped data — prototype-prefixed global index

Flows and records scoped to prototypes; objects stay global.

### Problem

All data files are globally unique by name+suffix. Multiple prototypes wanting `default.flow.json` or `posts.record.json` would clash.

### Design: prototype-prefixed flat index

All data lives in one **flat global index**. The data plugin prefixes flow/record names with the prototype directory name:

```
src/prototypes/Dashboard/signup.flow.json   → flow key: "Dashboard/signup"
src/prototypes/Blog/signup.flow.json        → flow key: "Blog/signup"
src/data/default.flow.json                  → flow key: "default" (no prefix)
src/data/posts.record.json                  → record key: "posts" (no prefix)
src/prototypes/Dashboard/stats.record.json  → record key: "Dashboard/stats"
src/data/jane-doe.object.json              → object key: "jane-doe" (objects never prefixed)
src/prototypes/Dashboard/helpers.object.json→ object key: "helpers" (objects never prefixed)
```

**Rules:**
1. Flows and records inside `src/prototypes/{Name}/` get prefixed: `{Name}/{filename}`
2. Objects are never prefixed — always global regardless of location
3. Files outside prototype dirs (e.g. `src/data/`) keep their plain name
4. The index is flat — no nested structure

### Local aliasing within a prototype

When StoryboardProvider knows the current prototype (from the route), it aliases away the prefix:

- Route `/Dashboard` → prototype = `Dashboard`
- `?scene=signup` resolves to flow `Dashboard/signup` in the index
- `?scene=default` resolves to `Dashboard/default` first; if not found, tries global `default`
- `?scene=Blog/signup` resolves to `Blog/signup` (explicit cross-prototype access)

Same for records:
- `useRecord('stats')` on `/Dashboard` → resolves `Dashboard/stats`
- `useRecord('Blog/posts')` → explicit cross-prototype access
- `useRecord('posts')` with no scoped match → falls back to global `posts`

**Data access unchanged** — `useFlowData('user.name')` still accesses a path in the currently loaded flow. Scoping only affects which flow gets loaded.

### Tradeoffs

**Pros:**
- **No collisions** — prototype prefix guarantees uniqueness
- **Simple mental model** — one flat index, slash-prefixed keys
- **Transparent within prototypes** — provider aliases prefix away
- **Cross-prototype access** — explicit full-name access always works
- **Objects stay shared** — `$ref` works unchanged
- **Backward compatible** — global files in `src/data/` keep working

**Cons:**
- **Flat prototypes can't scope** — `Example.jsx` (no subdirectory) has no namespace. Must become `Example/Example.jsx` to get scoping.
- **Resolution has one fallback** — local alias tries `{Proto}/{name}` first, then global `{name}`. Need to make sure this is predictable and debuggable.

### Delimiter: slash, not dot

| | Dot (`Dashboard.signup`) | Slash (`Dashboard/signup`) |
|---|---|---|
| Mirrors file paths | ❌ | ✅ |
| Conflicts with dot-notation | ⚠️ possible confusion | ❌ clear separation |
| URL-safe in `?scene=` | ✅ | ⚠️ needs encoding |
| Reads naturally | ✅ | ✅ |

**Decision: slash** — matches file system hierarchy, no dot-notation confusion.

### Implementation

#### Data plugin (`packages/react/src/vite/data-plugin.js`)
- `parseDataFile()` gains `scope` field based on file location relative to `src/prototypes/`
- For flows/records inside `src/prototypes/{Name}/`: key = `{Name}/{filename}`
- For objects: always plain name regardless of location
- Uniqueness check stays global on the full key

#### Core loader (`packages/core/src/loader.js`)
- `loadFlow(name)` unchanged — flat lookup by full key
- New export: `resolveFlowName(scope, name)` → tries `${scope}/${name}`, then `${name}`
- New export: `resolveRecordName(scope, name)` → same pattern
- Both throw if neither scoped nor global name exists

#### React context (`packages/react/src/context.jsx`)
- Derive `prototypeName` from route pathname (top-level segment)
- Use `resolveFlowName(prototypeName, sceneParam)` for flow selection
- Expose `prototypeName` in context value

#### React hooks
- `useRecord(name)` reads `prototypeName` from context, calls `resolveRecordName`
- `useFlowData()` unchanged — operates on already-loaded flow data

#### Viewfinder
- Groups flows by prototype prefix
- Shows prototype name as section header

#### Migration
- Zero breaking changes for existing global data files
- Prototype authors opt-in to scoping by creating a subdirectory and moving data files into it

## Phase 4: Viewfinder iteration

- [ ] Viewfinder should list prototypes instead of flows
- [ ] Prototypes can be expanded to show all flows they possess
- [ ] Add optional `name.prototype.json` metadata file (name, description, author, icon, team, tags)
- [ ] `name.prototype.json` gets author as the git user who first created the file if the field is missing/empty

## Phase 5: Documentation updates

All docs still reference "scenes", "pages", `src/pages/`, etc. Two waves:

**Wave 1 — Update for Phases 1-2 (already committed renames):**

| File | What to update |
|------|----------------|
| **README.md** | `.scene.json`→`.flow.json`, `loadScene`→`loadFlow`, `useSceneData`→`useFlowData`, `useScene`→`useFlow`, `src/pages/`→`src/prototypes/`, entire "Scenes" section, examples |
| **AGENTS.md** | "Scenes" section (~57 lines), `.scene.json` examples, hook names, `?scene=` references, data system section |
| **.github/architecture/index.md** | Master architecture overview — function renames, hook renames, data flow |
| **.github/architecture/\*.md** | Individual arch docs for loader.js, context.jsx, data-plugin.js, useSceneData, useScene, _app.jsx, index.jsx |
| **.github/skills/storyboard/SKILL.md** | Data structuring guide — `.scene.json` examples, scene composition |
| **.github/plans/cross-scene-state.md** | All "Scene A/B" examples, function calls |
| **.github/plans/workshop-plugin.md** | `src/pages/`→`src/prototypes/`, `.scene.json`→`.flow.json` |
| **.github/plans/design-modes.md** | Flow parameter examples |

**Wave 2 — Update for scoping (Phase 3):**

| File | What to update |
|------|----------------|
| **README.md** | Add scoping section, prototype-prefixed keys, local aliasing |
| **AGENTS.md** | Update data system section with scoping rules |
| **.github/skills/storyboard/SKILL.md** | Add scoped data examples |
| **.github/architecture/data-plugin.js.md** | Document prefix logic |
| **.github/architecture/loader.js.md** | Document resolveFlowName/resolveRecordName |
| **.github/architecture/context.jsx.md** | Document prototypeName derivation |

**Approach:** Update docs inline with each implementation step.