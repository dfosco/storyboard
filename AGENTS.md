# AGENTS.md

## General instructions

- Before running any other instruction, evaluate if the user prompt contains a trigger for one or more skills in `.github/skills`.
- If the user asks `how to use this repo`, `how to run this project` etc, give them an outline of `AGENTS.md` and point them to this file, the `README.md` and the `.github/architecture` docs
- **After completing any change**, always create a clips task for the work done and mark it as closed. Use the relevant goal if one exists, or create a new one. Never skip this step.

---

## Planning

Every single plan generated should be saved to a markdown file on the repository, no exceptions. 

The default location is in `.github/plans`, but the user may ask for a specific location or you might override that based on context.

---

## Skills

- **create** (`.github/skills/create/SKILL.md`) — Walks through creating Storyboard assets: prototype, external prototype, flow, page, canvas, object, or record.

- **worktree** (`.github/skills/worktree/SKILL.md`) — Creates a git worktree in `.worktrees/<branch-name>` and switches into it.

- **tools** (`.github/skills/tools/SKILL.md`) — Reference for creating toolbar tools: config schema, handlers, surfaces, and render types.

- **changeset** (`.github/skills/changeset/SKILL.md`) — Low-level changeset operations: create changeset files, version bump, tag.

- **release** (`.github/skills/release/SKILL.md`) — Full release workflow: generate changeset from commits, version, tag, push. CI publishes via OIDC.

- **storyboard-core** (`.github/skills/storyboard-core/SKILL.md`) — Guide for adding CoreUIBar menu buttons and wiring action handlers.

- **vitest** (`.github/skills/vitest/SKILL.md`) — Vitest testing framework guidance for writing and configuring tests.

- **clips** (`.github/skills/clips/SKILL.md`) — Local-first issue tracking workflow for goals/tasks synced to GitHub.

- **architecture-scanner** (`.github/skills/architecture-scanner/SKILL.md`) — Scans codebase architecture and generates docs in `.github/architecture/`.

- **storyboard** (`.github/skills/storyboard/SKILL.md`) — Storyboard data structuring for flows, objects, and records.

- **changelog** (`.github/skills/changelog/SKILL.md`) — Generates formatted changelog entries from commit ranges.

- **ship** (`.github/skills/ship/SKILL.md`) — End-to-end feature shipping: worktree → plan → implement → adversarial review → push → PR.

