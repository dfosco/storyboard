# Plan: `storyboard doctor` CLI Tool

## Problem

When storyboard-core undergoes large refactors (generouted config, vite plugin changes, directory structure conventions, new features), client repositories silently break. The recent WSOD incident — where `security/` was renamed to `security.folder/` on disk, breaking generouted routing with zero error output — is a recurring pattern. With potentially hundreds of client repos, manual verification doesn't scale.

**Root cause:** Clients manually compose 3-4 Vite plugins + generouted config + `storyboard.config.json` + directory conventions. Any drift between core's expectations and the client's setup causes silent breakage.

## Approach

Ship a `storyboard-doctor` CLI as part of `@dfosco/storyboard-core`. It validates a client repo's setup against the expectations of the installed storyboard version and auto-fixes problems with user confirmation.

**Invocation:**
```bash
npx storyboard-doctor          # run from client repo root
npx storyboard-doctor --fix    # auto-fix mode (prompts before each fix)
npx storyboard-doctor --json   # machine-readable output
```

**Package location:** `packages/core/bin/storyboard-doctor.js` + `packages/core/src/doctor/`

---

## Checks & Auto-Fixes

### 1. Package Version Alignment
**Check:** All `@dfosco/storyboard-*` packages in `package.json` are on the same version (fixed versioning requirement).
**Fix:** `npm install @dfosco/storyboard-core@X @dfosco/storyboard-react@X ...` to align.

### 2. Vite Config — Plugin Presence & Order
**Check:** Parse `vite.config.js` to verify:
- `storyboardData()` is present (from `@dfosco/storyboard-react/vite`)
- `storyboardServer()` is present (from `@dfosco/storyboard-core/vite/server`)
- `generouted()` is present with correct `source.routes` pattern
- Plugin order: storyboardData → storyboardServer → react → generouted
**Fix:** Show the expected vite.config.js diff and offer to patch it.

