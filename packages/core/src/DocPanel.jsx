/**
 * DocPanel — Documentation tab for the side panel.
 * Renders the project README.md as styled markdown.
 *
 * Server endpoints:
 *   GET /_storyboard/docs/readme → { content, path }
 *   GET /_storyboard/docs/repo   → { owner, name }
 */

import React, { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import octicons from '@primer/octicons'

const _basePath = (typeof window !== 'undefined' && window.__STORYBOARD_BASE_PATH__) || '/'
const _apiBase = _basePath.replace(/\/$/, '')

function OcticonSvg({ name, size = 16, className }) {
  const icon = octicons[name]
  if (!icon) return null
  const svg = icon.toSVG({ width: size, height: size })
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'inline-flex', alignItems: 'center' }} />
}

export default function DocPanel() {
  const [readmeHtml, setReadmeHtml] = useState('')
  const [readmeLoading, setReadmeLoading] = useState(true)
  const [readmeError, setReadmeError] = useState('')
  const [repoInfo, setRepoInfo] = useState(null)

  const githubUrl = useMemo(
    () => repoInfo ? `https://github.com/${repoInfo.owner}/${repoInfo.name}` : null,
    [repoInfo]
  )

  useEffect(() => {
    fetchReadme()
    fetchRepoInfo()
  }, [])

  async function fetchReadme() {
    setReadmeLoading(true)
    setReadmeError('')
    try {
      const res = await fetch(`${_apiBase}/_storyboard/docs/readme`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setReadmeHtml(marked.parse(data.content ?? ''))
    } catch {
      setReadmeError('README.md not found')
    } finally {
      setReadmeLoading(false)
    }
  }

  async function fetchRepoInfo() {
    try {
      const res = await fetch(`${_apiBase}/_storyboard/docs/repo`)
      if (res.ok) setRepoInfo(await res.json())
    } catch { /* ignore */ }
  }

  return (
    <div className="sb-doc-panel">
      <div className="sb-doc-header">
        <span className="sb-doc-header-title">
          <OcticonSvg name="book" size={14} />
          README
        </span>
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sb-doc-github-link"
          >
            <OcticonSvg name="mark-github" size={14} />
            <span>GitHub</span>
          </a>
        )}
      </div>

      <div className="sb-doc-content">
        {readmeLoading ? (
          <div className="sb-doc-loading">
            <div className="sb-doc-spinner" />
          </div>
        ) : readmeError ? (
          <div className="sb-doc-empty">
            <OcticonSvg name="book" size={24} />
            <p>{readmeError}</p>
          </div>
        ) : (
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        )}
      </div>
    </div>
  )
}
