/**
 * storyboard exit — Stop the Caddy proxy and all running dev servers.
 */

import * as p from '@clack/prompts'
import { execSync } from 'child_process'

p.intro('storyboard exit')

// 1. Stop all Vite dev servers started by storyboard
try {
  const psOutput = execSync('ps aux', { encoding: 'utf8' })
  const vitePids = psOutput
    .split('\n')
    .filter((line) => line.includes('vite') && line.includes('VITE_BASE_PATH'))
    .map((line) => line.trim().split(/\s+/)[1])
    .filter(Boolean)

  if (vitePids.length > 0) {
    for (const pid of vitePids) {
      try { process.kill(Number(pid), 'SIGTERM') } catch { /* already dead */ }
    }
    p.log.success(`Stopped ${vitePids.length} dev server${vitePids.length > 1 ? 's' : ''}`)
  } else {
    p.log.info('No dev servers running')
  }
} catch {
  p.log.info('No dev servers running')
}

// 2. Stop Caddy proxy
try {
  execSync('sudo caddy stop >/dev/null 2>&1', { stdio: ['inherit', 'pipe', 'pipe'] })
  p.log.success('Proxy stopped')
} catch {
  p.log.info('Proxy was not running')
}

p.outro('All stopped')
