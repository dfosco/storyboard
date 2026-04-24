<!--
  InspectorPanel — Inspector tab for the side panel.
  Select DOM elements and view their React component information.
  Uses mouseMode for element selection and fiberWalker for component introspection.
-->

<script>
  import { onMount, onDestroy } from 'svelte'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { inspectElement, inspectElementChain } from './inspector/fiberWalker.js'
  import { createMouseMode } from './inspector/mouseMode.js'
  import { getColors, createInspectorHighlighter } from './inspector/highlighter.js'

  /** @type {{ name: string, props: object, source: { fileName: string, lineNumber: number, columnNumber?: number } | null, owner: string | null } | null} */
  let componentInfo = $state(null)

  /** @type {Array<{ name: string, source: { fileName: string, lineNumber: number, columnNumber?: number } | null }>} */
  let componentChain = $state([])

  let inspecting = $state(false)
  let sourceCode = $state('')
  let sourceLoading = $state(false)
  let sourcePath = $state('')
  let matchedLine = $state(-1)

  /** @type {HTMLElement | null} */
  let sourceContainer = $state(null)

  /** @type {Element | null} — the currently selected DOM element */
  let selectedElement = $state(null)

  // ── URL state helpers ─────────────────────────────────────────────

  /**
   * Build a CSS selector that can re-find `el` later.
   * Prefers id, then data-testid, then an nth-child path from <body>.
   */
  function generateSelector(el) {
    if (!(el instanceof Element)) return null
    if (el.id) return `#${CSS.escape(el.id)}`

    const testId = el.getAttribute('data-testid')
    if (testId) return `[data-testid="${CSS.escape(testId)}"]`

    const parts = []
    let cur = el
    while (cur && cur !== document.body && cur !== document.documentElement) {
      let seg = cur.tagName.toLowerCase()
      if (cur.id) {
        parts.unshift(`#${CSS.escape(cur.id)}`)
        break
      }
      const parent = cur.parentElement
      if (parent) {
        const siblings = Array.from(parent.children)
        const idx = siblings.indexOf(cur) + 1
        seg += `:nth-child(${idx})`
      }
      parts.unshift(seg)
      cur = parent
    }
    return parts.length ? parts.join(' > ') : null
  }

  /** Read the `inspect` search param from the current URL. */
  function getInspectParam() {
    try {
      return new URL(window.location.href).searchParams.get('inspect')
    } catch { return null }
  }

  /** Set or clear the `inspect` search param without triggering navigation. */
  function setInspectParam(selector) {
    try {
      const url = new URL(window.location.href)
      if (selector) {
        url.searchParams.set('inspect', selector)
      } else {
        url.searchParams.delete('inspect')
      }
      history.replaceState(history.state, '', url.toString())
    } catch {}
  }

  /** @type {string[]} */
  let knownFiles = []

  /** @type {{ owner: string, name: string } | null} */
  let repoInfo = $state(null)

  /** @type {{ files: string[], sources: Record<string, string>, repo: { owner: string, name: string } | null } | null} */
  let staticInspectorData = null

  /**
   * Load the build-time static inspector JSON (production only).
   * Cached after the first successful fetch.
   */
  async function loadStaticData() {
    if (staticInspectorData) return staticInspectorData
    try {
      // Use window.location to derive base path at runtime, since
      // import.meta.env.BASE_URL is baked at compile time in the UI bundle
      const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
      const res = await fetch(`${basePath}_storyboard/inspector.json`)
      if (res.ok) {
        staticInspectorData = await res.json()
        return staticInspectorData
      }
    } catch {}
    return null
  }

  const _isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true && !new URLSearchParams(window.location.search).has('prodMode')
  const _basePath = (typeof window !== 'undefined' && window.__STORYBOARD_BASE_PATH__) || '/'

  /**
   * Fetch source file content — uses dev middleware in dev, static JSON in prod.
   */
  async function fetchSourceContent(filePath) {
    // In local dev, use the live middleware (reads from disk)
    if (_isLocalDev) {
      try {
        const res = await fetch(`${_basePath.replace(/\/$/, '')}/_storyboard/docs/source?path=${encodeURIComponent(filePath)}`)
        if (res.ok) {
          const json = await res.json()
          return json?.content || ''
        }
      } catch {}
    }
    // In production (or if dev middleware failed), use static build-time JSON
    const data = await loadStaticData()
    return data?.sources?.[filePath] || ''
  }

  let mouseMode = null

  const hasSelection = $derived(componentInfo !== null)

  /**
   * Derive the git branch from the URL base path.
   * Branch deploys use /branch--{name}/ in the path.
   * Falls back to 'main'.
   */
  const gitBranch = $derived.by(() => {
    const m = window.location.pathname.match(/\/branch--([^/]+)/)
    if (m) return m[1].replace(/-/g, '/')
    return 'main'
  })

  const githubUrl = $derived.by(() => {
    if (!repoInfo || !sourcePath) return null
    const base = `https://github.com/${repoInfo.owner}/${repoInfo.name}/blob/${gitBranch}/${sourcePath}`
    const line = matchedLine > 0 ? matchedLine : componentInfo?.source?.lineNumber
    return line ? `${base}#L${line}` : base
  })

  const sourceLink = $derived.by(() => {
    if (!sourcePath) return null
    return {
      label: sourcePath.split('/').pop(),
      href: null,
    }
  })

  /**
   * Find the source file for a component by matching against known files.
   * Strategy:
   *  1. If _debugSource is available (React <19), use that directly
   * Resolve the source file for the current page from the URL.
   * Maps the route path to a file in src/prototypes/ by stripping the
   * base path and matching against known files (which have .folder/
   * segments stripped during route generation).
   *
   * Also tries matching a specific component name as a fallback.
   */
  function resolveSourceFile(info) {
    // Strategy 1: _debugSource (React <19)
    if (info?.source?.fileName) {
      // Strip Vite query params (e.g. ?v=12345)
      const cleanName = info.source.fileName.split('?')[0]
      const srcIndex = cleanName.indexOf('/src/')
      if (srcIndex !== -1) return cleanName.slice(srcIndex + 1)
      if (cleanName.startsWith('src/')) return cleanName
    }

    // Strategy 2: match current URL route to a page file
    const pageFile = resolvePageFile()
    if (pageFile) return pageFile

    // Strategy 3: match component name to a file basename
    const name = info?.name
    if (name && name !== 'Anonymous' && name !== 'Unknown') {
      const match = knownFiles.find(f => {
        const base = f.split('/').pop()?.replace(/\.(jsx|tsx|js|ts)$/, '')
        return base === name
      })
      if (match) return match
    }

    return null
  }

  /**
   * Derive the current page's source file from window.location.pathname.
   * Strips the Vite base path, then searches known files for a match.
   */
  function resolvePageFile() {
    if (knownFiles.length === 0) return null

    let pathname = window.location.pathname

    // Strip any base path prefix by progressively removing leading segments
    // until we find a match. This handles /storyboard-source/Example → Example
    // without needing to know the exact base path.
    if (pathname.startsWith('/')) pathname = pathname.slice(1)
    pathname = pathname.replace(/\/$/, '')

    // Normalize file paths once: strip src/prototypes/, .folder/ segments, extensions
    const normalizedFiles = knownFiles.map(f => ({
      original: f,
      normalized: f
        .replace(/^src\/prototypes\//, '')
        .replace(/[^/]*\.folder\//g, '')
        .replace(/\.(jsx|tsx|js|ts)$/, ''),
    }))

    // Try matching with progressively fewer leading segments
    const segments = pathname.split('/').filter(Boolean)
    for (let start = 0; start < segments.length; start++) {
      const routeEnd = segments.slice(start).join('/')
      if (!routeEnd) continue

      for (const { original, normalized } of normalizedFiles) {
        // Match: "Example" → "Example/index" or "Example"
        const withoutIndex = normalized.replace(/\/index$/, '')
        if (withoutIndex === routeEnd || normalized === routeEnd) return original
      }
    }

    // Root path fallback
    if (!pathname || segments.length === 0) {
      const idx = knownFiles.find(f => /^src\/prototypes\/index\.(jsx|tsx|js|ts)$/.test(f))
      if (idx) return idx
    }

    return null
  }

  let highlightedHtml = $state('')

  // Code theme colors — refreshed on theme change events
  let codeTheme = $state(getColors())

  /** @type {any} */
  let highlighter = null

  async function getHighlighter() {
    if (highlighter) return highlighter
    highlighter = await createInspectorHighlighter()
    return highlighter
  }

  /** Re-highlight source code with current theme (called on theme change). */
  async function rehighlight() {
    codeTheme = getColors()
    if (!sourceCode || !sourcePath) return
    try {
      const hl = await getHighlighter()
      highlightedHtml = hl.codeToHtml(sourceCode, {
        lang: getLang(sourcePath),
        theme: 'github-dark',
        lineNumbers: false,
        decorations: matchedLine > 0
          ? [{ start: { line: matchedLine - 1, character: 0 }, end: { line: matchedLine - 1, character: Infinity }, properties: { class: 'highlighted-line' } }]
          : [],
      })
    } catch { /* ignore */ }
  }

  /**
   * Find the line number of a JSX component in source code by matching
   * the component name and its props against the source lines.
   *
   * Searches for `<ComponentName` followed by prop values from the
   * component's props. Scores each `<ComponentName` occurrence by how
   * many prop values appear nearby, picks the best match.
   */
  function findComponentLine(code, info) {
    if (!code || !info?.name) return -1

    const lines = code.split('\n')
    const name = info.name
    const props = info.props || {}

    // Collect string representations of prop values for matching
    const propSignatures = []
    for (const [key, val] of Object.entries(props)) {
      if (key === 'children') continue
      if (typeof val === 'string') {
        propSignatures.push(`"${val}"`, `'${val}'`, `\`${val}\``, `="${val}"`, `='${val}'`)
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        propSignatures.push(`{${val}}`, `=${val}`)
      }
    }

    // Find all lines with `<ComponentName` (opening JSX tag)
    const tagPattern = new RegExp(`<${name}[\\s/>]`)
    const candidates = []
    for (let i = 0; i < lines.length; i++) {
      if (tagPattern.test(lines[i])) {
        candidates.push(i)
      }
    }

    if (candidates.length === 0) return -1
    if (candidates.length === 1) return candidates[0] + 1

    // Score each candidate by how many prop values appear in nearby lines
    let bestLine = candidates[0]
    let bestScore = -1

    for (const lineIdx of candidates) {
      // Look at this line + the next 5 lines for prop values (JSX props are close)
      const window = lines.slice(lineIdx, lineIdx + 6).join(' ')
      let score = 0
      for (const sig of propSignatures) {
        if (window.includes(sig)) score++
      }
      if (score > bestScore) {
        bestScore = score
        bestLine = lineIdx
      }
    }

    return bestLine + 1 // 1-indexed
  }

  function getLang(filePath) {
    if (filePath.endsWith('.tsx')) return 'tsx'
    if (filePath.endsWith('.jsx')) return 'jsx'
    if (filePath.endsWith('.ts')) return 'typescript'
    return 'javascript'
  }

  $effect(() => {
    const path = resolveSourceFile(componentInfo)
    if (path) {
      sourceLoading = true
      sourcePath = path
      highlightedHtml = ''
      fetchSourceContent(path)
        .then(async (content) => {
          sourceCode = content
          // Try the selected component first, then walk up the chain
          matchedLine = findComponentLine(sourceCode, componentInfo)
          if (matchedLine < 0 && componentChain.length > 0) {
            for (const ancestor of componentChain) {
              matchedLine = findComponentLine(sourceCode, { name: ancestor.name, props: {} })
              if (matchedLine > 0) break
            }
          }
          if (sourceCode) {
            try {
              const hl = await getHighlighter()
              highlightedHtml = hl.codeToHtml(sourceCode, {
                lang: getLang(path),
                theme: 'github-dark',
                lineNumbers: false,
                decorations: matchedLine > 0
                  ? [{ start: { line: matchedLine - 1, character: 0 }, end: { line: matchedLine - 1, character: Infinity }, properties: { class: 'highlighted-line' } }]
                  : [],
              })
            } catch {
              highlightedHtml = ''
            }
          }
          sourceLoading = false
        })
        .catch(() => { sourceCode = ''; highlightedHtml = ''; matchedLine = -1; sourceLoading = false })
    } else {
      sourceCode = ''
      sourcePath = ''
      highlightedHtml = ''
    }
  })

  $effect(() => {
    if (sourceContainer && highlightedHtml) {
      requestAnimationFrame(() => {
        const el = sourceContainer.querySelector('.highlighted-line')
        if (el) {
          // Align the highlighted line to the top of the code viewport.
          const targetTop = Math.max(el.offsetTop - 24, 0)
          sourceContainer.scrollTo({ top: targetTop, behavior: 'smooth' })
        } else {
          sourceContainer.scrollTop = 0
        }
      })
    }
  })

  function handleSelect(el) {
    componentInfo = inspectElement(el)
    componentChain = inspectElementChain(el)
    selectedElement = el
    inspecting = false
    // Show persistent highlight on the selected element
    mouseMode?.showHighlight(el)
    // Persist selection to URL
    setInspectParam(generateSelector(el))
  }

  function handleDeactivate() {
    inspecting = false
  }

  function startInspecting() {
    // Hide any persistent highlight before entering mouse mode
    mouseMode?.hideHighlight()
    mouseMode?.activate()
    inspecting = true
    // Clear URL param while re-selecting
    setInspectParam(null)
  }

  function stopInspecting() {
    mouseMode?.deactivate()
    inspecting = false
  }

  function toggleInspecting() {
    if (inspecting) stopInspecting()
    else startInspecting()
  }

  function formatSourceLink(source) {
    if (!source) return null
    const { fileName, lineNumber, columnNumber } = source
    return {
      label: `${fileName.split('/').pop()}:${lineNumber}`,
      href: `vscode://file/${fileName}:${lineNumber}:${columnNumber || 1}`,
    }
  }

  onMount(async () => {
    mouseMode = createMouseMode({
      onSelect: handleSelect,
      onDeactivate: handleDeactivate,
    })

    // Re-highlight code when theme changes
    document.addEventListener('storyboard:theme:changed', rehighlight)

    // Pre-fetch file list and repo info
    // In local dev, try dev middleware; in production, go straight to static JSON
    let filesLoaded = false
    if (_isLocalDev) {
      try {
        const [filesRes, repoRes] = await Promise.all([
          fetch(`${_basePath.replace(/\/$/, '')}/_storyboard/docs/files`),
          fetch(`${_basePath.replace(/\/$/, '')}/_storyboard/docs/repo`),
        ])
        if (filesRes.ok) {
          const data = await filesRes.json()
          knownFiles = data.files || []
          filesLoaded = true
        }
        if (repoRes.ok) {
          repoInfo = await repoRes.json()
        }
      } catch {}
    }

    if (!filesLoaded) {
      // Use static build-time JSON
      const data = await loadStaticData()
      if (data) {
        knownFiles = data.files || []
        repoInfo = data.repo || null
      }
    }

    // Restore inspector selection from URL param (after files are loaded)
    const savedSelector = getInspectParam()
    let restored = false
    if (savedSelector) {
      // Retry with delay — the React page may still be rendering
      for (let attempt = 0; attempt < 5 && !restored; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 300))
        try {
          const el = document.querySelector(savedSelector)
          if (el) {
            handleSelect(el)
            restored = true
          }
        } catch {
          break // invalid selector, don't retry
        }
      }
      if (!restored) setInspectParam(null)
    }

    if (!restored) {
      startInspecting()
    }
  })

  onDestroy(() => {
    mouseMode?.deactivate()
    mouseMode?.hideHighlight()
    setInspectParam(null)
    document.removeEventListener('storyboard:theme:changed', rehighlight)
  })
