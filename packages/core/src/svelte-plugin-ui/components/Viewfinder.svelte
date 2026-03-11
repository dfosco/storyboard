<!--
  Viewfinder — prototype index and flow dashboard.

  Full-page component that lists prototypes as expandable groups,
  each showing its flows. Global flows (not belonging to any prototype)
  appear in a separate section.

  Mounted via mountViewfinder() from the viewfinder plugin entry point.
-->

<script lang="ts">
  import { hash, resolveFlowRoute, getFlowMeta, buildPrototypeIndex } from '../../viewfinder.js'

  interface Props {
    title?: string
    subtitle?: string
    basePath?: string
    knownRoutes?: string[]
    showThumbnails?: boolean
    hideDefaultFlow?: boolean
  }

  let {
    title = 'Storyboard',
    subtitle = '',
    basePath = '/',
    knownRoutes = [],
    showThumbnails = false,
    hideDefaultFlow = false,
  }: Props = $props()

  const { prototypes, globalFlows: allGlobalFlows } = buildPrototypeIndex(knownRoutes)

  const globalFlows = $derived(
    hideDefaultFlow
      ? allGlobalFlows.filter((f: any) => f.key !== 'default')
      : allGlobalFlows
  )

  const totalFlows = $derived(
    prototypes.reduce((sum: number, p: any) => sum + p.flows.length, 0) + globalFlows.length
  )

  // Expanded state — all prototypes start expanded
  let expanded: Record<string, boolean> = $state(
    Object.fromEntries(prototypes.map((p: any) => [p.dirName, true]))
  )

  function togglePrototype(dirName: string) {
    expanded[dirName] = !expanded[dirName]
  }

  function formatName(name: string): string {
    return name
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  function placeholderSvg(name: string): string {
    const h = (function hashStr(s: string) {
      let v = 0
      for (let i = 0; i < s.length; i++) v = ((v << 5) - v + s.charCodeAt(i)) | 0
      return Math.abs(v)
    })(name)

    let rects = ''
    for (let i = 0; i < 12; i++) {
      const s = h * (i + 1)
      const x = (s * 7 + i * 31) % 320
      const y = (s * 13 + i * 17) % 200
      const w = 20 + (s * (i + 3)) % 80
      const ht = 8 + (s * (i + 7)) % 40
      const opacity = 0.06 + ((s * (i + 2)) % 20) / 100
      const fill = i % 3 === 0 ? 'var(--vf-accent)' : i % 3 === 1 ? 'var(--vf-fg)' : 'var(--vf-muted)'
      rects += `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="2" fill="${fill}" opacity="${opacity}" />`
    }

    let lines = ''
    for (let i = 0; i < 6; i++) {
      const s = h * (i + 5)
      const y = 10 + (s % 180)
      lines += `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="var(--vf-grid)" stroke-width="0.5" opacity="0.4" />`
    }
    for (let i = 0; i < 8; i++) {
      const s = h * (i + 9)
      const x = 10 + (s % 300)
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="var(--vf-grid)" stroke-width="0.5" opacity="0.3" />`
    }

    return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="200" fill="var(--vf-bg-inset)" />${lines}${rects}</svg>`
  }

  // Branch switching
  interface Branch { branch: string; folder: string }

  const MOCK_BRANCHES: Branch[] = [
    { branch: 'main', folder: '' },
    { branch: 'feat/comments-v2', folder: 'branch--feat-comments-v2' },
    { branch: 'fix/nav-overflow', folder: 'branch--fix-nav-overflow' },
  ]

  let branches: Branch[] | null = $state(null)

  const branchBasePath = $derived(
    (basePath || '/storyboard-source/').replace(/\/branch--[^/]*\/$/, '/')
  )

  const currentBranch = $derived(
    (() => {
      const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
      return m ? m[1] : 'main'
    })()
  )

  $effect(() => {
    fetch(`${branchBasePath}branches.json`)
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        branches = Array.isArray(data) && data.length > 0 ? data : MOCK_BRANCHES
      })
      .catch(() => { branches = MOCK_BRANCHES })
  })

  function handleBranchChange(e: Event) {
    const folder = (e.target as HTMLSelectElement).value
    if (folder) {
      window.location.href = `${branchBasePath}${folder}/`
    }
  }
</script>

