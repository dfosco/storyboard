<!--
  DocPanel — Documentation tab for the side panel.
  Renders the project README.md as styled markdown.

  Server endpoints:
    GET /_storyboard/docs/readme → { content, path }
    GET /_storyboard/docs/repo   → { owner, name }
-->

<script>
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  // ── README state ──────────────────────────────────────────────
  let readmeHtml = $state('')
  let readmeLoading = $state(true)
  let readmeError = $state('')

  /** @type {{ owner: string, name: string } | null} */
  let repoInfo = $state(null)

  const githubUrl = $derived(
    repoInfo ? `https://github.com/${repoInfo.owner}/${repoInfo.name}` : null
  )

  const _basePath = (typeof window !== 'undefined' && window.__STORYBOARD_BASE_PATH__) || '/'
  const _apiBase = _basePath.replace(/\/$/, '')

  // ── Effects ───────────────────────────────────────────────────

  onMount(() => {
    fetchReadme()
    fetchRepoInfo()
  })

  // ── Fetchers ──────────────────────────────────────────────────

  async function fetchReadme() {
    readmeLoading = true
    readmeError = ''
    try {
      const res = await fetch(`${_apiBase}/_storyboard/docs/readme`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      readmeHtml = marked.parse(data.content ?? '')
    } catch {
      readmeError = 'README.md not found'
    } finally {
      readmeLoading = false
    }
  }

  async function fetchRepoInfo() {
    try {
      const res = await fetch(`${_apiBase}/_storyboard/docs/repo`)
      if (res.ok) repoInfo = await res.json()
    } catch {}
  }
</script>

<div class="sb-doc-panel">
  <div class="sb-doc-header">
    <span class="sb-doc-header-title">
      <Icon name="primer/book" size={14} />
      README
    </span>
    {#if githubUrl}
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="sb-doc-github-link"
      >
        <Icon name="primer/mark-github" size={14} />
        <span>GitHub</span>
      </a>
    {/if}
  </div>

  <div class="sb-doc-content">
    {#if readmeLoading}
      <div class="sb-doc-loading">
        <div class="sb-doc-spinner"></div>
      </div>
    {:else if readmeError}
      <div class="sb-doc-empty">
        <Icon name="primer/book" size={24} color="var(--fgColor-muted)" />
        <p>{readmeError}</p>
      </div>
    {:else}
      <div class="markdown-body">
        {@html readmeHtml}
      </div>
    {/if}
  </div>
</div>

<style>
  /* ── Panel layout ──────────────────────────────────────────── */
  .sb-doc-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    color: var(--fgColor-default, #e6edf3);
    font-family: "Mona Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 13px;
  }

  /* ── Header ────────────────────────────────────────────────── */
  .sb-doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--borderColor-default, #30363d);
    flex-shrink: 0;
  }

  .sb-doc-header-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--fgColor-default, #e6edf3);
  }

  .sb-doc-github-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    color: var(--fgColor-muted, #848d97);
    text-decoration: none;
    flex-shrink: 0;
  }

  .sb-doc-github-link:hover {
    text-decoration: underline;
  }

  /* ── Content area ──────────────────────────────────────────── */
  .sb-doc-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  /* ── Loading / empty states ────────────────────────────────── */
  .sb-doc-loading {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }

  .sb-doc-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--borderColor-default, #30363d);
    border-top-color: var(--fgColor-accent, #58a6ff);
    border-radius: 50%;
    animation: sb-spin 0.6s linear infinite;
  }

  @keyframes sb-spin {
    to { transform: rotate(360deg); }
  }

  .sb-doc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    color: var(--fgColor-muted, #848d97);
    text-align: center;
  }

  /* ── Markdown body ─────────────────────────────────────────── */
  .markdown-body {
    line-height: 1.6;
    word-wrap: break-word;
  }

  .markdown-body :global(h1) {
    font-size: 1.6em;
    font-weight: 600;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--borderColor-default, #30363d);
  }

  .markdown-body :global(h2) {
    font-size: 1.3em;
    font-weight: 600;
    margin: 20px 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--borderColor-default, #30363d);
  }

  .markdown-body :global(h3) {
    font-size: 1.1em;
    font-weight: 600;
    margin: 16px 0 6px;
  }

  .markdown-body :global(h4),
  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    font-size: 1em;
    font-weight: 600;
    margin: 12px 0 4px;
  }

  .markdown-body :global(p) {
    margin: 0 0 12px;
  }

  .markdown-body :global(a) {
    color: var(--fgColor-accent, #58a6ff);
    text-decoration: none;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    margin: 0 0 12px;
    padding-left: 24px;
  }

  .markdown-body :global(li) {
    margin: 2px 0;
  }

  .markdown-body :global(code) {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.9em;
    padding: 2px 6px;
    background: var(--bgColor-muted, #161b22);
    border-radius: 4px;
  }

  .markdown-body :global(pre) {
    margin: 0 0 12px;
    padding: 12px;
    background: var(--bgColor-muted, #161b22);
    border-radius: 6px;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    padding: 0;
    background: none;
    font-size: 12px;
    line-height: 1.5;
  }

  .markdown-body :global(blockquote) {
    margin: 0 0 12px;
    padding: 4px 12px;
    border-left: 3px solid var(--borderColor-default, #30363d);
    color: var(--fgColor-muted, #848d97);
  }

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 12px;
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    padding: 6px 10px;
    border: 1px solid var(--borderColor-default, #30363d);
    text-align: left;
  }

  .markdown-body :global(th) {
    font-weight: 600;
    background: var(--bgColor-muted, #161b22);
  }

  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid var(--borderColor-default, #30363d);
    margin: 16px 0;
  }

  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 6px;
  }
</style>
