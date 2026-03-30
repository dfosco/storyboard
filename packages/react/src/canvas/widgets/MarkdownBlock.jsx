import { useState, useRef, useEffect } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, markdownSchema } from './widgetProps.js'
import styles from './MarkdownBlock.module.css'

/**
 * Renders markdown as plain HTML using a minimal built-in converter.
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

export default function MarkdownBlock({ props, onUpdate }) {
  const content = readProp(props, 'content', markdownSchema)
  const width = readProp(props, 'width', markdownSchema)
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef(null)
  const blockRef = useRef(null)
  const [editHeight, setEditHeight] = useState(null)

  useEffect(() => {
    if (editing) {
      // Capture the preview height before switching to editor
      if (blockRef.current && !editHeight) {
        setEditHeight(blockRef.current.offsetHeight)
      }
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } else {
      setEditHeight(null)
    }
  }, [editing, editHeight])

  return (
    <WidgetWrapper>
      <div
        ref={blockRef}
        className={styles.block}
        style={{ width, minHeight: editHeight || undefined }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className={styles.editor}
            style={{ minHeight: editHeight ? editHeight - 2 : undefined }}
            value={content}
            onChange={(e) => onUpdate?.({ content: e.target.value })}
            onBlur={() => setEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
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
