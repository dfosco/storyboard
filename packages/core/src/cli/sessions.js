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
import { execSync as execSyncFn } from 'node:child_process'
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
  const name = entry.name || entry.widgetId || 'unknown'
  const canvas = entry.canvasId && entry.canvasId !== 'unknown'
    ? entry.canvasId.split('/').pop()
    : null
  return canvas ? `${canvas} › ${name}` : name
}

/** Detect the current tmux session name (the one running this CLI) */
function getCurrentTmuxSession() {
  try {
    const result = execSyncFn('tmux display-message -p "#{session_name}" 2>/dev/null', {
      encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    })
    return result.trim()
  } catch {
    return null
  }
}

function formatRow(idx, entry, isCurrent = false) {
  const num = `${idx + 1}.`.padEnd(4)
  const status = statusLabel(entry.status)
  const modified = relativeTime(entry.lastConnectedAt).padEnd(10)
  const created = relativeTime(entry.createdAt).padEnd(10)
  const summary = summaryText(entry)

  let badges = ''
  if (isCurrent) badges += ' ' + cyan('(current)')
  if (entry.status === 'live' && !isCurrent) badges += ' ' + blue('! Live')

  const summaryColored = entry.status === 'live'
    ? blue(summary)
    : entry.status === 'background'
      ? orange(summary)
      : dim(summary)

  return `  ${dim(num)} ${status}  ${dim(modified)} ${dim(created)} ${summaryColored}${badges}`
}

async function main() {
  const worktreeName = detectWorktreeName()
  const port = getPort(worktreeName)
  const currentTmuxSession = getCurrentTmuxSession()

  // Session list loop — user can navigate back here after actions
  while (true) {
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
      const byBranch = new Map()
      for (const s of sessions) {
        const b = s.branch || 'unknown'
        if (!byBranch.has(b)) byBranch.set(b, [])
        byBranch.get(b).push(s)
      }

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
          const isCurrent = s.tmuxName === currentTmuxSession
          options.push({
            value: s.tmuxName,
            label: formatRow(idx, s, isCurrent),
          })
          idx++
        }
      }
    } else {
      for (const [canvasId, canvasSessions] of byCanvas) {
        const canvasLabel = canvasId === 'unknown' ? 'Unknown canvas' : canvasId
        options.push({ value: `__sep_${canvasId}`, label: dim(`── ${canvasLabel} ──`), hint: '' })

        for (const s of canvasSessions) {
          const isCurrent = s.tmuxName === currentTmuxSession
          options.push({
            value: s.tmuxName,
            label: formatRow(idx, s, isCurrent),
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
      options: [
        ...options,
        { value: '__back', label: dim('← Back to options') },
      ],
    })

    if (p.isCancel(selected) || selected === '__back') {
      p.outro(dim('Done'))
      process.exit(0)
    }

    if (selected === '__none' || selected?.startsWith('__sep_')) continue

    // Find the selected session
    const session = sessions.find(s => s.tmuxName === selected)
    if (!session) {
      p.log.error('Session not found')
      continue
    }

    // Session detail loop — user can navigate back to session list
    let stayInDetail = true
    while (stayInDetail) {
      const isCurrent = session.tmuxName === currentTmuxSession
      const statusText = session.status === 'live'
        ? (isCurrent ? blue('Live (current)') : blue('Live'))
        : session.status === 'background' ? orange('Background')
        : dim('Archived')

      p.log.success(`Selected: ${bold(session.name || session.tmuxName)}`)
      p.log.info(`Status: ${statusText} · Canvas: ${cyan(session.canvasId)} · Widget: ${dim(session.widgetId)}`)

      const next = await p.select({
        message: 'What would you like to do?',
        options: [
          ...(!isCurrent ? [
            { value: 'open', label: 'Open session', hint: 'switch to this session' },
          ] : []),
          { value: 'tmux', label: 'Open tmux session manager', hint: 'tmux choose-session' },
          { value: 'remove', label: yellow('Remove session'), hint: 'permanently destroy' },
          { value: 'back', label: dim('← Back to sessions') },
        ],
      })

      if (p.isCancel(next) || next === 'back') {
        stayInDetail = false
        continue
      }

      if (next === 'open') {
        // Warn if session is already live on another widget
        if (session.status === 'live' && session.tmuxName !== currentTmuxSession) {
          p.log.warn(
            `Session ${cyan(session.name || session.tmuxName)} is currently ${blue('Live')} on widget ${dim(session.widgetId)} ` +
            `in canvas ${cyan(session.canvasId)}.`
          )
          const confirm = await p.confirm({
            message: 'Open anyway? This may cause conflicts with the live widget.',
          })
          if (p.isCancel(confirm) || !confirm) continue
        }

        // Switch or attach
        if (currentTmuxSession) {
          p.outro(`Switching to ${bold(session.name || session.tmuxName)}...`)
          try {
            execSyncFn(`tmux switch-client -t "${session.tmuxName}"`, { stdio: 'inherit' })
          } catch {
            p.log.error('Failed to switch tmux client')
          }
        } else {
          p.outro(`Opening ${bold(session.name || session.tmuxName)}...`)
          try {
            execSyncFn(`tmux attach-session -t "${session.tmuxName}"`, { stdio: 'inherit' })
          } catch {
            p.log.error('Failed to open tmux session')
          }
        }
        process.exit(0)
      }

      if (next === 'tmux') {
        p.outro('Opening tmux session manager...')
        try {
          execSyncFn('tmux choose-session', { stdio: 'inherit' })
        } catch {}
        process.exit(0)
      }

      if (next === 'remove') {
        const label = session.name || session.tmuxName
        const widgetNote = session.widgetId && session.widgetId !== 'unknown'
          ? `\n  This will also ${yellow('remove the terminal widget')} from canvas ${cyan(session.canvasId)}.`
          : ''
        const confirm = await p.confirm({
          message: `Permanently remove session ${bold(label)}?${widgetNote}\n  The session and all running processes inside it will be destroyed.`,
        })
        if (p.isCancel(confirm) || !confirm) continue

        try {
          const { proxyBase, directBase } = getBaseUrl(worktreeName, port)
          let removed = false
          for (const base of [proxyBase, directBase]) {
            try {
              const res = await fetch(
                `${base}_storyboard/terminal/sessions/${encodeURIComponent(session.tmuxName)}`,
                { method: 'DELETE', signal: AbortSignal.timeout(3000) }
              )
              if (res.ok) { removed = true; break }
            } catch { continue }
          }
          if (removed) {
            p.log.success(`Session ${cyan(label)} removed`)
          } else {
            p.log.warn('API call failed, removing tmux session directly...')
            try {
              execSyncFn(`tmux kill-session -t "${session.tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
            } catch {}
            p.log.success(`Session ${cyan(label)} removed via tmux`)
          }

          // Remove widget from canvas
          if (session.widgetId && session.widgetId !== 'unknown' && session.canvasId && session.canvasId !== 'unknown') {
            for (const base of [proxyBase, directBase]) {
              try {
                const res = await fetch(`${base}_storyboard/canvas/widget`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: session.canvasId, widgetId: session.widgetId }),
                  signal: AbortSignal.timeout(3000),
                })
                if (res.ok) {
                  p.log.success(`Widget ${dim(session.widgetId)} removed from canvas ${cyan(session.canvasId)}`)
                  break
                }
              } catch { continue }
            }
          }
        } catch {
          p.log.error('Failed to remove session')
        }

        // Go back to session list (re-fetches to show updated list)
        stayInDetail = false
        continue
      }
    }
  }
}

main().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
