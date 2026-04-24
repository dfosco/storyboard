/**
 * StoryPage — renders a .story.jsx module at its own route.
 *
 * Renders only the bare component(s) with no layout chrome.
 * When ?export=ExportName is present, renders that single export.
 * Without ?export, renders all named exports stacked.
 */
import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getStoryData } from '@dfosco/storyboard-core'
import { ThemeProvider, BaseStyles } from '@primer/react'
import styles from './StoryPage.module.css'

function StoryErrorFallback({ name, error }) {
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

  // Signal snapshot-ready after story renders in embed mode.
  useEffect(() => {
    if (!isEmbed || !exports || window.parent === window) return
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__sbSnapshotReady?.()
      }))
    })
  }, [isEmbed, exports])

  if (error) {
    return (
      <StoryErrorFallback name={name} error={error} />
    )
  }

  if (!exports) {
    if (isEmbed) return null
    return (
      <div className={styles.loading}>Loading story…</div>
    )
  }

  // Single export mode
  if (exportFilter) {
    const Component = exports[exportFilter]
    if (!Component) {
      return (
        <StoryErrorFallback
          name={`${name}/${exportFilter}`}
          error={`Export "${exportFilter}" not found in story "${name}"`}
        />
      )
    }

    return (
      <ThemeProvider colorMode="day">
        <BaseStyles>
          <Component />
        </BaseStyles>
      </ThemeProvider>
    )
  }

  // All exports — render each component bare
  const exportNames = Object.keys(exports)

  return (
    <ThemeProvider colorMode="day">
      <BaseStyles>
        {exportNames.map((exportName) => {
          const Component = exports[exportName]
          return <Component key={exportName} />
        })}
      </BaseStyles>
    </ThemeProvider>
  )
}
