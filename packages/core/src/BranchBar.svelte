<!--
  BranchBar — thin dark bar at the top of the page showing current branch.
  
  Shows when the app is loaded on a non-main branch (basePath contains branch--).
  Hidden on embeds (_sb_embed) and when CoreUI chrome is hidden (cmd+.).
  
  Switches branches via POST /_storyboard/switch-branch → server starts Vite,
  registers Caddy route, responds with redirect URL.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    basePath?: string
  }

  let { basePath = '/' }: Props = $props()

  let open = $state(false)
  let switching = $state<string | null>(null)
  let error = $state<string | null>(null)
  let chromeHidden = $state(false)
  let barEl: HTMLElement | undefined = $state()
  let branches: Array<{ branch: string; folder: string }> = $state([])

  const currentBranch = $derived(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?/)
    return m ? m[1] : null
  })

  const branchBasePath = $derived(
    (basePath || '/').replace(/\/branch--[^/]*\/?/, '/')
  )

  const isOnBranch = $derived(!!currentBranch())

  const sortedBranches = $derived(
    [...branches]
      .filter(b => b.branch !== currentBranch())
      .sort((a, b) => {
        if (a.branch === 'main') return -1
        if (b.branch === 'main') return 1
        return a.branch.localeCompare(b.branch)
      })
  )

  onMount(() => {
    const apiBase = (basePath || '/').replace(/\/$/, '')
    fetch(`${apiBase}/_storyboard/worktrees`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) branches = data })
      .catch(() => {})

    const observer = new MutationObserver(() => {
      chromeHidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    function handleClick(e: MouseEvent) {
      if (open && barEl && !barEl.contains(e.target as Node)) open = false
    }
    document.addEventListener('click', handleClick)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleClick)
    }
  })

  async function switchBranch(branch: string) {
    switching = branch
    error = null
    open = false

    const apiBase = (basePath || '/').replace(/\/$/, '')

    try {
      const res = await fetch(`${apiBase}/_storyboard/switch-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      })
      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        error = data.error || 'Failed to switch branch'
        switching = null
      }
    } catch (e: any) {
      error = e.message || 'Server not reachable'
      switching = null
    }
  }

  function goToMain() {
    switchBranch('main')
  }

  function hideChrome() {
    document.documentElement.classList.add('storyboard-chrome-hidden')
  }
</script>

{#if isOnBranch && !chromeHidden}
  <div class="branch-bar" bind:this={barEl}>
    <div class="branch-bar-inner">
      {#if switching}
        <span class="branch-bar-switching">
          Switching to {switching}…
        </span>
      {:else}
        <button class="branch-bar-trigger" onclick={() => { open = !open }}>
          <Icon name="feather/git-branch" size={12} />
          <span class="branch-bar-name">{currentBranch()}</span>
          <Icon name="feather/chevron-down" size={10} />
        </button>
      {/if}

      <div class="branch-bar-actions">
        <button class="branch-bar-action" onclick={hideChrome}>Hide</button>
        <button class="branch-bar-action" onclick={goToMain}>Close</button>
      </div>
    </div>

    {#if error}
      <div class="branch-bar-error">{error}</div>
    {/if}

    {#if open}
      <div class="branch-bar-dropdown">
        {#each sortedBranches as b (b.branch)}
          <button class="branch-bar-option" onclick={() => switchBranch(b.branch)}>
            <Icon name="feather/git-branch" size={12} />
            {b.branch}
          </button>
        {/each}
        {#if sortedBranches.length === 0}
          <div class="branch-bar-empty">No other branches available</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .branch-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
  }

  .branch-bar-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 32px;
    background: #1a1a1a;
    color: #ccc;
    padding: 4px 12px;
    position: relative;
  }

  .branch-bar-trigger {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #ddd;
    font-size: 11px;
    font-weight: 400;
    font-family: inherit;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    transition: background 0.1s;
  }

  .branch-bar-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .branch-bar-name {
    font-weight: 500;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .branch-bar-switching {
    font-size: 11px;
    color: #999;
    font-style: italic;
  }

  .branch-bar-actions {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .branch-bar-action {
    background: none;
    border: none;
    color: #777;
    font-size: 11px;
    font-weight: 400;
    font-family: inherit;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 3px;
    transition: all 0.1s;
  }

  .branch-bar-action:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .branch-bar-error {
    background: #7f1d1d;
    color: #fca5a5;
    font-size: 11px;
    text-align: center;
    padding: 4px 12px;
  }

  .branch-bar-dropdown {
    position: absolute;
    top: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    border: 1px solid #333;
    border-top: none;
    border-radius: 0 0 8px 8px;
    min-width: 220px;
    max-width: 360px;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .branch-bar-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 14px;
    background: none;
    border: none;
    color: #ccc;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .branch-bar-option:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .branch-bar-empty {
    padding: 8px 14px;
    color: #666;
    font-size: 11px;
    font-style: italic;
  }

  :global(html:has(.branch-bar)) {
    --sb-branch-bar-height: 32px;
  }

  :global(html:has(.branch-bar) body) {
    padding-top: 32px;
  }

  :global(html.storyboard-chrome-hidden .branch-bar) {
    display: none;
  }
</style>
