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
 * @param {Array<{icon: React.ComponentType, label: string, onClick: () => void}>} [props.leftActions] — action buttons for the left pane
 * @param {Array<{icon: React.ComponentType, label: string, onClick: () => void}>} [props.rightActions] — action buttons for the right pane
 */
export default function SplitScreenTopBar({ leftLabel, rightLabel, activePane, onClose, leftActions, rightActions }) {
  return (
    <div className={styles.bar}>
      <div className={`${styles.leftHalf} ${activePane === 'left' ? styles.active : styles.muted}`}>
        <span className={styles.label}>{leftLabel}</span>
        {leftActions?.map((action, i) => (
          <button key={i} className={styles.closeBtn} onClick={action.onClick} aria-label={action.label}>
            <action.icon size={16} />
          </button>
        ))}
      </div>
      <div className={`${styles.rightHalf} ${activePane === 'right' ? styles.active : styles.muted}`}>
        <span className={styles.label}>{rightLabel}</span>
        {rightActions?.map((action, i) => (
          <button key={i} className={styles.closeBtn} onClick={action.onClick} aria-label={action.label}>
            <action.icon size={16} />
          </button>
        ))}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
          <ScreenNormalIcon size={16} />
        </button>
      </div>
    </div>
  )
}
