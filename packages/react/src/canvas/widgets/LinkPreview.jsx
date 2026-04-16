import { useState } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, linkPreviewSchema } from './widgetProps.js'
import styles from './LinkPreview.module.css'

function formatDateLabel(rawValue) {
  if (!rawValue) return ''
  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function LinkPreview({ id, props, onRefreshGitHub, canRefreshGitHub }) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const url = readProp(props, 'url', linkPreviewSchema)
  const title = readProp(props, 'title', linkPreviewSchema)
  const github = props?.github && typeof props.github === 'object' ? props.github : null
  const authors = Array.isArray(github?.authors)
    ? github.authors.filter((author) => typeof author === 'string' && author.trim())
    : []

  const createdLabel = formatDateLabel(github?.createdAt)
  const updatedLabel = formatDateLabel(github?.updatedAt)
  const hasRefresh = Boolean(github && canRefreshGitHub && onRefreshGitHub)

  const width = typeof props?.width === 'number' ? props.width : null
  const height = typeof props?.height === 'number' ? props.height : null
  const sizeStyle = (width || height)
    ? { ...(width ? { width: `${width}px` } : {}), ...(height ? { minHeight: `${height}px` } : {}) }
    : undefined

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    // invalid URL
  }

  async function handleRefresh(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!hasRefresh || refreshing || !url) return
    setRefreshing(true)
    setRefreshError('')

    try {
      const result = await onRefreshGitHub(id, url)
      if (result?.error) setRefreshError(result.error)
    } catch {
      setRefreshError('Unable to refresh GitHub metadata right now.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <WidgetWrapper>
      <div className={`${styles.card} ${github ? styles.cardGithub : ''}`} style={sizeStyle}>
        <div className={styles.header}>
          <span className={styles.icon}>{github ? '🐙' : '🔗'}</span>
          <div className={styles.text}>
            {title && <p className={styles.title}>{title}</p>}
            {github?.context && <p className={styles.context}>{github.context}</p>}
          </div>
          {hasRefresh && (
            <button
              type="button"
              className={styles.refreshButton}
              onClick={handleRefresh}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={refreshing}
              aria-label="Refresh GitHub metadata"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>

        {github?.body && <p className={styles.body}>{github.body}</p>}

        {github && (
          <p className={styles.meta}>
            {authors.length > 0 ? `By ${authors.join(', ')}` : 'GitHub'}
            {createdLabel ? ` · Created ${createdLabel}` : ''}
            {updatedLabel ? ` · Updated ${updatedLabel}` : ''}
          </p>
        )}

        {refreshError && <p className={styles.error}>{refreshError}</p>}

        <a
          href={url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.url}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {hostname || url}
        </a>
      </div>
    </WidgetWrapper>
  )
}
