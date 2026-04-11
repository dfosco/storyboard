# `packages/core/src/scaffold.js`

<!--
source: packages/core/src/scaffold.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`scaffold.js` is the CLI entry point for `npx storyboard-scaffold`, the command that bootstraps consumer repositories with storyboard configuration files, skills, and scripts from the `@dfosco/storyboard-core` package. It reads a `scaffold/manifest.json` that declares which files to copy, and operates in two distinct modes to balance "set up once" config files with "always update" managed files.

The two-mode design is central to the scaffolding strategy: **scaffold** mode copies files only if they don't already exist (respecting user customizations), while **updateable** mode always overwrites with the latest version from the package (keeping skills and scripts in sync with core). This lets consumer repos safely run the scaffold command on every install without losing local config changes.

## Composition

The script is a self-contained Node.js CLI (`#!/usr/bin/env node`) with no external dependencies — only `node:fs` and `node:path`.

**Manifest loading** — Resolves `scaffold/manifest.json` relative to the package root:

```js
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const scaffoldRoot = path.resolve(__dirname, '..', 'scaffold')
const consumerRoot = process.cwd()

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
```

**File copy helpers** — Two recursive copy functions handle files and directories, creating intermediate directories as needed:

```js
function copyFileSync(src, dest) {
  const dir = path.dirname(dest)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.copyFileSync(src, dest)
}
```

**Manifest iteration** — Each manifest entry has `source`, `target`, `mode` (`"scaffold"` or `"updateable"`), and an optional `directory` flag. The loop handles both files and directories:

```js
for (const file of manifest.files) {
  if (file.mode === 'scaffold') {
    if (fs.existsSync(destPath)) {
      skipped++
    } else {
      copyFileSync(srcPath, destPath)
      created++
    }
  } else if (file.mode === 'updateable') {
    copyFileSync(srcPath, destPath)
    updated++
  }
}
```

Shell scripts (`.sh` extension) are automatically made executable with `chmod 0o755`.

**Summary output** — Logs created/updated/skipped counts at the end.

## Dependencies

- `node:fs` — File system operations
- `node:path` — Path resolution
- `scaffold/manifest.json` — Declarative file list (adjacent to package)

## Dependents

- `package.json` `bin.storyboard-scaffold` — Exposes the script as an npm bin command
- Consumer repos — Run `npx storyboard-scaffold` during setup or postinstall

## Notes

- The script uses `process.cwd()` as the consumer root, so it must be run from the consumer repo's root directory.
- The `__dirname` derivation uses `import.meta.url` for ESM compatibility.
- Directory entries in the manifest use the same scaffold/updateable logic but applied to entire directory trees.
