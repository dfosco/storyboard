/**
 * Setup wrapper — delegates to the storyboard CLI setup command.
 *
 * Usage:
 *   npm run setup
 *
 * Equivalent to: npx storyboard setup
 */

import { execSync } from 'child_process'
execSync('npx storyboard setup', { stdio: 'inherit' })
