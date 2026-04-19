#!/usr/bin/env node
/**
 * storyboard sessions — interactive TMUX session browser.
 *
 * Lists terminal sessions from the dev server registry, grouped by
 * canvas and branch. Uses @clack/prompts for interactive selection.
 *
 * Usage:
 *   storyboard sessions           # list sessions for current branch
 *   storyboard sessions --all     # list sessions across all branches
 */

import * as p from '@clack/prompts'
import { detectWorktreeName, getPort } from '../worktree/port.js'
import { readDevDomain } from './proxy.js'
import { parseFlags } from './flags.js'
import { dim, cyan, bold, yellow } from './intro.js'

const blue = (s) => `\x1b[34m${s}\x1b[0m`
const orange = (s) => `\x1b[38;5;208m${s}\x1b[0m`

const flagSchema = {
  all: { type: 'boolean', description: 'Show sessions from all branches' },
  branch: { type: 'string', description: 'Filter by branch name' },
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)

/** Resolve the dev server base URL (proxy or direct) */
function getBaseUrl(worktreeName, port) {
  const domain = readDevDomain()
  const isMain = worktreeName === 'main'
  const proxyBase = isMain ? `http://${domain}/` : `http://${domain}/branch--${worktreeName}/`
  const directBase = isMain ? `http://localhost:${port}/` : `http://localhost:${port}/branch--${worktreeName}/`
  return { proxyBase, directBase }
}

async function fetchSessions(worktreeName, port, branch = null) {
  const { proxyBase, directBase } = getBaseUrl(worktreeName, port)
  const suffix = branch
    ? `_storyboard/terminal/sessions?branch=${encodeURIComponent(branch)}`
    : `_storyboard/terminal/sessions`

  // Try proxy first, then direct
  for (const base of [proxyBase, directBase]) {
    try {
      const res = await fetch(`${base}${suffix}`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) continue
      const data = await res.json()
      return data.sessions || []
    } catch { continue }
  }
  return null
}