<div class="sb-vf">
  <header class="sb-vf-header">
    <div class="sb-vf-header-top">
      <div>
        <h1 class="sb-vf-title">{title}</h1>
        {#if subtitle}
          <p class="sb-vf-subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if branches && branches.length > 0}
        <div class="sb-vf-branch">
          <svg class="sb-vf-branch-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
          </svg>
          <select
            class="sb-vf-branch-select"
            onchange={handleBranchChange}
            aria-label="Switch branch"
          >
            <option value="" disabled selected>{currentBranch}</option>
            {#each branches as b (b.folder)}
              <option value={b.folder}>{b.branch}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    <p class="sb-vf-count">
      {prototypes.length} prototype{prototypes.length !== 1 ? 's' : ''} · {totalFlows} flow{totalFlows !== 1 ? 's' : ''}
    </p>
  </header>

  {#if prototypes.length === 0 && globalFlows.length === 0}
    <p class="sb-vf-empty">No flows found. Add a <code>*.flow.json</code> file to get started.</p>
  {:else}
    <!-- Prototype groups -->
    {#each prototypes as proto (proto.dirName)}
      <section class="sb-vf-proto">
        <button
          class="sb-vf-proto-header"
          onclick={() => togglePrototype(proto.dirName)}
          aria-expanded={expanded[proto.dirName]}
        >
          <span class="sb-vf-proto-chevron" class:sb-vf-proto-chevron-open={expanded[proto.dirName]}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </span>
          <span class="sb-vf-proto-info">
            <span class="sb-vf-proto-name">
              {#if proto.icon}<span class="sb-vf-proto-icon">{proto.icon}</span>{/if}
              {proto.name}
            </span>
            {#if proto.description}
              <span class="sb-vf-proto-desc">{proto.description}</span>
            {/if}
          </span>
          <span class="sb-vf-proto-meta">
            {#if proto.author}
              {@const authors = Array.isArray(proto.author) ? proto.author : [proto.author]}
              <span class="sb-vf-avatars">
                {#each authors as a (a)}
                  <img
                    src="https://github.com/{a}.png?size=32"
                    alt={a}
                    class="sb-vf-avatar"
                  />
                {/each}
              </span>
            {/if}
            {#if proto.tags}
              <span class="sb-vf-tags">
                {#each proto.tags as tag (tag)}
                  <span class="sb-vf-tag">{tag}</span>
                {/each}
              </span>
            {/if}
            <span class="sb-vf-flow-count">
              {proto.flows.length} flow{proto.flows.length !== 1 ? 's' : ''}
            </span>
          </span>
        </button>

        {#if expanded[proto.dirName]}
          <div class="sb-vf-flow-list">
            {#each proto.flows as flow (flow.key)}
              <a href={flow.route} class="sb-vf-flow-item">
                {#if showThumbnails}
                  <div class="sb-vf-thumb">
                    {@html placeholderSvg(flow.key)}
                  </div>
                {/if}
                <div class="sb-vf-flow-body">
                  <span class="sb-vf-flow-name">{flow.meta?.title || formatName(flow.name)}</span>
                  {#if flow.meta?.author}
                    {@const authors = Array.isArray(flow.meta.author) ? flow.meta.author : [flow.meta.author]}
                    <span class="sb-vf-flow-authors">
                      {#each authors as a (a)}
                        <img src="https://github.com/{a}.png?size=32" alt={a} class="sb-vf-avatar sb-vf-avatar-sm" />
                      {/each}
                      <span class="sb-vf-author-name">{authors.join(', ')}</span>
                    </span>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </section>
    {/each}

    <!-- Global flows -->
    {#if globalFlows.length > 0}
      <section class="sb-vf-proto sb-vf-global">
        <div class="sb-vf-section-label">Global Flows</div>
        <div class="sb-vf-flow-list">
          {#each globalFlows as flow (flow.key)}
            <a href={flow.route} class="sb-vf-flow-item">
              {#if showThumbnails}
                <div class="sb-vf-thumb">
                  {@html placeholderSvg(flow.key)}
                </div>
              {/if}
              <div class="sb-vf-flow-body">
                <span class="sb-vf-flow-name">{flow.meta?.title || formatName(flow.name)}</span>
                {#if flow.meta?.author}
                  {@const authors = Array.isArray(flow.meta.author) ? flow.meta.author : [flow.meta.author]}
                  <span class="sb-vf-flow-authors">
                    {#each authors as a (a)}
                      <img src="https://github.com/{a}.png?size=32" alt={a} class="sb-vf-avatar sb-vf-avatar-sm" />
                    {/each}
                    <span class="sb-vf-author-name">{authors.join(', ')}</span>
                  </span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  /* ── Layout ─────────────────────────────────────────── */
  .sb-vf {
    min-height: 100vh;
    background-color: var(--bgColor-default, #0d1117);
    color: var(--fgColor-default, #e6edf3);
    padding: 80px 32px 48px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }

  /* ── Header ─────────────────────────────────────────── */
  .sb-vf-header {
    max-width: 720px;
    margin: 0 auto 64px;
  }
  .sb-vf-header-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }
  .sb-vf-title {
    font-size: 72px;
    font-weight: 400;
    margin: 0 0 12px;
    color: var(--fgColor-default, #e6edf3);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .sb-vf-subtitle {
    font-size: 15px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }
  .sb-vf-count {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 16px 0 0;
    letter-spacing: 0.01em;
  }

  /* ── Branch switcher ────────────────────────────────── */
  .sb-vf-branch {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    position: relative;
  }
  .sb-vf-branch-icon {
    position: absolute;
    left: 10px;
    color: var(--fgColor-muted, #848d97);
    pointer-events: none;
    z-index: 1;
  }
  .sb-vf-branch-select {
    appearance: none;
    background-color: transparent;
    color: var(--fgColor-default, #e6edf3);
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 20px;
    padding: 6px 32px 6px 32px;
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23848d97'%3E%3Cpath d='M6 8.5L1.5 4h9L6 8.5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    min-width: 140px;
    max-width: 220px;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: border-color 0.15s ease;
  }
  .sb-vf-branch-select:hover {
    border-color: var(--fgColor-muted, #848d97);
  }
  .sb-vf-branch-select:focus-visible {
    outline: 2px solid var(--borderColor-accent-emphasis, #1f6feb);
    outline-offset: -1px;
  }

  /* ── Prototype group ────────────────────────────────── */
  .sb-vf-proto {
    max-width: 720px;
    margin: 0 auto 8px;
  }
  .sb-vf-proto-header {
    appearance: none;
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 12px;
    background: var(--bgColor-muted, #161b22);
    color: inherit;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .sb-vf-proto-header:hover {
    border-color: var(--borderColor-accent-emphasis, #1f6feb);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.04));
  }
  .sb-vf-proto-chevron {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--fgColor-muted, #848d97);
    transition: transform 0.15s ease;
    transform: rotate(0deg);
  }
  .sb-vf-proto-chevron-open {
    transform: rotate(90deg);
  }
  .sb-vf-proto-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sb-vf-proto-name {
    font-size: 20px;
    font-weight: 500;
    color: var(--fgColor-default, #e6edf3);
    letter-spacing: -0.01em;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sb-vf-proto-icon {
    font-size: 18px;
  }
  .sb-vf-proto-desc {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    line-height: 1.4;
  }
  .sb-vf-proto-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .sb-vf-flow-count {
    font-size: 12px;
    color: var(--fgColor-muted, #848d97);
    white-space: nowrap;
  }

  /* ── Avatars ────────────────────────────────────────── */
  .sb-vf-avatars {
    display: flex;
    flex-direction: row;
  }
  .sb-vf-avatars:hover .sb-vf-avatar {
    margin-left: 2px;
  }
  .sb-vf-avatars:hover .sb-vf-avatar:first-child {
    margin-left: 0;
  }
  .sb-vf-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    margin-left: -6px;
    transition: margin-left 0.15s ease;
    outline: 2px solid var(--bgColor-muted, #161b22);
    position: relative;
  }
  .sb-vf-avatar:first-child {
    margin-left: 0;
  }
  .sb-vf-avatar-sm {
    width: 18px;
    height: 18px;
    outline-color: var(--bgColor-default, #0d1117);
  }

  /* ── Tags ───────────────────────────────────────────── */
  .sb-vf-tags {
    display: flex;
    gap: 4px;
  }
  .sb-vf-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bgColor-accent-muted, rgba(56, 139, 253, 0.1));
    color: var(--fgColor-accent, #58a6ff);
    white-space: nowrap;
  }

  /* ── Flow list (inside prototype) ───────────────────── */
  .sb-vf-flow-list {
    padding: 4px 0 0 28px;
    display: flex;
    flex-direction: column;
  }
  .sb-vf-flow-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    transition: background 0.12s ease;
  }
  .sb-vf-flow-item:hover {
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.06));
    text-decoration: none !important;
  }
  .sb-vf-flow-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .sb-vf-flow-name {
    font-size: 16px;
    font-weight: 400;
    color: var(--fgColor-default, #e6edf3);
    letter-spacing: -0.01em;
  }
  .sb-vf-flow-authors {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sb-vf-author-name {
    font-size: 12px;
    color: var(--fgColor-muted, #848d97);
  }

  /* ── Thumbnail ──────────────────────────────────────── */
  .sb-vf-thumb {
    width: 100px;
    aspect-ratio: 16 / 10;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bgColor-inset, #010409);
    --vf-bg-inset: var(--bgColor-inset, #010409);
    --vf-grid: var(--borderColor-default, #30363d);
    --vf-accent: var(--fgColor-accent, #58a6ff);
    --vf-fg: var(--fgColor-default, #c9d1d9);
    --vf-muted: var(--fgColor-muted, #484f58);
  }
  .sb-vf-thumb :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* ── Global section ─────────────────────────────────── */
  .sb-vf-global {
    margin-top: 32px;
  }
  .sb-vf-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--fgColor-muted, #848d97);
    padding: 0 0 12px;
  }

  /* ── Empty state ────────────────────────────────────── */
  .sb-vf-empty {
    text-align: center;
    padding: 80px 24px;
    color: var(--fgColor-muted, #848d97);
    font-size: 15px;
    max-width: 720px;
    margin: 0 auto;
  }
</style>
