<!--
  CommentWindow — thread viewer popup showing a comment with replies and reactions.
  Uses shadcn-svelte Button, Textarea, Avatar, Badge, Separator.
-->

<script lang="ts">
  import { replyToComment, addReaction, removeReaction, resolveComment, unresolveComment, editComment, editReply, deleteComment } from '../api.js'
  import { saveDraft, getDraft, clearDraft, replyDraftKey } from '../commentDrafts.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { cn } from '$lib/utils/index.js'

  const REACTION_EMOJI: Record<string, string> = {
    THUMBS_UP: '👍', THUMBS_DOWN: '👎', LAUGH: '😄', HOORAY: '🎉',
    CONFUSED: '😕', HEART: '❤️', ROCKET: '🚀', EYES: '👀',
  }
  const emojiEntries = Object.entries(REACTION_EMOJI)

  interface Props {
    comment: any
    discussion: any
    user?: any
    onClose?: () => void
    onMove?: () => void
    winEl?: HTMLElement
  }

  let { comment, discussion, user = null, onClose, onMove, winEl }: Props = $props()

  const draftKey = replyDraftKey(comment.id)

  let resolved = $state(!!comment.meta?.resolved)
  let resolving = $state(false)
  let copied = $state(false)
  let editing = $state(false)
  let editText = $state('')
  let saving = $state(false)
  let commentText = $state(comment.text ?? '')
  let replyText = $state(getDraft(draftKey)?.text ?? '')
  let submittingReply = $state(false)
  let editingReply = $state(-1)
  let editReplyText = $state('')
  let savingReply = $state(false)
  let pickerTarget: string | null = $state(null)
  let reactions: any[] = $state([...(comment.reactionGroups ?? [])])
  let replyReactions: any[][] = $state((comment.replies ?? []).map((r: any) => [...(r.reactionGroups ?? [])]))
  let replyTexts: string[] = $state((comment.replies ?? []).map((r: any) => r.text ?? r.body ?? ''))

  const replies = comment.replies ?? []
  const canEdit = user && comment.author?.login === user.login
  const canReply = user && discussion

  function handleReplyBlur() {
    if (replyText.trim()) {
      saveDraft(draftKey, { type: 'reply', text: replyText })
    } else {
      clearDraft(draftKey)
    }
  }

  function timeAgo(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function emojiFor(content: string) { return REACTION_EMOJI[content] ?? content }
  function isReacted(content: string) { return reactions.some((r: any) => r.content === content && r.viewerHasReacted) }
  function isReplyReacted(ri: number, content: string) { return (replyReactions[ri] ?? []).some((r: any) => r.content === content && r.viewerHasReacted) }

  function pillClass(active: boolean) {
    return cn(
      'inline-flex items-center text-xs px-2 py-0.5 rounded-full border cursor-pointer transition-colors',
      active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-muted-foreground'
    )
  }

  function emojiPickerBtnClass(active: boolean) {
    return cn(
      'flex items-center justify-center w-7 h-7 rounded border-none text-base cursor-pointer transition-colors',
      active ? 'bg-primary/10' : 'bg-transparent hover:bg-muted'
    )
  }

  async function toggleResolve() {
    resolving = true
    try {
      if (resolved) {
        await unresolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
        comment.meta = { ...comment.meta }; delete comment.meta.resolved
        resolved = false; resolving = false; onMove?.()
      } else {
        await resolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
        comment.meta = { ...comment.meta, resolved: true }; onMove?.(); onClose?.()
      }
    } catch (err) { console.error('[storyboard] Failed to toggle resolve:', err); resolving = false }
  }

  function copyLink() {
    const url = new URL(window.location.href); url.searchParams.set('comment', comment.id)
    navigator.clipboard.writeText(url.toString()).then(() => { copied = true; setTimeout(() => { copied = false }, 2000) }).catch(() => {})
  }

  async function saveEdit() {
    const t = editText.trim(); if (!t) return; saving = true
    try { await editComment(comment.id, comment._rawBody ?? comment.body ?? '', t); comment.text = t; comment._rawBody = null; commentText = t; editing = false } catch (err) { console.error('[storyboard] Failed to edit:', err) } finally { saving = false }
  }

  async function toggleReaction(content: string, gi?: number) {
    const group = gi !== undefined ? reactions[gi] : reactions.find((r: any) => r.content === content)
    const was = group?.viewerHasReacted ?? false
    if (was && group) {
      group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }; group.viewerHasReacted = false
      reactions = group.users.totalCount === 0 ? reactions.filter((r: any) => r.content !== content) : [...reactions]
    } else if (group) {
      group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }; group.viewerHasReacted = true; reactions = [...reactions]
    } else {
      reactions = [...reactions, { content, users: { totalCount: 1 }, viewerHasReacted: true }]
    }
    comment.reactionGroups = reactions
    try { if (was) await removeReaction(comment.id, content); else await addReaction(comment.id, content) } catch {}
  }

  async function toggleReplyReaction(ri: number, content: string, rgi?: number) {
    const reply = replies[ri]; if (!reply) return
    const groups = replyReactions[ri] ?? []
    const group = rgi !== undefined ? groups[rgi] : groups.find((r: any) => r.content === content)
    const was = group?.viewerHasReacted ?? false
    if (was && group) {
      group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }; group.viewerHasReacted = false
      if (group.users.totalCount === 0) replyReactions[ri] = groups.filter((r: any) => r.content !== content)
    } else if (group) {
      group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }; group.viewerHasReacted = true
    } else {
      groups.push({ content, users: { totalCount: 1 }, viewerHasReacted: true }); replyReactions[ri] = groups
    }
    replyReactions = [...replyReactions]; reply.reactionGroups = replyReactions[ri]
    try { if (was) await removeReaction(reply.id, content); else await addReaction(reply.id, content) } catch {}
  }

  async function submitReply() {
    const t = replyText.trim(); if (!t) return; submittingReply = true
    try {
      await replyToComment(discussion.id, comment.id, t)
      replyText = ''
      clearDraft(draftKey)
      onMove?.()
    } catch (err) { console.error('[storyboard] Reply failed:', err) } finally { submittingReply = false }
  }

  async function saveReply(ri: number) {
    const t = editReplyText.trim(); if (!t) return
    const reply = replies[ri]; if (!reply) return; savingReply = true
    try { await editReply(reply.id, t); reply.text = t; reply.body = t; replyTexts[ri] = t; replyTexts = [...replyTexts]; editingReply = -1 } catch (err) { console.error('[storyboard] Edit reply failed:', err) } finally { savingReply = false }
  }

  async function deleteReplyAt(ri: number) {
    const reply = replies[ri]; if (!reply || !confirm('Delete this reply?')) return
    try { await deleteComment(reply.id); onMove?.() } catch (err) { console.error('[storyboard] Delete failed:', err) }
  }

  function startDrag(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]') || !winEl) return
    const startX = e.clientX, startY = e.clientY, rect = winEl.getBoundingClientRect()
    const sx = rect.left, sy = rect.top; target.style.cursor = 'grabbing'
    const mv = (ev: MouseEvent) => { winEl!.style.position = 'fixed'; winEl!.style.left = `${sx + ev.clientX - startX}px`; winEl!.style.top = `${sy + ev.clientY - startY}px`; winEl!.style.transform = 'none' }
    const up = () => { target.style.cursor = 'grab'; document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); e.preventDefault()
  }

  function handleReplyKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitReply() }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="font-sans" onclick={(e) => e.stopPropagation()}>
  <!-- Header -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex items-center justify-between px-3 py-3 border-b border-border cursor-grab select-none" onmousedown={startDrag}>
    <div class="flex items-center gap-2">
      {#if comment.author?.avatarUrl}
        <Avatar.Root class="h-6 w-6">
          <Avatar.Image src={comment.author.avatarUrl} alt={comment.author?.login} />
          <Avatar.Fallback class="text-[10px]">{(comment.author?.login ?? '?')[0]?.toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
      {/if}
      <div class="flex flex-col">
        <span class="text-xs font-semibold">{comment.author?.login ?? 'unknown'}</span>
        {#if comment.createdAt}
          <span class="text-[11px] text-muted-foreground leading-tight">{timeAgo(comment.createdAt)}</span>
        {/if}
      </div>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="flex items-center shrink-0 gap-1.5" data-no-drag onmousedown={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="sm" class={cn('h-6 px-2 text-[11px]', resolved ? 'text-success' : 'text-muted-foreground')} disabled={resolving} onclick={toggleResolve}>
        {resolving ? (resolved ? 'Unresolving…' : 'Resolving…') : (resolved ? 'Resolved ✓' : 'Resolve')}
      </Button>
      <Button variant="ghost" size="sm" class={cn('h-6 px-2 text-[11px]', copied ? 'text-success' : 'text-muted-foreground')} onclick={copyLink}>
        {copied ? 'Copied!' : 'Copy link'}
      </Button>
      <Button variant="ghost" size="icon" class="h-6 w-6 text-muted-foreground" aria-label="Close" onclick={onClose}>×</Button>
    </div>
  </div>

  <!-- Body -->
  <div class="flex-auto overflow-y-auto px-3 pt-3 no-scrollbar">
    {#if !editing}
      <p class="text-sm leading-relaxed m-0 mb-2 break-words">{commentText}</p>
    {:else}
      <div class="mb-2">
        <Textarea class="min-h-[40px] max-h-[100px] text-xs mb-2" bind:value={editText} />
        <div class="flex justify-end gap-1">
          <Button variant="outline" size="sm" class="h-6 text-xs border border-input text-foreground" onclick={() => editing = false}>Cancel</Button>
          <Button size="sm" class="h-6 text-xs" disabled={saving} onclick={saveEdit}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    {/if}

    <!-- Reactions -->
    <div class="flex items-center flex-wrap gap-1 mb-2">
      {#each reactions as group, gi (group.content)}
        {#if (group.users?.totalCount ?? 0) > 0}
          <button class={pillClass(group.viewerHasReacted)}
                  onclick={(e) => { e.stopPropagation(); toggleReaction(group.content, gi) }}>
            <span class="mr-1">{emojiFor(group.content)}</span><span>{group.users?.totalCount ?? 0}</span>
          </button>
        {/if}
      {/each}
      <div class="relative">
        <button class="inline-flex items-center text-xs px-2 py-0.5 rounded-full border border-border bg-transparent text-muted-foreground cursor-pointer hover:border-primary"
                onclick={(e) => { e.stopPropagation(); pickerTarget = pickerTarget === 'comment' ? null : 'comment' }}>😀 +</button>
        {#if pickerTarget === 'comment'}
          <div class="absolute bottom-full left-0 mb-1 flex gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg z-10">
            {#each emojiEntries as [key, emoji] (key)}
              <button class={emojiPickerBtnClass(isReacted(key))}
                      onclick={(e) => { e.stopPropagation(); toggleReaction(key); pickerTarget = null }}>{emoji}</button>
            {/each}
          </div>
        {/if}
      </div>
      {#if !editing && canEdit}
        <button class="ml-auto text-xs text-muted-foreground bg-transparent border-none cursor-pointer hover:underline" onclick={() => { editing = true; editText = commentText }}>Edit</button>
      {/if}
    </div>

    <!-- Replies -->
    {#if replies.length > 0}
      <Separator class="my-2" />
      <div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</div>
      {#each replies as reply, ri (reply.id ?? ri)}
        <div class="flex mb-2 gap-2">
          {#if reply.author?.avatarUrl}
            <Avatar.Root class="h-5 w-5 shrink-0">
              <Avatar.Image src={reply.author.avatarUrl} alt={reply.author?.login} />
              <Avatar.Fallback class="text-[10px]">{(reply.author?.login ?? '?')[0]?.toUpperCase()}</Avatar.Fallback>
            </Avatar.Root>
          {/if}
          <div class="flex-auto min-w-0">
            <div class="flex items-start justify-between mb-0.5">
              <div class="flex flex-col">
                <span class="text-xs font-semibold">{reply.author?.login ?? 'unknown'}</span>
                {#if reply.createdAt}<span class="text-[11px] text-muted-foreground leading-tight">{timeAgo(reply.createdAt)}</span>{/if}
              </div>
              {#if user && reply.author?.login === user.login}
                <div class="flex gap-2 ml-auto shrink-0">
                  {#if editingReply !== ri}
                    <button class="text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer hover:underline" onclick={() => { editingReply = ri; editReplyText = replyTexts[ri] }}>Edit</button>
                    <button class="text-[11px] text-destructive bg-transparent border-none cursor-pointer hover:underline" onclick={() => deleteReplyAt(ri)}>Delete</button>
                  {/if}
                </div>
              {/if}
            </div>
            {#if editingReply !== ri}
              <p class="text-sm leading-relaxed m-0 break-words">{replyTexts[ri] ?? reply.text ?? reply.body}</p>
            {:else}
              <div>
                <Textarea class="min-h-[40px] max-h-[100px] text-xs mb-1" bind:value={editReplyText} />
                <div class="flex justify-end gap-1">
                  <Button variant="outline" size="sm" class="h-6 text-xs border border-input text-foreground" onclick={() => editingReply = -1}>Cancel</Button>
                  <Button size="sm" class="h-6 text-xs" disabled={savingReply} onclick={() => saveReply(ri)}>{savingReply ? 'Saving…' : 'Save'}</Button>
                </div>
              </div>
            {/if}
            <!-- Reply reactions -->
            <div class="flex items-center flex-wrap gap-1 mt-1">
              {#each (replyReactions[ri] ?? []) as rg, rgi (rg.content)}
                {#if (rg.users?.totalCount ?? 0) > 0}
                  <button class={pillClass(rg.viewerHasReacted)}
                          onclick={(e) => { e.stopPropagation(); toggleReplyReaction(ri, rg.content, rgi) }}>
                    <span class="mr-1">{emojiFor(rg.content)}</span><span>{rg.users?.totalCount ?? 0}</span>
                  </button>
                {/if}
              {/each}
              <div class="relative">
                <button class="inline-flex items-center text-xs px-2 py-0.5 rounded-full border border-border bg-transparent text-muted-foreground cursor-pointer"
                        onclick={(e) => { e.stopPropagation(); pickerTarget = pickerTarget === `reply-${ri}` ? null : `reply-${ri}` }}>😀 +</button>
                {#if pickerTarget === `reply-${ri}`}
                  <div class="absolute bottom-full left-0 mb-1 flex gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg z-10">
                    {#each emojiEntries as [key, emoji] (key)}
                      <button class={emojiPickerBtnClass(isReplyReacted(ri, key))}
                              onclick={(e) => { e.stopPropagation(); toggleReplyReaction(ri, key); pickerTarget = null }}>{emoji}</button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Reply form -->
  {#if canReply}
    <div class="border-t border-border px-3 py-3 flex flex-col">
      <Textarea class="min-h-[40px] max-h-[100px] text-xs mb-1" placeholder="Reply…" bind:value={replyText} onkeydown={handleReplyKeydown} onblur={handleReplyBlur} />
      <div class="flex justify-end mt-1">
        <Button size="sm" class="text-xs" disabled={!replyText.trim() || submittingReply} onclick={submitReply}>
          {submittingReply ? 'Posting…' : 'Reply'}
        </Button>
      </div>
    </div>
  {/if}
</div>
