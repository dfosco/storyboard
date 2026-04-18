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

function TerminalLine({ prompt, command, output, muted }) {
  return (
    <div className={`${styles.line} ${muted ? styles.muted : ''}`}>
      {prompt && <span className={styles.prompt}>{prompt}</span>}
      {command && <span className={styles.command}>{command}</span>}
      {output && <div className={styles.output}>{output}</div>}
    </div>
  )
}

function ActionButton({ icon, label, active }) {
  return (
    <button className={`${styles.actionBtn} ${active ? styles.active : ''}`}>
      {icon} <span>{label}</span>
    </button>
  )
}

function CopilotBadge() {
  return <span className={styles.copilotBadge}>✦ Copilot</span>
}

function ContextTag({ label }) {
  return <span className={styles.contextTag}>{label}</span>
}

export default TerminalChrome
