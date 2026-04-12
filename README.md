# Storyboard

Storyboard is a framework for building **stateful prototypes**: real UI, structured local data, and shareable URL-based state in one workflow.

It is designed as a middle ground between static mockups and full app environments. You can model realistic scenarios, review interaction details, and deploy as a static site without wiring APIs or backend infrastructure.

## Why teams use it

- **Data-first prototyping**: prototype state lives in JSON files, not hardcoded component fixtures.
- **Shareable interactions**: runtime changes are encoded in the URL, so anyone can open the exact same state.
- **Scenario-driven work**: switch between flows (default, empty, error, admin, etc.) without changing UI code.
- **UI + tooling together**: build pages and use built-in tools (Create, Flow switcher, Inspector, Canvas, Viewfinder) in the same app.

## Quick start

```bash
npm install
npm run dev
```

This starts a local Storyboard instance (usually `http://localhost:1234`).

```bash
npm run build
```

The output is static and can be deployed to GitHub Pages, Vercel, Netlify, or any static host.

## What you see in the UI

- **Viewfinder** (`/`): dashboard of all prototypes (and canvases), including grouped folders and external prototypes.
- **Toolbar** (bottom-right): command menu, flow switcher, inspector, docs, and dev tools.
- **Create menu**: scaffold prototypes, flows, and canvases from a form.
- **Canvas**: free-form board for notes, embeds, links, and prototype references.

## Create a prototype (UI-first)

1. Run `npm run dev`.
2. Open the toolbar and choose **Create -> New prototype**.
3. Fill metadata/template options and submit.
4. Storyboard generates the starter files in `src/prototypes/`.

This is local live editing: during local dev, UI actions can write files directly into your repository.

## Create a prototype (files-first)

You can also create the same structure manually:

```text
src/prototypes/MyProfile/
  my-profile.prototype.json
  default.flow.json
  index.jsx
```

```json
// my-profile.prototype.json
{
  "meta": {
    "title": "My Profile",
    "description": "Simple profile prototype",
    "author": ["your-name"]
  }
}
```

```json
// default.flow.json
{
  "user": {
    "name": "Jane Doe",
    "bio": "Designer & developer",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4"
  }
}
```

```jsx
// index.jsx
import { Avatar, Heading, Text } from '@primer/react'
import { useFlowData } from '@dfosco/storyboard-react'

export default function MyProfilePage() {
  const user = useFlowData('user')

  return (
    <main>
      <Avatar src={user?.avatar} size={64} />
      <Heading as="h1">{user?.name ?? 'Unknown user'}</Heading>
      <Text>{user?.bio ?? 'No bio yet'}</Text>
    </main>
  )
}
```

## Core data model

| File type | Purpose | Example |
| --- | --- | --- |
| `.prototype.json` | Prototype metadata and registration | `my-profile.prototype.json` |
| `.flow.json` | Scenario/state snapshot used as page context | `default.flow.json` |
| `.object.json` | Reusable data fragment shared by flows | `navigation.object.json` |
| `.record.json` | Collection data for list/detail routes | `posts.record.json` |

Notes:
- Flows can reference objects with `{"$ref": "object-name"}`.
- Prototype-local data is scoped automatically, with fallback to global data.
- Components should always handle missing data with optional chaining/fallbacks.

## URL-driven state model

- `?flow=empty-state` selects a different flow snapshot.
- `#user.name=Alice` overrides a value at runtime.

That combination makes states reproducible, linkable, and fast to iterate on.

## Learn more

- Full docs: [`DOCS.md`](./DOCS.md)
- Architecture docs: [`.github/architecture/`](./.github/architecture/)
