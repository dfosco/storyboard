/**
 * ExpandedPaneTopBar — split-half title bar for expanded views.
 *
 * Bar split in half: left label | right label | close button.
 * Active pane label uses default color; inactive pane is dimmed.
 * Single-pane: one label + close button.
 */
import { ScreenNormalIcon } from '@primer/octicons-react'
import styles from './ExpandedPaneTopBar.module.css'

/**
 * @param {Object} props
 * @param {Array<{ id: string, label: string }>} props.panes — one entry per pane
 * @param {number} props.activePaneIndex — which pane is focused
 * @param {() => void} props.onClose — close entire ExpandedPane
 */
export default function ExpandedPaneTopBar({ panes, activePaneIndex, onClose }) {
  const left = panes[0]
  const right = panes[1]

  return (
    <div className={styles.bar}>
      {left && (
        <span className={`${styles.leftLabel} ${activePaneIndex === 0 ? styles.active : styles.muted}`}>
          {left.label}
        </span>
      )}
      {right && (
        <span className={`${styles.rightLabel} ${activePaneIndex === 1 ? styles.active : styles.muted}`}>
          {right.label}
        </span>
      )}
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
        <ScreenNormalIcon size={16} />
      </button>
    </div>
  )
}
