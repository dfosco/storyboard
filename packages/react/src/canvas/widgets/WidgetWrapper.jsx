import styles from './WidgetWrapper.module.css'

/**
 * Common wrapper for all canvas widgets.
 * Provides shadow/border styling and a remove button on hover.
 */
export default function WidgetWrapper({ children, onRemove, className }) {
  return (
    <section className={`${styles.wrapper} ${className || ''}`}>
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
      <div className={styles.content}>
        {children}
      </div>
    </section>
  )
}
