import { useMode } from './hooks/useMode.js'
import styles from './ToolbarShell.module.css'

/**
 * Right-side toolbar container with two stacked groups:
 *   1. Mode-specific tools (from the active mode's `tools` array)
 *   2. Developer tools (from the active mode's `devTools` array)
 *
 * Fixed to the right side of the viewport, above the ModeSwitch.
 * Only renders when the current mode provides tools or devTools.
 */
export default function ToolbarShell() {
  const { currentModeConfig } = useMode()

  const tools = currentModeConfig?.tools ?? []
  const devTools = currentModeConfig?.devTools ?? []

  if (tools.length === 0 && devTools.length === 0) return null

  return (
    <div className={styles.shell}>
      {tools.length > 0 && (
        <div className={styles.toolbar} role="toolbar" aria-label="Mode tools">
          <span className={styles.label}>Tools</span>
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={styles.toolButton}
              onClick={tool.action}
              title={tool.label}
            >
              {tool.label}
            </button>
          ))}
        </div>
      )}

      {devTools.length > 0 && (
        <div className={styles.toolbar} role="toolbar" aria-label="Developer tools">
          <span className={styles.label}>Dev</span>
          {devTools.map((tool) => (
            <button
              key={tool.id}
              className={styles.toolButton}
              onClick={tool.action}
              title={tool.label}
            >
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