### 3. Generouted Source Pattern
**Check:** The `generouted()` call uses the correct glob pattern matching `./src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}` (or the current version's expected pattern).
**Fix:** Update the pattern in-place.

### 4. storyboard.config.json Validity
**Check:**
- File exists and is valid JSONC
- `repository.owner` and `repository.name` are present
- No unknown top-level keys (warn only — forward compat)
- Schema matches the version's expectations
**Fix:** Create file with defaults if missing; add missing required fields.

### 5. Directory Structure
**Check:**
- `src/prototypes/` directory exists
- No orphaned renames (e.g. `security.folder/` exists but `security/` doesn't — the exact bug from the incident)
- No nested `.folder/` directories (already validated by data-plugin, but catch it earlier)
- Git working tree is clean for prototype directories (warn on uncommitted renames)
**Fix:** Offer `git checkout` to restore committed structure; flag untracked `.folder/` renames.

### 6. Data File Integrity
**Check:**
- All `*.flow.json`, `*.object.json`, `*.record.json`, `*.prototype.json` are valid JSONC
- No duplicate `{name}.{suffix}` combinations (reuse data-plugin validation logic)
- `$ref` references resolve to existing objects
**Fix:** Report which files conflict and suggest renames.

### 7. Dependency Health
**Check:**
- Required peer dependencies installed (`react`, `react-router-dom`, `vite`, `@generouted/react-router`)
- No version range conflicts
**Fix:** `npm install` the missing peers.

### 8. Deprecated API Usage (optional scan)
**Check:** Grep source files for deprecated 1.x function names (`loadScene`, `useSceneData`, `useSceneLoading`, `.scene.json` files).
**Fix:** Report files and line numbers; suggest replacements (not auto-rewrite — too risky).

---

## Architecture

```
packages/core/
  bin/
    storyboard-doctor.js         # CLI entry point (hashbang, args parsing)
  src/doctor/
    index.js                     # Main orchestrator — runs all checks, reports results
    checks/
      packageVersions.js         # Check 1: version alignment
      viteConfig.js              # Check 2+3: plugin presence, order, generouted pattern
      configFile.js              # Check 4: storyboard.config.json schema
      directoryStructure.js      # Check 5: prototype dirs, orphaned renames
      dataIntegrity.js           # Check 6: duplicate detection, $ref resolution
      dependencies.js            # Check 7: peer deps
      deprecatedApi.js           # Check 8: deprecated usage scan
    fixes/
      applyFix.js                # Fix orchestrator — confirm + execute
    reporter.js                  # Pretty terminal output (colors, icons)
    schema.js                    # Expected storyboard.config.json schema per version
```

### Check result format
Each check returns:
```js
{
  name: 'package-versions',
  status: 'pass' | 'warn' | 'fail',
  message: 'All @dfosco/storyboard-* packages are on v2.3.0',
  fix: null | { description: 'Install aligned versions', apply: async () => {...} }
}
```

### CLI output example
```
🔍 Storyboard Doctor v2.3.0

  ✅ Package versions — all on v2.3.0
  ✅ Vite plugins — correct order and configuration
  ⚠️  Generouted pattern — using legacy src/pages/ pattern
     → Expected: ./src/prototypes/**/[\w[-]*.{jsx,tsx,mdx}
     → Found:    ./src/pages/**/[\w[-]*.{jsx,tsx}
  ✅ storyboard.config.json — valid
  ❌ Directory structure — orphaned rename detected
     → src/prototypes/security.folder/ exists (untracked)
     → src/prototypes/security/ missing from disk (exists in git HEAD)
     → This will cause generouted route mismatch
  ✅ Data files — no duplicates
  ✅ Dependencies — all peers installed
  ⚠️  Deprecated API — 3 files using 1.x names

  2 issues found (1 error, 2 warnings)

  Fix? [Y/n]
```

---

## Todos

1. **scaffold-doctor-module** — Create `packages/core/src/doctor/` directory structure with `index.js` orchestrator and `reporter.js` for terminal output
2. **check-package-versions** — Implement version alignment check (read `package.json`, compare all `@dfosco/storyboard-*` versions)
3. **check-vite-config** — Implement vite.config.js parser (regex/AST-light) to validate plugin presence, order, and generouted source pattern
4. **check-config-file** — Implement `storyboard.config.json` schema validation using `jsonc-parser` (already a dependency)
5. **check-directory-structure** — Implement prototype directory checks: existence, orphaned `.folder/` renames, git working tree comparison, nested folders
6. **check-data-integrity** — Extract and reuse duplicate detection + `$ref` resolution logic from `data-plugin.js`
7. **check-dependencies** — Implement peer dependency verification against installed `node_modules`
8. **check-deprecated-api** — Implement source file grep for deprecated 1.x names with line numbers
9. **fix-orchestrator** — Implement `--fix` mode: prompt per-fix, apply, and verify
10. **cli-entry-point** — Create `bin/storyboard-doctor.js` with arg parsing, add `bin` field to `packages/core/package.json`, add export `./doctor` to exports map
11. **tests** — Write vitest tests for each check module using fixture directories
12. **docs** — Add doctor usage to README.md and AGENTS.md

## Notes

- **No new dependencies** — use `jsonc-parser` (already in core), `node:fs`, `node:path`, `node:child_process` (for git commands). Terminal colors via ANSI escape codes (no chalk needed).
- **Vite config parsing** — Regex-based is fragile; consider a lightweight AST approach using `es-module-lexer` or simple string pattern matching. The config shape is well-known enough that regex should work for the common case, with a graceful "couldn't parse" fallback.
- **Version coupling** — The doctor should embed the current version's expectations (expected generouted pattern, expected config schema) so it validates against what the installed version expects, not a hardcoded ideal.
- **`--json` flag** — For CI integration, output check results as JSON for automated monitoring across repos.
