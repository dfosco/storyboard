import { useState, useRef, useEffect } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import styles from './PrototypeEmbed.module.css'

export default function PrototypeEmbed({ props, onUpdate }) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const iframeSrc = src ? `${basePath}${src}` : ''

  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function handleSubmit(e) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim() || ''
    onUpdate?.({ src: value })
    setEditing(false)
  }

  return (
    <WidgetWrapper>
      <div
        className={styles.embed}
        style={{ width, height }}
      >
        {editing ? (
          <form
            className={styles.urlForm}
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <label className={styles.urlLabel}>Prototype URL path</label>
            <input
              ref={inputRef}
              className={styles.urlInput}
              type="text"
              defaultValue={src}
              placeholder="/MyPrototype/page"
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
            />
            <div className={styles.urlActions}>
              <button type="submit" className={styles.urlSave}>Save</button>
              <button type="button" className={styles.urlCancel} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : iframeSrc ? (
          <>
            <iframe
              src={iframeSrc}
              className={styles.iframe}
              title={label || 'Prototype embed'}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
            <div
              className={styles.dragOverlay}
              onDoubleClick={() => setEditing(true)}
            />
          </>
        ) : (
          <div
            className={styles.empty}
            onDoubleClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
          >
            <p>Double-click to set prototype URL</p>
          </div>
        )}
        {iframeSrc && !editing && (
          <button
            className={styles.editBtn}
            onClick={(e) => { e.stopPropagation(); setEditing(true) }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="Edit URL"
            aria-label="Edit prototype URL"
          >✏️</button>
        )}
      </div>
      <div
        className={styles.resizeHandle}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          const startX = e.clientX
          const startY = e.clientY
          const startW = width
          const startH = height
          function onMove(ev) {
            const newW = Math.max(200, startW + ev.clientX - startX)
            const newH = Math.max(150, startH + ev.clientY - startY)
            onUpdate?.({ width: newW, height: newH })
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
          }
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp)
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </WidgetWrapper>
  )
}
