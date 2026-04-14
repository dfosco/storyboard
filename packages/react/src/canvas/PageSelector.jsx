import { useCallback, useRef, useState, useEffect } from 'react'
import styles from './PageSelector.module.css'

/**
 * In-canvas page selector — shows sibling pages in the same canvas group.
 * Only renders when 2+ sibling pages exist.
 * Uses window.location for navigation to avoid requiring a Router context.
 *
 * @param {{ currentName: string, pages: Array<{ name: string, route: string, title: string }> }} props
 */
export default function PageSelector({ currentName, pages }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const currentPage = pages.find((p) => p.name === currentName)
  const currentLabel = currentPage?.title || currentName.split('/').pop()
  const currentIndex = pages.findIndex((p) => p.name === currentName)

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

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

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
        </ul>
      )}
    </nav>
  )
}
