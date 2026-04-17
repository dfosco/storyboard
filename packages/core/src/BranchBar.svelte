<!--
  BranchBar — thin dark bar at the top of the page showing current branch.
  
  Shows when the app is loaded on a non-main branch (basePath contains branch--).
  Hidden on embeds (_sb_embed) and when CoreUI chrome is hidden (cmd+.).
  
  Features:
  - Branch name display
  - Dropdown to switch to other branches
  - × button to switch to main
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    basePath?: string
    branches?: Array<{ branch: string; folder: string }>
  }

  let { basePath = '/', branches = [] }: Props = $props()

  let open = $state(false)
  let chromeHidden = $state(false)
  let barEl: HTMLElement | undefined = $state()

  // Parse current branch from basePath
  const currentBranch = $derived(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?/)
    return m ? m[1] : null
  })

  // Base path without branch prefix (for switching)
  const branchBasePath = $derived(
    (basePath || '/').replace(/\/branch--[^/]*\/?/, '/')
  )

  // Don't render if we're on main (no branch-- in path)
  const isOnBranch = $derived(!!currentBranch())

  // Fetch branches from server if not provided
  let fetchedBranches: Array<{ branch: string; folder: string }> = $state([])
  
  onMount(() => {
    if (branches.length === 0) {
      const apiBase = (basePath || '/').replace(/\/$/, '')
      fetch(`${apiBase}/_storyboard/worktrees`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) fetchedBranches = data })
        .catch(() => {})
    }

    // Listen for chrome hidden toggle
    const observer = new MutationObserver(() => {
      chromeHidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Close dropdown on outside click
    function handleClick(e: MouseEvent) {
      if (open && barEl && !barEl.contains(e.target as Node)) {
        open = false
      }
    }
    document.addEventListener('click', handleClick)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleClick)
    }
  })

  const allBranches = $derived(
    branches.length > 0 ? branches : fetchedBranches
  )

  // Sort: main first, then A-Z
  const sortedBranches = $derived(
    [...allBranches]
      .filter(b => b.branch !== currentBranch())
      .sort((a, b) => {
        if (a.branch === 'main') return -1
        if (b.branch === 'main') return 1
        return a.branch.localeCompare(b.branch)
      })
  )

  function navigate(folder: string) {
    window.location.href = `${branchBasePath}${folder}`
  }

  function goToMain() {
    const main = allBranches.find(b => b.branch === 'main')
    window.location.href = branchBasePath + (main?.folder || '')
  }

  function hideChrome() {
    document.documentElement.classList.add('storyboard-chrome-hidden')
  }
</script>

{#if isOnBranch && !chromeHidden}
  <div class="branch-bar" bind:this={barEl}>
    <div class="branch-bar-inner">
      <button class="branch-bar-trigger" onclick={() => { open = !open }}>
        <Icon name="feather/git-branch" size={12} />
        <span class="branch-bar-name">{currentBranch()}</span>
        <Icon name="feather/chevron-down" size={10} />
      </button>

      <div class="branch-bar-actions">
        <button class="branch-bar-action" onclick={hideChrome} aria-label="Hide UI">
          Hide
        </button>
        <button class="branch-bar-action" onclick={goToMain} aria-label="Switch to main">
          Close
        </button>
      </div>
    </div>

    {#if open}
      <div class="branch-bar-dropdown">
        {#each sortedBranches as b (b.branch)}
          <button class="branch-bar-option" onclick={() => navigate(b.folder)}>
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

  /* Push page content down when branch bar is visible */
  :global(html:has(.branch-bar)) {
    --sb-branch-bar-height: 32px;
  }

  :global(html:has(.branch-bar) body) {
    padding-top: 32px;
  }

  /* Hide when chrome is hidden (cmd+.) */
  :global(html.storyboard-chrome-hidden .branch-bar) {
    display: none;
  }
</style>
