import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import styles from './PrototypeEmbed.module.css'

export default function PrototypeEmbed({ id, props, onUpdate, onRemove }) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  // Build the full iframe URL using the app's base path
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const iframeSrc = src ? `${basePath}${src}` : ''

  return (
    <WidgetWrapper onRemove={onRemove}>
      <div className={styles.embed} style={{ width, height }}>
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className={styles.iframe}
            title={label || 'Prototype embed'}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        ) : (
          <div className={styles.empty}>
            <p>No prototype URL set</p>
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
