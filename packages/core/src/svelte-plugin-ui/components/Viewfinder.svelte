<!--
  Viewfinder — prototype index and flow dashboard.

  Full-page component that lists prototypes as expandable groups,
  each showing its flows. Global flows (not belonging to any prototype)
  appear as an "Other flows" group.

  Mounted via mountViewfinder() from the viewfinder plugin entry point.
-->

<script lang="ts">
  import { buildPrototypeIndex } from '../../viewfinder.js'
  import { getLocal, setLocal } from '../../localStorage.js'
  import Icon from './Icon.svelte'

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

  const prototypeIndex = $derived(buildPrototypeIndex(knownRoutes))

  const globalFlows = $derived(
    hideDefaultFlow
      ? prototypeIndex.globalFlows.filter((f: any) => f.key !== 'default')
      : prototypeIndex.globalFlows
  )

  // Build a flat display list: folders (with nested prototypes), ungrouped prototypes, global flows
  const ungroupedProtos = $derived(prototypeIndex.prototypes)

  const folders = $derived(prototypeIndex.folders || [])

  const otherFlows = $derived.by(() => {
    if (globalFlows.length === 0) return null
    return {
      name: 'Other flows',
      dirName: '__global__',
      description: null,
      author: null,
      gitAuthor: null,
      lastModified: null,
      icon: null,
      team: null,
      tags: null,
      flows: globalFlows,
    }
  })

  const totalProtos = $derived(
    ungroupedProtos.length + folders.reduce((sum: number, f: any) => sum + f.prototypes.length, 0)
  )

  const totalFlows = $derived(
    ungroupedProtos.reduce((sum: number, p: any) => sum + p.flows.length, 0) +
    globalFlows.length +
    folders.reduce((sum: number, f: any) =>
      sum + f.prototypes.reduce((s: number, p: any) => s + p.flows.length, 0), 0)
  )

  // Sorting — use pre-sorted arrays from buildPrototypeIndex
  type SortMode = 'updated' | 'title'
  let sortBy: SortMode = $state('updated')

  const sortedProtos = $derived(prototypeIndex.sorted?.[sortBy]?.prototypes ?? ungroupedProtos)
  const sortedFolders = $derived(prototypeIndex.sorted?.[sortBy]?.folders ?? folders)

  // Canvases
  const ungroupedCanvases = $derived(prototypeIndex.canvases || [])
  const sortedCanvases = $derived(prototypeIndex.sorted?.[sortBy]?.canvases ?? ungroupedCanvases)

  // View mode — top-level toggle between Prototypes and Canvases
  type ViewMode = 'prototypes' | 'canvases'
  const VIEW_MODE_KEY = 'viewfinder.viewMode'
  let viewMode: ViewMode = $state(getLocal(VIEW_MODE_KEY) === 'canvases' ? 'canvases' : 'prototypes')

  $effect(() => {
    setLocal(VIEW_MODE_KEY, viewMode)
  })

  // Canvas folder data: extract folders that contain canvases for canvas view
  const canvasFolders = $derived.by(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? folders
    return src
      .filter((f: any) => f.canvases && f.canvases.length > 0)
      .map((f: any) => ({ ...f, prototypes: [], canvases: f.canvases }))
  })

  const totalCanvases = $derived(
    ungroupedCanvases.length + folders.reduce((sum: number, f: any) => sum + (f.canvases?.length || 0), 0)
  )

  // For prototype view: filter canvases out of folder contents
  const protoOnlyFolders = $derived.by(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? folders
    return src
      .filter((f: any) => f.prototypes.length > 0)
      .map((f: any) => ({ ...f, canvases: [] }))
  })

  // Expanded state — persisted in localStorage
  const EXPANDED_KEY = 'viewfinder.expanded'

  function loadExpanded(): Record<string, boolean> {
    const raw = getLocal(EXPANDED_KEY)
    if (!raw) return {}
    try { return JSON.parse(raw) } catch { return {} }
  }

  let expanded: Record<string, boolean> = $state(loadExpanded())

  function isExpanded(dirName: string): boolean {
    return expanded[dirName] ?? false
  }

  function toggle(dirName: string) {
    expanded[dirName] = !isExpanded(dirName)
    setLocal(EXPANDED_KEY, JSON.stringify(expanded))
  }

  function withBase(route: string): string {
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`
    const normalizedBase = (basePath || '/').replace(/\/+$/, '')
    if (!normalizedBase || normalizedBase === '/') return normalizedRoute
    return `${normalizedBase}${normalizedRoute}`.replace(/\/+/g, '/')
  }

  function protoRoute(dirName: string): string {
    return withBase(`/${dirName}`)
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
      const fill = i % 3 === 0 ? 'var(--sb--placeholder-accent)' : i % 3 === 1 ? 'var(--sb--placeholder-fg)' : 'var(--sb--placeholder-muted)'
      rects += `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="2" fill="${fill}" opacity="${opacity}" />`
    }

    let lines = ''
    for (let i = 0; i < 6; i++) {
      const s = h * (i + 5)
      const y = 10 + (s % 180)
      lines += `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="var(--sb--placeholder-grid)" stroke-width="0.5" opacity="0.4" />`
    }
    for (let i = 0; i < 8; i++) {
      const s = h * (i + 9)
      const x = 10 + (s % 300)
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="var(--sb--placeholder-grid)" stroke-width="0.5" opacity="0.3" />`
    }

    return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="200" fill="var(--sb--placeholder-bg)" />${lines}${rects}</svg>`
  }

  // Branch switching — populated by Vite server plugin when available
  interface Branch { branch: string; folder: string }

  let branches: Branch[] | null = $state(
    (typeof window !== 'undefined' && Array.isArray((window as any).__SB_BRANCHES__))
      ? (window as any).__SB_BRANCHES__
      : null
  )

  const branchBasePath = $derived(
    (basePath || '/storyboard-source/').replace(/\/branch--[^/]*\/$/, '/')
  )

  const currentBranch = $derived(
    (() => {
      const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
      return m ? m[1] : 'main'
    })()
  )

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
    </div>
    <div class="controlsRow">
      <!-- View mode toggle (Prototypes / Canvases) -->
      <div class="sortToggle">
        <button
          class="sortButton"
          class:sortButtonActive={viewMode === 'prototypes'}
          onclick={() => viewMode = 'prototypes'}
        >
          Prototypes
        </button>
        <button
          class="sortButton"
          class:sortButtonActive={viewMode === 'canvases'}
          onclick={() => viewMode = 'canvases'}
        >
          Canvas
        </button>
      </div>
      <!-- <span class="sceneCount">
        {(folders.length > 0 ? `${folders.length} folder${folders.length !== 1 ? 's' : ''} · ` : '') + `${totalProtos} prototype${totalProtos !== 1 ? 's' : ''} · ${totalFlows} flow${totalFlows !== 1 ? 's' : ''}`}
      </span> -->
      <!-- Sort toggle — hidden for now -->
      <div class="sortToggle" style="display: none;">
        <button
          class="sortButton"
          class:sortButtonActive={sortBy === 'updated'}
          onclick={() => sortBy = 'updated'}
        >
          <Icon name="primer/clock" size={14} color="var(--fgColor-muted)" />
          Last updated
        </button>
        <button
          class="sortButton"
          class:sortButtonActive={sortBy === 'title'}
          onclick={() => sortBy = 'title'}
        >
          <Icon name="primer/sort-asc" size={14} color="var(--fgColor-muted)" />
          Title A–Z
        </button>
      </div>
      {#if branches && branches.length > 0}
        <div class="branchDropdown">
          <span class="branchIcon"><Icon size={16} color="var(--fgColor-muted)" offsetY={-1} offsetX={2} name="primer/git-branch" /></span>
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
  </header>

  {#if viewMode === 'prototypes' && totalProtos === 0 && folders.length === 0}
    <p class="empty">No flows found. Add a <code>*.flow.json</code> file to get started.</p>
  {:else if viewMode === 'canvases' && totalCanvases === 0}
    <p class="empty">No canvases found. Add a <code>*.canvas.jsonl</code> file to get started.</p>
  {:else}
    <div class="list">
      {#snippet protoEntry(proto)}
        <section class="protoGroup">
          {#if proto.isExternal}
            <!-- External prototype — opens in new tab -->
            <a class="listItem" href={proto.externalUrl} target="_blank" rel="noopener noreferrer">
              <div class="cardBody">
                <p class="protoName">
                  {#if proto.icon}<span class="protoIcon">{proto.icon}</span>{/if}
                  {proto.name}
                  <span class="externalBadge">
                    <Icon size={12} color="var(--fgColor-muted)" name="primer/link-external" offsetY={-2} />
                    external
                  </span>
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
          {:else if proto.hideFlows && proto.flows.length === 1}
            <!-- Single flow, hidden — navigates directly to the flow -->
            <a class="listItem" href={withBase(proto.flows[0].route)}>
              <div class="cardBody">
                <p class="protoName" class:otherflows={proto.dirName === '__global__'}>
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
          {:else if proto.flows.length > 0}
            <!-- Expandable prototype with flows -->
            <button
              class="listItem protoHeader"
              onclick={() => toggle(proto.dirName)}
              aria-expanded={isExpanded(proto.dirName)}
            >
              <div class="cardBody">
                <p class="protoName" class:otherflows={proto.dirName === '__global__'}>
                  {#if proto.icon}<span class="protoIcon">{proto.icon}</span>{/if}
                  {proto.name}
                  <span class="protoChevron">
                    {#if isExpanded(proto.dirName)}
                      <Icon size={12} color="var(--fgColor-disabled)" name="primer/chevron-down" offsetY={-3} offsetX={2} />
                    {:else}
                      <Icon size={12} color="var(--fgColor-disabled)" name="primer/chevron-right" offsetY={-3} offsetX={2} />
                    {/if}
                  </span>
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
                <p class="protoName" class:otherflows={proto.dirName === '__global__'}>
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

          {#if !(proto.hideFlows && proto.flows.length === 1) && isExpanded(proto.dirName) && proto.flows.length > 0}
            <div class="flowList">
              {#each proto.flows as flow (flow.key)}
                <a href={withBase(flow.route)} class="listItem flowItem">
                  {#if showThumbnails}
                    <div class="thumbnail">
                      {@html placeholderSvg(flow.key)}
                    </div>
                  {/if}
                  <div class="cardBody">
                    <p class="protoName">{flow.meta?.title || formatName(flow.name)}</p>
                    {#if flow.meta?.description}
                      <p class="flowDesc">{flow.meta.description}</p>
                    {/if}
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </section>
      {/snippet}

      {#snippet canvasEntry(canvas)}
        <section class="protoGroup">
          <a class="listItem" href={withBase(canvas.route)}>
            <div class="cardBody">
              <p class="protoName">
                <span class="protoIcon">{canvas.icon || ''}</span>
                {canvas.name}
              </p>
              {#if canvas.description}
                <p class="protoDesc">{canvas.description}</p>
              {/if}
              {#if canvas.author}
                {@const authors = Array.isArray(canvas.author) ? canvas.author : [canvas.author]}
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
              {:else if canvas.gitAuthor}
                <p class="authorPlain">{canvas.gitAuthor}</p>
              {/if}
            </div>
          </a>
        </section>
      {/snippet}

      {#if viewMode === 'prototypes'}
        {#each protoOnlyFolders as folder (folder.dirName)}
          <section class="folderGroup" class:folderGroupOpen={isExpanded(`folder:${folder.dirName}`)}>
            <button
              class="folderHeader"
              onclick={() => toggle(`folder:${folder.dirName}`)}
              aria-expanded={isExpanded(`folder:${folder.dirName}`)}
            >
              <p class="folderName">
                <span>
                  {#if isExpanded(`folder:${folder.dirName}`)}
                    <Icon size={20} offsetY={-1.5} name="folder-open" color="#54aeff" />
                  {:else}
                    <Icon size={20} offsetY={-1.5} name="folder" color="#54aeff" />
                  {/if}
                </span>
                {folder.name}
              </p>
              {#if folder.description}
                <p class="folderDesc">{folder.description}</p>
              {/if}
            </button>
            {#if isExpanded(`folder:${folder.dirName}`) && folder.prototypes.length > 0}
              <div class="folderContent">
                {#each folder.prototypes as proto (proto.dirName)}
                  {@render protoEntry(proto)}
                {/each}
              </div>
            {/if}
          </section>
        {/each}

        <!-- Ungrouped prototypes (not in any folder) -->
        {#each sortedProtos as proto (proto.dirName)}
          {@render protoEntry(proto)}
        {/each}

        <!-- Other flows (always at the bottom) -->
        {#if otherFlows}
          {@render protoEntry(otherFlows)}
        {/if}
      {:else}
        <!-- Canvas view -->
        <div class="canvasWarning">
          <Icon size={14} name="primer/alert" color="#9a6700" offsetY={-1} />
          <span>Canvas is an experimental feature. Use with caution.</span>
        </div>
        {#each canvasFolders as folder (folder.dirName)}
          <section class="folderGroup" class:folderGroupOpen={isExpanded(`folder:${folder.dirName}`)}>
            <button
              class="folderHeader"
              onclick={() => toggle(`folder:${folder.dirName}`)}
              aria-expanded={isExpanded(`folder:${folder.dirName}`)}
            >
              <p class="folderName">
                <span>
                  {#if isExpanded(`folder:${folder.dirName}`)}
                    <Icon size={20} offsetY={-1.5} name="folder-open" color="#54aeff" />
                  {:else}
                    <Icon size={20} offsetY={-1.5} name="folder" color="#54aeff" />
                  {/if}
                </span>
                {folder.name}
              </p>
              {#if folder.description}
                <p class="folderDesc">{folder.description}</p>
              {/if}
            </button>
            {#if isExpanded(`folder:${folder.dirName}`) && folder.canvases?.length > 0}
              <div class="folderContent">
                {#each folder.canvases as canvas (canvas.dirName)}
                  {@render canvasEntry(canvas)}
                {/each}
              </div>
            {/if}
          </section>
        {/each}

        <!-- Ungrouped canvases -->
        {#each sortedCanvases as canvas (canvas.dirName)}
          {@render canvasEntry(canvas)}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .container {
    min-height: 100vh;
    background-color: var(--bgColor-default, #0d1117);
    color: var(--fgColor-default, #e6edf3);
    padding: 80px 32px 48px;
    max-width: 960px;
    margin: 0 auto;
  }

  .header {
    max-width: 720px;
    margin: 0 auto 40px;
  }

  .headerTop {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .title {
    font: var(--text-display-shorthand); 
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

  .controlsRow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 0;
  }

  /* .sceneCount {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    letter-spacing: 0.01em;
    white-space: nowrap;
  } */

  .sortToggle {
    display: flex;
    gap: 2px;
    background: var(--bgColor-inset);
    padding: var(--base-size-4) var(--base-size-6);
    border-radius: 9999px;
  }

  .sortButton {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-family: inherit;
    color: var(--fgColor-muted, #848d97);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;

    &:first-child {
      transform: translateX(-1px);
    }

    &:last-child {
      transform: translateX(1px);
    }
  }

  .sortButton:hover {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
  }

  .sortButtonActive {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.15));
    border: none;
  }

  .sortButton:first-child {
    transform: translateX(-1px);
  }

  .branchDropdown {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    position: relative;
    margin-left: auto;
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
    border-color: #bbbbbb;
  }

  .branchSelect:focus-visible {
    outline: 2px solid var(--borderColor-accent-emphasis, #1f6feb);
    outline-offset: -1px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--base-size-8);
    max-width: 720px;
    margin: 0 auto;
  }

  .protoGroup {
    display: flex;
    flex-direction: column;
    gap: var(--base-size-8);
  }

  .protoGroup > .listItem {
    border: 1px solid var(--borderColor-muted, #30363d);
    border-radius: var(--base-size-6);
  }

  .folderGroup {
    display: flex;
    flex-direction: column;
    gap: var(--base-size-8);
  }

  .folderHeader {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    gap: var(--base-size-8);
    appearance: none;
    border: none;
    border-radius: var(--base-size-6);
    border: 1px solid var(--borderColor-muted, #30363d);
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    color: inherit;
    padding: var(--base-size-16);

    &:hover,
    .folderGroupOpen & {
      background-color: var(--bgColor-muted, #161b22);
    }
  }


  .folderGroupOpen .folderHeader {
    background-color: var(--bgColor-muted, #161b22);
  }


  .folderName {
    display: inline-flex;
    align-items: center;
    gap: var(--base-size-8);
    font-size: var(--text-body-size-small);
    font-weight: 600;
    color: var(--fgColor-default);
    margin: 0;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.6;
  }

  .folderDesc {
    font-size: var(--text-body-size-small);
    color: var(--fgColor-muted, #848d97);
    margin: 0;
    letter-spacing: 0.01em;
    text-transform: none;
    font-weight: 400;
  }

  .folderContent {
    display: flex;
    flex-direction: column;
    gap: var(--base-size-8);
  }

  .listItem {
    display: block;
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
    border-radius: var(--base-size-6);
    width: 100%;
    text-align: left;
    cursor: pointer;
    color: inherit;
    padding: 0;
  }

  .protoHeader[aria-expanded="true"] .cardBody {
    background-color: var(--bgColor-muted);
    border-radius: var(--base-size-6);
  }

  .cardBody {
    padding: 12px 16px;
  }

  .cardBody:hover {
    background-color: var(--bgColor-muted);
    border-radius: var(--base-size-6);
  }

  .protoName {
    font-size: var(--text-title-size-medium);
    font-weight: 400;
    color: var(--fgColor-default, #e6edf3);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.6;
    transition: font-style 0.15s ease;
  }
  
  .protoName.otherflows {
    font-size: var(--text-body-size-small);
    font-weight: 600;
    text-transform: uppercase;
    direction: rtl;

    & .protoChevron {
      margin-right: var(--base-size-8);
    }

  }

  .protoDesc {
    font-size: 13px;
    color: var(--fgColor-muted, #848d97);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .externalBadge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--fgColor-muted, #848d97);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
    border-radius: 9999px;
    padding: 2px 8px;
    margin-left: 8px;
    vertical-align: middle;
    letter-spacing: 0.02em;
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

  .authorAvatars:hover .authorAvatar:not(:first-child) {
    margin-left: -2px;
  }

  .authorAvatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-left: -8px;
    transition: margin-left 50ms linear;
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
    color: var(--fgColor-muted);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .flowList {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .flowItem {
    border: 1px solid var(--borderColor-muted);
    padding: 0;
  }

  .flowItem:not(:first-child) {
    margin-top: -1px;
  }

  .flowItem:first-child {
    border-top-left-radius: var(--base-size-6);
    border-top-right-radius: var(--base-size-6);
  }

  .flowItem:last-child {
    border-bottom-left-radius: var(--base-size-6);
    border-bottom-right-radius: var(--base-size-6);
  }

  .flowItem:only-child {
    border-radius: var(--base-size-6);
  }

  .flowItem .protoName {
    font-size: var(--text-title-size-small);
    color: var(--fgColor-muted);
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

    --sb--placeholder-bg: var(--bgColor-inset, #010409);
    --sb--placeholder-grid: var(--borderColor-default, #30363d);
    --sb--placeholder-accent: var(--fgColor-accent, #58a6ff);
    --sb--placeholder-fg: var(--fgColor-default, #c9d1d9);
    --sb--placeholder-muted: var(--fgColor-muted, #484f58);
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

  .canvasWarning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    margin-bottom: 16px;
    border-radius: 8px;
    border: 1px solid var(--borderColor-default, var(--sb--color-border, #d0d7de));
    background: var(--bgColor-attention-muted, #3d2e00);
    color: var(--fgColor-attention, #9a6700);
    font-size: 13px;
    line-height: 1.4;
  }
</style>
