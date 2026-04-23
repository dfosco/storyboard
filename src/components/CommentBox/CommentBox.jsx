import { MentionIcon, SmileyIcon, DeviceCameraVideoIcon } from '@primer/octicons-react'
import styles from './CommentBox.module.css'

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
        <img className={styles.avatar} src={avatarUrl} alt={recipientName} />
        <span className={styles.placeholder}>Respond to {recipientName}...</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarIcons}>
          <button className={styles.iconButton} aria-label="Mention">
            <MentionIcon size={16} />
          </button>
          <span className={styles.separator} />
          <button className={styles.iconButton} aria-label="Emoji">
            <SmileyIcon size={16} />
          </button>
          <span className={styles.separator} />
          <button className={styles.iconButton} aria-label="Record video">
            <DeviceCameraVideoIcon size={16} />
          </button>
        </div>

        <button
          className={styles.timestampButton}
          onClick={onCommentAtClick}
        >
          Comment at {timestamp}
        </button>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className={styles.suggestionsLabel}>
            Start with a suggestion from Loom AI <span className={styles.sparkle}>✦</span>
          </div>
          <div className={styles.suggestions}>
            {suggestions.map((text, i) => (
              <button
                key={i}
                className={styles.chip}
                onClick={() => onSuggestionClick?.(text)}
              >
                {text}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
