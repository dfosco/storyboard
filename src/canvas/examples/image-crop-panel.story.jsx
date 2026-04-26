/**
 * Story B — Fixed Panel Below.
 *
 * When crop activates a panel slides below the toolbar with Save, Undo, Cancel
 * and live crop dimensions. Click-outside does NOT dismiss — only explicit
 * Cancel or Save exits crop mode.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './image-crop-panel.story.module.css'

/* ── helpers ──────────────────────────────────────────────────── */

function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }

const MIN_CROP = 30

/* SVG micro-icons (Octicons) */
function CropIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.75 1a.75.75 0 0 1 .75.75V3.5h7a1.75 1.75 0 0 1 1.75 1.75v7h1.75a.75.75 0 0 1 0 1.5H13.25v1.5a.75.75 0 0 1-1.5 0v-1.5h-7A1.75 1.75 0 0 1 3 12.5v-7H1.25a.75.75 0 0 1 0-1.5H3V1.75A.75.75 0 0 1 3.75 1ZM4.5 5.25v7c0 .138.112.25.25.25h7V5.25a.25.25 0 0 0-.25-.25h-7Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.22 6.28a.749.749 0 0 1 0-1.06l3.5-3.5a.749.749 0 1 1 1.06 1.06L3.56 5h7.19a5.25 5.25 0 0 1 0 10.5H9.25a.75.75 0 0 1 0-1.5h1.5a3.75 3.75 0 0 0 0-7.5H3.56l2.22 2.22a.749.749 0 1 1-1.06 1.06Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5H4.56l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L3.5 4.56v2.69a.75.75 0 0 1-1.5 0v-3.5A1.75 1.75 0 0 1 3.75 2Zm8.5 12h-3.5a.75.75 0 0 1 0-1.5h2.69l-3.22-3.22a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.22 3.22V8.75a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14Z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M16 13.25A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75ZM1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM3.5 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm9.994 5.123a.75.75 0 0 1-1.06.036L8.16 7.607a.25.25 0 0 0-.333-.004l-2.26 2.065a.75.75 0 0 1-1.012-1.106l2.26-2.066a1.75 1.75 0 0 1 2.33.028l4.313 4.037a.75.75 0 0 1 .036 1.062Z" />
    </svg>
  )
}

/* ── Crop overlay with draggable handles ──────────────────────── */

