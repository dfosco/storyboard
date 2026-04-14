import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import styles from './MarkdownBlock.module.css'

const markdownSchema = schemas['markdown']

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

/**
 * Post-process rendered HTML to syntax-highlight fenced code blocks.
 * remark-html outputs <pre><code class="language-xxx">...</code></pre>.
 * We replace the code content with highlight.js output.
 */
let hljsPromise = null
function getHljs() {
  if (!hljsPromise) {
    hljsPromise = import('highlight.js/lib/core').then(async (mod) => {
      const hljs = mod.default
      const [js, ts, xml] = await Promise.all([
        import('highlight.js/lib/languages/javascript'),
        import('highlight.js/lib/languages/typescript'),
        import('highlight.js/lib/languages/xml'),
      ])
      hljs.registerLanguage('javascript', js.default)
      hljs.registerLanguage('typescript', ts.default)
      hljs.registerLanguage('xml', xml.default)
      hljs.registerLanguage('jsx', js.default)
      hljs.registerLanguage('tsx', ts.default)
      return hljs
    })
  }
  return hljsPromise
}

async function highlightCodeBlocks(html) {
  if (!html.includes('<code class="language-')) return html
  const hljs = await getHljs()
  return html.replace(
    /<code class="language-(\w+)">([\s\S]*?)<\/code>/g,
    (_, lang, code) => {
      try {
        const decoded = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        const result = hljs.highlight(decoded, { language: lang, ignoreIllegals: true })
        return `<code class="language-${lang} hljs">${result.value}</code>`
      } catch {
        return `<code class="language-${lang}">${code}</code>`
      }
    }
  )
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

  const rawHtml = useMemo(() => renderMarkdown(content), [content])
  const [renderedHtml, setRenderedHtml] = useState(rawHtml)

  // Async-highlight code blocks after initial render
  useEffect(() => {
    setRenderedHtml(rawHtml)
    if (!rawHtml.includes('<code class="language-')) return
    let cancelled = false
    highlightCodeBlocks(rawHtml).then((highlighted) => {
      if (!cancelled) setRenderedHtml(highlighted)
    })
    return () => { cancelled = true }
  }, [rawHtml])

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
              __html: renderedHtml || (canEdit
                ? '<p class="placeholder">Double-click to edit…</p>'
                : '<p class="placeholder">No content</p>'),
            }}
          />
        )}
      </div>
    </WidgetWrapper>
  )
}
