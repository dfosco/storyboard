import { useState, useRef, useEffect } from 'react'
import styles from './StickyNote.module.css'

const COLORS = {
  yellow: { bg: '#fff8c5', border: '#d4a72c' },
  blue: { bg: '#ddf4ff', border: '#54aeff' },
  green: { bg: '#dafbe1', border: '#4ac26b' },
  pink: { bg: '#ffebe9', border: '#ff8182' },
  purple: { bg: '#fbefff', border: '#c297ff' },
  orange: { bg: '#fff1e5', border: '#d18616' },
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
    <article
      className={styles.sticky}
      style={{ '--sticky-bg': palette.bg, '--sticky-border': palette.border }}
    >
      <header className={styles.header}>
        <div className={styles.colors}>
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
        {onRemove && (
          <button
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove"
            aria-label="Remove sticky note"
          >×</button>
        )}
      </header>
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
  )
}
