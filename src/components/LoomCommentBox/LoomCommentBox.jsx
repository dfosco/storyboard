import { MentionIcon, SmileyIcon, DeviceCameraVideoIcon } from '@primer/octicons-react'
import styles from './LoomCommentBox.module.css'

export default function LoomCommentBox({
  recipientName = 'Aaron',
  avatarUrl = 'https://avatars.githubusercontent.com/u/3?v=4',
  timestamp = '0:00',
  suggestions = [
    'Great insights on filtering the results,...',
    'Nice job on addressing the check failures,...',
  ],
  onSuggestionClick,
  onCommentAtClick,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img className={styles.avatar} src={avatarUrl} alt={recipientName} />
        <span className={styles.placeholder}>Respond to {recipientName}...</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarIcons}>
          <button className={styles.iconButton} aria-label="Mention">
            <MentionIcon size={20} />
          </button>
          <span className={styles.divider} />
          <button className={styles.iconButton} aria-label="Emoji">
            <SmileyIcon size={20} />
          </button>
          <span className={styles.divider} />
          <button className={styles.iconButton} aria-label="Record video">
            <DeviceCameraVideoIcon size={20} />
          </button>
        </div>
        <button
          className={styles.timestampButton}
          onClick={onCommentAtClick}
        >
          Comment at {timestamp}
        </button>
      </div>

      <div className={styles.suggestionsLabel}>
        Start with a suggestion from Loom AI <span className={styles.sparkle}>✦</span>
      </div>

      <div className={styles.suggestions}>
        {suggestions.map((text, i) => (
          <button
            key={i}
            className={styles.chip}
            onClick={() => onSuggestionClick?.(text, i)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
