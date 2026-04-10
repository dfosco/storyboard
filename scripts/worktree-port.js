/**
 * Worktree Port Registry (root repo wrapper)
 *
 * Delegates to the core worktree port logic published in @dfosco/storyboard-core.
 * Client repos use: import { getPort } from '@dfosco/storyboard-core/worktree/port'
 *
 * CLI:
 *   node scripts/worktree-port.js <worktree-name>
 */

import { getPort } from '../packages/core/src/worktree/port.js'

const name = process.argv[2]
if (name) {
  console.log(getPort(name))
}
