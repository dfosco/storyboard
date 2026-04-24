#!/usr/bin/env node

/**
 * Sync root package.json version to match @dfosco/storyboard-core.
 *
 * Run automatically after `changeset version` via the npm "version" script.
 * All @dfosco/storyboard-* packages share a fixed version — this ensures
 * the root package.json stays in lockstep.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const corePkg = JSON.parse(readFileSync(resolve(root, 'packages/core/package.json'), 'utf-8'))
const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

const isPrerelease = corePkg.version.includes('-')

if (isPrerelease) {
  console.log(`[sync-version] skipping prerelease ${corePkg.version} — root tracks stable only`)
} else if (rootPkg.version !== corePkg.version) {
  rootPkg.version = corePkg.version
  writeFileSync(resolve(root, 'package.json'), JSON.stringify(rootPkg, null, 4) + '\n')
  console.log(`[sync-version] root package.json → ${corePkg.version}`)
} else {
  console.log(`[sync-version] already at ${corePkg.version}`)
}
