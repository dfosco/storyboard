/**
 * Terminal Config — per-terminal context files for agent awareness.
 *
 * Each terminal widget gets a config at `.storyboard/terminals/{hash}.json`
 * that agents read on startup to understand their canvas context.
 *
 * Files are keyed by a stable hash (same as tmuxName) so renames don't break them.
 * The canvasId/widgetId are stored inside the JSON payload.
 *
 * Connected widgets are stored as IDs only — full widget data is resolved
 * from the materialized canvas state at read time to stay fresh.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'

const TERMINALS_DIR = '.storyboard/terminals'

let rootDir = process.cwd()

/** Initialize with the project root directory */
export function initTerminalConfig(root) {
  rootDir = root
  const dir = join(rootDir, TERMINALS_DIR)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/** Generate a stable filename from branch + canvasId + widgetId */
function configKey(branch, canvasId, widgetId) {
  const input = `${branch}::${canvasId}::${widgetId}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/** Get the config file path */
function configPath(branch, canvasId, widgetId) {
  return join(rootDir, TERMINALS_DIR, `${configKey(branch, canvasId, widgetId)}.json`)
}

/** Atomic write — write to temp then rename */
function atomicWrite(filePath, data) {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, filePath)
}

/**
 * Write or update a terminal config file.
 * Called when a terminal widget is created or reconnected.
 */
export function writeTerminalConfig({ branch, canvasId, widgetId, canvasFile = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  const dir = dirname(fp)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  let existing = {}
  try {
    existing = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* new file */ }

  const config = {
    ...existing,
    widgetId,
    canvasId,
    canvasFile: canvasFile || existing.canvasFile || null,
    branch,
    deleted: false,
    connectedWidgetIds: existing.connectedWidgetIds || [],
    agentStatus: existing.agentStatus || null,
    updatedAt: new Date().toISOString(),
  }

  atomicWrite(fp, config)
  return config
}

/**
 * Update connected widget IDs for a terminal.
 * Called when connectors are added/removed.
 * Only stores widget IDs — full data resolved at read time.
 */
export function updateTerminalConnections({ branch, canvasId, widgetId, connectedWidgetIds }) {
  const fp = configPath(branch, canvasId, widgetId)
  let config = {}
  try {
    config = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* file may not exist yet */ }

  config.connectedWidgetIds = connectedWidgetIds
  config.updatedAt = new Date().toISOString()

  atomicWrite(fp, config)
  return config
}

/**
 * Mark a terminal config as deleted (tombstone).
 * Called when a terminal widget is deleted.
 */
export function markTerminalDeleted({ branch, canvasId, widgetId }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    const config = JSON.parse(readFileSync(fp, 'utf8'))
    config.deleted = true
    config.updatedAt = new Date().toISOString()
    atomicWrite(fp, config)
  } catch { /* file may not exist */ }
}

/**
 * Unmark a terminal config as deleted (undo).
 * Called when a deleted terminal widget is restored.
 */
export function unmarkTerminalDeleted({ branch, canvasId, widgetId }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    const config = JSON.parse(readFileSync(fp, 'utf8'))
    config.deleted = false
    config.updatedAt = new Date().toISOString()
    atomicWrite(fp, config)
  } catch { /* file may not exist */ }
}

/**
 * Read a terminal config, optionally resolving connected widget data
 * from the materialized canvas state.
 *
 * @param {object} opts
 * @param {function} [opts.resolveWidgets] — fn(canvasName, widgetIds) => widget objects
 */
export function readTerminalConfig({ branch, canvasId, widgetId, resolveWidgets = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    const config = JSON.parse(readFileSync(fp, 'utf8'))

    // Resolve full widget data if resolver provided
    if (resolveWidgets && config.connectedWidgetIds?.length > 0) {
      try {
        config.connectedWidgets = resolveWidgets(canvasId, config.connectedWidgetIds)
      } catch {
        config.connectedWidgets = []
      }
    }

    return config
  } catch {
    return null
  }
}

/**
 * Update agent status in the terminal config.
 * Called by the signal endpoint.
 */
export function updateAgentStatus({ branch, canvasId, widgetId, status, message = null, data = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  let config = {}
  try {
    config = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* may not exist */ }

  config.agentStatus = {
    status,
    message,
    data,
    updatedAt: new Date().toISOString(),
  }
  config.updatedAt = new Date().toISOString()

  atomicWrite(fp, config)
  return config
}
