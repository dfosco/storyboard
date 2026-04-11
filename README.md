# Storyboard

A small framework to create stateful prototypes. Create `flows` with JSON to prototype states of your app and save all interaction as URL parameters. This means you can:

- Set up interactions that create and edit data in your UI with ease
- Share *any* state of your prototype – every single change has a unique URL!
- Build a static site that can be deployed anywhere (including GitHub Pages)
- Work with data structures that mirror your production app without dealing with APIs or using heavy frameworks like NextJS

Built with [Vite](https://vite.dev) and [generouted](https://github.com/oedotme/generouted). 

Uses [GitHub Primer](https://primer.style) as the default design system, with per-page support for other systems like [Reshaped](https://www.reshaped.so).

## Quick Start

```bash
npm install
npm run dev     # http://localhost:1234
```

## How It Works

Storyboard separates **data** from **UI**. Your components read from JSON flow files instead of hardcoding content. 

You can switch between different flows via a URL parameter, and override any value at runtime through the URL. 

Every interaction on your UI get saved to the URL and persist during a user session. That also means any session and user state can be recovered just by sharing a URL! 

```
┌──────────────────────────────┐
│  Data Files (read-only)      │  ← Discovered by Vite plugin
│  *.flow.json / *.object.json │
│  *.record.json               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Storyboard Context          │  ← Loaded into React context
│  useFlowData() / useOverride │
│  useRecord()                  │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐  ┌────────────┐
│ Components │  │ URL Hash   │  ← Runtime overrides (#key=value)
│            │◄─│ Overrides  │
└────────────┘  └────────────┘
```

---

## Data Structure

Data files use a **suffix-based naming convention** and can live anywhere in the repo. A Vite plugin discovers them automatically at dev/build time.

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.flow.json` | Page data context | `default.flow.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Parameterized collection | `posts.record.json` |

```
src/data/
  ├── default.flow.json            # Main flow
  ├── other-flow.flow.json         # Alternative flow
  ├── jane-doe.object.json       # A user object
  ├── navigation.object.json     # Nav links
  └── posts.record.json          # Blog post collection
```

Files can be organized into subdirectories if desired — the plugin finds them regardless. Every name+suffix must be **unique** across the repo (the build fails with a clear error on duplicates).

### Objects

Objects are **reusable data fragments** — standalone JSON files representing a single entity like a user, a navigation config, or a settings block. Any flow can pull in an object via `$ref`, so you define it once and reuse it everywhere.

Use objects when a piece of data is **shared across multiple flows** or when you want to keep your flow files focused and readable.

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

#### Creating a new object

Add a `.object.json` file anywhere in the repo (typically in `src/data/`). The name must be unique across all data files.

```json
// acme-org.object.json
{
  "name": "Acme Corp",
  "plan": "enterprise",
  "members": 42
}
```

Then reference it from any flow with `{ "$ref": "acme-org" }`.

#### Using an object directly (without a flow)

Objects can also be loaded directly by components using `useObject()`, without wiring them through a flow file:

```jsx
import { useObject } from '@dfosco/storyboard-react'

const user = useObject('jane-doe')                       // full object
const bio = useObject('jane-doe', 'profile.bio')         // dot-notation path
```

This is useful when a component needs shared data (e.g., navigation, user profile) but the page doesn't use a flow, or when you want to avoid duplicating `$ref` entries across multiple flows.

`useObject` supports URL hash overrides with the `object.{name}.{field}` namespace:

```
#object.jane-doe.name=Alice    → useObject('jane-doe') returns { name: 'Alice', ... }
```

#### Updating an object at runtime

Objects are read-only JSON — you don't modify the file at runtime. Instead, use `useOverride()` to override individual fields via the URL hash.

When the object is accessed through a flow (via `$ref`), override by the flow path:

```jsx
const [name, setName] = useOverride('user.name')
setName('Alice')
// URL becomes: #user.name=Alice
// Components reading user.name now see "Alice" instead of "Jane Doe"
```

When the object is accessed directly via `useObject()`, override by the object namespace:

```jsx
const [name, setName] = useOverride('object.jane-doe.name')
setName('Alice')
// URL becomes: #object.jane-doe.name=Alice
// useObject('jane-doe') now returns { name: 'Alice', ... }
```

`useOverride` works both inside and outside a `<StoryboardProvider>`, so you can override object fields from any component.

The JSON file stays unchanged. The override lives in the URL and can be cleared at any time, reverting to the original value.

#### Removing an object field at runtime

To "delete" a value from the UI, override it with an empty string or `null`. Components should handle missing/empty values gracefully:

```jsx
const [bio, setBio] = useOverride('user.profile.bio')
setBio('')  // effectively "removes" the bio from the UI
```

Since every component is expected to handle `null`/`undefined`/empty values, the UI simply stops rendering that content.

### Flows

Flows are the **data context for a page** — they define what data is available when a user visits a particular URL. Think of each flow as a complete snapshot of your app's state: the logged-in user, the navigation links, the list of projects, the current settings.

**Why create multiple flows?** Flows are how you prototype different states without changing any UI code. A large prototype might have:

- `default.flow.json` — the happy-path state with a full profile, active projects, and all features enabled
- `empty-state.flow.json` — a new user with no projects, testing empty states
- `admin.flow.json` — an admin user with elevated permissions, showing admin-only UI
- `error-state.flow.json` — settings configured to trigger error or warning states
- `onboarding.flow.json` — a first-time user going through a setup flow

Each flow can reference the same objects (via `$ref`) or define its own inline data. Switching between flows is instant — just change the `?flow=` URL parameter.

#### Composing a flow

Flows support two special keys for composing data:

- **`$ref`** — Replaced inline with the contents of the referenced object (by name)
- **`$global`** — An array of object names merged into the flow root (flow values win on conflicts)

```json
// default.flow.json
{
  "user": { "$ref": "jane-doe" },
  "navigation": { "$ref": "navigation" },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 },
    { "id": 2, "name": "storyboard", "stars": 128 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true,
    "language": "en"
  }
}
```

References are resolved by **name** — no relative paths needed. `{ "$ref": "jane-doe" }` finds `jane-doe.object.json` anywhere in the repo.

After loading, all `$ref` and `$global` references are resolved — the final data is a flat object with everything inlined.

`$global` is useful when an object's keys should be merged directly into the flow root rather than nested under a single key. Compare `$ref` vs `$global`:

**With `$ref`** — the object is nested under a key you choose:

```json
// flow file
{ "nav": { "$ref": "navigation" } }

// resolved result
{
  "nav": {
    "primary": [{ "label": "Overview", "url": "/Overview" }],
    "secondary": [{ "label": "Settings", "url": "/settings" }]
  }
}
```

**With `$global`** — the object's keys are merged into the flow root:

```json
// flow file
{
  "$global": ["navigation"],
  "pageTitle": "Repositories"
}

// resolved result
{
  "primary": [{ "label": "Overview", "url": "/Overview" }],
  "secondary": [{ "label": "Settings", "url": "/settings" }],
  "pageTitle": "Repositories"
}
```

This is handy when multiple components read top-level keys (e.g., a header reads `primary`, a sidebar reads `secondary`) and you don't want to nest everything under a single parent key. Flow values always win on conflicts.

JSONC is supported — you can use `//` and `/* */` comments in your data files.

#### Creating a new flow

Add a `.flow.json` file anywhere in `src/data/`:

```json
// empty-state.flow.json
{
  "user": { "$ref": "jane-doe" },
  "projects": [],
  "settings": { "theme": "light" }
}
```

Then load it by visiting `?flow=empty-state` in your browser. No code changes needed.

**Page-flow matching:** If no `?flow=` param is set, Storyboard checks if a flow file matches the current page name. For example, visiting `/Repositories` automatically loads `Repositories.flow.json` if it exists. Otherwise it falls back to `default.flow.json`.

### Records

Records are **collections** — arrays of entries, each with a unique `id` field. They power **dynamic routes** where the same page template renders different content based on the URL (think blog posts, repositories, issues, users — any list-and-detail pattern).

**Why use records instead of flow data?** Flows provide the static context for a page. Records provide the *collection* that populates lists and detail views. In a large prototype you might have:

- `repositories.record.json` — all repos shown in a list, each clickable to a detail page
- `issues.record.json` — issues for a repo, each with its own route
- `team-members.record.json` — people shown in a team directory

Records are the core building block for any prototype with **repeating items** and **detail pages**.

```json
// posts.record.json
[
  {
    "id": "welcome-to-storyboard",
    "title": "Welcome to Storyboard",
    "date": "2026-02-14",
    "author": "Jane Doe",
    "body": "Storyboard is a prototyping meta-framework..."
  },
  {
    "id": "data-driven-prototyping",
    "title": "Data-Driven Prototyping",
    "date": "2026-02-13",
    "author": "Jane Doe",
    "body": "Traditional prototyping tools force you..."
  }
]
```

#### Reading records

Use `useRecord()` for a single entry (matched by URL param) or `useRecords()` for the full collection:

```jsx
// src/pages/posts/[slug].jsx — detail page
import { useRecord } from '@dfosco/storyboard-react'

function BlogPost() {
  const post = useRecord('posts', 'slug')
  // URL /posts/welcome-to-storyboard → entry with id "welcome-to-storyboard"
  return <h1>{post?.title}</h1>
}
```

```jsx
// src/pages/posts/index.jsx — list page
import { useRecords } from '@dfosco/storyboard-react'

function BlogIndex() {
  const posts = useRecords('posts')
  return posts.filter(p => p.id).map(post => (
    <a key={post.id} href={`/posts/${post.id}`}>{post.title}</a>
  ))
}
```

#### Updating a record entry at runtime

Use `useOverride()` to override a specific field on a specific entry. The override is stored in the URL hash. The hash convention for record overrides is: `record.{name}.{entryId}.{field}=value`

```jsx
import { useOverride } from '@dfosco/storyboard-react'

// Override the title of a specific post
const [title, setTitle] = useOverride('record.posts.welcome-to-storyboard.title')
setTitle('New Title')
// URL becomes: #record.posts.welcome-to-storyboard.title=New%20Title
```

Both `useRecord` and `useRecords` automatically pick up these overrides — no extra wiring needed.

#### Creating a new record entry at runtime

You can create entries that don't exist in the JSON file by setting override fields with a new id. The entry is appended to the collection at runtime:

```
#record.posts.my-new-post.title=Draft%20Post&record.posts.my-new-post.author=Alice
```

When `useRecords('posts')` runs, it sees overrides for an id (`my-new-post`) that doesn't exist in the JSON, so it creates a new entry `{ id: "my-new-post", title: "Draft Post", author: "Alice" }` and appends it to the array.

#### Removing a record entry at runtime

To "delete" an entry from a list, override its `id` to an empty string. The entry still exists in the array, but components that filter on `id` will skip it:

```jsx
const [id, setId] = useOverride('record.posts.welcome-to-storyboard.id')
setId('')  // "deletes" this entry
```

For this pattern to work, your list components should filter out entries with empty or falsy ids:

```jsx
const posts = useRecords('posts')
const visiblePosts = posts.filter(p => p.id)
```

This is a convention, not a hard rule — but it's the recommended way to simulate deletion in a prototype where the underlying JSON is read-only.

---

## Reading Flow Data

Use `useFlowData()` to read data from the current flow. Supports dot-notation for nested access.

```jsx
import { useFlowData } from '@dfosco/storyboard-react'

function UserCard() {
  const user = useFlowData('user')
  const name = useFlowData('user.profile.name')
  const firstProject = useFlowData('projects.0')
  const allData = useFlowData() // entire flow object

  return (
    <div>
      <Text>{name}</Text>
      <Text>{user.profile.bio}</Text>
      <Text>First project: {firstProject.name}</Text>
    </div>
  )
}
```

`useFlowData()` is **read-only** — it returns flow data with any hash overrides applied transparently. Use it by default for reading data.

---

## Overrides (Read/Write)

Use `useOverride()` when you need to **write** an override. Values are stored in the **URL hash** (`#key=value`) so they persist across page refreshes and can be shared by copying the URL.

```jsx
import { useOverride } from '@dfosco/storyboard-react'

const [value, setValue, clearValue] = useOverride('path.to.value')
```

The hook returns a 3-element array:

| Index | What it does |
|-------|-------------|
| `value` | Current value — reads from URL hash first, falls back to flow JSON default |
| `setValue` | Writes a new value to the URL hash |
| `clearValue` | Removes the hash param, reverting to the flow default |

### Read priority

```
URL hash param  →  Flow JSON default  →  undefined
```

If the user hasn't overridden anything, they see the flow default. Once they interact, the URL hash takes over. Clearing the override reverts to the default.

### Example: Updating user info with buttons

```jsx
import { useOverride } from '@dfosco/storyboard-react'
import { Button, ButtonGroup } from '@primer/react'

function UserSwitcher() {
  const [name, setName] = useOverride('user.name')
  const [role, setRole] = useOverride('user.role')

  return (
    <div>
      <Text>Current user: {name} ({role})</Text>
      <ButtonGroup>
        <Button onClick={() => { setName('Alice'); setRole('admin') }}>
          Switch to Alice
        </Button>
        <Button onClick={() => { setName('Bob'); setRole('viewer') }}>
          Switch to Bob
        </Button>
      </ButtonGroup>
    </div>
  )
}
```

Clicking a button updates the URL to something like:
```
/?flow=default#user.name=Alice&user.role=admin
```

Refresh the page — the override persists. Remove the hash params from the URL — it reverts to the flow JSON defaults.

### Example: Form with StoryboardForm

Storyboard provides form components that automatically persist to URL session state on submit. No hooks or event handlers needed — just use a `name` prop.

```jsx
import { FormControl, Button } from '@primer/react'
import { StoryboardForm, TextInput, Textarea } from '@dfosco/storyboard-react-primer'

function ProfileForm() {
  return (
    <StoryboardForm data="user">
      <FormControl>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput name="name" />
      </FormControl>

      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <Textarea name="profile.bio" />
      </FormControl>

      <Button type="submit">Save</Button>
    </StoryboardForm>
  )
}
```

The `data` prop sets a root path. Each input's `name` is appended to it:
- `data="user"` + `name="name"` → session path `user.name`
- `data="user"` + `name="profile.bio"` → session path `user.profile.bio`

Values are buffered locally while typing. On submit, they flush to the URL hash:
```
#user.name=Alice&user.profile.bio=Hello%20world
```

Available form components: `TextInput`, `Textarea`, `Select`, `Checkbox`. They look and behave identically to Primer React originals — just import from `'@dfosco/storyboard-react-primer'` instead of `'@primer/react'`. Equivalent Reshaped form components are available from `'@dfosco/storyboard-react-reshaped'`.

### Override Namespaces

`useOverride(path)` works with three namespaces. The path you pass determines what gets overridden:

| Namespace | Path format | Example | What it overrides |
|-----------|------------|---------|-------------------|
| **Flow data** | `{field}` | `useOverride('user.name')` | A field in the current flow |
| **Object data** | `object.{name}.{field}` | `useOverride('object.jane-doe.name')` | A field in an object loaded via `useObject()` |
| **Record data** | `record.{name}.{entryId}.{field}` | `useOverride('record.posts.post-1.title')` | A field in a record entry loaded via `useRecord()`/`useRecords()` |

All three follow the same read priority: **hash override → fallback → undefined**. The fallback is flow data when inside a `<StoryboardProvider>`, or nothing when used standalone.

`useRecord`, `useRecords`, and `useObject` all pick up overrides automatically — you only need `useOverride` when you want to **write** an override from a component.

---

## Flow Switching

### Via URL

Change the `?flow=` search parameter:

```
http://localhost:1234/?flow=other-flow
http://localhost:1234/?flow=empty-state
```

No parameter defaults to `?flow=default`.

### Programmatically

```jsx
import { useFlow } from '@dfosco/storyboard-react'
import { Button } from '@primer/react'

function FlowPicker() {
  const { flowName, switchFlow } = useFlow()

  return (
    <div>
      <Text>Current flow: {flowName}</Text>
      <Button onClick={() => switchFlow('other-flow')}>
        Switch to other-flow
      </Button>
    </div>
  )
}
```

`switchFlow()` updates the `?flow=` param. Hash overrides persist across flow switches.

### Via toolbar

When a prototype has multiple flows, a **flow switcher button** appears in the toolbar. Click it to switch between flows for the current prototype without touching the URL manually.

---

## Feature Flags

Feature flags are configured in `storyboard.config.json` and automatically initialized at startup by the Storyboard Vite plugin.

```json
{
  "featureFlags": {
    "show-banner": true,
    "new-navigation": false
  }
}
```

### Reading a flag in React

Use `useFeatureFlag()` from `@dfosco/storyboard-react`:

```jsx
import { useFeatureFlag } from '@dfosco/storyboard-react'

function Banner() {
  const showBanner = useFeatureFlag('show-banner')
  if (!showBanner) return null
  return <div>Feature-enabled content</div>
}
```

### Changing flags at runtime

- **DevTools UI:** Open DevTools → **Feature Flags** and toggle any configured flag.
- **Programmatic API:** Use `setFlag()`, `toggleFlag()`, or `resetFlags()` from `@dfosco/storyboard-core`.

Flag resolution priority is:

```
localStorage  →  storyboard.config.json default
```

Flags are persisted to localStorage when set via `setFlag()`, `toggleFlag()`, or the DevTools UI. Use plain flag keys in hooks/APIs (for example, `show-banner`). The `flag.` prefix is used internally as a localStorage key prefix.

### Body CSS classes

Every flag that resolves to `true` adds a `sb-ff-{name}` class to `<body>` (e.g. `sb-ff-show-banner`). Classes are synced automatically on init, toggle, set, and reset — so you can use them in CSS without any JavaScript:

```css
.promo-banner { display: none; }
body.sb-ff-show-banner .promo-banner { display: block; }
```

---

## Toolbar

Storyboard renders a floating toolbar (bottom-right) with configurable tools — buttons, menus, side panels, and a command menu (⌘K). The toolbar is driven by `toolbar.config.json` bundled inside `@dfosco/storyboard-core`, with optional per-prototype overrides.

### Toolbar config

Each tool is declared in the `tools` object of `toolbar.config.json`:

```json
{
  "tools": {
    "inspector": {
      "ariaLabel": "Inspect components",
      "icon": "iconoir/square-dashed",
      "render": "sidepanel",
      "surface": "main-toolbar",
      "sidepanel": "inspector",
      "handler": "core:inspector",
      "state": "active",
      "modes": ["*"],
      "localOnly": false,
      "excludeRoutes": ["^/$", "/viewfinder"]
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `render` | `string` | How the tool renders: `button`, `menu`, `sidepanel`, `separator`, `link`, `submenu`, `zoom-control` |
| `surface` | `string` | Where it appears: `main-toolbar`, `command-list`, `canvas-toolbar` |
| `handler` | `string` | Module reference: `core:name` for built-in, `custom:name` for client-provided handlers |
| `state` | `string` | Initial state (default: `"active"`). See [Tool States](#tool-states) below. |
| `modes` | `string[]` | Which modes show this tool. `["*"]` = all modes. |
| `localOnly` | `boolean` | When `true`, tool is automatically `disabled` in deployed environments and shows a green dot indicator in local dev. |
| `excludeRoutes` | `string[]` | Regex patterns — tool is hidden on matching routes. |

### Prototype overrides

Place a `toolbar.config.json` inside a prototype folder to override tool config for that prototype. Overrides are deep-merged with the base config on navigation:

```
src/prototypes/my-prototype.folder/dashboard/
├── toolbar.config.json     ← prototype-level overrides
├── dashboard.prototype.json
└── index.jsx
```

```json
{
  "tools": {
    "inspector": { "state": "dimmed" },
    "comments": { "state": "disabled" }
  }
}
```

Overrides are automatically cleared when navigating away from the prototype.

### Tool states

Every tool has a runtime state that controls its visibility, interactivity, and loading behavior. Tools default to `active` unless config or application code sets otherwise.

| State | Trigger visible | Clickable | Shortcuts | Loaded on FE | Description |
|-------|:-:|:-:|:-:|:-:|-------------|
| `active` | ✅ | ✅ | ✅ | ✅ | Normal (default) |
| `inactive` | ✅ | ❌ | ❌ | ✅ | Disabled-looking, no interaction. Use for errors too. |
| `hidden` | ❌ | — | ✅ | ✅ | Trigger disappears but shortcuts still work |
| `dimmed` | ✅ | ✅ | ✅ | ✅ | Reduced opacity, interactive on hover/focus |
| `disabled` | ❌ | ❌ | ❌ | ❌ | Completely removed — module never loads |

#### Setting state in config

Add a `state` property to any tool in `toolbar.config.json`:

```json
{ "inspector": { "state": "dimmed" } }
```

#### Setting state at runtime

```js
import { setToolbarToolState, TOOL_STATES } from '@dfosco/storyboard-core'

setToolbarToolState('inspector', TOOL_STATES.INACTIVE)  // disable inspector
setToolbarToolState('inspector', TOOL_STATES.ACTIVE)    // re-enable it
```

Runtime state changes are reactive — the toolbar and command menu update immediately.

#### localOnly tools

Tools with `"localOnly": true` are automatically set to `disabled` in deployed environments (non-local-dev). In local dev, they render normally with a **green dot indicator** (4px, top-right on toolbar buttons, far-right on command menu items) to signal they're dev-only.

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + .` | Toggle toolbar visibility (hide/show chrome) |
| `⌘ + K` | Open/close command menu (works even when toolbar is hidden) |

Individual tools can also declare shortcuts in config via the `shortcut` property (e.g. `⌘ + I` for inspector, `⌘ + D` for docs). Shortcuts respect tool state — `inactive` and `disabled` tools don't respond.

---

## Routing

Routes are auto-generated from the file structure in `src/pages/` via [@generouted/react-router](https://github.com/oedotme/generouted) with lazy loading for automatic route-level code splitting:

- `src/pages/index.jsx` → `/`
- `src/pages/Overview.jsx` → `/Overview`
- `src/pages/Signup.jsx` → `/Signup`
- `src/pages/posts/index.jsx` → `/posts`
- `src/pages/posts/[slug].jsx` → `/posts/:slug` (dynamic route)

To create a new page, add a `.jsx` file to `src/pages/`. Each page is loaded on-demand — pages using different design systems (e.g., Reshaped) don't affect the initial bundle size.

### Dynamic Routes

Use `[paramName]` brackets in filenames for dynamic segments. The param value is available via `useParams()` or the `useRecord()` hook:

```
src/pages/posts/[slug].jsx    → /posts/:slug
src/pages/users/[id].jsx      → /users/:id
```

Pair dynamic routes with `.record.json` files to create data-driven parameterized pages. See [Records](#records) above.

### Hash Preservation

URL hash params (session state) are automatically preserved across **all** page navigations — both `<a>` link clicks and programmatic `navigate()` calls. A global interceptor installed in `src/index.jsx` wraps both the document-level click handler and `router.navigate()` to carry the current hash forward automatically.

No page needs to manually append `window.location.hash` — just use `navigate('/Page')` or any link component and the hash carries forward.

Hash is **not** preserved when:
- The target path already defines its own hash fragment
- The link points to an external origin
- `switchFlow()` is called (intentionally clears hash since it belongs to the previous flow)

---

## Body Class Sync

Storyboard automatically mirrors active **overrides** and the current **flow** as CSS classes on `<body>`. This lets you conditionally style components based on storyboard state using CSS — including CSS Modules.

### Class format

| Source | Class pattern | Example |
|--------|--------------|---------|
| Override `key=value` | `sb-{key}--{value}` | `theme=dark` → `sb-theme--dark` |
| Dot-notation override | Dots become dashes | `settings.theme=dark` → `sb-settings-theme--dark` |
| Active flow | `sb-flow--{name}` | Flow "Dashboard" → `sb-flow--dashboard` |

Classes are added/removed reactively — no page reload needed. Works in both normal mode (URL hash) and hide mode (localStorage shadows).

### Usage with CSS Modules

Use `:global()` to reference body classes from CSS Modules:

```css
/* MyComponent.module.css */
:global(.sb-theme--dark) .panel {
  background: var(--bgColor-muted);
}

:global(.sb-flow--dashboard) .sidebar {
  display: block;
}

:global(.sb-settings-theme--compact) .container {
  padding: 8px;
}
```

### Setup

Body class sync is automatically initialized by `mountStoryboardCore()` in the app entry (`src/index.jsx`). `setFlowClass()` is called automatically by `StoryboardProvider`. No additional setup needed.

---

## API Reference

### Hooks (`@dfosco/storyboard-react`)

| Hook | Returns | Description |
|------|---------|-------------|
| `useFlowData(path?)` | `any` | Read flow data (overrides applied transparently). Dot-notation path. Omit path for entire flow. |
| `useFlowLoading()` | `boolean` | `true` while flow is loading |
| `useOverride(path)` | `[value, setValue, clearValue]` | Read/write hash overrides on flow or object data. Works with any namespace (`settings.theme`, `object.jane-doe.name`, `record.posts.post-1.title`). Works with or without a `<StoryboardProvider>`. |
| `useFlow()` | `{ flowName, switchFlow }` | Current flow name + switch function |
| `useFlows()` | `Array` | List all available flows for the current prototype. |
| `useObject(name, path?)` | `any` | Load an object data file directly by name, without a flow. Supports dot-notation path and hash overrides (`object.{name}.{field}`). |
| `useRecord(name, param)` | `object \| null` | Load a single record entry. `name` = record file name, `param` = route param matched against `id`. |
| `useRecords(name)` | `Array` | Load all entries from a record collection. |
| `useLocalStorage(path)` | `[value, setValue, clearValue]` | Persist overrides in localStorage. Read priority: hash → localStorage → flow data. |
| `useHideMode()` | `[isHidden, toggle]` | Toggle clean-URL mode. When active, overrides read/write to localStorage shadow keys instead of the URL hash. |
| `useUndoRedo()` | `{ canUndo, canRedo, undo, redo }` | Undo/redo for override history snapshots. |
| `useFeatureFlag(key)` | `boolean` | Read a feature flag by key. Reactively updates when localStorage-backed flag values change. |
| `useMode()` | `{ mode, switchMode }` | Read the current design mode and switch between modes (e.g., `prototype`, `inspect`, `present`). |

### Components

| Component | Package | Description |
|-----------|---------|-------------|
| `<StoryboardProvider>` | `@dfosco/storyboard-react` | Wraps the app. Loads flow from `?flow=` param. Already configured in `src/pages/_app.jsx`. |
| `<DevTools>` | `@dfosco/storyboard-react-primer` | Floating debug panel showing current flow, hash params, and flow data. Includes comments menu when configured. Already configured in `src/index.jsx`. |
| `<FlowDebug>` | `@dfosco/storyboard-react-primer` | Renders resolved flow data as formatted JSON. |
| `<FlowDataDemo>` | `@dfosco/storyboard-react-primer` | Interactive demo of flow data and overrides. |
| `<StoryboardForm>` | `@dfosco/storyboard-react-primer` | Form wrapper. `data` prop sets root path for child inputs. Buffers values locally; flushes to URL hash on submit. |
| `<TextInput>` | `@dfosco/storyboard-react-primer` | Wrapped Primer TextInput. `name` prop auto-binds to session state via form context. |
| `<Textarea>` | `@dfosco/storyboard-react-primer` | Wrapped Primer Textarea. `name` prop auto-binds to session state via form context. |
| `<Select>` | `@dfosco/storyboard-react-primer` | Wrapped Primer Select. `name` prop auto-binds to session state via form context. |
| `<Checkbox>` | `@dfosco/storyboard-react-primer` | Wrapped Primer Checkbox. `name` prop auto-binds to session state via form context. |

> **Reshaped equivalents:** `StoryboardForm`, `TextInput`, `Textarea`, `Select`, and `Checkbox` are also available from `@dfosco/storyboard-react-reshaped` with the same API but Reshaped styling.

### Utilities (`@dfosco/storyboard-core`)

| Function | Description |
|----------|-------------|
| `mountStoryboardCore(config, options)` | Initialize the entire storyboard system: toolbar, feature flags, body class sync, hide mode, comments. Call once at app startup with `storyboard.config.json` contents. |
| `init({ flows, objects, records })` | Seed the data index. Called automatically by the Vite plugin. |
| `loadFlow(name)` | Low-level flow loader. Returns resolved flow data. |
| `loadObject(name)` | Low-level object loader. Resolves `$ref`s, returns deep clone. |
| `loadRecord(name)` | Low-level record loader. Returns full array. |
| `findRecord(name, id)` | Find a single entry in a record collection by id. |
| `flowExists(name)` | Check if a flow file exists. |
| `listFlows()` | List all registered flow names. |
| `getFlowsForPrototype(name)` | List flows scoped to a specific prototype. |
| `listPrototypes()` | List all registered prototypes. |
| `getByPath(obj, path)` | Dot-notation path accessor. |
| `setByPath(obj, path, value)` | Dot-notation path setter (mutates in-place). |
| `deepClone(obj)` | Deep clone an object. |
| `deepMerge(target, source)` | Deep merge two objects (source wins, arrays replaced). |
| `getParam(key)` | Read a URL hash param. |
| `setParam(key, value)` | Write a URL hash param. |
| `getAllParams()` | Get all hash params as an object. |
| `removeParam(key)` | Remove a URL hash param. |
| `subscribeToHash(callback)` | Subscribe to hash changes (for reactive frameworks). |
| `getHashSnapshot()` | Returns current hash string (for `useSyncExternalStore`). |
| `getLocal(key)` / `setLocal(key, value)` / `removeLocal(key)` | localStorage read/write/remove for persistent overrides. |
| `isHideMode()` / `activateHideMode()` / `deactivateHideMode()` | Toggle clean-URL mode (overrides move from hash to localStorage). |
| `installHideParamListener()` | Listens for `?hide` / `?show` URL params to toggle hide mode. |
| `installHistorySync()` | Syncs hash changes to the undo/redo history stack. |
| `installBodyClassSync()` | Mirrors active overrides and flow to `<body>` CSS classes. Returns unsubscribe function. |
| `setFlowClass(name)` | Sets `sb-flow--{name}` class on `<body>`. Called automatically by `StoryboardProvider`. |
| `syncOverrideClasses()` | Manually sync override classes (called automatically by `installBodyClassSync`). |
| `initFeatureFlags(defaults)` | Initialize feature flags from config defaults. Called automatically by the Vite plugin when `featureFlags` is present in `storyboard.config.json`. |
| `getFlag(key)` | Read a feature flag value. Resolution order: localStorage → config defaults. |
| `setFlag(key, value)` | Set a flag value. Writes to localStorage for persistence. |
| `toggleFlag(key)` | Toggle a flag value by key. |
| `getAllFlags()` | Get all configured flags as `{ key: { default, current } }`. |
| `resetFlags()` | Clear all flag overrides from hash and localStorage; values revert to config defaults. |
| `getFlagKeys()` | Get all configured feature flag keys. |
| `TOOL_STATES` | Constant object with all valid tool states: `ACTIVE`, `INACTIVE`, `HIDDEN`, `DIMMED`, `DISABLED`. |
| `initToolbarToolStates(toolsConfig, options)` | Seed tool states from `toolbar.config.json` tools. Called automatically at startup. |
| `setToolbarToolState(id, state)` | Set runtime state for a toolbar tool. |
| `getToolbarToolState(id)` | Get current state for a tool (returns `'active'` for unknown IDs). |
| `isToolbarToolLocalOnly(id)` | Check if a tool is marked `localOnly` in config. |
| `subscribeToToolbarToolStates(callback)` | Subscribe to tool state changes. Returns unsubscribe function. |
| `getToolbarToolStatesSnapshot()` | Snapshot string for `useSyncExternalStore`. |

### Utilities (`@dfosco/storyboard-react`)

| Function | Description |
|----------|-------------|
| `installHashPreserver(router, basename)` | Intercepts both `<a>` link clicks and programmatic `router.navigate()` calls for client-side navigation with hash preservation. |

### Special JSON keys

| Key | Where | What it does |
|-----|-------|-------------|
| `$ref` | Any value in a flow or object | Replaced with the contents of the referenced object, by **name** (e.g., `"jane-doe"` finds `jane-doe.object.json`). |
| `$global` | Top-level array in a flow | Each name is loaded and deep-merged into the flow root. Flow values win on conflicts. |

---

## Comments

Storyboard includes an optional **comments system** backed by GitHub Discussions. Collaborators can leave contextual comments pinned to specific positions on any page — no database required.

### How it works

- Press **C** or click the **comment button** in the toolbar to enter comment mode — click anywhere on the page to place a comment
- If you're not signed in, clicking the comment button opens the login panel automatically
- Comments are stored as GitHub Discussions in your repository (one discussion per route)
- Each comment tracks its page position, so pins appear exactly where they were placed
- A **comments drawer** lists all comments for the current page
- Comments support **threaded replies**, **reactions**, **resolving**, and **drag-to-move**
- Authentication uses a GitHub personal access token (stored in localStorage)
- To remove your token, open the command menu → **Devtools** → **Logout (remove token)**

### Setup

1. Enable [GitHub Discussions](https://docs.github.com/en/discussions) on your repository
2. Add comments and repository configuration to `storyboard.config.json` at the repo root:

```json
{
  "repository": {
    "owner": "your-username",
    "name": "your-repo"
  },
  "comments": {
    "discussions": {
      "category": "General"
    }
  }
}
```

3. Comments are automatically initialized when `mountStoryboardCore()` is called with a config that includes the `comments` key. No separate import is needed:

```js
import { mountStoryboardCore } from '@dfosco/storyboard-core'
import storyboardConfig from '../storyboard.config.json'

mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
```

The comment button appears automatically in the toolbar when configured. Clicking it toggles comment mode directly — no submenu. Remove the `comments` key from `storyboard.config.json` to disable.

### Comments API (`@dfosco/storyboard-core/comments`)

| Function | Description |
|----------|-------------|
| `initCommentsConfig(config)` | Initialize from `storyboard.config.json`. Call once at startup. |
| `mountComments()` | Mount keyboard shortcut, cursor overlay, and click-to-comment UI. |
| `isCommentsEnabled()` | Check if comments are configured and enabled. |
| `toggleCommentMode()` | Toggle comment placement mode on/off. |
| `fetchRouteDiscussion(route)` | Fetch all comments for a given route. |
| `createComment(...)` | Create a new comment on a route. |
| `replyToComment(...)` | Reply to an existing comment thread. |
| `resolveComment(id)` | Mark a comment thread as resolved. |
| `moveComment(id, position)` | Update a comment's pinned position. |
| `deleteComment(id)` | Delete a comment. |
| `addReaction(id, content)` / `removeReaction(id, content)` | Toggle reactions on a comment. |
| `openCommentsDrawer()` / `closeCommentsDrawer()` | Open/close the comments drawer panel. |

---

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run lint     # ESLint
```

---

## Architecture

Detailed architecture docs live in `.github/architecture/`. Implementation plan and phase history in `.github/plans/`.

### Package Structure

The storyboard system is organized as an npm workspace with five publishable packages:

```
packages/
├── core/            ← @dfosco/storyboard-core — Framework-agnostic (pure JS, zero dependencies)
├── react/           ← @dfosco/storyboard-react — React hooks, context, provider (design-system agnostic)
├── react-primer/    ← @dfosco/storyboard-react-primer — Primer React form components, DevTools
├── react-reshaped/  ← @dfosco/storyboard-react-reshaped — Reshaped form components
└── tiny-canvas/     ← @dfosco/tiny-canvas — Lightweight canvas rendering engine
```

| Package | Purpose | Import |
|---------|---------|--------|
| `@dfosco/storyboard-core` | Data loading, URL hash state, dot-path utilities, localStorage, hide mode, comments, toolbar | `import { loadFlow, getParam } from '@dfosco/storyboard-core'` |
| `@dfosco/storyboard-react` | Provider, hooks (`useFlowData`, `useOverride`, `useRecord`, etc.), hash preserver, Viewfinder, CanvasPage | `import { useFlowData } from '@dfosco/storyboard-react'` |
| `@dfosco/storyboard-react-primer` | Primer-styled form inputs, DevTools, FlowDebug | `import { TextInput, DevTools } from '@dfosco/storyboard-react-primer'` |
| `@dfosco/storyboard-react-reshaped` | Reshaped-styled form inputs (same API as Primer) | `import { TextInput } from '@dfosco/storyboard-react-reshaped'` |
| `@dfosco/tiny-canvas` | Canvas rendering engine for widget-based canvases | `import { ... } from '@dfosco/tiny-canvas'` |

**For non-React frontends** (Alpine.js, Vue, Svelte, vanilla JS), import only from `@dfosco/storyboard-core`:

```js
import {
  init, loadFlow, flowExists, loadRecord, findRecord,
  getByPath, setByPath, deepClone,
  getParam, setParam, getAllParams, removeParam,
  subscribeToHash, getHashSnapshot,
} from '@dfosco/storyboard-core'

// 1. Seed the data index (the Vite plugin does this automatically)
init({ flows: { ... }, objects: { ... }, records: { ... } })

// 2. Load a flow
const data = await loadFlow('default')

// 3. Read flow values
const userName = getByPath(data, 'user.name')

// 4. Override values via URL hash
setParam('user.name', 'Alice')

// 5. React to hash changes (for reactive frameworks)
subscribeToHash(() => {
  const overriddenName = getParam('user.name') ?? getByPath(data, 'user.name')
  // update your UI
})
```
