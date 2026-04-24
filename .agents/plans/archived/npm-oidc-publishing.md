# Plan: Move npm publishing to CI with OIDC Trusted Publishing

## Problem
`npm run release` requires interactive 2FA for every `npm publish` call (4 packages). This blocks CI-based publishing entirely.

## Solution
Use **npm OIDC Trusted Publishing** via GitHub Actions. Local script handles versioning and pushing; CI handles publishing with provenance attestation — no tokens or 2FA needed.

## Changes Made

1. **`release-publish.yml`** (new) — Tag-triggered + workflow_dispatch workflow. Uses OIDC, publishes all 4 packages with `--provenance`, skips already-published versions, creates GitHub Release.

2. **`release.sh`** — Removed npm auth check, npm publish, and GH release creation. Now stops after `git push --follow-tags` with CI handoff message.

3. **`release-resume.sh`** — Simplified to: ensure tags exist → push → print CI workflow URL.

4. **`publish.yml`** — Made PR-only (renamed to "Version"). Removed `publish:` step and npm token env vars. Node bumped to 22.

5. **`releasing.md`** — Updated docs: new OIDC setup instructions, updated flow descriptions, removed local publish references.

## One-time setup required
For each package on npmjs.com → Settings → Trusted Publisher:
- Owner: `dfosco`
- Repository: `storyboard`
- Workflow: `release-publish.yml`
