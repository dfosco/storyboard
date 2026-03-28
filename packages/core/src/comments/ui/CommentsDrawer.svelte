<!--
  CommentsDrawer — right-side panel listing all comments across all routes.
  Uses shadcn Avatar, Badge, Button.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { listDiscussions, fetchRouteDiscussion } from '../api.js'
  import { getCommentsConfig } from '../config.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'

  interface Props {
    onClose?: () => void
    onNavigate?: (route: string, commentId: string) => void
  }
  let { onClose, onNavigate }: Props = $props()

  interface CommentGroup { route: string; comments: any[] }

  let loading = $state(true)
  let error: string | null = $state(null)
  let groups: CommentGroup[] = $state([])

  function timeAgo(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  onMount(async () => {
    try {
      const discussions = await listDiscussions()
      if (!discussions || discussions.length === 0) { loading = false; return }
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
    } catch (err: any) { error = err.message } finally { loading = false }
  })
</script>

<div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
  <h2 class="text-base font-semibold">All Comments</h2>
  <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground" aria-label="Close" onclick={onClose}>&#215;</Button>
</div>

<div class="flex-auto overflow-y-auto">
  {#if loading}
    <div class="py-8 px-4 text-center text-sm text-muted-foreground">Loading comments&#8230;</div>
  {:else if error}
    <div class="py-8 px-4 text-center text-sm text-muted-foreground">Failed to load comments: {error}</div>
  {:else if groups.length === 0}
    <div class="py-8 px-4 text-center text-sm text-muted-foreground">No comments yet</div>
  {:else}
    {#each groups as group (group.route)}
      <div class="border-b border-border">
        <div class="flex items-center px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
          <code class="text-primary">{group.route}</code>
          <span class="ml-auto font-normal whitespace-nowrap">{group.comments.length} {group.comments.length !== 1 ? 'comments' : 'comment'}</span>
        </div>
        {#each group.comments as comment (comment.id)}
          <button class="flex px-4 py-2 cursor-pointer border-none bg-transparent w-full text-left font-sans hover:bg-accent/50 transition-colors"
                  class:opacity-60={comment.meta?.resolved}
                  onclick={() => onNavigate?.(group.route, comment.id)}>
            {#if comment.author?.avatarUrl}
              <Avatar.Root class="h-6 w-6 shrink-0 mr-2">
                <Avatar.Image src={comment.author.avatarUrl} alt={comment.author?.login ?? ''} />
                <Avatar.Fallback class="text-[10px]">{(comment.author?.login ?? '?')[0]?.toUpperCase()}</Avatar.Fallback>
              </Avatar.Root>
            {/if}
            <div class="flex flex-col flex-auto min-w-0 gap-0.5">
              <div class="flex items-center gap-1">
                <span class="text-xs font-semibold" class:text-foreground={!comment.meta?.resolved} class:text-muted-foreground={comment.meta?.resolved}>{comment.author?.login ?? 'unknown'}</span>
                {#if comment.createdAt}<span class="text-[11px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>{/if}
                {#if comment.meta?.resolved}<Badge variant="outline" class="text-success text-[10px] px-1 py-0">Resolved</Badge>{/if}
              </div>
              <p class="text-sm leading-snug overflow-hidden whitespace-nowrap text-ellipsis m-0" class:text-foreground={!comment.meta?.resolved} class:text-muted-foreground={comment.meta?.resolved}>{(comment.text ?? '').slice(0, 100)}</p>
              {#if (comment.replies?.length ?? 0) > 0}
                <div class="text-[11px] text-muted-foreground mt-0.5">&#128172; {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</div>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>
