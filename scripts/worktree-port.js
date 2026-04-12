/**
 * Worktree Port Registry (root repo wrapper)
 *
 * CLI:
 *   node scripts/worktree-port.js <worktree-name>
 */

import { getPort } from '../packages/core/src/worktree/port.js'

const name = process.argv[2]
if (name) {
  console.log(getPort(name))
}
