/**
 * TerminalWidgetMock — static mockups of the terminal canvas widget experience.
 * These are design storyboards, not functional components.
 */
import styles from './TerminalWidgetMock.module.css'

/* ── Shared chrome ── */

function TerminalChrome({ title, status, actions, children }) {
  return (
    <div className={styles.chrome}>
      <div className={styles.titleBar}>
        <span className={styles.titleIcon}>⬛</span>
        <span className={styles.titleText}>{title}</span>
        {status && <span className={styles.status}>{status}</span>}
        <span className={styles.spacer} />
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.terminal}>{children}</div>
    </div>
  )
}

export default TerminalChrome
