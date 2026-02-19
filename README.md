# Storyboard

A prototyping app powered by [Storyboard](https://github.com/dfosco/storyboard-source), a data-driven prototyping meta-framework for React.

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
npm install
npm run dev
```

Open [http://localhost:1234/storyboard/](http://localhost:1234/storyboard/) in your browser.

## Configuring the Base Path

By default the app is served at `/storyboard/`. If your GitHub repo has a different name, update the base path:

1. Edit `vite.config.js` — change the default in this line:
   ```js
   const base = process.env.VITE_BASE_PATH || '/your-repo-name/'
   ```

2. That's it — the GitHub Actions workflows automatically read this value for deployments.

## Project Structure

```
src/
├── index.jsx           # App entry point
├── globals.css         # Primer design tokens & typography
├── reset.css           # CSS reset
├── pages/              # File-based routes (powered by @generouted/react-router)
│   ├── _app.jsx        # Layout wrapper (StoryboardProvider + Suspense)
│   ├── index.jsx       # Home page
│   ├── Issues.jsx      # Primer example page
│   └── issues/         # Reshaped example pages with dynamic routes
│       ├── index.jsx   # Issue list (uses records)
│       └── [id].jsx    # Issue detail (dynamic route)
├── components/         # Shared components
├── templates/          # Page layout templates
└── data/               # Scene, object, and record JSON files
```

## Pages & Routing

Routes are auto-generated from `src/pages/`:
- `src/pages/index.jsx` → `/`
- `src/pages/Issues.jsx` → `/Issues`
- `src/pages/issues/index.jsx` → `/issues`
- `src/pages/issues/[id].jsx` → `/issues/:id`

Create a new page by adding a `.jsx` file to `src/pages/`.

## Storyboard Data

Data files use suffix-based naming and are auto-discovered by the Vite plugin:

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.scene.json` | Page data context | `default.scene.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Collection with `id` per entry | `issues.record.json` |

Use hooks to access data in components:

```jsx
import { useSceneData, useRecord, useRecords } from '@dfosco/storyboard-react'

const user = useSceneData('user')           // dot-notation path
const issue = useRecord('issues')           // single record by URL param
const allIssues = useRecords('issues')      // all records
```

## Design Systems

This repo includes example pages for both design systems:

- **Primer** (`@primer/react`) — Used in `Issues.jsx` and the home page
- **Reshaped** (`reshaped`) — Used in `issues/` pages

Delete whichever you don't need, along with its dependencies in `package.json`.

## Comments System

To enable the comments system (powered by GitHub Discussions):

1. Enable Discussions on your GitHub repo
2. Edit `storyboard.config.json`:
   ```json
   {
     "comments": {
       "repo": {
         "owner": "YOUR_GITHUB_USERNAME",
         "name": "YOUR_REPO_NAME"
       },
       "discussions": {
         "category": "General"
       }
     }
   }
   ```

## Deployment

### GitHub Pages (automatic)

Push to `main` to deploy to GitHub Pages. Branch pushes create preview deploys.

Enable GitHub Pages in your repo settings → **Source: Deploy from a branch** → **Branch: gh-pages**.

### Manual Build

```bash
npm run build        # Output in dist/
npm run preview      # Preview the build locally
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:1234 |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Updating Storyboard Packages

To update the Storyboard framework packages to the latest version:

```bash
npm install @dfosco/storyboard-core@latest @dfosco/storyboard-react@latest @dfosco/storyboard-react-primer@latest @dfosco/storyboard-react-reshaped@latest
```

To check if updates are available without installing them:

```bash
npm outdated @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-primer @dfosco/storyboard-react-reshaped
```

After updating, verify everything works:

```bash
npm run build
```

> **Note:** If you removed one of the design system packages (Primer or Reshaped), omit its corresponding `@dfosco/storyboard-react-*` package from the commands above.

## Learn More

- [Storyboard Source](https://github.com/dfosco/storyboard-source) — Framework source code
- [Primer React](https://primer.style/react) — Primer component docs
- [Reshaped](https://reshaped.so) — Reshaped component docs
