import { useState, useRef, useEffect, useCallback } from 'react'
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
  const canEdit = typeof onUpdate === 'function'
  const [editing, setEditing] = useState(false)
  const editingActive = canEdit && editing
  const textareaRef = useRef(null)
  const blockRef = useRef(null)
  const [editHeight, setEditHeight] = useState(null)

  const handleContentChange = useCallback((e) => {
    onUpdate?.({ content: e.target.value })
  }, [onUpdate])

  const handleReadOnlyCopy = useCallback((e) => {
    if (canEdit) return
    e.preventDefault()
    e.stopPropagation()
    if (e.clipboardData?.setData) {
      e.clipboardData.setData('text/plain', content || '')
    }
  }, [canEdit, content])

  useEffect(() => {
    if (editingActive) {
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
  }, [editingActive, editHeight])

  return (
    <WidgetWrapper>
      <div
        ref={blockRef}
        className={styles.block}
        style={{ width, minHeight: editHeight || undefined }}
      >
        {editingActive ? (
          <textarea
            ref={textareaRef}
            className={styles.editor}
            data-canvas-allow-text-selection
            style={{ minHeight: editHeight ? editHeight - 2 : undefined }}
            value={content}
            onChange={handleContentChange}
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
            style={!canEdit ? { cursor: 'default' } : undefined}
            data-canvas-allow-text-selection={!canEdit ? '' : undefined}
            onClick={!canEdit ? (e) => e.stopPropagation() : undefined}
            onCopy={!canEdit ? handleReadOnlyCopy : undefined}
            onDoubleClick={canEdit ? () => setEditing(true) : undefined}
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onKeyDown={canEdit ? (e) => { if (e.key === 'Enter') setEditing(true) } : undefined}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(content) || (canEdit
                ? '<p class="placeholder">Double-click to edit…</p>'
                : '<p class="placeholder">No content</p>'),
            }}
          />
        )}
      </div>
    </WidgetWrapper>
  )
}