---

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:1234
npm run build        # Production build
npm run lint         # Run ESLint
```

---

## Architecture

This is a **Storyboard prototyping app** using Vite and file-based routing via `@generouted/react-router`.

Detailed architectural documentation lives in `.github/architecture/`. Consult the relevant architecture docs when:

- Debugging a hard-to-solve bug in a file or set of files
- Implementing a large-scale refactor of a file

After any meaningful refactor, ask the user if the architecture documents should be updated.

## Key Conventions to follow at all times

- Use **Primer React** components from `@primer/react` for all UI elements
- Use **semantic HTML tags** whenever they are appropriate in between Primer React components
- Use **Primer Octicons** from `@primer/octicons-react` for icons
- Use **CSS Modules** (`*.module.css`) for component-specific styles
  - If you find any `sx` styled-components styling, migrate them to CSS Modules
- **Every piece of data consumed in a page must gracefully handle `null` or `undefined` without crashing.** Since flow data, records, and overrides can all be partial, incomplete, or missing, components must never assume a field exists. Use optional chaining, fallback values, or conditional rendering for every data access.

---

## Key anti-patterns to avoid

- **DO NOT EVER USE** `<Box>` components
- **DO NOT EVER USE** `sx` styled-components
- **DO NOT USE `useState` in pages or components.** All state management must happen through storyboard hooks (`useFlowData`, `useOverride`, `useObject`, `useRecord`, etc.). Storyboard state lives in the URL hash — not in React component state.

---

## Storyboard Data System

The storyboard data system separates UI prototype data from components using JSON files discovered by a Vite plugin at dev/build time.

### Data File Types

Data files use **suffix-based naming** and can live anywhere in the repo:

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.flow.json` | Page data context | `default.flow.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Parameterized collection (array with `id` per entry) | `posts.record.json` |
| `.prototype.json` | Prototype metadata (title, author, description) | `my-proto.prototype.json` |

Every name+suffix must be unique within its scope — the build fails on duplicates. Objects, flows, and records inside `src/prototypes/` are scoped to their prototype; global files (outside prototypes) share a single namespace.

---

### Data Objects (`*.object.json`)

Reusable JSON data files that represent entities (users, navigation, etc):

```json
// jane-doe.object.json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "role": "admin",
  "avatar": "https://avatars.githubusercontent.com/u/1?v=4",
  "profile": {
    "bio": "Designer & developer",
    "location": "San Francisco, CA"
  }
}
```

Objects are standalone data fragments — they have no special keys and can be structured however you need.

**Prototype scoping:** Objects inside `src/prototypes/{Proto}/` are automatically scoped to that prototype. When resolved (via `useObject`, `$ref`, or `$global`), the system tries the scoped name first (`Proto/objectName`), then falls back to global. This means duplicating a prototype folder and renaming it just works — object files inside don't conflict with the originals.

---

### Flows (`*.flow.json`)

Flow files compose objects into a complete data context. They support two special keys:

- **`$global`** — An array of object **names** merged into the flow root. Flow values win on conflicts.
- **`$ref`** — An inline reference `{ "$ref": "some-object" }` resolved by **name** from the data index.

```json
// default.flow.json
{
  "$global": ["navigation"],
  "user": { "$ref": "jane-doe" },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true
  }
}
```

References use **names**, not paths: `"jane-doe"` not `"../objects/jane-doe"`.

After loading, `$global` and `$ref` are resolved — the final flow data is a flat object with all references inlined. Circular `$ref` chains are detected and throw an error.

---

### Records (`*.record.json`)

Records are collections — arrays of entries, each with a unique `id`. They power dynamic routes:

```json
// posts.record.json
[
  { "id": "welcome-to-storyboard", "title": "Welcome", "author": "Jane Doe" },
  { "id": "another-post", "title": "Another Post", "author": "Jane Doe" }
]
```

Access with `useRecord('posts')` in a `pages/posts/[id].jsx` dynamic route page. The second argument defaults to `'id'` and determines which record field to match against the URL param — name the file `[field].jsx` to match a different field (e.g. `[permalink].jsx` matches `entry.permalink`).

---

### External Prototypes

An **external prototype** links to a prototype hosted at an external URL. It appears in the viewfinder alongside regular prototypes but opens in a new tab instead of navigating within the app.

To create one, add a folder inside `src/prototypes/` with only a `.prototype.json` file containing a `url` field:

```json
// my-external-app.prototype.json
{
  "meta": {
    "title": "External App",
    "description": "Hosted on another domain",
    "author": ["dfosco"]
  },
  "url": "https://example.com/prototype"
}
```

No `index.jsx` or flow files are needed — the folder only contains the `.prototype.json`.

**Behavior:**
- Shows up in the viewfinder with an "external" badge
- Clicking opens the URL in a new tab (`target="_blank"`)
- Can live inside `.folder/` directories for grouping
- Supports all standard metadata (`title`, `description`, `author`, `icon`, `tags`, `team`)

**Creating via Workshop UI:** Use the "New prototype" workshop action and check the "External prototype" checkbox, then provide the URL.

**Creating via Agent:** Create the folder and `.prototype.json` file directly — no special commands needed.

---

### Template Variables

Data files support **build-time template variables** using `${variableName}` syntax within JSON string values. Variables are resolved by the Vite data plugin based on the file's location — no runtime overhead.

```json
// sidenav.object.json inside src/prototypes/main.folder/Example/
{
  "items": [
    { "label": "Overview", "url": "/${currentDir}/security/overview" },
    { "label": "Home", "proto": "${currentProto}" }
  ]
}
```

| Variable | Description | Example (for file at `src/prototypes/main.folder/Example/nav.object.json`) |
|----------|-------------|-------------|
| `${currentDir}` | Directory of the file, relative to project root | `src/prototypes/main.folder/Example` |
| `${currentProto}` | Path to the prototype directory containing the file | `src/prototypes/main.folder/Example` |
| `${currentProtoDir}` | Path to the first parent `*.folder` directory | `src/prototypes/main.folder` |

**Notes:**
- Only **string values** are processed — keys, numbers, booleans are left untouched
- `${currentProto}` and `${currentProtoDir}` resolve to empty string (with a console warning) when the file is outside a prototype or `.folder` directory
- Unknown variable patterns like `${foo}` are left as-is

---

### Flow Loader (`storyboard/core/loader.js`)

The loader is seeded at app startup via `init({ flows, objects, records })`, called automatically by the Vite data plugin's generated virtual module:

```js
import { loadFlow } from '../storyboard/core/loader.js'

