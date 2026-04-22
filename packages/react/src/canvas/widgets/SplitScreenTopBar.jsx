/**
 * SplitScreenTopBar — terminal-style slim top bar for split-screen modals.
 * Shows "Type · Metadata" for each pane, with active pane in default color
 * and inactive pane in muted color. Theme-responsive.
 */
import { ScreenNormalIcon } from '@primer/octicons-react'
import styles from './SplitScreenTopBar.module.css'

/**
 * @param {Object} props
 * @param {string} props.leftLabel — "Type · Metadata" for the left pane
 * @param {string} props.rightLabel — "Type · Metadata" for the right pane
 * @param {'left' | 'right'} props.activePane — which pane has focus
 * @param {() => void} props.onClose — close handler
 */
export default function SplitScreenTopBar({ leftLabel, rightLabel, activePane, onClose }) {
  return (
    <div className={styles.bar}>
      <span className={activePane === 'left' ? styles.labelActive : styles.labelMuted}>
        {leftLabel}
      </span>
      <span className={activePane === 'right' ? styles.labelActive : styles.labelMuted}>
        {rightLabel}
      </span>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
        <ScreenNormalIcon size={16} />
      </button>
    </div>
  )
}
