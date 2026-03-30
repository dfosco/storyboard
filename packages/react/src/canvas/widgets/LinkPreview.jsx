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
      <div className={styles.card}>
        <span className={styles.icon}>🔗</span>
        <div className={styles.text}>
          {title && <p className={styles.title}>{title}</p>}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.url}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {hostname || url}
          </a>
        </div>
      </div>
    </WidgetWrapper>
  )
}
