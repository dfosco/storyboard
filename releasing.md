# Releasing @dfosco/storyboard-* packages

All five packages share a **fixed version** — every release bumps them together.

| Package | Description |
|---------|-------------|
| `@dfosco/storyboard-core` | Framework-agnostic data layer, DevTools, utilities |
| `@dfosco/storyboard-react` | React hooks, context, Vite plugin |
| `@dfosco/storyboard-react-primer` | Primer design system form wrappers |
| `@dfosco/storyboard-react-reshaped` | Reshaped design system form wrappers |
| `@dfosco/tiny-canvas` | Lightweight React canvas with draggable widgets |

---

## One-time setup

### 1. Make packages public

Remove `"private": true` from each package.json:

```bash
# packages/core/package.json
# packages/react/package.json
# packages/react-primer/package.json
# packages/react-reshaped/package.json
# packages/tiny-canvas/package.json
```

Add metadata to each package.json (adjust URLs):

```jsonc
{
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/<org>/storyboard.git",
    "directory": "packages/<name>"
  },
  "files": ["src"]
}
```

### 2. Add missing dependencies

`@dfosco/storyboard-react`'s Vite plugin uses `glob` and `jsonc-parser` — add them as real deps:

```bash
cd packages/react
npm install glob jsonc-parser
```

### 3. Add peer dependencies

```jsonc
// packages/react/package.json
"peerDependencies": {
  "react": ">=18",
  "react-dom": ">=18"
}

// packages/react-primer/package.json
"peerDependencies": {
  "@primer/react": ">=37",
  "react": ">=18"
}

// packages/react-reshaped/package.json
"peerDependencies": {
  "reshaped": ">=3",
  "react": ">=18"
}
```

### 4. Update changeset config

Edit `.changeset/config.json`:

```jsonc
{
  "access": "public",
  "fixed": [["@dfosco/storyboard-*"]],
  "changelog": ["@changesets/changelog-github", { "repo": "dfosco/storyboard" }]
}
```

The `@changesets/changelog-github` generator produces richer changelog entries that link to PRs, commit SHAs, and credit contributors — these read well as GitHub Release bodies.

### 5. Set up npm OIDC Trusted Publishing

All packages must have been published at least once before configuring trusted publishing.
Since all five `@dfosco/storyboard-*` and `@dfosco/tiny-canvas` packages are already published, you can configure OIDC immediately.

