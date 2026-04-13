/**
 * storyboard create — Interactive creation of prototypes, canvases, flows, and pages.
 *
 * Usage:
 *   storyboard create                  Interactive picker
 *   storyboard create prototype        Create a prototype
 *   storyboard create canvas           Create a canvas
 */

import * as p from '@clack/prompts'
import { detectWorktreeName, getPort } from '../worktree/port.js'

const dim = (s) => `\x1b[2m${s}\x1b[0m`

function getServerUrl() {
  const name = detectWorktreeName()
  const port = getPort(name)
  return `http://localhost:${port}`
}

async function serverGet(path) {
  const base = getServerUrl()
  const res = await fetch(`${base}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function serverPost(path, body) {
  const base = getServerUrl()
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${text ? ': ' + text : ''}`)
  }
  return res.json()
}

async function checkServer() {
  try {
    await fetch(getServerUrl(), { signal: AbortSignal.timeout(2000) })
    return true
  } catch {
    return false
  }
}

async function ensureDevServer() {
  if (await checkServer()) return

  const s = p.spinner()
  s.start('Starting dev server...')

  const { spawn } = await import('child_process')
  const { readFileSync } = await import('fs')
  const { resolve } = await import('path')
  const { generateCaddyfile, isCaddyRunning, reloadCaddy } = await import('./proxy.js')

  const worktreeName = detectWorktreeName()
  const port = getPort(worktreeName)
  const isMain = worktreeName === 'main'
  const basePath = isMain ? '/' : `/branch--${worktreeName}/`

  const child = spawn('npx', ['vite', '--port', String(port)], {
    env: { ...process.env, VITE_BASE_PATH: basePath },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  child.unref()

  // Wait for Vite to be ready (up to 30s)
  const start = Date.now()
  while (Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 500))
    if (await checkServer()) {
      // Update Caddy with actual port
      try {
        const caddyfilePath = generateCaddyfile({ [worktreeName]: port })
        if (isCaddyRunning()) reloadCaddy(caddyfilePath)
      } catch {}
      s.stop('Dev server started')
      return
    }
  }
  s.stop('Dev server may still be starting...')
}

// ── Prototype creation ────────────────────────────────────────