function relativeTime(iso) {
  if (!iso) return dim('—')
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function statusLabel(status) {
  switch (status) {
    case 'live': return blue('Live      ')
    case 'background': return orange('Background')
    case 'archived': return dim('Archived  ')
    default: return dim(status.padEnd(10))
  }
}

function summaryText(entry) {
  const parts = []
  if (entry.canvasId && entry.canvasId !== 'unknown') {
    parts.push(entry.canvasId.split('/').pop())
  }
  parts.push(entry.widgetId || 'unknown')
  return parts.join(' › ')
}

function formatRow(idx, entry, selected = false) {
  const cursor = selected ? blue('❯') : ' '
  const num = `${idx + 1}.`.padEnd(4)
  const status = statusLabel(entry.status)
  const modified = relativeTime(entry.lastConnectedAt).padEnd(10)
  const created = relativeTime(entry.createdAt).padEnd(10)
  const summary = summaryText(entry)

  let badges = ''
  if (entry.status === 'live') badges = ' ' + blue('! Live')

  const summaryColored = entry.status === 'live'
    ? blue(summary)
    : entry.status === 'background'
      ? orange(summary)
      : dim(summary)

  return `${cursor} ${dim(num)} ${status}  ${dim(modified)} ${dim(created)} ${summaryColored}${badges}`
}

async function main() {
  const worktreeName = detectWorktreeName()
  const port = getPort(worktreeName)

  p.intro(bold('Terminal Sessions'))

  // Fetch sessions
  const filterBranch = flags.all ? null : (flags.branch || worktreeName)
  const sessions = await fetchSessions(worktreeName, port, filterBranch)

  if (sessions === null) {
    p.log.error('Could not connect to dev server. Is it running?')
    p.log.info(`Expected at: ${dim(`http://localhost:${port}`)}`)
    p.outro('')
    process.exit(1)
  }

  if (sessions.length === 0) {
    p.log.info('No terminal sessions found.')
    if (!flags.all) {
      p.log.info(`Showing sessions for branch ${cyan(worktreeName)}. Use ${bold('--all')} to see all branches.`)
    }
    p.outro('')
    process.exit(0)
  }

  // Group sessions by canvas
  const byCanvas = new Map()
  for (const s of sessions) {
    const key = s.canvasId || 'unknown'
    if (!byCanvas.has(key)) byCanvas.set(key, [])
    byCanvas.get(key).push(s)
  }

  // Build options for clack select
  const options = []
  let idx = 0

  if (flags.all) {
    // Group by branch then canvas
    const byBranch = new Map()
    for (const s of sessions) {
      const b = s.branch || 'unknown'
      if (!byBranch.has(b)) byBranch.set(b, [])
      byBranch.get(b).push(s)
    }

    // Current branch first
    const branches = [...byBranch.keys()].sort((a, b) => {
      if (a === worktreeName) return -1
      if (b === worktreeName) return 1
      return a.localeCompare(b)
    })

    for (const branch of branches) {
      const branchSessions = byBranch.get(branch)
      const label = branch === worktreeName ? `${branch} (current)` : branch
      options.push({ value: `__sep_branch_${branch}`, label: dim(`── ${label} ──`), hint: '' })

      for (const s of branchSessions) {
        options.push({
          value: s.tmuxName,
          label: formatRow(idx, s),
        })
        idx++
      }
    }
  } else {
    // Group by canvas within current branch
    for (const [canvasId, canvasSessions] of byCanvas) {
      const canvasLabel = canvasId === 'unknown' ? 'Unknown canvas' : canvasId
      options.push({ value: `__sep_${canvasId}`, label: dim(`── ${canvasLabel} ──`), hint: '' })

      for (const s of canvasSessions) {
        options.push({
          value: s.tmuxName,
          label: formatRow(idx, s),
        })
        idx++
      }
    }
  }

  // Header
  const scope = flags.all ? 'All branches' : `Branch: ${cyan(worktreeName)}`
  p.log.info(`${scope} · ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`)
  console.log(dim('  #    Status       Modified    Created     Summary'))
  console.log('')

  const selected = await p.select({
    message: 'Select a session',
    options: options.filter(o => !o.value.startsWith('__sep_')).length > 0
      ? options
      : [{ value: '__none', label: dim('No sessions available') }],
  })

  if (p.isCancel(selected) || selected === '__none' || selected?.startsWith('__sep_')) {
    p.outro(dim('Cancelled'))
    process.exit(0)
  }

  // Find the selected session
  const session = sessions.find(s => s.tmuxName === selected)
  if (!session) {
    p.log.error('Session not found')
    process.exit(1)
  }

  // Show what was selected
  const statusText = session.status === 'live' ? blue('Live')
    : session.status === 'background' ? orange('Background')
    : dim('Archived')

  p.log.success(`Selected: ${bold(session.tmuxName)}`)
  p.log.info(`Status: ${statusText} · Canvas: ${cyan(session.canvasId)} · Widget: ${dim(session.widgetId)}`)

  // If session is background or archived, offer to attach via tmux
  if (session.status !== 'live') {
    p.log.info(`\nTo attach: ${cyan(`tmux attach-session -t "${session.tmuxName}"`)}`)
  }

  // Offer tmux native management
  const next = await p.select({
    message: 'What would you like to do?',
    options: [
      ...(session.status !== 'live' ? [
        { value: 'attach', label: 'Attach to this session', hint: `tmux attach -t ${session.tmuxName}` },
      ] : []),
      { value: 'tmux', label: 'Open tmux session manager', hint: 'tmux choose-session' },
      { value: 'kill', label: yellow('Kill this session'), hint: 'Permanently destroy' },
      { value: 'cancel', label: dim('Cancel') },
    ],
  })

  if (p.isCancel(next) || next === 'cancel') {
    p.outro(dim('Done'))
    process.exit(0)
  }

  if (next === 'attach') {
    p.outro(`Attaching to ${bold(session.tmuxName)}...`)
    const { execSync } = await import('node:child_process')
    try {
      execSync(`tmux attach-session -t "${session.tmuxName}"`, { stdio: 'inherit' })
    } catch {}
    process.exit(0)
  }

  if (next === 'tmux') {
    p.outro('Opening tmux session manager...')
    const { execSync } = await import('node:child_process')
    try {
      execSync('tmux choose-session', { stdio: 'inherit' })
    } catch {}
    process.exit(0)
  }

  if (next === 'kill') {
    const confirm = await p.confirm({ message: `Kill session ${bold(session.tmuxName)}?` })
    if (p.isCancel(confirm) || !confirm) {
      p.outro(dim('Cancelled'))
      process.exit(0)
    }

    try {
      const { proxyBase, directBase } = getBaseUrl(worktreeName, port)
      let killed = false
      for (const base of [proxyBase, directBase]) {
        try {
          const res = await fetch(
            `${base}_storyboard/terminal/sessions/${encodeURIComponent(session.tmuxName)}`,
            { method: 'DELETE', signal: AbortSignal.timeout(3000) }
          )
          if (res.ok) { killed = true; break }
        } catch { continue }
      }
      if (killed) {
        p.log.success('Session killed')
      } else {
        p.log.error('Failed to kill session via API, trying tmux directly...')
        const { execSync } = await import('node:child_process')
        execSync(`tmux kill-session -t "${session.tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
        p.log.success('Session killed via tmux')
      }
    } catch {
      p.log.error('Failed to kill session')
    }
    p.outro('')
  }
}

main().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