For each package on [npmjs.com](https://www.npmjs.com):

1. Go to **Settings → Trusted Publisher**
2. Add GitHub Actions as a trusted publisher:
   - **Owner:** `dfosco`
   - **Repository:** `storyboard`
   - **Workflow:** `release-publish.yml`
   - **Environment:** _(leave blank)_
3. Repeat for all five packages

Once configured, publishing uses OIDC — no npm tokens, no 2FA, automatic provenance attestation.

> **Note:** You can delete the `NPM_TOKEN` repository secret after verifying OIDC works.

### 6. Workflows

Two workflows handle the release lifecycle:

**`.github/workflows/publish.yml`** — Creates a "Version Packages" PR when changesets exist on `main`:

```yaml
name: Version

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --legacy-peer-deps
      - uses: changesets/action@v1
        with:
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**`.github/workflows/release-publish.yml`** — Publishes to npm when a version tag is pushed (via OIDC Trusted Publishing):

```yaml
name: Release Publish

on:
  push:
    tags:
      - '@dfosco/storyboard-core@*'
  workflow_dispatch:
    inputs:
      tag:
        description: 'Core package tag'
        required: true

permissions:
  contents: write
  id-token: write   # Required for OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci --legacy-peer-deps
      - run: |
          # Publishes all 5 packages with provenance
          # Skips already-published versions
          # No NODE_AUTH_TOKEN needed — OIDC handles auth
          npm publish -w @dfosco/storyboard-core --access public --provenance
          # ... (see actual workflow for full script)
```

---

## Day-to-day release process

### 1. Add a changeset

When you make a change worth releasing:

```bash
npx changeset
```

Select the affected packages, choose the bump type (patch / minor / major), and write a summary. This creates a markdown file in `.changeset/`.

Since versioning is fixed, **all packages will be bumped to the same version** regardless of which ones you select. This includes `@dfosco/tiny-canvas`.

### 2. Commit and push

```bash
git add .changeset/
git commit -m "chore: add changeset for <description>"
git push
```

### 3. Merge the version PR

When `.changeset/` files exist on `main`, the GitHub Action opens a PR titled **"chore: version packages"**. This PR:

- Bumps `version` in every package.json
- Updates CHANGELOG.md
- Removes consumed changeset files

Merge it to trigger the publish.

### 4. Auto-publish

Once the version PR is merged, the `release-publish.yml` workflow detects the new version tags and publishes all packages to npm via OIDC Trusted Publishing (with provenance attestation).

---

## Manual publish (recommended)

Use the release script which runs lint, tests, build, versions packages, and pushes to trigger CI publishing:

```bash
npm run release              # stable release
npm run release:beta         # beta prerelease (e.g. 1.25.0-beta.0)
npm run release:alpha        # alpha prerelease
```

> ⚠️ **Do not use `npm run release --beta`** — npm swallows the flag. Always use `npm run release:beta`.

The script will:
1. Run lint, tests, and build
2. Enter prerelease mode (if beta/alpha)
3. Create a changeset interactively
4. Bump versions
5. Show a confirmation prompt
6. Commit, create git tags, and push
7. **CI takes over** — `release-publish.yml` publishes to npm with OIDC provenance and creates a GitHub Release

No npm login, no 2FA prompts. Publishing is handled entirely by GitHub Actions.

### Resuming a failed release

If a release fails partway through (e.g. push failed, CI didn't trigger), use the resume script:

```bash
npm run release:resume              # resume stable release
npm run release:resume:beta         # resume beta prerelease
npm run release:resume:alpha        # resume alpha prerelease
```

This skips lint/test/build/versioning and picks up from the current committed state. It will:
1. Re-create git tags if missing
2. Push with tags
3. CI handles publishing (skips already-published packages)

If CI still doesn't trigger, you can manually dispatch:

```bash
gh workflow run release-publish.yml -f tag=@dfosco/storyboard-core@<VERSION>
```

The GitHub Release uses the changelog from `packages/core/CHANGELOG.md`. If no changelog section is found for the version, it falls back to auto-generated notes from commits (with a warning). Stable releases are marked as Latest; prereleases are marked as Pre-release.

Changelogs are generated by `@changesets/changelog-github`, which links PRs, commits, and credits contributors automatically.

Or run each step manually:

```bash
npm run version             # bump versions + sync root
npx changeset tag           # create git tags
git add -A && git commit -m "chore: version packages"
git push --follow-tags      # CI publishes automatically
```

---

## Prerelease versions (alpha / beta)

The release script supports publishing prerelease versions using changesets' built-in prerelease mode.

### Quick start

```bash
npm run release:beta     # publish a beta prerelease (e.g. 1.25.0-beta.0)
npm run release:alpha    # publish an alpha prerelease (e.g. 1.25.0-alpha.0)
```

Or invoke the script directly:

```bash
./scripts/release.sh --beta
./scripts/release.sh --alpha
```

### What happens

1. The script enters changesets prerelease mode (`changeset pre enter <tag>`)
2. You create a changeset and version as usual
3. Versions are suffixed: `X.Y.Z-beta.0`, then `-beta.1`, `-beta.2`, etc.
4. npm packages are published under the prerelease dist-tag (e.g. `npm install @dfosco/storyboard-core@beta`)
5. The GitHub Release is marked as a prerelease
6. Prerelease mode is exited automatically after publishing

### Branch strategy (recommended)

> **Do prereleases from a dedicated branch, not `main`.**

If you enter prerelease mode on `main`, you cannot ship a stable hotfix until you exit pre mode. The recommended workflow:

1. Create a branch for the prerelease cycle (e.g. `next`, `beta`, or a feature branch)
2. Run `npm run release:beta` from that branch
3. When the prerelease is ready for stable, merge to `main` and run a normal `npm run release`

### Installing a prerelease

```bash
npm install @dfosco/storyboard-core@beta
npm install @dfosco/storyboard-react@beta
```

Prerelease versions are never tagged as `latest` on npm, so they won't affect users installing without an explicit tag.

---

## Installing @storyboard in a new project

### Minimal (React + Primer)

```bash
npm install @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-primer @dfosco/tiny-canvas
```

### With Reshaped instead

```bash
npm install @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-reshaped @dfosco/tiny-canvas
```

### Vite config

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { storyboardData } from '@dfosco/storyboard-react/vite'

export default defineConfig({
  plugins: [react(), storyboardData()],
})
```

### App entry

```jsx
import { StoryboardProvider, useSceneData } from '@dfosco/storyboard-react'
import { mountDevTools } from '@dfosco/storyboard-core'

// Mount devtools in dev mode
if (import.meta.env.DEV) mountDevTools()

function App() {
  return (
    <StoryboardProvider>
      <MyPage />
    </StoryboardProvider>
  )
}
```

### Data files

Create `.scene.json`, `.object.json`, and `.record.json` files anywhere in your project. The Vite plugin discovers them automatically.

See `AGENTS.md` for the full data format reference.
