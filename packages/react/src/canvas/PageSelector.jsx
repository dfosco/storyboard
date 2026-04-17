import { useCallback, useRef, useState, useEffect } from 'react'
import { createCanvas } from './canvasApi.js'
import styles from './PageSelector.module.css'

/**
 * In-canvas page selector — shows sibling pages in the same canvas group.
 * Only renders when 2+ sibling pages exist.
 * Uses window.location for navigation to avoid requiring a Router context.
 *
 * @param {{ currentName: string, pages: Array<{ name: string, route: string, title: string }>, isLocalDev?: boolean }} props
 */
export default function PageSelector({ currentName, pages, isLocalDev = false }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const currentPage = pages.find((p) => p.name === currentName)
  const currentLabel = currentPage?.title || currentName.split('/').pop()
  const currentIndex = pages.findIndex((p) => p.name === currentName)

  // Derive folder from currentName (e.g. "Examples/Design Overview" → "Examples")
  const folder = currentName.includes('/') ? currentName.split('/')[0] : ''

  const handleSelect = useCallback(
    (page) => {
      if (page.name !== currentName) {
        const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
        window.location.href = base + page.route
      }
      setOpen(false)
    },
    [currentName],
  )

  const handleAddPage = useCallback(async () => {
    const trimmed = newName.trim()
    if (!trimmed || creating) return
    setCreating(true)
    try {
      const result = await createCanvas({ name: trimmed, folder: folder || undefined })
      if (result.error) {
        console.error('Failed to create canvas page:', result.error)
        setCreating(false)
        return
      }
      // Navigate to the new page once Vite picks it up
      const kebab = trimmed
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      const route = folder ? `/${folder}/${kebab}` : `/${kebab}`
      const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
      // Small delay to let Vite detect the new file
      setTimeout(() => { window.location.href = base + route }, 600)
    } catch (err) {
      console.error('Failed to create canvas page:', err)
      setCreating(false)
    }
  }, [newName, folder, creating])

  // Focus input when entering add mode
  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setAdding(false)
        setNewName('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (adding) {
          setAdding(false)
          setNewName('')
        } else {
          setOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, adding])

  if (!pages || pages.length < 2) return null

  return (
    <nav ref={containerRef} className={styles.container} aria-label="Canvas pages">
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch canvas page"
      >
        <span className={styles.label}>{currentLabel}</span>
        <span className={styles.badge}>
          {currentIndex + 1}/{pages.length}
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Canvas pages">
          {pages.map((page) => (
            <li
              key={page.name}
              role="option"
              aria-selected={page.name === currentName}
              className={`${styles.item} ${page.name === currentName ? styles.itemActive : ''}`}
              onClick={() => handleSelect(page)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(page)
                }
              }}
              tabIndex={0}
            >
              {page.title}
            </li>
          ))}
          {isLocalDev && (
            <>
              <li className={styles.separator} role="separator" />
              {adding ? (
                <li className={styles.addForm}>
                  <input
                    ref={inputRef}
                    className={styles.addInput}
                    type="text"
                    placeholder="Page name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddPage()
                      }
                    }}
                    disabled={creating}
                  />
                  <button
                    className={styles.addSubmit}
                    onClick={handleAddPage}
                    disabled={!newName.trim() || creating}
                  >
                    {creating ? '…' : 'Add'}
                  </button>
                </li>
              ) : (
                <li
                  className={styles.addItem}
                  onClick={() => setAdding(true)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setAdding(true)
                    }
                  }}
                >
                  + Add new page
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </nav>
  )
}
