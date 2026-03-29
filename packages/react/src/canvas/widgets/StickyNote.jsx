import { useState, useRef, useEffect } from 'react'
import styles from './StickyNote.module.css'

const COLORS = {
  yellow: { bg: '#fff8c5', border: '#d4a72c', dot: '#e8c846' },
  blue: { bg: '#ddf4ff', border: '#54aeff', dot: '#74b9ff' },
  green: { bg: '#dafbe1', border: '#4ac26b', dot: '#6dd58c' },
  pink: { bg: '#ffebe9', border: '#ff8182', dot: '#ff9a9e' },
  purple: { bg: '#fbefff', border: '#c297ff', dot: '#d4a8ff' },
  orange: { bg: '#fff1e5', border: '#d18616', dot: '#e8a844' },
}

export default function StickyNote({ id, props, onUpdate, onRemove }) {
  const text = props?.text ?? ''
  const color = props?.color ?? 'yellow'
  const palette = COLORS[color] ?? COLORS.yellow
  const textareaRef = useRef(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [editing])

  return (
    <div className={styles.container}>
      <article
        className={styles.sticky}
        style={{ '--sticky-bg': palette.bg, '--sticky-border': palette.border }}
      >
        {onRemove && (
          <button
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove"
            aria-label="Remove sticky note"
          >×</button>
        )}
        {editing ? (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={(e) => onUpdate?.({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Type here…"
          />
        ) : (
          <p
            className={styles.text}
            onDoubleClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
          >
            {text || 'Double-click to edit…'}
          </p>
        )}
      </article>

      {/* Color picker — dot trigger below the sticky */}
      <div className={styles.pickerArea}>
        <span
          className={styles.pickerDot}
          style={{ background: palette.dot }}
        />
        <div className={styles.pickerPopup}>
          {Object.entries(COLORS).map(([name, c]) => (
            <button
              key={name}
              className={`${styles.colorDot} ${name === color ? styles.active : ''}`}
              style={{ background: c.bg, borderColor: c.border }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate?.({ color: name })
              }}
              title={name}
              aria-label={`Set color to ${name}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
