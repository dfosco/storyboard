/**
 * ToolbarShell — right-side toolbar container with two stacked groups:
 *   1. Mode-specific tools (group: 'tools')
 *   2. Developer tools (group: 'dev')
 *
 * Reads from the tool store, which sources from the declarative tool
 * registry (modes.config.json) + runtime state (setToolState/setToolAction).
 *
 * Fixed to the right side of the viewport, above the ModeSwitch.
 * Only renders when the current mode has visible tools.
 */

import { useSyncExternalStore } from 'react'
import './ToolbarShell.css'
import { toolState } from '../stores/toolStore.js'

function subscribeToolState(callback) {
  return toolState.subscribe(callback)
}

function getSnapshotToolState() {
  let current
  const unsub = toolState.subscribe((v) => { current = v })
  unsub()
  return current
}

function handleClick(tool) {
  if (tool.action && tool.state.enabled && !tool.state.busy) {
    tool.action()
  }
}

function ToolButton({ tool }) {
  return (
    <button
      className={
        'sb-tool-btn' +
        (tool.state.active ? ' sb-tool-btn-active' : '') +
        (tool.state.busy ? ' sb-tool-btn-busy' : '')
      }
      onClick={() => handleClick(tool)}
      disabled={!tool.state.enabled || tool.state.busy || !tool.action}
      title={tool.label}
    >
      {tool.label}
      {tool.state.badge != null && (
        <span className="sb-tool-badge">{tool.state.badge}</span>
      )}
    </button>
  )
}

export function ToolbarShell() {
  const state = useSyncExternalStore(subscribeToolState, getSnapshotToolState)

  if (!state || (state.tools.length === 0 && state.devTools.length === 0)) {
    return null
  }

  return (
    <div className="sb-toolbar-shell">
      {state.tools.length > 0 && (
        <div className="sb-toolbar" role="toolbar" aria-label="Mode tools">
          <span className="sb-toolbar-label">Tools</span>
          {state.tools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {state.devTools.length > 0 && (
        <div className="sb-toolbar" role="toolbar" aria-label="Developer tools">
          <span className="sb-toolbar-label">Dev</span>
          {state.devTools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ToolbarShell
