/**
 * TerminalSessionMock — static mockups of the TMUX session management experience.
 * These are design storyboards, not functional components.
 */
import styles from './TerminalSessionMock.module.css'

/* ── Shared chrome ── */

export function Chrome({ title, status, actions, children }) {
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

export function Line({ prompt, command, output, muted }) {
  return (
    <div className={`${styles.line} ${muted ? styles.muted : ''}`}>
      {prompt && <span className={styles.prompt}>{prompt}</span>}
      {command && <span className={styles.command}>{command}</span>}
      {output && <div className={styles.output}>{output}</div>}
    </div>
  )
}

export function Btn({ icon, label, active }) {
  return (
    <button className={`${styles.actionBtn} ${active ? styles.active : ''}`}>
      {icon} <span>{label}</span>
    </button>
  )
}

export default Chrome