function CropOverlayWithHandles({ containerRect, cropRect, onCropChange, onCropEnd }) {
  const dragging = useRef(null)

  const startDrag = useCallback((handleId, e) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = {
      handle: handleId,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...cropRect },
    }

    const onMove = (me) => {
      if (!dragging.current) return
      const { handle, startX, startY, startCrop } = dragging.current
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      const cw = containerRect.width
      const ch = containerRect.height

      let { x, y, width, height } = startCrop

      if (handle === 'move') {
        x = clamp(startCrop.x + dx, 0, cw - width)
        y = clamp(startCrop.y + dy, 0, ch - height)
      } else {
        if (handle.includes('W') || handle === 'W') {
          const newX = clamp(startCrop.x + dx, 0, startCrop.x + startCrop.width - MIN_CROP)
          width = startCrop.width - (newX - startCrop.x)
          x = newX
        }
        if (handle.includes('E') || handle === 'E') {
          width = clamp(startCrop.width + dx, MIN_CROP, cw - startCrop.x)
        }
        if (handle.includes('N') || handle === 'N') {
          const newY = clamp(startCrop.y + dy, 0, startCrop.y + startCrop.height - MIN_CROP)
          height = startCrop.height - (newY - startCrop.y)
          y = newY
        }
        if (handle.includes('S') || handle === 'S') {
          height = clamp(startCrop.height + dy, MIN_CROP, ch - startCrop.y)
        }
      }

      onCropChange({ x, y, width, height })
    }

    const onUp = () => {
      dragging.current = null
      onCropEnd?.()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [containerRect, cropRect, onCropChange, onCropEnd])

  const handles = ['NW', 'NE', 'SW', 'SE', 'N', 'S', 'W', 'E']

  return (
    <div className={styles.cropOverlay}>
      <div
        className={styles.cropRegion}
        style={{
          left: cropRect.x,
          top: cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
        }}
        onPointerDown={(e) => startDrag('move', e)}
      >
        {handles.map((h) => (
          <div
            key={h}
            className={`${styles.handle} ${styles[`handle${h}`]}`}
            onPointerDown={(e) => startDrag(h, e)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Fixed crop panel (slides below toolbar) ──────────────────── */

function CropPanel({ cropRect, onSave, onUndo, onCancel, canUndo }) {
  const cropW = Math.round(cropRect.width)
  const cropH = Math.round(cropRect.height)

  return (
    <div className={styles.cropPanel}>
      <span className={styles.panelLabel}>Crop</span>
      <span className={styles.panelSep} />
      <span className={styles.dimensions}>{cropW} × {cropH}</span>
      <span className={styles.panelSep} />
      <button className={`${styles.panelBtn} ${styles.panelBtnSave}`} onClick={onSave}>
        <CheckIcon /> Save
      </button>
      {canUndo && (
        <button className={styles.panelBtn} onClick={onUndo}>
          <UndoIcon /> Undo
        </button>
      )}
      <button className={`${styles.panelBtn} ${styles.panelBtnCancel}`} onClick={onCancel}>
        <XIcon /> Cancel
      </button>
    </div>
  )
}

/* ── Main story export ────────────────────────────────────────── */

export function PanelBelowCrop() {
  const [cropping, setCropping] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 60, y: 40, width: 360, height: 220 })
  const [savedCrop, setSavedCrop] = useState(null)
  const [status, setStatus] = useState(null)
  const containerRef = useRef(null)
  const [containerRect, setContainerRect] = useState({ width: 480, height: 300 })

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setContainerRect({ width: rect.width, height: rect.height })
  }, [cropping])

  const handleStartCrop = useCallback(() => {
    setCropping(true)
    setStatus(null)
    setCropRect({ x: 40, y: 30, width: 400, height: 240 })
  }, [])

  const handleSave = useCallback(() => {
    setSavedCrop({ ...cropRect })
    setCropping(false)
    setStatus('saved')
  }, [cropRect])

  const handleUndo = useCallback(() => {
    if (savedCrop) {
      setSavedCrop(null)
      setCropping(false)
      setStatus('undone')
    }
  }, [savedCrop])

  const handleCancel = useCallback(() => {
    setCropping(false)
    setStatus(null)
  }, [])

  const previewStyle = savedCrop ? {
    clipPath: `inset(${savedCrop.y}px ${480 - savedCrop.x - savedCrop.width}px ${300 - savedCrop.y - savedCrop.height}px ${savedCrop.x}px)`,
  } : {}

  return (
    <div className={styles.cropStoryContainer}>
      {/* Toolbar + slide-down panel */}
      <div className={styles.toolbarWrapper}>
        <div className={styles.mockToolbar}>
          <button className={styles.toolbarBtn} title="Toggle private">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z" />
            </svg>
          </button>
          <button className={styles.toolbarBtn} title="Expand"><ExpandIcon /></button>
          <button className={styles.toolbarBtn} title="Duplicate"><CopyIcon /></button>
          <button
            className={`${styles.toolbarBtn} ${cropping ? styles.toolbarBtnActive : ''}`}
            onClick={handleStartCrop}
            title="Crop image"
          >
            <CropIcon />
          </button>
          <button className={styles.toolbarBtn} title="Image actions"><ImageIcon /></button>
        </div>

        {/* Panel slides below the toolbar — click-outside does NOT dismiss */}
        <div className={`${styles.panelContainer} ${cropping ? styles.panelContainerOpen : ''}`}>
          <CropPanel
            cropRect={cropRect}
            onSave={handleSave}
            onUndo={handleUndo}
            onCancel={handleCancel}
            canUndo={!!savedCrop}
          />
        </div>
      </div>

      {/* Image container */}
      <div ref={containerRef} className={styles.imageFrame}>
        <div className={styles.mockImage} style={previewStyle} />

        {cropping && (
          <CropOverlayWithHandles
            containerRect={containerRect}
            cropRect={cropRect}
            onCropChange={setCropRect}
          />
        )}
      </div>

      {/* Status bar */}
      {status === 'saved' && (
        <div className={`${styles.statusBar} ${styles.statusBarSuccess}`}>
          ✓ Crop saved — new image generated with --cropped-- timestamp
        </div>
      )}
      {status === 'undone' && (
        <div className={styles.statusBar}>
          ↩ Undo — reverted to original image
        </div>
      )}

      {/* Description */}
      <div className={styles.description}>
        <h3>Story B — Fixed Panel Below</h3>
        <p>
          A panel slides down from below the toolbar when crop activates, similar to the
          sticky-note color picker pattern. Contains Save, Undo, Cancel buttons and live
          crop dimensions. Clicking outside the panel does NOT dismiss — only explicit
          Cancel or Save exits crop mode.
        </p>
      </div>
    </div>
  )
}
