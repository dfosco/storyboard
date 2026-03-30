import { useState, useRef, useEffect, useCallback } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import styles from './PrototypeEmbed.module.css'

export default function PrototypeEmbed({ props, onUpdate }) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const rawSrc = src ? `${basePath}${src}` : ''
  const iframeSrc = rawSrc ? `${rawSrc}${rawSrc.includes('?') ? '&' : '?'}_sb_embed` : ''

  const [editing, setEditing] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const inputRef = useRef(null)
  const embedRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Exit interactive mode when clicking outside the embed
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  const enterInteractive = useCallback(() => setInteractive(true), [])
  const exitInteractive = useCallback(() => setInteractive(false), [])

  function handleSubmit(e) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim() || ''
    onUpdate?.({ src: value })
    setEditing(false)
  }

  return (
    <WidgetWrapper>
      <div
        ref={embedRef}
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
            <div className={styles.iframeContainer}>
              <iframe
                src={iframeSrc}
                className={styles.iframe}
                title={label || 'Prototype embed'}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
            {!interactive && (
              <div
                className={styles.dragOverlay}
                onDoubleClick={enterInteractive}
              />
            )}
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
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/></svg>
          </button>
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
