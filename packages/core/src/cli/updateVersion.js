/**
 * storyboard update:version — Update all @dfosco/storyboard-* packages to the latest version.
 *
 * Equivalent to `npm run update` in a client repo.
 *
 * Usage:
 *   storyboard update:version          # update to latest
 *   storyboard update:version 4.0.0    # update to specific version
 */

import * as p from '@clack/prompts'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const targetVersion = process.argv[3]

const pkgPath = resolve(process.cwd(), 'package.json')
let pkg
try {
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
} catch (err) {
  p.log.error(`Failed to read package.json: ${err.message}`)
  process.exit(1)
}

// Collect all @dfosco/storyboard-* packages from deps and devDeps
const storyboardPkgs = new Set()
for (const depField of ['dependencies', 'devDependencies']) {
  if (!pkg[depField]) continue
  for (const name of Object.keys(pkg[depField])) {
    if (name.startsWith('@dfosco/storyboard-') || name === '@dfosco/tiny-canvas') {
      storyboardPkgs.add(name)
    }
  }
}

if (storyboardPkgs.size === 0) {
  p.log.warn('No @dfosco/storyboard-* packages found in package.json')
  process.exit(0)
}

const suffix = targetVersion ? `@${targetVersion}` : '@latest'
const packages = [...storyboardPkgs].map(name => `${name}${suffix}`).join(' ')

p.intro('storyboard update:version')
p.log.info(`Updating ${storyboardPkgs.size} package(s)${targetVersion ? ` to ${targetVersion}` : ''}…`)
for (const name of storyboardPkgs) {
  p.log.message(`  ${name}${suffix}`)
}

try {
  execSync(`npm install ${packages}`, { stdio: 'inherit', cwd: process.cwd() })
  p.log.success('All storyboard packages updated')
  p.outro('Done')
} catch {
  p.log.error('Failed to update packages — see npm output above')
  process.exit(1)
}
