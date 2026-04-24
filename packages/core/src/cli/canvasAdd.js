/**
 * storyboard canvas add <widget-type> — Add a widget to an existing canvas.
 *
 * Usage:
 *   storyboard canvas add sticky-note --canvas my-canvas
 *   storyboard canvas add markdown --canvas my-canvas --x 100 --y 200
 *   storyboard canvas add prototype --canvas my-canvas --props '{"src":"my-proto"}'
 *
 * Known widget types: sticky-note, markdown, prototype
 * The server accepts any type string — new widget types work automatically.
 */

import fs from 'node:fs'
import * as p from '@clack/prompts'
import { parseFlags, hasFlags, formatFlagHelp } from './flags.js'
import { widgetSchema } from './schemas.js'
import { ensureDevServer, serverPost, getServerUrl } from './create.js'

const KNOWN_TYPES = ['sticky-note', 'markdown', 'prototype', 'story']

async function canvasAdd() {
  // argv: storyboard canvas add [type] [--flags]
  // process.argv: [node, script, 'canvas', 'add', ...rest]
  const rest = process.argv.slice(4)

  if (rest.includes('--help') || rest.includes('-h')) {
    console.log(`\n  canvas add flags:\n`)
    console.log(`  Positional: <widget-type>  Widget type (${KNOWN_TYPES.join(', ')})\n`)
    console.log(formatFlagHelp(widgetSchema))
    console.log('')
    process.exit(0)
  }

  // Extract positional widget type (first non-flag arg)
  let widgetType = ''
  const flagTokens = []
  for (const token of rest) {
    if (!widgetType && !token.startsWith('-')) {
      widgetType = token
    } else {
      flagTokens.push(token)
    }
  }

  const flagMode = hasFlags(rest) || Boolean(widgetType)
  const { flags, errors } = flagMode ? parseFlags(flagTokens, widgetSchema) : { flags: {}, errors: [] }

  if (errors.length) {
    for (const e of errors) p.log.error(e)
    process.exit(1)
  }

  p.intro('storyboard canvas add')
  await ensureDevServer()

  // Widget type
  if (!widgetType) {
    widgetType = await p.select({
      message: 'Widget type',
      options: KNOWN_TYPES.map((t) => ({ value: t, label: t })),
    })
    if (p.isCancel(widgetType)) return process.exit(0)
  }

  // Canvas name
  const canvasName = flags.canvas || await (async () => {
    // Try to fetch available canvases
    let canvases = []
    try {
      const base = getServerUrl()
      const res = await fetch(`${base}/_storyboard/canvas/list`)
      if (res.ok) {
        const data = await res.json()
        canvases = data.canvases || data || []
      }
    } catch {}

    if (canvases.length > 0) {
      const choice = await p.select({
        message: 'Canvas',
        options: canvases.map((c) => ({ value: c.name || c, label: c.name || c })),
      })
      if (p.isCancel(choice)) process.exit(0)
      return choice
    }

    const v = await p.text({
      message: 'Canvas name',
      placeholder: 'my-canvas',
      validate: (v) => { if (!v) return 'Canvas name is required' },
    })
    if (p.isCancel(v)) process.exit(0)
    return v
  })()

  const x = flags.x ?? 0
  const y = flags.y ?? 0

  let props = {}
  if (flags['props-file']) {
    try {
      const raw = fs.readFileSync(flags['props-file'], 'utf8')
      props = JSON.parse(raw)
    } catch (err) {
      p.log.error(`--props-file: ${err.message}`)
      process.exit(1)
    }
  } else if (flags.props) {
    try {
      props = JSON.parse(flags.props)
    } catch {
      p.log.error('--props must be valid JSON')
      process.exit(1)
    }
  }

  // Story-specific: prompt for storyId and exportName if not in --props
  if (widgetType === 'story' && !props.storyId) {
    // Try to fetch available stories from the dev server
    let stories = []
    try {
      const base = getServerUrl()
      const res = await fetch(`${base}/_storyboard/stories/list`)
      if (res.ok) {
        const data = await res.json()
        stories = data.stories || []
      }
    } catch {}

    if (stories.length > 0) {
      const storyId = await (async () => {
        const choice = await p.select({
          message: 'Story',
          options: stories.map((s) => ({ value: s.name, label: s.name, hint: s.route || '' })),
        })
        if (p.isCancel(choice)) process.exit(0)
        return choice
      })()
      props.storyId = storyId
    } else {
      const storyId = await (async () => {
        const v = await p.text({
          message: 'Story ID',
          placeholder: 'button-patterns',
          validate: (v) => { if (!v) return 'Story ID is required' },
        })
        if (p.isCancel(v)) process.exit(0)
        return v
      })()
      props.storyId = storyId
    }

    if (!props.exportName) {
      const exportName = await (async () => {
        const v = await p.text({
          message: 'Export name (leave empty for all)',
          placeholder: 'Default',
        })
        if (p.isCancel(v)) process.exit(0)
        return v
      })()
      if (exportName) props.exportName = exportName
    }

    if (!props.width) props.width = 600
    if (!props.height) props.height = 400
  }

  // Submit
  const s = p.spinner()
  s.start(`Adding ${widgetType} widget...`)

  try {
    const result = await serverPost('/_storyboard/canvas/widget', {
      name: canvasName,
      type: widgetType,
      props,
      position: { x, y },
    })
    s.stop(`Widget added!`)
    if (result.id) {
      p.log.success(`  ${widgetType} → ${canvasName} (id: ${result.id})`)
    } else {
      p.log.success(`  ${widgetType} → ${canvasName}`)
    }
    p.outro('')
  } catch (err) {
    s.stop('Failed to add widget')
    p.log.error(err.message)
    p.outro('')
  }
}

canvasAdd()
