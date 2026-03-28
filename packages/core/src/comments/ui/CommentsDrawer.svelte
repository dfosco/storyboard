<!--
  CommentsDrawer — right-side panel listing all comments across all routes.

  Fetches all discussions, groups comments by route. Click navigates to
  the comment's route and opens it.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { listDiscussions, fetchRouteDiscussion } from '../api.js'
  import { getCommentsConfig } from '../config.js'

  interface Props {
    onClose?: () => void
    onNavigate?: (route: string, commentId: string) => void
  }

  let { onClose, onNavigate }: Props = $props()

  interface CommentGroup {
    route: string
    comments: any[]
  }

  let loading = $state(true)
  let error: string | null = $state(null)
  let groups: CommentGroup[] = $state([])

  function timeAgo(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  onMount(async () => {
    try {
      const discussions = await listDiscussions()
      if (!discussions || discussions.length === 0) {
        loading = false
        return
      }

      const basePath = getCommentsConfig()?.basePath ?? '/'
      const result: CommentGroup[] = []

      for (const disc of discussions) {
        const routeMatch = disc.title?.match(/^Comments:\s*(.+)$/)
        if (!routeMatch) continue
        const route = routeMatch[1]
        if (!route.startsWith(basePath)) continue

        let discussion: any
        try { discussion = await fetchRouteDiscussion(route) } catch { continue }
        if (!discussion?.comments?.length) continue

        result.push({ route, comments: discussion.comments })
      }

      groups = result
    } catch (err: any) {
      error = err.message
    } finally {
      loading = false
    }
  })

  function navigateTo(route: string, commentId: string) {
    onNavigate?.(route, commentId)
  }
</script>

<!-- Header -->
<div class="flex items-center justify-between ph4 pv3 bb sb-b-muted flex-shrink-0">
  <h2 class="f5 fw6 sb-fg ma0">All Comments</h2>
  <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer sb-close-btn"
          aria-label="Close"
          onclick={onClose}>×</button>
</div>

<!-- Body -->
<div class="flex-auto overflow-y-auto pa0">
  {#if loading}
    <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">Loading comments…</div>
  {:else if error}
    <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">Failed to load comments: {error}</div>
  {:else if groups.length === 0}
    <div class="pv4 ph4 tc sb-fg-muted sb-f-sm">No comments yet</div>
  {:else}
    {#each groups as group (group.route)}
      <div class="bb sb-b-muted">
        <div class="flex items-center ph4 pv2 sb-bg-inset f7 fw6 sb-fg-muted">
          <span class="code sb-fg-accent">{group.route}</span>
          <span class="ml-auto fw4 flex flex-nowrap sb-f-xs sb-min-w-max">
            {group.comments.length} {group.comments.length !== 1 ? 'comments' : 'comment'}
          </span>
        </div>
        {#each group.comments as comment (comment.id)}
          <button class="flex ph4 pv2 pointer bn bg-transparent w-100 tl sans-serif sb-drawer-btn"
                  class:sb-drawer-btn-resolved={comment.meta?.resolved}
                  onclick={() => navigateTo(group.route, comment.id)}>
            {#if comment.author?.avatarUrl}
              <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar"
                   src={comment.author.avatarUrl}
                   alt={comment.author?.login ?? ''} />
            {/if}
            <div class="flex flex-column flex-auto sb-min-w-0 gap-2">
              <div class="flex items-center">
                <span class="f7 fw6 mr1"
                      class:sb-fg={!comment.meta?.resolved}
                      class:sb-fg-muted={comment.meta?.resolved}>
                  {comment.author?.login ?? 'unknown'}
                </span>
                {#if comment.createdAt}
                  <span class="sb-fg-muted mr1 sb-f-xs">{timeAgo(comment.createdAt)}</span>
                {/if}
                {#if comment.meta?.resolved}
                  <span class="sb-fg-success br-pill ph1 sb-badge-resolved">Resolved</span>
                {/if}
              </div>
              <p class="ma0 overflow-hidden nowrap truncate lh-copy sb-f-sm"
                 class:sb-fg={!comment.meta?.resolved}
                 class:sb-fg-muted={comment.meta?.resolved}>
                {(comment.text ?? '').slice(0, 100)}
              </p>
              {#if (comment.replies?.length ?? 0) > 0}
                <div class="sb-fg-muted mt1 sb-f-xs">
                  💬 {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </div>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>
