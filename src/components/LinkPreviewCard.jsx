import {
  StarIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  CalendarIcon,
} from '@primer/octicons-react'
import styles from './LinkPreviewCard.module.css'

/**
 * Link preview card with OG image support.
 * Shows a rich preview with title, domain, stats, and date.
 * Renders an emoji placeholder when no OG image is provided.
 */
export default function LinkPreviewCard({
  title,
  url,
  domain,
  domainIcon,
  ogImage,
  ogEmoji = '🔗',
  stats,
  date,
  width,
}) {
  let displayDomain = domain
  if (!displayDomain && url) {
    try { displayDomain = new URL(url).hostname } catch { /* */ }
  }

  const sizeStyle = width ? { width: `${width}px` } : undefined

  return (
    <article className={styles.card} style={sizeStyle}>
      <div className={styles.ogArea}>
        {ogImage ? (
          <img
            className={styles.ogImage}
            src={ogImage}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className={styles.ogPlaceholder}>
            {ogEmoji}
          </div>
        )}
      </div>

      <div className={styles.top}>
        <h2 className={styles.title}>{title || displayDomain || 'Untitled'}</h2>
        {displayDomain && (
          <span className={styles.domain}>
            {domainIcon && <span className={styles.domainIcon}>{domainIcon}</span>}
            {displayDomain}
          </span>
        )}
      </div>

      <div className={styles.bottom}>
        {stats && (
          <div className={styles.stats}>
            {stats.stars != null && (
              <div className={styles.stat}>
                <span className={styles.statTop}>
                  {stats.stars}
                  <StarIcon size={16} />
                </span>
                <span className={styles.statLabel}>stars</span>
              </div>
            )}
            {stats.pulls != null && (
              <div className={styles.stat}>
                <span className={styles.statTop}>
                  {stats.pulls}
                  <GitPullRequestIcon size={16} />
                </span>
                <span className={styles.statLabel}>pulls</span>
              </div>
            )}
            {stats.issues != null && (
              <div className={styles.stat}>
                <span className={styles.statTop}>
                  {stats.issues}
                  <IssueOpenedIcon size={16} />
                </span>
                <span className={styles.statLabel}>issues</span>
              </div>
            )}
          </div>
        )}

        {date && (
          <div className={styles.date}>
            <CalendarIcon size={16} />
            {date}
          </div>
        )}
      </div>
    </article>
  )
}
