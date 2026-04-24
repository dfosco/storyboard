import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import { toggleImagePrivacy } from '../canvasApi.js'
import styles from './ImageWidget.module.css'

const imageSchema = schemas['image']

function getImageUrl(src) {
  if (!src) return ''
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  return `${base}/_storyboard/canvas/images/${src}`
}

/**
 * Canvas widget that displays a pasted image.
 * Supports aspect-ratio locked resize and privacy toggle.
 */
const ImageWidget = forwardRef(function ImageWidget({ props, onUpdate, resizable }, ref) {
  const containerRef = useRef(null)
  const [naturalRatio, setNaturalRatio] = useState(null)

  const src = readProp(props, 'src', imageSchema)
  const isPrivate = readProp(props, 'private', imageSchema)

  // Private images are not included in production builds
  const isHiddenInProd = isPrivate && import.meta.env?.PROD
  const width = readProp(props, 'width', imageSchema)
  const height = readProp(props, 'height', imageSchema)

  const handleImageLoad = useCallback((e) => {
    const img = e.target
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalRatio(img.naturalWidth / img.naturalHeight)
    }
  }, [])

  const handleResize = useCallback((newWidth) => {
    const ratio = naturalRatio || (width && height ? width / height : 4 / 3)
    const newHeight = Math.round(newWidth / ratio)
    onUpdate?.({ width: newWidth, height: newHeight })
  }, [naturalRatio, width, height, onUpdate])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'toggle-private') {
        if (!src) return
        toggleImagePrivacy(src).then((result) => {
          if (result.success) {
            onUpdate?.({ src: result.filename, private: result.private })
          }
        }).catch((err) => {
          console.error('[canvas] Failed to toggle image privacy:', err)
        })
      } else if (actionId === 'download-image') {
        if (!src) return
        const url = getImageUrl(src)
        const a = document.createElement('a')
        a.href = url
        a.download = src.replace(/^_/, '')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (actionId === 'copy-as-png') {
        if (!src) return
        const url = getImageUrl(src)
        fetch(url)
          .then((r) => r.blob())
          .then((blob) => {
            const pngBlob = blob.type === 'image/png' ? blob : blob
            navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]).catch(() => {})
          })
          .catch((err) => console.error('[canvas] Failed to copy image:', err))
      } else if (actionId === 'copy-file-path') {
        if (!src) return
        navigator.clipboard.writeText(`src/canvas/images/${src}`).catch(() => {})
      }
    }
  }), [src, onUpdate])

  if (!src || isHiddenInProd) return null

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`

  return (
    <WidgetWrapper className={styles.imageWrapper}>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.frame}>
          <img
            src={getImageUrl(src)}
            alt=""
            className={styles.image}
            onLoad={handleImageLoad}
            draggable={false}
          />
          {isPrivate && (
            <span className={styles.privateBadge} title="Private — not committed to git">
              Private
            </span>
          )}
        </div>
        {resizable && (
          <ResizeHandle
            targetRef={containerRef}
            minWidth={100}
            minHeight={60}
            onResize={(w) => handleResize(w)}
          />
        )}
      </div>
    </WidgetWrapper>
  )
})

export default ImageWidget
