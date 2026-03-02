
import { useState, useEffect, useMemo } from 'react'
import { hash, resolveSceneRoute, getSceneMeta } from '@dfosco/storyboard-core'
import styles from './Viewfinder.module.css'

function PlaceholderGraphic({ name }) {
  const seed = hash(name)
  const rects = []

  for (let i = 0; i < 12; i++) {
    const s = seed * (i + 1)
    const x = (s * 7 + i * 31) % 320
    const y = (s * 13 + i * 17) % 200
    const w = 20 + (s * (i + 3)) % 80
    const h = 8 + (s * (i + 7)) % 40
    const opacity = 0.06 + ((s * (i + 2)) % 20) / 100
    const fill = i % 3 === 0 ? 'var(--placeholder-accent)' : i % 3 === 1 ? 'var(--placeholder-fg)' : 'var(--placeholder-muted)'

    rects.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={fill}
        opacity={opacity}
      />
    )
  }

  const lines = []
  for (let i = 0; i < 6; i++) {
    const s = seed * (i + 5)
    const y = 10 + (s % 180)
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={320}
        y2={y}
        stroke="var(--placeholder-grid)"
        strokeWidth={0.5}
        opacity={0.4}
      />
    )
  }
  for (let i = 0; i < 8; i++) {
    const s = seed * (i + 9)
    const x = 10 + (s % 300)
    lines.push(
      <line
        key={`v${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={200}
        stroke="var(--placeholder-grid)"
        strokeWidth={0.5}
        opacity={0.3}
      />
    )
  }

  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="320" height="200" fill="var(--placeholder-bg)" />
      {lines}
      {rects}
    </svg>
  )
}

/**
 * Derive the current branch label from the base path.
 * Branch deploy folders use the convention `branch--<name>/`.
 */
function getCurrentBranch(basePath) {
  const match = (basePath || '').match(/\/branch--([^/]+)\/?$/)
  return match ? match[1] : 'main'
}

/**
 * Viewfinder — scene index and branch preview dashboard.
 *
 * @param {Object} props
 * @param {Record<string, unknown>} props.scenes - Scene index object (keys are scene names)
 * @param {Record<string, unknown>} props.pageModules - import.meta.glob result for page files
 * @param {string} [props.basePath] - Base URL path (defaults to import.meta.env.BASE_URL)
 * @param {string} [props.title] - Header title (defaults to "Viewfinder")
 * @param {string} [props.subtitle] - Optional subtitle displayed below the title
 * @param {boolean} [props.showThumbnails] - Show thumbnail previews (defaults to false)
 * @param {boolean} [props.hideDefaultScene] - Hide the "default" scene from the list (defaults to false)
 */
export default function Viewfinder({ scenes = {}, pageModules = {}, basePath, title = 'Viewfinder', subtitle, showThumbnails = false, hideDefaultScene = false }) {
  const [branches, setBranches] = useState(null)

  const sceneNames = useMemo(() => {
    const names = Object.keys(scenes)
    return hideDefaultScene ? names.filter(n => n !== 'default') : names
  }, [scenes, hideDefaultScene])

  const knownRoutes = useMemo(() =>
    Object.keys(pageModules)
      .map(p => p.replace('/src/pages/', '').replace('.jsx', ''))
      .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder'),
    [pageModules]
  )

  const branchBasePath = useMemo(() => {
    const base = basePath || '/storyboard-source/'
    return base.replace(/\/branch--[^/]*\/$/, '/')
  }, [basePath])

  const currentBranch = useMemo(() => getCurrentBranch(basePath), [basePath])

  const MOCK_BRANCHES = useMemo(() => [
    { branch: 'main', folder: '' },
    { branch: 'feat/comments-v2', folder: 'branch--feat-comments-v2' },
    { branch: 'fix/nav-overflow', folder: 'branch--fix-nav-overflow' },
  ], [])

  useEffect(() => {
    const url = `${branchBasePath}branches.json`
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => setBranches(Array.isArray(data) && data.length > 0 ? data : MOCK_BRANCHES))
      .catch(() => setBranches(MOCK_BRANCHES))
  }, [branchBasePath, MOCK_BRANCHES])

  const handleBranchChange = (e) => {
    const folder = e.target.value
    if (folder) {
      window.location.href = `${branchBasePath}${folder}/`
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {branches && branches.length > 0 && (
            <div className={styles.branchDropdown}>
              <svg className={styles.branchIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
              </svg>
              <select
                id="branch-select"
                className={styles.branchSelect}
                defaultValue=""
                onChange={handleBranchChange}
                aria-label="Switch branch"
              >
                <option value="" disabled>{currentBranch}</option>
                {branches.map((b) => (
                  <option key={b.folder} value={b.folder}>
                    {b.branch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <p className={styles.sceneCount}>
          {sceneNames.length} scene{sceneNames.length !== 1 ? 's' : ''}
        </p>
      </header>

      {sceneNames.length === 0 ? (
        <p className={styles.empty}>No scenes found. Add a <code>*.scene.json</code> file to get started.</p>
      ) : (
        <section>
          {/* <h2 className={styles.sectionTitle}>Scenes</h2> */}
          <div className={showThumbnails ? styles.grid : styles.list}>
            {sceneNames.map((name) => {
              const meta = getSceneMeta(name)
              const displayName = meta?.name || name
              return (
                <a key={name} href={resolveSceneRoute(name, knownRoutes)} className={showThumbnails ? styles.card : styles.listItem}>
                  {showThumbnails && (
                    <div className={styles.thumbnail}>
                      <PlaceholderGraphic name={name} />
                    </div>
                  )}
                  <div className={styles.cardBody}>
                    <p className={styles.sceneName}>{displayName}</p>
                    {meta?.author && (() => {
                      const authors = Array.isArray(meta.author) ? meta.author : [meta.author]
                      return (
                        <div className={styles.author}>
                          <span className={styles.authorAvatars}>
                            {authors.map((a) => (
                              <img
                                key={a}
                                src={`https://github.com/${a}.png?size=32`}
                                alt={a}
                                className={styles.authorAvatar}
                              />
                            ))}
                          </span>
                          <span className={styles.authorName}>{authors.join(', ')}</span>
                        </div>
                      )
                    })()}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