async function createPrototype() {
  p.intro('storyboard create prototype')
  await ensureDevServer()

  // Fetch available folders and templates from server
  let folders = []
  let partials = []
  try {
    const data = await serverGet('/_storyboard/workshop/prototypes')
    folders = data.folders || []
    partials = data.partials || []
  } catch {
    // Server may not support this endpoint — continue without options
  }

  const isExternal = await p.confirm({
    message: 'Is this an external prototype?',
    initialValue: false,
  })
  if (p.isCancel(isExternal)) return process.exit(0)

  let url = ''
  if (isExternal) {
    url = await p.text({
      message: 'External URL',
      placeholder: 'https://example.com/prototype',
      validate: (v) => {
        if (!v) return 'URL is required for external prototypes'
        if (!/^https?:\/\//.test(v)) return 'URL must start with http:// or https://'
      },
    })
    if (p.isCancel(url)) return process.exit(0)
  }

  const name = await p.text({
    message: 'Prototype name',
    placeholder: 'my-prototype',
    validate: (v) => {
      if (!v) return 'Name is required'
      if (/[A-Z\s]/.test(v)) return 'Use kebab-case (lowercase, hyphens)'
    },
  })
  if (p.isCancel(name)) return process.exit(0)

  const title = await p.text({
    message: 'Display title',
    placeholder: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    defaultValue: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  })
  if (p.isCancel(title)) return process.exit(0)

  // Folder selection
  let folder = ''
  if (folders.length > 0) {
    folder = await p.select({
      message: 'Folder',
      options: [
        { value: '', label: 'None (root)' },
        ...folders.map((f) => ({ value: f, label: f })),
      ],
    })
    if (p.isCancel(folder)) return process.exit(0)
  }

  // Template selection
  let partial = ''
  if (!isExternal && partials.length > 0) {
    const templateOptions = [
      { value: '', label: 'Blank (no template)' },
      ...partials.map((t) => ({
        value: t.id || t.name || t,
        label: t.name || t.label || t,
        hint: t.directory || undefined,
      })),
    ]
    partial = await p.select({
      message: 'Template',
      options: templateOptions,
    })
    if (p.isCancel(partial)) return process.exit(0)
  }

  const author = await p.text({
    message: 'Author',
    placeholder: 'your-name',
    defaultValue: '',
  })
  if (p.isCancel(author)) return process.exit(0)

  const description = await p.text({
    message: 'Description',
    placeholder: 'What is this prototype about?',
    defaultValue: '',
  })
  if (p.isCancel(description)) return process.exit(0)

  let createFlow = false
  if (!isExternal) {
    createFlow = await p.confirm({
      message: 'Create a default flow file?',
      initialValue: false,
    })
    if (p.isCancel(createFlow)) return process.exit(0)
  }

  // Submit
  const s = p.spinner()
  s.start('Creating prototype...')

  try {
    const body = {
      name,
      title: title || name,
      folder: folder || undefined,
      partial: partial || undefined,
      author: author || undefined,
      description: description || undefined,
      createFlow,
    }
    if (isExternal) body.url = url

    const result = await serverPost('/_storyboard/workshop/prototypes', body)
    s.stop('Prototype created!')
    if (result.path) {
      p.log.success(`  ${result.path}`)
    }
  } catch (err) {
    s.stop('Failed to create prototype')
    p.log.error(err.message)
  }

  p.outro('')
}

// ── Canvas creation ───────────────────────────────────────────

async function createCanvas() {
  p.intro('storyboard create canvas')
  await ensureDevServer()

  // Fetch available folders
  let folders = []
  try {
    const data = await serverGet('/_storyboard/canvas/folders')
    folders = data.folders || data || []
  } catch {
    // Continue without folders
  }

  const name = await p.text({
    message: 'Canvas name',
    placeholder: 'my-canvas',
    validate: (v) => {
      if (!v) return 'Name is required'
      if (/[A-Z\s]/.test(v)) return 'Use kebab-case (lowercase, hyphens)'
    },
  })
  if (p.isCancel(name)) return process.exit(0)

  const title = await p.text({
    message: 'Display title',
    placeholder: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    defaultValue: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  })
  if (p.isCancel(title)) return process.exit(0)

  let folder = ''
  if (Array.isArray(folders) && folders.length > 0) {
    folder = await p.select({
      message: 'Folder',
      options: [
        { value: '', label: 'None (root)' },
        ...folders.map((f) => ({ value: f, label: f })),
      ],
    })
    if (p.isCancel(folder)) return process.exit(0)
  }

  const grid = await p.confirm({
    message: 'Show dot grid?',
    initialValue: true,
  })
  if (p.isCancel(grid)) return process.exit(0)

  const includeJsx = await p.confirm({
    message: 'Include JSX companion file?',
    initialValue: false,
  })
  if (p.isCancel(includeJsx)) return process.exit(0)

  // Submit
  const s = p.spinner()
  s.start('Creating canvas...')

  try {
    const result = await serverPost('/_storyboard/canvas/create', {
      name,
      title: title || name,
      folder: folder || undefined,
      grid,
      includeJsx,
    })
    s.stop('Canvas created!')
    if (result.path || result.name) {
      p.log.success(`  ${result.path || result.name}`)
    }
  } catch (err) {
    s.stop('Failed to create canvas')
    p.log.error(err.message)
  }

  p.outro('')
}

// ── Dispatcher ────────────────────────────────────────────────

async function main() {
  const subcommand = process.argv[3]

  if (subcommand === 'prototype') return createPrototype()
  if (subcommand === 'canvas') return createCanvas()

  // Interactive picker
  p.intro('storyboard create')

  const type = await p.select({
    message: 'What would you like to create?',
    options: [
      { value: 'prototype', label: 'Prototype', hint: 'React-based interactive prototype' },
      { value: 'canvas', label: 'Canvas', hint: 'Freeform canvas with widgets' },
    ],
  })

  if (p.isCancel(type)) return process.exit(0)

  // Re-run with the selected subcommand
  if (type === 'prototype') return createPrototype()
  if (type === 'canvas') return createCanvas()
}

main()
