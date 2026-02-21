import { useMode } from './hooks/useMode.js'
import styles from './ModeSwitch.module.css'

/**
 * Segmented toggle for switching between design modes.
 *
 * Renders as a fixed pill at the bottom-center of the viewport.
 * Only shows when two or more modes are registered.
 */
export default function ModeSwitch() {
  const { mode, modes, switchMode } = useMode()

  if (modes.length < 2) return null

  return (
    <div className={styles.modeSwitch} role="tablist" aria-label="Design mode">
      {modes.map((m) => (
        <button
          key={m.name}
          role="tab"
          aria-selected={mode === m.name}
          className={`${styles.modeButton}${mode === m.name ? ` ${styles.modeButtonActive}` : ''}`}
          onClick={() => switchMode(m.name)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
