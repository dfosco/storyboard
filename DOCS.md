# Storyboard Documentation

A comprehensive guide to building stateful prototypes with Storyboard.

---

## Table of Contents

### Learn Storyboard
- [What is Storyboard?](#what-is-storyboard)
- [Getting Started](#getting-started)
- [Your First Prototype](#your-first-prototype)
- [Core Concepts](#core-concepts)
- [Data Model Overview](#data-model-overview)
- [Flows](#flows)
- [Reading Data](#reading-data)
- [Overrides](#overrides)
- [Forms](#forms)
- [Objects](#objects)
- [Records & Dynamic Routes](#records--dynamic-routes)

### Features
- [Project Structure & Routing](#project-structure--routing)
- [Feature Flags](#feature-flags)
- [Body CSS Classes](#body-css-classes)
- [Hide Mode](#hide-mode)
- [Inspector](#inspector)
- [Organizing Prototypes](#organizing-prototypes)
- [Viewfinder](#viewfinder)
- [External Prototypes](#external-prototypes)
- [Canvas](#canvas)
- [Toolbar](#toolbar)
- [Comments](#comments)
- [Template Variables](#template-variables)
- [Design Systems](#design-systems)

### Reference
- [Toolbar Configuration](#toolbar-configuration)
- [Configuration Reference](#configuration-reference)
- [API Reference](#api-reference)

---

## What is Storyboard?

Storyboard is a framework for building **stateful prototypes** — interactive UIs backed by real data structures, where every interaction is saved to the URL.

Think of it as a middle ground between static mockups and a full app: you get realistic data, real navigation, and shareable state — without needing a backend, database, or heavy framework.

**What makes it different:**

- **Data lives in JSON files**, not hardcoded in components. Change the data, and every component that reads it updates automatically.
- **Every interaction is a URL.** Click a button, fill a form, toggle a setting — the URL updates. Copy it and paste it in Slack. Your colleague sees the exact same state.
- **Multiple states from the same UI.** Define different "flows" (data snapshots) and switch between them instantly — empty state, admin view, error state — without touching any code.
- **It's just a static site.** Build it, deploy it anywhere (GitHub Pages, Vercel, Netlify), share it with stakeholders. No server required.

Storyboard is built with [Vite](https://vite.dev) and uses [GitHub Primer](https://primer.style) as the default design system.

---

## Getting Started

### Install and run

```bash
npx storyboard setup   # first-time: install deps, Caddy proxy, start proxy
npx storyboard dev     # start dev server → http://storyboard.localhost/storyboard/
```

### What you'll see

When the dev server starts, you'll land on the **Viewfinder** — a dashboard showing all your prototypes. From here you can navigate into any prototype, create new ones, or switch between prototypes and canvases.

In the bottom-right corner, you'll see the **toolbar** — a floating bar with tools for switching flows, toggling features, opening the command menu (⌘K), and more.

### Build for production

```bash
npm run build    # outputs to dist/
```

> **Note:** `npm run dev` and `npm run build` still work as before. The `storyboard` CLI adds proxy management, worktree support, and creation tools on top.

### What's already wired for you

When you clone a Storyboard project, the following are pre-configured — you don't need to set any of this up:

- **Routing** — pages become URLs automatically (file-based routing)
- **Data loading** — JSON data files are discovered and loaded by a Vite plugin
- **State management** — overrides are persisted to the URL hash automatically
- **Toolbar** — the floating toolbar with flow switching, command menu, and dev tools
- **Hash preservation** — session state carries forward when navigating between pages

You just create pages and data files. Everything else is handled.

### The fastest path: create from the toolbar

You don't have to create files manually. The toolbar's **Create** menu lets you scaffold new prototypes, flows, and canvases through a simple form — no terminal needed. This guide teaches both approaches: toolbar-first for speed, files-first for understanding.

---

## Your First Prototype

Let's build a simple profile page prototype from scratch.

### 1. Create the prototype folder

Prototypes live inside `src/prototypes/`. Create a new folder:

```
src/prototypes/MyProfile/
```

### 2. Add prototype metadata

Create a `my-profile.prototype.json` file inside the folder:

```json
{
  "meta": {
    "title": "My Profile",
    "description": "A simple profile page prototype",
    "author": ["your-name"]
  }
}
```

### 3. Create a page

Add an `index.jsx` file — this becomes the main page of your prototype:

```jsx
import { useFlowData } from '@dfosco/storyboard-react'
import { Heading, Text, Avatar } from '@primer/react'

export default function ProfilePage() {
  const user = useFlowData('user')

  return (
    <div style={{ padding: 32 }}>
      <Avatar src={user?.avatar} size={64} />
      <Heading as="h1">{user?.name ?? 'Unknown User'}</Heading>
      <Text>{user?.bio ?? 'No bio yet'}</Text>
    </div>
  )
}
```

> **Important:** Always use optional chaining (`?.`) and fallback values (`??`). Data might not be loaded yet, or a field might not exist in the current flow.

### 4. Add flow data

Create a `default.flow.json` file in the same folder:

```json
{
  "user": {
    "name": "Jane Doe",
    "bio": "Designer & developer from San Francisco",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4"
  }
}
```

### 5. See it in action

Visit `http://storyboard.localhost/storyboard/MyProfile` — you should see the profile page with Jane's data.

Now try changing the name via the URL hash:

```
http://storyboard.localhost/storyboard/MyProfile#user.name=Alice
```

The page updates instantly. That's the core of Storyboard: **data in JSON, state in the URL**.

---

## Core Concepts

Now that you've built something, let's name the pieces.

### Prototypes

A **prototype** is a folder containing pages, data files, and metadata. It's the top-level unit of organization — one prototype per feature, screen, or experiment.

### Flows

A **flow** is a JSON file that defines the complete data context for a page. Think of it as a snapshot of your app's state: which user is logged in, what data is loaded, which features are enabled.

You can have multiple flows for the same prototype — `default.flow.json` for the happy path, `empty-state.flow.json` for a blank slate, `error.flow.json` for error states. Switch between them with a URL parameter.

### Objects

An **object** is a reusable data fragment — a JSON file representing a single entity like a user profile or navigation config. Objects can be pulled into flows via `$ref`, so you define data once and reuse it everywhere.

### Records

A **record** is a collection — an array of entries with unique IDs. Records power dynamic routes: a blog post list, a set of repositories, a team directory.

### Overrides

An **override** is a runtime change stored in the URL hash. When a user fills a form, clicks a button, or triggers an interaction, the change is written to the URL as a hash parameter like `#user.name=Alice`. This means:

- Every state change has a unique, shareable URL
- State persists across page refreshes
- You can undo/redo changes

### The data flow

```
JSON files (read-only)  →  Storyboard context  →  Components
                                    ↑
                           URL hash overrides
```

Data flows from JSON files into your components through Storyboard's hooks. When users interact, overrides are written to the URL hash. Components automatically re-render with the overridden values.

---

## Data Model Overview

Storyboard discovers data files automatically at dev/build time using a Vite plugin. Files are identified by their **suffix**:

| Suffix | What it is | Example filename |
|--------|-----------|-----------------|
| `.flow.json` | Page data context | `default.flow.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Collection of entries | `posts.record.json` |

### Where to put data files

Data files can live anywhere in `src/`, but conventionally:

- **Inside a prototype folder** — scoped to that prototype
- **In `src/data/`** — available globally across all prototypes

```
src/
├── data/
│   ├── navigation.object.json      ← global
│   └── team-members.record.json    ← global
├── prototypes/
│   └── Dashboard/
│       ├── default.flow.json        ← scoped to Dashboard
│       ├── admin.flow.json          ← scoped to Dashboard
│       └── sidebar.object.json      ← scoped to Dashboard
```

### Naming rules

- Every name+suffix must be **unique** (the build fails with a clear error on duplicates)
- Names are used as identifiers — `jane-doe.object.json` is referenced as `"jane-doe"`
- Use kebab-case for multi-word names

### JSONC support

All data files support comments using `//` and `/* */` syntax.

---

## Flows

Flows are the heart of Storyboard. A flow defines **what data is available** when someone visits a page.

### Creating a flow

Add a `.flow.json` file to your prototype folder:

```json
// default.flow.json
{
  "user": {
    "name": "Jane Doe",
    "role": "admin"
  },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 },
    { "id": 2, "name": "storyboard", "stars": 128 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true
  }
}
```

### Multiple flows for different states

Create additional flow files to prototype different scenarios:

| File | Scenario |
|------|----------|
| `default.flow.json` | Happy path — full data, active user |
| `empty-state.flow.json` | New user with no projects |
| `admin.flow.json` | Admin user with elevated permissions |
| `error-state.flow.json` | Data that triggers error states |

Switch between flows by changing the URL parameter:

```
http://storyboard.localhost/storyboard/Dashboard?flow=empty-state
```

No code changes needed. The toolbar also shows a **flow switcher** when multiple flows exist.

### Composing flows with `$ref`

Instead of duplicating data across flows, reference shared objects:

```json
// default.flow.json
{
  "user": { "$ref": "jane-doe" },
  "navigation": { "$ref": "navigation" },
  "projects": [
    { "id": 1, "name": "primer-react" }
  ]
}
```

`{ "$ref": "jane-doe" }` is replaced with the contents of `jane-doe.object.json`. References use **names**, not file paths — Storyboard finds the file automatically.

### Merging globals with `$global`

Use `$global` when an object's keys should be merged directly into the flow root:

```json
{
  "$global": ["navigation"],
  "pageTitle": "Dashboard"
}
```

If `navigation.object.json` contains `{ "primary": [...], "secondary": [...] }`, the resolved flow becomes:

```json
{
  "primary": [...],
  "secondary": [...],
  "pageTitle": "Dashboard"
}
```

Flow values win on conflicts.

### Page-flow matching

If no `?flow=` parameter is set, Storyboard looks for a flow file that matches the current page name. For example, visiting `/Dashboard` automatically loads `Dashboard.flow.json` if it exists. Otherwise it falls back to `default.flow.json`.

### Switching flows programmatically

```jsx
import { useFlow } from '@dfosco/storyboard-react'

function FlowPicker() {
  const { flowName, switchFlow } = useFlow()

  return (
    <div>
      <p>Current: {flowName}</p>
      <button onClick={() => switchFlow('empty-state')}>
        Show empty state
      </button>
    </div>
  )
}
```

### Listing available flows

```jsx
import { useFlows } from '@dfosco/storyboard-react'

function FlowMenu() {
  const flows = useFlows()
  // Returns all flows available for the current prototype
  return flows.map(f => <button key={f}>{f}</button>)
}
```

---

## Reading Data

Use `useFlowData()` to read data from the current flow. This is the primary way components access data.

```jsx
import { useFlowData } from '@dfosco/storyboard-react'

function ProjectList() {
  const projects = useFlowData('projects')
  const userName = useFlowData('user.name')
  const allData = useFlowData() // entire flow object

  return (
    <div>
      <h2>{userName}'s projects</h2>
      {projects?.map(p => <p key={p.id}>{p.name}</p>)}
    </div>
  )
}
```

### Dot-notation paths

Access nested values using dots:

```jsx
useFlowData('user')                // → { name: "Jane", profile: { bio: "..." } }
useFlowData('user.name')           // → "Jane"
useFlowData('user.profile.bio')    // → "Designer & developer"
useFlowData('projects.0')          // → first project
useFlowData('projects.0.name')     // → "primer-react"
```

### Overrides are applied transparently

`useFlowData()` automatically includes any URL hash overrides. If the URL is `#user.name=Alice`, then `useFlowData('user.name')` returns `"Alice"` — no extra code needed.

### Loading state

```jsx
import { useFlowLoading } from '@dfosco/storyboard-react'

function Page() {
  const loading = useFlowLoading()
  if (loading) return <p>Loading...</p>
  return <Content />
}
```

---

## Overrides

While `useFlowData()` is for **reading**, `useOverride()` is for **reading and writing**. Use it when you need a component to change data at runtime.

```jsx
import { useOverride } from '@dfosco/storyboard-react'

const [value, setValue, clearValue] = useOverride('user.name')
```

| Return | Purpose |
|--------|---------|
| `value` | Current value — reads from URL hash first, falls back to flow data |
| `setValue` | Writes to the URL hash |
| `clearValue` | Removes the hash param, reverting to the flow default |

### How it works

When you call `setValue('Alice')`, Storyboard updates the URL hash:

```
http://localhost:1234/Dashboard#user.name=Alice
```

Every component reading `user.name` (via `useFlowData` or `useOverride`) immediately sees the new value. Refresh the page — it persists. Copy the URL — it's shareable.

### Read priority

```
URL hash override  →  Flow JSON default  →  undefined
```

### Example: toggle button

```jsx
import { useOverride } from '@dfosco/storyboard-react'
import { Button } from '@primer/react'

function ThemeToggle() {
  const [theme, setTheme] = useOverride('settings.theme')

  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current: {theme ?? 'not set'}
    </Button>
  )
}
```

### Example: user switcher

```jsx
function UserSwitcher() {
  const [name, setName] = useOverride('user.name')
  const [role, setRole] = useOverride('user.role')

  return (
    <>
      <p>Current: {name} ({role})</p>
      <button onClick={() => { setName('Alice'); setRole('admin') }}>
        Switch to Alice
      </button>
      <button onClick={() => { setName('Bob'); setRole('viewer') }}>
        Switch to Bob
      </button>
    </>
  )
}
```

### Override namespaces

The path you pass to `useOverride()` determines what gets overridden:

| Namespace | Path format | Example |
|-----------|------------|---------|
| Flow data | `{field}` | `useOverride('user.name')` |
| Object data | `object.{name}.{field}` | `useOverride('object.jane-doe.name')` |
| Record data | `record.{name}.{entryId}.{field}` | `useOverride('record.posts.post-1.title')` |

### Undo / Redo

```jsx
import { useUndoRedo } from '@dfosco/storyboard-react'

function UndoButtons() {
  const { canUndo, canRedo, undo, redo } = useUndoRedo()

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </>
  )
}
```

---

## Forms

Storyboard provides form components that automatically persist to the URL on submit. No event handlers or state management needed.

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

### How it works

The `data` prop sets a root path. Each input's `name` is appended:

- `data="user"` + `name="name"` → overrides `user.name`
- `data="user"` + `name="profile.bio"` → overrides `user.profile.bio`

Values are buffered while typing. On submit, they flush to the URL hash:

```
#user.name=Alice&user.profile.bio=Hello%20world
```

### Available form components

| Component | Description |
|-----------|-------------|
| `StoryboardForm` | Form wrapper. Sets the root data path. |
| `TextInput` | Text input field |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown select |
| `Checkbox` | Checkbox toggle |

Import from `@dfosco/storyboard-react-primer` for Primer-styled components, or from `@dfosco/storyboard-react-reshaped` for Reshaped-styled equivalents. Same API, different styling.

---

## Objects

Objects are **reusable data fragments** — standalone JSON files representing a single entity. Define data once, reference it from any flow.

### Creating an object

Add a `.object.json` file:

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

### Referencing from a flow

Use `$ref` to pull an object into a flow:

```json
// default.flow.json
{
  "user": { "$ref": "jane-doe" },
  "settings": { "theme": "dark" }
}
```

The object is resolved by **name** — no file paths needed.

### Using objects directly (without a flow)

Load objects directly in components with `useObject()`:

```jsx
import { useObject } from '@dfosco/storyboard-react'

function Sidebar() {
  const nav = useObject('navigation')               // full object
  const bio = useObject('jane-doe', 'profile.bio')   // dot-notation path

  return <nav>{nav?.items?.map(i => <a href={i.url}>{i.label}</a>)}</nav>
}
```

This is useful when a component needs shared data but the page doesn't use a flow.

### Overriding object fields

When accessed through a flow (`$ref`), override by the flow path:

```jsx
const [name, setName] = useOverride('user.name')
// URL: #user.name=Alice
```

When accessed directly (`useObject`), override by the object namespace:

```jsx
const [name, setName] = useOverride('object.jane-doe.name')
// URL: #object.jane-doe.name=Alice
```

### Prototype scoping

Objects inside a prototype folder are automatically scoped to that prototype. If both a global `sidebar.object.json` and a prototype-local one exist, the local version takes priority within that prototype.

---

## Records & Dynamic Routes

Records are **collections** — arrays of entries with unique IDs. They're the building block for any prototype with lists and detail pages.

### Creating a record

Add a `.record.json` file:

```json
// posts.record.json
[
  {
    "id": "welcome-to-storyboard",
    "title": "Welcome to Storyboard",
    "author": "Jane Doe",
    "body": "Storyboard is a prototyping framework..."
  },
  {
    "id": "data-driven-prototyping",
    "title": "Data-Driven Prototyping",
    "author": "Jane Doe",
    "body": "Traditional prototyping tools force you..."
  }
]
```

Every entry must have a unique `id` field.

### Reading a single entry

Use `useRecord()` in a dynamic route page. The hook matches the URL param against the record's `id` field:

```jsx
// src/prototypes/Blog/pages/[slug].jsx
import { useRecord } from '@dfosco/storyboard-react'

function BlogPost() {
  const post = useRecord('posts', 'slug')
  // URL /Blog/welcome-to-storyboard → matches entry with id "welcome-to-storyboard"

  return (
    <article>
      <h1>{post?.title}</h1>
      <p>By {post?.author}</p>
      <p>{post?.body}</p>
    </article>
  )
}
```

The second argument (`'slug'`) tells Storyboard which URL parameter to match against. If omitted, it defaults to `'id'`.

### Reading all entries

Use `useRecords()` for list pages:

```jsx
// src/prototypes/Blog/index.jsx
import { useRecords } from '@dfosco/storyboard-react'

function BlogIndex() {
  const posts = useRecords('posts')

  return posts.filter(p => p.id).map(post => (
    <a key={post.id} href={`/Blog/${post.id}`}>
      {post.title}
    </a>
  ))
}
```

### Overriding record entries

Use the `record.{name}.{entryId}.{field}` namespace:

```jsx
const [title, setTitle] = useOverride('record.posts.welcome-to-storyboard.title')
setTitle('Updated Title')
// URL: #record.posts.welcome-to-storyboard.title=Updated%20Title
```

### Creating entries at runtime

Set override fields with a new ID to create entries that don't exist in the JSON:

```
#record.posts.my-new-post.title=Draft%20Post&record.posts.my-new-post.author=Alice
```

`useRecords('posts')` will include a new entry `{ id: "my-new-post", title: "Draft Post", author: "Alice" }`.

### Removing entries at runtime

Override the `id` to an empty string to effectively remove an entry from lists:

```jsx
const [id, setId] = useOverride('record.posts.welcome-to-storyboard.id')
setId('')  // "removes" this entry from filtered lists
```

For this to work, your list components should filter out entries with empty IDs: `posts.filter(p => p.id)`.

---

## Project Structure & Routing

### File-based routing

Storyboard uses file-based routing — every `.jsx` file in your project automatically becomes a page with its own URL. No router configuration needed.

```
src/pages/index.jsx           → /
src/pages/Overview.jsx        → /Overview
src/pages/settings/index.jsx  → /settings
```

To create a new page, just add a `.jsx` file.

### Prototype folders

Each prototype is a folder inside `src/prototypes/`. The folder name becomes the URL path:

```
src/prototypes/
├── Dashboard/
│   ├── dashboard.prototype.json
│   ├── default.flow.json
│   └── index.jsx               → /Dashboard
├── Settings/
│   ├── settings.prototype.json
│   ├── default.flow.json
│   ├── index.jsx               → /Settings
│   └── pages/
│       └── advanced.jsx        → /Settings/advanced
```

### Dynamic routes

Use `[paramName]` brackets in filenames to create dynamic URL segments. This is how records connect to pages:

```
src/prototypes/Blog/pages/[slug].jsx  → /Blog/:slug
```

Pair this with a record collection and `useRecord()` to create data-driven detail pages. See [Records & Dynamic Routes](#records--dynamic-routes).

### Folder groups

Use `.folder` directories to visually group prototypes without affecting URLs:

```
src/prototypes/
├── main.folder/                  ← group (not in URL)
│   ├── main.folder.json          ← group metadata
│   ├── Dashboard/
│   │   └── index.jsx             → /Dashboard
│   └── Settings/
│       └── index.jsx             → /Settings
```

The `.folder` suffix tells Storyboard this is a grouping container — it appears as a collapsible section in the Viewfinder but doesn't add a URL segment.

### Hash preservation

URL hash params (your session state) are automatically preserved when navigating between pages. Click a link, and your overrides carry forward — no extra code needed.

Hash is **not** preserved when:
- The target URL already has its own hash
- The link points to an external site
- You call `switchFlow()` (intentionally clears state for the new flow)

---

## Feature Flags

Feature flags let you toggle features on and off without changing code. They're configured in `storyboard.config.json`.

### Configuration

```json
// storyboard.config.json
{
  "featureFlags": {
    "show-banner": true,
    "new-navigation": false
  }
}
```

### Reading a flag

```jsx
import { useFeatureFlag } from '@dfosco/storyboard-react'

function Banner() {
  const showBanner = useFeatureFlag('show-banner')
  if (!showBanner) return null
  return <div className="banner">New feature available!</div>
}
```

### Changing flags at runtime

- **DevTools UI:** Open the toolbar → **Feature Flags** submenu and toggle any flag
- **Programmatic API:** Use `setFlag()`, `toggleFlag()`, or `resetFlags()` from `@dfosco/storyboard-core`

```js
import { setFlag, toggleFlag, resetFlags } from '@dfosco/storyboard-core'

setFlag('show-banner', false)   // turn off
toggleFlag('new-navigation')     // flip current value
resetFlags()                     // revert all to config defaults
```

### Resolution priority

```
localStorage  →  storyboard.config.json default
```

When you toggle a flag, it's persisted to localStorage. Resetting clears localStorage, reverting to the config default.

### CSS body classes

Every flag that resolves to `true` adds a CSS class to `<body>`:

```css
/* Flag "show-banner" is true → body has class "sb-ff-show-banner" */
.promo-banner { display: none; }
body.sb-ff-show-banner .promo-banner { display: block; }
```

This lets you toggle visibility with pure CSS — no JavaScript needed in the component.

---

## Body CSS Classes

Storyboard automatically mirrors state as CSS classes on `<body>`. This enables CSS-driven styling based on overrides, flows, and feature flags.

### Class patterns

| Source | CSS class | Example |
|--------|-----------|---------|
| Override `key=value` | `sb-{key}--{value}` | `#theme=dark` → `sb-theme--dark` |
| Nested override | Dots become dashes | `#settings.theme=dark` → `sb-settings-theme--dark` |
| Active flow | `sb-flow--{name}` | Flow "dashboard" → `sb-flow--dashboard` |
| Feature flag | `sb-ff-{name}` | Flag "show-banner" → `sb-ff-show-banner` |

### Using with CSS Modules

Reference body classes with `:global()` in CSS Modules:

```css
/* MyComponent.module.css */
:global(.sb-theme--dark) .panel {
  background: var(--bgColor-muted);
}

:global(.sb-flow--dashboard) .sidebar {
  display: block;
}
```

### When to use this

Body CSS classes are ideal for:

- **Theme switching** — change colors/layouts based on an override
- **Flow-specific styling** — show/hide elements per flow
- **Feature flag styling** — toggle visual features with CSS

Classes are added and removed reactively — no page reload needed.

---

## Hide Mode

Hide mode gives you **clean URLs** for sharing and presenting. When active, overrides are moved from the URL hash into localStorage, so the URL stays clean while your session state is preserved.

### How it works

| Mode | URL looks like | State stored in |
|------|---------------|----------------|
| Normal | `/Dashboard#user.name=Alice&theme=dark` | URL hash |
| Hidden | `/Dashboard` | localStorage |

### Activating hide mode

- **URL parameter:** Add `?hide` to any URL
- **Toolbar:** Use the hide mode toggle in the toolbar
- **Programmatically:**

```jsx
import { useHideMode } from '@dfosco/storyboard-react'

function HideToggle() {
  const [isHidden, toggleHide] = useHideMode()

  return (
    <button onClick={toggleHide}>
      {isHidden ? 'Show URL state' : 'Hide URL state'}
    </button>
  )
}
```

### Deactivating

Add `?show` to the URL, or use the toggle again. Overrides are restored from localStorage back to the URL hash.

### When to use this

- **Sharing with stakeholders** who don't need to see hash params
- **Presentations** where clean URLs look more professional
- **Screenshots** where the URL bar should be clean

---

## Inspector

The Inspector lets you see **what data a component is reading** — useful for debugging and understanding how data flows through your prototype.

### Using the Inspector

- Press **⌘I** or click the **Inspector** button in the toolbar to toggle it on
- Hover over any component to see its data bindings
- The Inspector panel shows the current flow data, active overrides, and which hooks are being used

The Inspector is a development tool — it's automatically disabled in deployed builds.

---

## Organizing Prototypes

As your project grows, you'll need ways to organize multiple prototypes.

### Prototype folders

Each prototype is a folder in `src/prototypes/` with at least a `.prototype.json` metadata file:

```
src/prototypes/
├── Dashboard/
│   ├── dashboard.prototype.json
│   ├── default.flow.json
│   └── index.jsx
├── Settings/
│   ├── settings.prototype.json
│   ├── default.flow.json
│   └── index.jsx
```

### Prototype metadata

The `.prototype.json` file describes the prototype:

```json
{
  "meta": {
    "title": "Dashboard",
    "description": "Main dashboard with project overview",
    "author": ["janedoe"],
    "tags": ["admin", "overview"],
    "team": "design-systems"
  }
}
```

### Folder groups

Use `.folder` directories to group related prototypes:

```
src/prototypes/
├── admin.folder/
│   ├── admin.folder.json         ← group metadata (title, icon)
│   ├── Dashboard/
│   │   └── ...
│   └── Settings/
│       └── ...
├── onboarding.folder/
│   ├── onboarding.folder.json
│   ├── Signup/
│   │   └── ...
│   └── Welcome/
│       └── ...
```

Groups appear as collapsible sections in the Viewfinder. The `.folder` suffix is stripped from URLs.

### Prototype scoping

Data files (objects, flows, records) inside a prototype folder are automatically **scoped** to that prototype. This means:

- A `sidebar.object.json` inside `Dashboard/` doesn't conflict with one inside `Settings/`
- Scoped data takes priority over global data with the same name
- Duplicating a prototype folder "just works" — no name conflicts

---

## Viewfinder

The Viewfinder is the **home page** of your Storyboard project — a dashboard that shows all your prototypes, organized by folder groups.

### What it shows

- **Prototypes** listed in cards, grouped by `.folder` directories
- **Canvases** accessible via a Prototypes/Canvases toggle
- **External prototypes** marked with an external badge
- **Metadata** including title, description, author, and last updated time

### Navigation

- Click a prototype card to navigate into it
- Click an external prototype to open it in a new tab
- Expand/collapse folder groups (state is remembered in localStorage)
- Sort by title or last updated

### Accessing the Viewfinder

The Viewfinder is the default route (`/`) of your project. You can also access it via the Viewfinder button in the toolbar.

---

## External Prototypes

An external prototype links to a prototype hosted at an external URL. It appears in the Viewfinder alongside regular prototypes but opens in a new tab.

### Creating an external prototype

Create a folder with only a `.prototype.json` file containing a `url` field:

```json
// external-app.prototype.json
{
  "meta": {
    "title": "External App",
    "description": "Hosted on another domain",
    "author": ["janedoe"]
  },
  "url": "https://example.com/prototype"
}
```

No `index.jsx` or flow files needed. The Viewfinder shows an "external" badge, and clicking opens the URL in a new tab.

### Creating via the Workshop

Use the toolbar's create menu → **New prototype** → check **External prototype** → enter the URL.

---

## Canvas

Canvases are **free-form boards** for arranging widgets — sticky notes, markdown blocks, prototype embeds, and more. Think of them as a lightweight whiteboard for your prototyping project.

### Creating a canvas

Use the toolbar's create menu → **New canvas**, or create a `.canvas.jsonl` file manually.

### Widget types

| Widget | Description |
|--------|-------------|
| **Sticky note** | Colored sticky note with editable text |
| **Markdown** | Rich text block with Markdown rendering |
| **Prototype** | Embedded iframe of another prototype or any URL — including Figma embeds, CodePen, deployed apps, etc. Supports zoom controls. |
| **Link preview** | Preview card for an external URL |
| **Component** | Custom JSX component from a `.story.jsx` file |

### Using canvases

- **Navigate** by dragging the canvas background
- **Add widgets** via the toolbar's add widget button
- **Move widgets** by dragging them
- **Resize widgets** by dragging edges
- **Edit widgets** by double-clicking or using the widget toolbar
- **Select multiple** by shift-clicking

### Embedding Figma files

The **Prototype** widget can embed any URL in an iframe — including Figma designs. To add a Figma embed:

1. In Figma, click **Share** → **Get embed code**, or copy the file URL
2. Add a Prototype widget to your canvas
3. Paste the Figma embed URL (e.g., `https://www.figma.com/embed?embed_host=share&url=...`)

The widget supports zoom controls, so you can zoom in/out on the embedded Figma file directly from the canvas.

This also works for any embeddable URL: CodePen, CodeSandbox, deployed apps, Google Docs, etc.

### Custom component widgets

Create a `.story.jsx` file in `src/components/`. Each named export becomes an available component widget on any canvas:

```jsx
// my-component.story.jsx
export function StatusCard({ label, count }) {
  return <div className="card">{label}: {count}</div>
}

export function TeamAvatar({ name }) {
  return <div className="avatar">{name[0]}</div>
}
```

---

## Toolbar

The toolbar is a floating bar (bottom-right) that provides quick access to common actions.

### Built-in tools

| Tool | What it does |
|------|-------------|
| **Command menu** | Search and run any action (⌘K) |
| **Flow switcher** | Switch between flows for the current prototype |
| **Theme** | Toggle between light, dark, and auto themes |
| **Inspector** | Inspect component data (⌘I) |
| **Comments** | Toggle comment placement mode (C) |
| **Create** | Create new prototypes, flows, canvases |
| **Viewfinder** | Navigate to the prototype dashboard |
| **Docs** | Open documentation (⌘D) |
| **DevTools** | Feature flags, hide mode, logout |

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘ + K | Open/close command menu |
| ⌘ + . | Toggle toolbar visibility |
| ⌘ + I | Toggle inspector |
| ⌘ + D | Open docs |
| C | Toggle comment mode |

---

## Toolbar Configuration

The toolbar is fully configurable via `toolbar.config.json`. The base config ships inside `@dfosco/storyboard-core`, and prototypes can override it.

### Tool config schema

Each tool is declared in the `tools` object:

```json
{
  "tools": {
    "inspector": {
      "ariaLabel": "Inspect components",
      "icon": "iconoir/square-dashed",
      "render": "sidepanel",
      "surface": "main-toolbar",
      "handler": "core:inspector",
      "state": "active",
      "modes": ["*"],
      "localOnly": false,
      "excludeRoutes": ["^/$", "/viewfinder"]
    }
  }
}
```

| Property | Description |
|----------|-------------|
| `render` | How it renders: `button`, `menu`, `sidepanel`, `separator`, `link`, `submenu`, `zoom-control` |
| `surface` | Where it appears: `main-toolbar`, `command-list`, `canvas-toolbar` |
| `handler` | Module reference: `core:name` for built-in, `custom:name` for client-provided |
| `state` | Initial state (default: `"active"`) |
| `modes` | Which modes show this tool. `["*"]` = all modes |
| `localOnly` | When `true`, disabled in deployed environments; shows green dot in dev |
| `excludeRoutes` | Regex patterns — tool is hidden on matching routes |

### Tool states

| State | Visible | Clickable | Description |
|-------|:-------:|:---------:|-------------|
| `active` | ✅ | ✅ | Normal (default) |
| `inactive` | ✅ | ❌ | Disabled appearance |
| `hidden` | ❌ | — | Hidden but shortcuts still work |
| `dimmed` | ✅ | ✅ | Reduced opacity, interactive on hover |
| `disabled` | ❌ | ❌ | Completely removed |

### Prototype-level overrides

Place a `toolbar.config.json` inside a prototype folder to override tools for that prototype:

```json
// src/prototypes/Dashboard/toolbar.config.json
{
  "tools": {
    "inspector": { "state": "dimmed" },
    "comments": { "state": "disabled" }
  }
}
```

Overrides are deep-merged with the base config and automatically cleared when navigating away.

### Setting state at runtime

```js
import { setToolbarToolState, TOOL_STATES } from '@dfosco/storyboard-core'

setToolbarToolState('inspector', TOOL_STATES.INACTIVE)
setToolbarToolState('inspector', TOOL_STATES.ACTIVE)
```

---

## Comments

Storyboard includes a **comments system** backed by GitHub Discussions. Collaborators can leave contextual comments pinned to specific positions on any page.

### How it works

1. Press **C** or click the **comment button** in the toolbar to enter comment mode
2. Click anywhere on the page to place a comment
3. Comments are stored as GitHub Discussions in your repository
4. Each comment tracks its page position — pins appear exactly where they were placed

### Features

- **Threaded replies** — respond to existing comments
- **Reactions** — add emoji reactions
- **Resolving** — mark comment threads as resolved
- **Drag-to-move** — reposition comment pins
- **Authentication** via GitHub personal access token (stored in localStorage)

### Setup

1. Enable [GitHub Discussions](https://docs.github.com/en/discussions) on your repository

2. Add repository and comments configuration to `storyboard.config.json`:

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

Comments are automatically initialized by `mountStoryboardCore()`. The comment button appears in the toolbar when configured. Remove the `comments` key to disable.

---

## Template Variables

Data files support **build-time template variables** using `${variableName}` syntax inside JSON string values. Variables are resolved based on the file's location — no runtime overhead.

### Available variables

| Variable | Description | Example value |
|----------|-------------|--------------|
| `${currentDir}` | Directory containing the file, relative to project root | `src/prototypes/main.folder/Dashboard` |
| `${currentProto}` | Path to the prototype directory | `src/prototypes/main.folder/Dashboard` |
| `${currentProtoDir}` | Path to the first parent `.folder` directory | `src/prototypes/main.folder` |

### Example

```json
// sidenav.object.json (inside src/prototypes/main.folder/Dashboard/)
{
  "items": [
    { "label": "Overview", "url": "/${currentDir}/overview" },
    { "label": "Home", "proto": "${currentProto}" }
  ]
}
```

### Rules

- Only **string values** are processed — keys, numbers, and booleans are left untouched
- `${currentProto}` and `${currentProtoDir}` resolve to empty string (with a console warning) when the file is outside a prototype or `.folder` directory
- Unknown variables like `${foo}` are left as-is

---

## Design Systems

Storyboard uses [GitHub Primer](https://primer.style) as the default design system, but supports using **different design systems on different pages**.

### Per-page design systems

Since routing is lazy-loaded (each page is its own bundle), you can import any design system on any page without affecting others:

```jsx
// A page using Primer (default)
import { Button, Text } from '@primer/react'

// A different page using Reshaped
import { Button, Text } from 'reshaped'
```

Pages using different design systems don't affect each other's bundle size.

### Storyboard form components

Form components that auto-persist to URL state are available for both systems:

| Package | Import |
|---------|--------|
| Primer-styled | `import { TextInput } from '@dfosco/storyboard-react-primer'` |
| Reshaped-styled | `import { TextInput } from '@dfosco/storyboard-react-reshaped'` |

Same API, different styling. Both include `StoryboardForm`, `TextInput`, `Textarea`, `Select`, and `Checkbox`.

---

## Configuration Reference

The `storyboard.config.json` file at the project root configures project-wide settings.

```json
{
  "repository": {
    "owner": "your-username",
    "name": "your-repo"
  },
  "featureFlags": {
    "show-banner": true,
    "new-navigation": false
  },
  "comments": {
    "discussions": {
      "category": "General"
    }
  },
  "modes": {
    "enabled": false
  },
  "workshop": {
    "features": {
      "createPrototype": true,
      "createFlow": true,
      "createCanvas": true
    },
    "partials": [
      { "directory": "template", "name": "Application" }
    ]
  }
}
```

| Key | Description |
|-----|-------------|
| `repository` | GitHub repository info (owner, name). Used by comments and other integrations. |
| `featureFlags` | Default values for feature flags. Keys are flag names, values are booleans. |
| `comments` | Comments configuration. Requires `repository` to be set. |
| `comments.discussions.category` | GitHub Discussions category to use for comments. |
| `modes` | Design mode system. Set `enabled: true` to enable mode switching. |
| `workshop` | Workshop feature toggles. Controls which "create" actions are available in the toolbar. |
| `workshop.features` | Enable/disable individual workshop features: `createPrototype`, `createFlow`, `createCanvas`, `createPage`. |
| `workshop.partials` | Template directories for the prototype creation wizard. |

---

## API Reference

### Hooks (`@dfosco/storyboard-react`)

| Hook | Returns | Description |
|------|---------|-------------|
| `useFlowData(path?)` | `any` | Read flow data by dot-notation path. Omit path for entire flow. Overrides applied transparently. |
| `useFlowLoading()` | `boolean` | `true` while flow data is loading. |
| `useOverride(path)` | `[value, setValue, clearValue]` | Read/write URL hash overrides. Works with flow, object, and record namespaces. |
| `useFlow()` | `{ flowName, switchFlow }` | Current flow name and switch function. |
| `useFlows()` | `string[]` | List all available flows for the current prototype. |
| `useObject(name, path?)` | `any` | Load an object by name. Supports dot-notation path and hash overrides. |
| `useRecord(name, param?)` | `object \| null` | Load a single record entry matched by URL param. Defaults to `'id'`. |
| `useRecords(name)` | `Array` | Load all entries from a record collection. |
| `useLocalStorage(path)` | `[value, setValue, clearValue]` | Persist overrides in localStorage. Read priority: hash → localStorage → flow data. |
| `useHideMode()` | `[isHidden, toggle]` | Toggle clean-URL mode. |
| `useUndoRedo()` | `{ canUndo, canRedo, undo, redo }` | Undo/redo for override history. |
| `useFeatureFlag(key)` | `boolean` | Read a feature flag value reactively. |
| `useMode()` | `{ mode, switchMode }` | Read/switch design modes. |

### Components

| Component | Package | Description |
|-----------|---------|-------------|
| `StoryboardProvider` | `@dfosco/storyboard-react` | Wraps the app. Loads flow data into context. |
| `StoryboardForm` | `@dfosco/storyboard-react-primer` | Form wrapper with auto-persist. `data` prop sets root path. |
| `TextInput` | `@dfosco/storyboard-react-primer` | Text input bound to session state. |
| `Textarea` | `@dfosco/storyboard-react-primer` | Multi-line text input bound to session state. |
| `Select` | `@dfosco/storyboard-react-primer` | Dropdown bound to session state. |
| `Checkbox` | `@dfosco/storyboard-react-primer` | Checkbox bound to session state. |

### Core Utilities (`@dfosco/storyboard-core`)

| Function | Description |
|----------|-------------|
| `mountStoryboardCore(config, options)` | Initialize the storyboard system. Call once at app startup. |
| `init({ flows, objects, records })` | Seed the data index. Called automatically by the Vite plugin. |
| `loadFlow(name)` | Load and resolve a flow by name. |
| `loadObject(name, scope?)` | Load an object by name with optional prototype scope. |
| `loadRecord(name)` | Load all entries from a record. |
| `findRecord(name, id)` | Find a single record entry by ID. |
| `flowExists(name)` | Check if a flow exists. |
| `listFlows()` | List all registered flow names. |
| `getFlowsForPrototype(name)` | List flows scoped to a prototype. |
| `listPrototypes()` | List all registered prototypes. |
| `getByPath(obj, path)` | Read a nested value by dot-notation path. |
| `setByPath(obj, path, value)` | Set a nested value by dot-notation path (mutates). |
| `deepClone(obj)` | Deep clone an object. |
| `deepMerge(target, source)` | Deep merge (source wins, arrays replaced). |
| `getParam(key)` | Read a URL hash parameter. |
| `setParam(key, value)` | Write a URL hash parameter. |
| `getAllParams()` | Get all hash params as an object. |
| `removeParam(key)` | Remove a hash parameter. |
| `subscribeToHash(callback)` | Subscribe to hash changes. |
| `initFeatureFlags(defaults)` | Initialize feature flags from config. |
| `getFlag(key)` | Read a flag (localStorage → config default). |
| `setFlag(key, value)` | Set a flag (persists to localStorage). |
| `toggleFlag(key)` | Toggle a flag value. |
| `resetFlags()` | Revert all flags to config defaults. |
| `setToolbarToolState(id, state)` | Set runtime state for a toolbar tool. |
| `TOOL_STATES` | Constants: `ACTIVE`, `INACTIVE`, `HIDDEN`, `DIMMED`, `DISABLED`. |

### Special JSON Keys

| Key | Where | What it does |
|-----|-------|-------------|
| `$ref` | Any value in a flow or object | Replaced with the referenced object's contents (by name). |
| `$global` | Top-level array in a flow | Each name is loaded and deep-merged into the flow root. |