</script>

<div class="flex flex-col h-full" data-inspector-panel>
  <!-- Content -->
  <div class="flex-1 overflow-y-auto min-h-0 flex flex-col">
    <!-- Empty state -->
    {#if !hasSelection && !inspecting}
      <div class="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
        <span style:color="var(--fgColor-muted)" class="opacity-40">
          <Icon name="iconoir/square-dashed" size={48} strokeWeight={2} scale={1.05} />
        </span>
        <p class="text-sm font-medium m-0" style:color="var(--fgColor-default)">
          Select an element to start
        </p>
        <p class="text-xs m-0" style:color="var(--fgColor-muted)">
          Click the inspect button to enter selection mode
        </p>
        <button
          class="mt-2 px-4 py-1.5 text-xs font-medium rounded-md border-none cursor-pointer transition-colors"
          style:background="var(--sb--color-purple, #7655a4)"
          style:color="#fff"
          onclick={startInspecting}
        >
          Start inspecting
        </button>
      </div>

    <!-- Inspecting state -->
    {:else if inspecting}
      <div class="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
        <div class="flex items-center gap-2">
          <span class="inspector-pulse-dot"></span>
          <p class="text-sm m-0" style:color="var(--fgColor-default)">
            Click any element on the page to inspect it
          </p>
        </div>
        <button
          class="mt-2 px-4 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors"
          style:background="transparent"
          style:color="var(--fgColor-muted)"
          style:border-color="var(--borderColor-default, var(--sb--color-border, #d1d9e0))"
          onclick={stopInspecting}
        >
          Cancel
        </button>
      </div>

    <!-- Selected state -->
    {:else}
      <div class="flex flex-col flex-1 min-h-0 p-3 pt-0 gap-3">
        <!-- Component name -->
        <div>
          <h3 class="text-base font-bold m-0 inspector-mono" style:color="var(--sb--color-purple, #7655a4)">
            {componentInfo.name}
          </h3>
        </div>

        <!-- Source code -->
        {#if sourcePath}
          <div class="border rounded-md overflow-hidden flex-1 min-h-0 flex flex-col" style:background={codeTheme.bg} style:border-color={codeTheme.border}>
            <div
              class="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold shrink-0"
              style:background={codeTheme.headerBg}
              style:color={codeTheme.headerFg}
              style:border-bottom="1px solid {codeTheme.border}"
            >
              <span class="flex items-center gap-1.5 min-w-0">
                <Icon name="primer/file-code" size={12} />
                <span class="truncate">{sourcePath}</span>
              </span>
              {#if githubUrl}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 shrink-0 text-xs no-underline hover:underline inspector-mono inspector-code-link"
                  style:color={codeTheme.headerFg}
                >
                  <Icon name="primer/mark-github" size={14} />
                  <span>GitHub</span>
                </a>
              {/if}
            </div>

            <div class="border-t flex-1 min-h-0 flex flex-col" style:border-color={codeTheme.border}>
                {#if sourceLoading}
                  <div class="px-3 py-4 text-xs text-center" style:color={codeTheme.headerFg}>
                    Loading source…
                  </div>
                {:else if sourceCode}
                  <div class="flex-1 min-h-0 overflow-y-auto source-scroll-container" bind:this={sourceContainer} style:--inspector-line-num-color={codeTheme.comment} style:--inspector-line-hover={codeTheme.lineHighlight}>
                    {#if highlightedHtml}
                      <div class="code-wrapper line-numbers">{@html highlightedHtml}</div>
                    {:else}
                      <pre class="m-0 text-xs leading-relaxed inspector-mono source-pre line-numbers" style:background={codeTheme.bg} style:color={codeTheme.fg}><code>{#each sourceCode.split('\n') as line, i}<span class="line{matchedLine > 0 && i + 1 === matchedLine ? ' highlighted-line' : ''}">{line}</span>{#if i < sourceCode.split('\n').length - 1}{'\n'}{/if}{/each}</code></pre>
                    {/if}
                  </div>
                {:else}
                  <div class="px-3 py-4 text-xs text-center" style:color={codeTheme.headerFg}>
                    Unable to load source
                  </div>
                {/if}
              </div>
          </div>
        {/if}

        <!-- Re-select button -->
        <button
          class="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium rounded-md border-none cursor-pointer transition-colors shrink-0"
          style:background="var(--sb--color-purple, #7655a4)"
          style:color="#fff"
          onclick={startInspecting}
        >
          <Icon name="primer/search" size={12} />
          Re-select
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .inspector-mono {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  }

  .inspector-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sb--color-purple, #7655a4);
    animation: inspector-pulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes inspector-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  pre {
    background: transparent;
  }

  .source-pre {
    background: transparent;
    tab-size: 2;
    padding: 12px 0;
    color: #c9d1d9;
    overflow-x: auto;
  }

  .source-pre code {
    font-family: inherit;
    display: block;
  }

  .source-pre .line {
    padding: 0 12px 0 0;
    display: inline-block;
    width: 100%;
    min-height: 1.5em;
  }

  .source-pre .line:hover {
    background: var(--inspector-line-hover, rgba(255, 255, 255, 0.04));
  }

  .source-pre :global(.highlighted-line) {
    background: color-mix(in srgb, var(--sb--color-purple, #7655a4) 20%, transparent);
    border-left: 2px solid var(--sb--color-purple, #7655a4);
    padding-left: 10px;
  }

  /* Line numbers via CSS counters — works for both highlight.js and plain-text */
  .line-numbers :global(code) {
    counter-reset: line;
  }

  .line-numbers :global(.line) {
    padding-left: 0 !important;
  }

  .line-numbers :global(.line::before) {
    counter-increment: line;
    content: counter(line);
    display: inline-block;
    width: 3.5ch;
    margin-right: 1.5ch;
    text-align: right;
    color: var(--inspector-line-num-color, #484f58);
    user-select: none;
  }

  .code-wrapper :global(pre) {
    margin: 0;
    padding: 12px 0;
    font-size: 12px;
    line-height: 1.6;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    tab-size: 2;
    background: transparent !important;
    overflow-x: auto;
  }

  .code-wrapper :global(code) {
    font-family: inherit;
    display: block;
  }

  .code-wrapper :global(.line) {
    padding: 0 12px 0 0;
    display: inline-block;
    width: 100%;
    min-height: 1.5em;
  }

  .code-wrapper :global(.line:hover) {
    background: var(--inspector-line-hover, rgba(255, 255, 255, 0.04));
  }

  .code-wrapper :global(.highlighted-line) {
    background: color-mix(in srgb, var(--sb--color-purple, #7655a4) 20%, transparent);
    border-left: 2px solid var(--sb--color-purple, #7655a4);
    padding-left: 10px;
  }

  /* Force dark chrome on the code block — independent of page theme */
  .inspector-code-link:hover {
    text-decoration: underline;
  }
</style>
