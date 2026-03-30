import { useState, useRef, useEffect, useCallback } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import styles from './PrototypeEmbed.module.css'

export default function PrototypeEmbed({ props, onUpdate }) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const rawSrc = src ? `${basePath}${src}` : ''
  const iframeSrc = rawSrc ? `${rawSrc}${rawSrc.includes('?') ? '&' : '?'}_sb_embed` : ''

  const scale = zoom / 100
  const iframeWidth = width / scale
  const iframeHeight = height / scale

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
                style={{
                  width: iframeWidth,
                  height: iframeHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                }}
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
          >✏️</button>
        )}
        {iframeSrc && !editing && (
          <div
            className={styles.zoomBar}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              className={styles.zoomBtn}
              onClick={() => onUpdate?.({ zoom: Math.max(25, zoom - 25) })}
              disabled={zoom <= 25}
              aria-label="Zoom out"
            >−</button>
            <span className={styles.zoomLabel}>{zoom}%</span>
            <button
              className={styles.zoomBtn}
              onClick={() => onUpdate?.({ zoom: Math.min(200, zoom + 25) })}
              disabled={zoom >= 200}
              aria-label="Zoom in"
            >+</button>
          </div>
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
