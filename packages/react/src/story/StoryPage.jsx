/**
 * StoryPage — renders a .story.jsx module at its own route.
 *
 * When visited at e.g. /canvas/button-patterns, renders all named exports
 * from button-patterns.story.jsx in a gallery layout.
 *
 * When ?export=ExportName is present, renders only that single export
 * (used by iframe embeds from canvas StoryWidget).
 */
import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getStoryData } from '@dfosco/storyboard-core'
import { ThemeProvider, BaseStyles } from '@primer/react'
import styles from './StoryPage.module.css'

function StoryErrorBoundaryFallback({ name, error }) {
  return (
    <div className={styles.error}>
      <strong>{name}</strong>
      <span>{String(error?.message || error)}</span>
    </div>
  )
}

export default function StoryPage({ name }) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const exportFilter = searchParams.get('export')
  const isEmbed = searchParams.has('_sb_embed')

  const story = useMemo(() => getStoryData(name), [name])
  const [exports, setExports] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!story?._storyImport) {
      Promise.resolve().then(() => setError(`Story "${name}" not found or missing import`))
      return
    }

    let cancelled = false
    story._storyImport()
      .then((mod) => {
        if (cancelled) return
        const namedExports = {}
        for (const [key, value] of Object.entries(mod)) {
          if (key !== 'default' && typeof value === 'function') {
            namedExports[key] = value
          }
        }
        setExports(namedExports)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(`Failed to load story "${name}": ${err.message || err}`)
      })

    return () => { cancelled = true }
  }, [name, story])

  if (error) {
    return (
      <div className={styles.page}>
        <StoryErrorBoundaryFallback name={name} error={error} />
      </div>
    )
  }

  if (!exports) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading story…</div>
      </div>
    )
  }

  // Single export mode (for iframe embedding)
  if (exportFilter) {
    const Component = exports[exportFilter]
    if (!Component) {
      return (
        <div className={styles.page}>
          <StoryErrorBoundaryFallback
            name={`${name}/${exportFilter}`}
            error={`Export "${exportFilter}" not found in story "${name}"`}
          />
        </div>
      )
    }

    // Minimal wrapper for embed mode
    if (isEmbed) {
      return (
        <ThemeProvider colorMode="day">
          <BaseStyles>
            <Component />
          </BaseStyles>
        </ThemeProvider>
      )
    }

    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{name}</h1>
          <span className={styles.exportBadge}>{exportFilter}</span>
        </header>
        <section className={styles.storySection}>
          <Component />
        </section>
      </div>
    )
  }

  // Gallery mode — render all exports
  const exportNames = Object.keys(exports)

  return (
    <div className={styles.page}>
      {!isEmbed && (
        <header className={styles.header}>
          <h1 className={styles.title}>{name}</h1>
          <span className={styles.count}>{exportNames.length} {exportNames.length === 1 ? 'export' : 'exports'}</span>
        </header>
      )}
      {exportNames.map((exportName) => {
        const Component = exports[exportName]
        return (
          <section key={exportName} className={styles.storySection}>
            {!isEmbed && <h2 className={styles.exportName}>{exportName}</h2>}
            <div className={styles.storyContent}>
              <Component />
            </div>
          </section>
        )
      })}
    </div>
  )
}
