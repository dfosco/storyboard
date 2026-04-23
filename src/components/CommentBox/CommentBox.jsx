import { Fragment } from 'react'
import { MentionIcon, SmileyIcon, DeviceCameraVideoIcon } from '@primer/octicons-react'
import styles from './CommentBox.module.css'

const TOOLBAR_ACTIONS = [
  { label: 'Mention', icon: MentionIcon },
  { label: 'Emoji', icon: SmileyIcon },
  { label: 'Record video', icon: DeviceCameraVideoIcon },
]

export default function CommentBox({
  recipientName = 'Aaron',
  avatarUrl = 'https://avatars.githubusercontent.com/u/3?v=4',
  timestamp = '0:00',
  suggestions = [],
  onSuggestionClick,
  onCommentAtClick,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <img className={styles.avatar} src={avatarUrl} alt={`${recipientName}'s avatar`} />
        <span className={styles.placeholder}>Respond to {recipientName}...</span>
      </div>

      <div className={styles.toolbar} role="toolbar" aria-label="Comment actions">
        <div className={styles.toolbarIcons}>
          {TOOLBAR_ACTIONS.map(({ label, icon: Icon }, i) => (
            <Fragment key={label}>
              {i > 0 && <span className={styles.separator} aria-hidden="true" />}
              <button className={styles.iconButton} aria-label={label}>
                <Icon size={16} />
              </button>
            </Fragment>
          ))}
        </div>

        <button
          className={styles.timestampButton}
          onClick={onCommentAtClick}
        >
          Comment at {timestamp}
        </button>
      </div>

      {suggestions.length > 0 && (
        <section aria-label="AI suggestions">
          <p className={styles.suggestionsLabel}>
            Start with a suggestion from Loom AI <span className={styles.sparkle} aria-hidden="true">✦</span>
          </p>
          <div className={styles.suggestions} role="group">
            {suggestions.map((text) => (
              <button
                key={text}
                className={styles.chip}
                onClick={() => onSuggestionClick?.(text)}
              >
                {text}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
