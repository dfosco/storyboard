import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, markdownSchema } from './widgetProps.js'
import styles from './MarkdownBlock.module.css'

/**
 * Renders markdown to HTML using remark with GitHub Flavored Markdown support.
 */
function renderMarkdown(text) {
  if (!text) return ''
  const result = remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .processSync(text)
  return String(result)
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
