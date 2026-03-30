import { useState, useRef, useEffect, useCallback } from 'react'
import { readProp, stickyNoteSchema } from './widgetProps.js'
import styles from './StickyNote.module.css'

const COLORS = {
  yellow: { bg: '#fff8c5', border: '#d4a72c', dot: '#e8c846' },
  blue: { bg: '#ddf4ff', border: '#54aeff', dot: '#74b9ff' },
  green: { bg: '#dafbe1', border: '#4ac26b', dot: '#6dd58c' },
  pink: { bg: '#ffebe9', border: '#ff8182', dot: '#ff9a9e' },
  purple: { bg: '#fbefff', border: '#c297ff', dot: '#d4a8ff' },
  orange: { bg: '#fff1e5', border: '#d18616', dot: '#e8a844' },
}

export default function StickyNote({ props, onUpdate }) {
  const text = readProp(props, 'text', stickyNoteSchema)
  const color = readProp(props, 'color', stickyNoteSchema)
  const palette = COLORS[color] ?? COLORS.yellow
  const textareaRef = useRef(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [editing])

  const handleTextChange = useCallback((e) => {
    onUpdate?.({ text: e.target.value })
  }, [onUpdate])

  const handleColorChange = useCallback((newColor) => {
    onUpdate?.({ color: newColor })
  }, [onUpdate])

  return (
    <div className={styles.container}>
      <article
        className={styles.sticky}
        style={{ '--sticky-bg': palette.bg, '--sticky-border': palette.border }}
      >
        <p
          className={styles.text}
          style={editing ? { visibility: 'hidden' } : undefined}
          onDoubleClick={() => setEditing(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
        >
          {text || 'Double-click to edit…'}
        </p>
        {editing && (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={handleTextChange}
            onBlur={() => setEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Type here…"
          />
        )}
      </article>

      {/* Color picker — dot trigger below the sticky */}
      <div
        className={styles.pickerArea}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          className={styles.pickerDot}
          style={{ background: palette.dot }}
        />
        <div className={styles.pickerPopup}>
          {Object.entries(COLORS).map(([colorName, c]) => (
            <button
              key={colorName}
              className={`${styles.colorDot} ${colorName === color ? styles.active : ''}`}
              style={{ background: c.bg, borderColor: c.border }}
              onClick={(e) => {
                e.stopPropagation()
                handleColorChange(colorName)
              }}
              title={colorName}
              aria-label={`Set color to ${colorName}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