const data = await loadFlow('default')    // loads default.flow.json
const data = await loadFlow('other-flow') // loads other-flow.flow.json
```

Also exports `init()`, `loadRecord(name)`, `findRecord(name, id)`, and `flowExists(name)`.

---

### Architecture: Core / React Split

The storyboard system is split into two layers:

- **`storyboard/core/`** — Framework-agnostic JavaScript (zero npm dependencies). Data loading, URL hash session, dot-notation utilities, hash change subscription. Can be used by any frontend.
- **`storyboard/internals/`** — Framework-specific plumbing (currently React). Context providers, hooks, Primer components, React Router integration. Gets replaced entirely when building a non-React frontend.
- **`storyboard/vite/`** — Vite plugin for data discovery. Framework-agnostic (Vite works with React, Vue, Svelte).

### StoryboardProvider & Hooks (`storyboard/internals/`)

The `StoryboardProvider` wraps the app and loads flow data into React context:

```jsx
import { useFlowData, useFlowLoading, useObject, useRecord, useRecords } from '../storyboard'

// Flow data (dot-notation paths)
const user = useFlowData('user')
const userName = useFlowData('user.profile.name')
const allData = useFlowData() // entire flow object

// Objects (direct access, no flow needed)
const nav = useObject('navigation')              // full object
const bio = useObject('jane-doe', 'profile.bio') // dot-notation path

// Records (dynamic routes)
const post = useRecord('posts')             // single entry by URL param (defaults to 'id')
const post = useRecord('posts', 'permalink') // match by a different field
const allPosts = useRecords('posts')         // all entries

const loading = useFlowLoading()
```

**Page-flow matching:** If no `?flow=` param or `flowName` prop is provided, the provider checks whether a flow file exists whose name matches the current page (e.g. `Repositories.flow.json` for the `/Repositories` route). If it does, that flow is loaded automatically. Otherwise it falls back to `"default"`.

**Public exports** from `storyboard/index.js` (re-exports from core + react):
- `init({ flows, objects, records })` — Seed the data index (called by Vite plugin)
- `StoryboardProvider` — React context provider
- `useFlowData(path?)` — Access flow data by dot-notation path
- `useFlowLoading()` — Returns true while flow is loading
- `useOverride(path)` — Read/write hash overrides (works with or without StoryboardProvider)
- `useObject(name, path?)` — Load object data directly by name, without a flow
- `useRecord(name, param?)` — Load single record entry by URL param (defaults to `'id'`)
- `useRecords(name)` — Load all entries from a record collection
- `loadFlow(name)` — Low-level flow loader
- `loadObject(name, scope?)` — Low-level object loader (resolves `$ref`s, optional prototype scope)
- `loadRecord(name)` — Low-level record loader
- `findRecord(name, id)` — Find record entry by id
- `flowExists(name)` — Check if a flow file exists
- `getByPath(obj, path)` — Dot-notation path utility
- `subscribeToHash(callback)` — Subscribe to hash changes (for any reactive framework)
