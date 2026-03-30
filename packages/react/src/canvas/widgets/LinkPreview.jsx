import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, linkPreviewSchema } from './widgetProps.js'
import styles from './LinkPreview.module.css'

export default function LinkPreview({ props }) {
  const url = readProp(props, 'url', linkPreviewSchema)
  const title = readProp(props, 'title', linkPreviewSchema)

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch { /* invalid URL */ }

  return (
    <WidgetWrapper>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className={styles.icon}>🔗</span>
        <div className={styles.text}>
          {title && <p className={styles.title}>{title}</p>}
          <p className={styles.url}>{hostname || url}</p>
        </div>
      </a>
    </WidgetWrapper>
  )
}
