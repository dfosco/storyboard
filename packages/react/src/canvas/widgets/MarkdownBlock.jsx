import { useState, useRef, useEffect } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import styles from './MarkdownBlock.module.css'

/**
 * Renders markdown as plain HTML using a minimal built-in converter.
 * No external markdown library needed for basic formatting.
 */
function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line
      return `<p>${line}</p>`
    })
}

export default function MarkdownBlock({ id, props, onUpdate, onRemove }) {
  const content = props?.content ?? ''
  const width = props?.width ?? 360
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  return (
    <WidgetWrapper onRemove={onRemove}>
      <div className={styles.block} style={{ width }}>
        {editing ? (
          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={content}
            onChange={(e) => onUpdate?.({ content: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Write markdown…"
          />
        ) : (
          <div
            className={styles.preview}
            onDoubleClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(content) || '<p class="placeholder">Double-click to edit…</p>',
            }}
          />
        )}
      </div>
    </WidgetWrapper>
  )
}
