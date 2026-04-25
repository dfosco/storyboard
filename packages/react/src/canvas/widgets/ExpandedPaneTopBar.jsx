/**
 * ExpandedPaneTopBar — dark per-pane title bar for expanded/split-screen views.
 *
 * Each pane gets its own bar with a left-aligned label.
 * The rightmost (or only) pane shows the close button.
 */
import { ScreenNormalIcon } from '@primer/octicons-react'
import styles from './ExpandedPaneTopBar.module.css'

/**
 * @param {Object} props
 * @param {string} props.label — pane display label
 * @param {boolean} [props.showClose] — show close button (rightmost pane)
 * @param {() => void} [props.onClose] — close entire ExpandedPane
 */
export default function ExpandedPaneTopBar({ label, showClose, onClose }) {
  return (
    <div className={styles.bar}>
      <span className={styles.label}>{label}</span>
      {showClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
          <ScreenNormalIcon size={16} />
        </button>
      )}
    </div>
  )
}
