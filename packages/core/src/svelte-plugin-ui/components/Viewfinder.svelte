<!--
  Viewfinder — prototype index and flow dashboard.

  Full-page component that lists prototypes as expandable groups,
  each showing its flows. Global flows (not belonging to any prototype)
  appear as an "Other flows" group.

  Mounted via mountViewfinder() from the viewfinder plugin entry point.
-->

<script lang="ts">
  import { buildPrototypeIndex } from '../../viewfinder.js'

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

  // Merge global flows into the prototype list as "Other flows"
  const allGroups = $derived(
    globalFlows.length > 0
      ? [
          ...prototypes,
          {
            name: 'Other flows',
            dirName: '__global__',
            description: null,
            author: null,
            gitAuthor: null,
            icon: null,
            team: null,
            tags: null,
            flows: globalFlows,
          },
        ]
      : prototypes
  )

  const totalFlows = $derived(
    allGroups.reduce((sum: number, p: any) => sum + p.flows.length, 0)
  )

  // Expanded state — all prototypes start expanded
  let expanded: Record<string, boolean> = $state(
    Object.fromEntries(allGroups.map((p: any) => [p.dirName, true]))
  )

  function togglePrototype(dirName: string) {
    expanded[dirName] = !expanded[dirName]
  }

  function protoRoute(dirName: string): string {
    return `/${dirName}`
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
      const fill = i % 3 === 0 ? 'var(--placeholder-accent)' : i % 3 === 1 ? 'var(--placeholder-fg)' : 'var(--placeholder-muted)'
      rects += `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="2" fill="${fill}" opacity="${opacity}" />`
    }

    let lines = ''
    for (let i = 0; i < 6; i++) {
      const s = h * (i + 5)
      const y = 10 + (s % 180)
      lines += `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="var(--placeholder-grid)" stroke-width="0.5" opacity="0.4" />`
    }
    for (let i = 0; i < 8; i++) {
      const s = h * (i + 9)
      const x = 10 + (s % 300)
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="var(--placeholder-grid)" stroke-width="0.5" opacity="0.3" />`
    }

    return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="200" fill="var(--placeholder-bg)" />${lines}${rects}</svg>`
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

<div class="container">
  <header class="header">
    <div class="headerTop">
      <div>
        <h1 class="title">{title}</h1>
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if branches && branches.length > 0}
        <div class="branchDropdown">
          <svg class="branchIcon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
          </svg>
          <select
            class="branchSelect"
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
    <p class="sceneCount">
      {allGroups.length} prototype{allGroups.length !== 1 ? 's' : ''} · {totalFlows} flow{totalFlows !== 1 ? 's' : ''}
    </p>
  </header>

  {#if allGroups.length === 0}
    <p class="empty">No flows found. Add a <code>*.flow.json</code> file to get started.</p>
  {:else}
    <div class="list">
      {#each allGroups as proto (proto.dirName)}
        <section class="protoGroup">
          {#if proto.flows.length > 0}
            <!-- Expandable prototype with flows -->
            <button
              class="listItem protoHeader"
              onclick={() => togglePrototype(proto.dirName)}
              aria-expanded={expanded[proto.dirName]}
            >
              <div class="cardBody">
                <p class="sceneName">
                  <span class="protoChevron" class:protoChevronOpen={expanded[proto.dirName]}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </span>
                  {#if proto.icon}<span class="protoIcon">{proto.icon}</span>{/if}
                  {proto.name}
                </p>
                {#if proto.description}
                  <p class="protoDesc">{proto.description}</p>
                {/if}
                {#if proto.author}
                  {@const authors = Array.isArray(proto.author) ? proto.author : [proto.author]}
                  <div class="author">
                    <span class="authorAvatars">
                      {#each authors as a (a)}
                        <img
                          src="https://github.com/{a}.png?size=48"
                          alt={a}
                          class="authorAvatar"
                        />
                      {/each}
                    </span>
                    <span class="authorName">{authors.join(', ')}</span>
                  </div>
                {:else if proto.gitAuthor}
                  <p class="authorPlain">{proto.gitAuthor}</p>
                {/if}
              </div>
            </button>
          {:else}
            <!-- Prototype with no flows — navigates directly -->
            <a class="listItem" href={protoRoute(proto.dirName)}>
              <div class="cardBody">
                <p class="sceneName">
                  {#if proto.icon}<span class="protoIcon">{proto.icon}</span>{/if}
                  {proto.name}
                </p>
                {#if proto.description}
                  <p class="protoDesc">{proto.description}</p>
                {/if}
                {#if proto.author}
                  {@const authors = Array.isArray(proto.author) ? proto.author : [proto.author]}
                  <div class="author">
                    <span class="authorAvatars">
                      {#each authors as a (a)}
                        <img
                          src="https://github.com/{a}.png?size=48"
                          alt={a}
                          class="authorAvatar"
                        />
                      {/each}
                    </span>
                    <span class="authorName">{authors.join(', ')}</span>
                  </div>
                {:else if proto.gitAuthor}
                  <p class="authorPlain">{proto.gitAuthor}</p>
                {/if}
              </div>
            </a>
          {/if}

          {#if expanded[proto.dirName] && proto.flows.length > 0}
            <div class="flowList">
              {#each proto.flows as flow (flow.key)}
                <a href={flow.route} class="listItem flowItem">
                  {#if showThumbnails}
                    <div class="thumbnail">
                      {@html placeholderSvg(flow.key)}
                    </div>
                  {/if}
                  <div class="cardBody">
                    <p class="sceneName">{flow.meta?.title || formatName(flow.name)}</p>
                    {#if flow.meta?.description}
                      <p class="flowDesc">{flow.meta.description}</p>
                    {/if}
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    min-height: 100vh;
    background-color: var(--bgColor-default, #0d1117);
    color: var(--fgColor-default, #e6edf3);
    padding: 80px 32px 48px;
  }

  .header {
    max-width: 720px;
    margin: 0 auto 64px;
  }

  .headerTop {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }

  .title {
    font-size: 72px;
    font-weight: 400;
    margin: 0 0 12px;
    color: var(--fgColor-default, #e6edf3);
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .subtitle {
    font-size: 15px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .sceneCount {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 16px 0 0;
    letter-spacing: 0.01em;
  }

  .branchDropdown {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    position: relative;
  }

  .branchIcon {
    position: absolute;
    left: 10px;
    color: var(--fgColor-muted, #848d97);
    pointer-events: none;
    z-index: 1;
  }

  .branchSelect {
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

  .branchSelect:hover {
    border-color: var(--fgColor-muted, #848d97);
  }

  .branchSelect:focus-visible {
    outline: 2px solid var(--borderColor-accent-emphasis, #1f6feb);
    outline-offset: -1px;
  }

  .list {
    display: flex;
    flex-direction: column;
    max-width: 720px;
    margin: 0 auto;
  }

  .protoGroup {
    display: flex;
    flex-direction: column;
  }

  .listItem {
    display: block;
    padding: 8px 0;
    text-decoration: none;
    color: inherit;
  }

  .listItem:hover {
    text-decoration: none !important;
  }

  .protoHeader {
    appearance: none;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    color: inherit;
    padding: 8px 0;
  }

  .cardBody {
    padding: 12px 16px;
  }

  .cardBody:hover {
    background-color: var(--bgColor-muted, #161b22);
    border-radius: 8px;
  }

  .sceneName {
    font-size: 28px;
    font-weight: 400;
    color: var(--fgColor-default, #e6edf3);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
    transition: font-style 0.15s ease;
  }

  .protoChevron {
    display: inline-flex;
    align-items: center;
    color: var(--fgColor-muted, #848d97);
    transition: transform 0.15s ease;
    transform: rotate(0deg);
    margin-right: 4px;
    vertical-align: middle;
  }

  .protoChevronOpen {
    transform: rotate(90deg);
  }

  .protoIcon {
    margin-right: 4px;
  }

  .protoDesc {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .author {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }

  .authorAvatars {
    display: flex;
    flex-direction: row;
  }

  .authorAvatars:hover .authorAvatar {
    margin-left: 2px;
  }

  .authorAvatars:hover .authorAvatar:first-child {
    margin-left: 0;
  }

  .authorAvatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-left: -8px;
    transition: margin-left 0.15s ease;
    outline: 2px solid var(--bgColor-default, #0d1117);
    position: relative;
  }

  .authorAvatar:first-child {
    margin-left: 0;
  }

  .authorName {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    letter-spacing: 0.01em;
  }

  .authorPlain {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .flowList {
    padding: 0 0 0 28px;
    display: flex;
    flex-direction: column;
  }

  .flowItem .sceneName {
    font-size: 22px;
  }

  .flowDesc {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .thumbnail {
    aspect-ratio: 16 / 10;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--bgColor-inset, #010409);

    --placeholder-bg: var(--bgColor-inset, #010409);
    --placeholder-grid: var(--borderColor-default, #30363d);
    --placeholder-accent: var(--fgColor-accent, #58a6ff);
    --placeholder-fg: var(--fgColor-default, #c9d1d9);
    --placeholder-muted: var(--fgColor-muted, #484f58);
  }

  .thumbnail :global(svg) {
    width: 100%;
    height: 100%;
  }

  .empty {
    text-align: center;
    padding: 80px 24px;
    color: var(--fgColor-muted, #848d97);
    font-size: 15px;
    max-width: 720px;
    margin: 0 auto;
  }
</style>
