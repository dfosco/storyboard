/**
 * ExpandedPaneTopBar — N-pane aware top bar for expanded views.
 *
 * Renders one label chip per pane (active highlighted, muted otherwise),
 * with remove buttons, add-pane button, and close button.
 */
import { ScreenNormalIcon, PlusIcon, XIcon } from '@primer/octicons-react'
import styles from './ExpandedPaneTopBar.module.css'

/**
 * @param {Object} props
 * @param {Array<{ id: string, label: string }>} props.panes — one entry per pane
 * @param {number} props.activePaneIndex — which pane is focused
 * @param {() => void} props.onClose — close entire ExpandedPane
 * @param {(index: number) => void} [props.onRemovePane] — remove a specific pane
 * @param {() => void} [props.onAddPane] — add empty pane slot
 */
export default function ExpandedPaneTopBar({
  panes,
  activePaneIndex,
  onClose,
  onRemovePane,
  onAddPane,
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.labels}>
        {panes.map((pane, i) => (
          <div
            key={pane.id}
            className={`${styles.label} ${i === activePaneIndex ? styles.active : styles.muted}`}
            onPointerDown={() => {/* future: drag reorder */}}
          >
            <span className={styles.labelText}>{pane.label}</span>
            {panes.length > 1 && onRemovePane && (
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); onRemovePane(i) }}
                aria-label={`Remove ${pane.label} pane`}
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        {onAddPane && (
          <button className={styles.addBtn} onClick={onAddPane} aria-label="Add pane">
            <PlusIcon size={16} />
          </button>
        )}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close expanded view" autoFocus>
          <ScreenNormalIcon size={16} />
        </button>
      </div>
    </div>
  )
}
