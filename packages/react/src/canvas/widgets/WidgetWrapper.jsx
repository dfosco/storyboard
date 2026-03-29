import styles from './WidgetWrapper.module.css'

/**
 * Common wrapper for all canvas widgets.
 * Provides a labeled frame, delete button, and consistent styling.
 */
export default function WidgetWrapper({ label, children, onRemove, className }) {
  return (
    <section className={`${styles.wrapper} ${className || ''}`}>
      <header className={styles.header}>
        <span className={styles.label}>{label}</span>
        {onRemove && (
          <button
            className={styles.removeBtn}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            title="Remove widget"
            aria-label="Remove widget"
          >
            ×
          </button>
        )}
      </header>
      <div className={styles.content}>
        {children}
      </div>
    </section>
  )
}
