import { forwardRef, useImperativeHandle, useMemo, useCallback, useState } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import { toFigmaEmbedUrl, getFigmaTitle, getFigmaType, isFigmaUrl } from './figmaUrl.js'
import styles from './FigmaEmbed.module.css'

const figmaEmbedSchema = schemas['figma-embed']

/** Inline Figma logo SVG */
function FigmaLogo() {
  return (
    <svg className={styles.figmaLogo} viewBox="0 0 38 57" fill="none" aria-hidden="true">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
    </svg>
  )
}

const TYPE_LABELS = { board: 'Board', design: 'Design', proto: 'Prototype' }

export default forwardRef(function FigmaEmbed({ props, onUpdate }, ref) {
  const url = readProp(props, 'url', figmaEmbedSchema)
  const width = readProp(props, 'width', figmaEmbedSchema)
  const height = readProp(props, 'height', figmaEmbedSchema)

  const [interactive, setInteractive] = useState(false)

  // Validate URL at render time — only embed known Figma URLs
  const isValid = useMemo(() => isFigmaUrl(url), [url])
  const embedUrl = useMemo(() => (isValid ? toFigmaEmbedUrl(url) : ''), [url, isValid])
  const title = useMemo(() => (url ? getFigmaTitle(url) : 'Figma'), [url])
  const figmaType = useMemo(() => getFigmaType(url), [url])
  const typeLabel = figmaType ? TYPE_LABELS[figmaType] : 'Figma'

  const enterInteractive = useCallback(() => setInteractive(true), [])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'open-external') {
        if (url) window.open(url, '_blank', 'noopener')
      }
    },
  }), [url])

  return (
    <WidgetWrapper>
      <div className={styles.embed} style={{ width, height }}>
        <div className={styles.header}>
          <FigmaLogo />
          <span className={styles.headerTitle}>{typeLabel}: {title}</span>
        </div>
        {embedUrl ? (
          <>
            <div className={styles.iframeContainer}>
              <iframe
                src={embedUrl}
                className={styles.iframe}
                title={`Figma ${typeLabel}: ${title}`}
                allowFullScreen
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
          <div className={styles.iframeContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--fgColor-muted, #656d76)', fontSize: 14, fontStyle: 'italic' }}>
              No Figma URL
            </p>
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
})
