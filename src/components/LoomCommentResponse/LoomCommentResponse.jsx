import { Avatar } from '@primer/react'
import {
  MentionIcon,
  SmileyIcon,
  DeviceCameraVideoIcon,
  SparkleFillIcon,
} from '@primer/octicons-react'
import styles from './LoomCommentResponse.module.css'

export default function LoomCommentResponse({
  recipientName = 'Aaron',
  avatarUrl = 'https://avatars.githubusercontent.com/u/3?v=4',
  timestamp = '0:00',
  suggestions = [
    'Great insights on filtering the results,...',
    'Nice job on addressing the check failures,...',
  ],
  onSuggestionClick,
  onSubmit,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar src={avatarUrl} alt={recipientName} size={36} />
        <span className={styles.placeholder}>Respond to {recipientName}...</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarIcons}>
          <button className={styles.iconButton} aria-label="Mention someone" type="button">
            <MentionIcon size={20} />
          </button>
          <span className={styles.separator} />
          <button className={styles.iconButton} aria-label="Add emoji" type="button">
            <SmileyIcon size={20} />
          </button>
          <span className={styles.separator} />
          <button className={styles.iconButton} aria-label="Record video" type="button">
            <DeviceCameraVideoIcon size={20} />
          </button>
        </div>
        <button
          className={styles.timestampButton}
          type="button"
          onClick={onSubmit}
        >
          Comment at {timestamp}
        </button>
      </div>

      <div className={styles.aiSection}>
        <div className={styles.aiLabel}>
          <span>Start with a suggestion from Loom AI</span>
          <SparkleFillIcon size={14} />
        </div>
        <div className={styles.suggestions}>
          {suggestions.map((text, i) => (
            <button
              key={i}
              className={styles.suggestion}
              type="button"
              onClick={() => onSuggestionClick?.(text, i)}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
