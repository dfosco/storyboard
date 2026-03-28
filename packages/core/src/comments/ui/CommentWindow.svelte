<!--
  CommentWindow — thread viewer popup showing a comment with replies and reactions.

  Opens when clicking a comment pin. Shows comment body, author, replies,
  reply input, reactions, and supports drag-to-move.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { replyToComment, addReaction, removeReaction, resolveComment, unresolveComment, editComment, editReply, deleteComment } from '../api.js'

  const REACTION_EMOJI: Record<string, string> = {
    THUMBS_UP: '👍',
    THUMBS_DOWN: '👎',
    LAUGH: '😄',
    HOORAY: '🎉',
    CONFUSED: '😕',
    HEART: '❤️',
    ROCKET: '🚀',
    EYES: '👀',
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

  let resolved = $state(!!comment.meta?.resolved)
  let resolving = $state(false)
  let copied = $state(false)
  let editing = $state(false)
  let editText = $state('')
  let saving = $state(false)
  let commentText = $state(comment.text ?? '')
  let replyText = $state('')
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

  function timeAgo(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function esc(str: string | null | undefined) {
    return str ?? ''
  }

  function emojiFor(content: string) {
    return REACTION_EMOJI[content] ?? content
  }

  function isReacted(content: string) {
    return reactions.some((r: any) => r.content === content && r.viewerHasReacted)
  }

  function isReplyReacted(ri: number, content: string) {
    return (replyReactions[ri] ?? []).some((r: any) => r.content === content && r.viewerHasReacted)
  }

  async function toggleResolve() {
    resolving = true
    try {
      if (resolved) {
        await unresolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
        comment.meta = { ...comment.meta }
        delete comment.meta.resolved
        resolved = false
        resolving = false
        onMove?.()
      } else {
        await resolveComment(comment.id, comment._rawBody ?? comment.body ?? '')
        comment.meta = { ...comment.meta, resolved: true }
        onMove?.()
        onClose?.()
      }
    } catch (err) {
      console.error('[storyboard] Failed to toggle resolve:', err)
      resolving = false
    }
  }

  function copyLink() {
    const linkUrl = new URL(window.location.href)
    linkUrl.searchParams.set('comment', comment.id)
    navigator.clipboard.writeText(linkUrl.toString()).then(() => {
      copied = true
      setTimeout(() => { copied = false }, 2000)
    }).catch(() => {
      const input = document.createElement('input')
      input.value = linkUrl.toString()
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    })
  }

  async function saveEdit() {
    const newText = editText.trim()
    if (!newText) return
    saving = true
    try {
      await editComment(comment.id, comment._rawBody ?? comment.body ?? '', newText)
      comment.text = newText
      comment._rawBody = null
      commentText = newText
      editing = false
      saving = false
    } catch (err) {
      console.error('[storyboard] Failed to edit comment:', err)
      saving = false
    }
  }

  async function toggleReaction(content: string, gi?: number) {
    const group = gi !== undefined ? reactions[gi] : reactions.find((r: any) => r.content === content)
    const wasReacted = group?.viewerHasReacted ?? false

    if (wasReacted && group) {
      group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }
      group.viewerHasReacted = false
      if (group.users.totalCount === 0) {
        reactions = reactions.filter((r: any) => r.content !== content)
      } else {
        reactions = [...reactions]
      }
    } else if (group) {
      group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }
      group.viewerHasReacted = true
      reactions = [...reactions]
    } else {
      reactions = [...reactions, { content, users: { totalCount: 1 }, viewerHasReacted: true }]
    }
    comment.reactionGroups = reactions

    try {
      if (wasReacted) { await removeReaction(comment.id, content) }
      else { await addReaction(comment.id, content) }
    } catch (err) { console.error('[storyboard] Reaction toggle failed:', err) }
  }

  async function toggleReplyReaction(ri: number, content: string, rgi?: number) {
    const reply = replies[ri]
    if (!reply) return
    const groups = replyReactions[ri] ?? []
    const group = rgi !== undefined ? groups[rgi] : groups.find((r: any) => r.content === content)
    const wasReacted = group?.viewerHasReacted ?? false

    if (wasReacted && group) {
      group.users = { totalCount: Math.max(0, (group.users?.totalCount ?? 1) - 1) }
      group.viewerHasReacted = false
      if (group.users.totalCount === 0) {
        replyReactions[ri] = groups.filter((r: any) => r.content !== content)
      }
    } else if (group) {
      group.users = { totalCount: (group.users?.totalCount ?? 0) + 1 }
      group.viewerHasReacted = true
    } else {
      groups.push({ content, users: { totalCount: 1 }, viewerHasReacted: true })
      replyReactions[ri] = groups
    }
    replyReactions = [...replyReactions]
    reply.reactionGroups = replyReactions[ri]

    try {
      if (wasReacted) { await removeReaction(reply.id, content) }
      else { await addReaction(reply.id, content) }
    } catch (err) { console.error('[storyboard] Reaction toggle failed:', err) }
  }

  async function submitReply() {
    const text = replyText.trim()
    if (!text) return
    submittingReply = true
    try {
      await replyToComment(discussion.id, comment.id, text)
      replyText = ''
      submittingReply = false
      onMove?.()
    } catch (err) {
      console.error('[storyboard] Failed to post reply:', err)
      submittingReply = false
    }
  }

  async function saveReply(ri: number) {
    const newText = editReplyText.trim()
    if (!newText) return
    const reply = replies[ri]
    if (!reply) return
    savingReply = true
    try {
      await editReply(reply.id, newText)
      reply.text = newText
      reply.body = newText
      replyTexts[ri] = newText
      replyTexts = [...replyTexts]
      editingReply = -1
      savingReply = false
    } catch (err) {
      console.error('[storyboard] Failed to edit reply:', err)
      savingReply = false
    }
  }

  async function deleteReplyAt(ri: number) {
    const reply = replies[ri]
    if (!reply || !confirm('Delete this reply?')) return
    try {
      await deleteComment(reply.id)
      onMove?.()
    } catch (err) {
      console.error('[storyboard] Failed to delete reply:', err)
    }
  }

  function startDrag(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('.sb-comment-window-header-actions')) return
    if (!winEl) return

    const startX = e.clientX
    const startY = e.clientY
    const rect = winEl.getBoundingClientRect()
    const startWinX = rect.left
    const startWinY = rect.top

    target.style.cursor = 'grabbing'

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      winEl!.style.position = 'fixed'
      winEl!.style.left = `${startWinX + dx}px`
      winEl!.style.top = `${startWinY + dy}px`
      winEl!.style.transform = 'none'
    }

    const onMouseUp = () => {
      target.style.cursor = 'grab'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  function handleReplyKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submitReply()
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e) => e.stopPropagation()}>
  <!-- Header (draggable) -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex items-center justify-between ph3 pv3 bb sb-b-muted sb-draggable"
       onmousedown={startDrag}>
    <div class="flex items-center">
      {#if comment.author?.avatarUrl}
        <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar" src={comment.author.avatarUrl} alt={esc(comment.author.login)} />
      {/if}
      <span class="f7 fw6 sb-fg">{esc(comment.author?.login ?? 'unknown')}</span>
      {#if comment.createdAt}
        <span class="sb-fg-muted ml1 sb-f-xs">{timeAgo(comment.createdAt)}</span>
      {/if}
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sb-comment-window-header-actions flex items-center flex-shrink-0" onmousedown={(e) => e.stopPropagation()}>
      <button class="flex items-center justify-center bg-transparent bn br2 pointer fw5 sans-serif flex-shrink-0 nowrap sb-action-btn"
              class:sb-fg-success={resolved}
              class:sb-fg-muted={!resolved}
              title={resolved ? 'Unresolve' : 'Resolve'}
              disabled={resolving}
              onclick={toggleResolve}>
        {resolving ? (resolved ? 'Unresolving…' : 'Resolving…') : (resolved ? 'Resolved ✓' : 'Resolve')}
      </button>
      <button class="flex items-center justify-center bg-transparent bn br2 pointer fw5 sans-serif flex-shrink-0 nowrap sb-action-btn"
              class:sb-fg-success={copied}
              class:sb-fg-muted={!copied}
              title="Copy link"
              onclick={copyLink}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer flex-shrink-0 sb-close-btn-sm"
              aria-label="Close"
              onclick={onClose}>×</button>
    </div>
  </div>

  <!-- Body -->
  <div class="flex-auto overflow-y-auto ph3 pt3">
    <!-- Comment text / edit -->
    {#if !editing}
      <p class="lh-copy sb-fg ma0 mb2 word-wrap sb-f-sm">{commentText}</p>
    {:else}
      <div>
        <textarea class="sb-input sb-textarea w-100 ph2 pv1 br2 f7 sans-serif lh-copy db mb2"
                  bind:value={editText}></textarea>
        <div class="flex justify-end mb2">
          <button class="sb-btn-cancel ph2 pv1 br2 f7 fw5 sans-serif pointer mr1" onclick={() => editing = false}>Cancel</button>
          <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                  disabled={saving} onclick={saveEdit}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    {/if}

    <!-- Reactions -->
    <div class="flex items-center flex-wrap mb2">
      {#each reactions as group, gi (group.content)}
        {#if (group.users?.totalCount ?? 0) > 0}
          <button class="f7 flex items-center ph2 br-pill pointer sans-serif mr1 mb1 pv1"
                  class:sb-pill={!group.viewerHasReacted}
                  class:sb-pill-active={group.viewerHasReacted}
                  onclick={(e) => { e.stopPropagation(); toggleReaction(group.content, gi) }}>
            <span class="mr1 f7">{emojiFor(group.content)}</span>
            <span class="f7">{group.users?.totalCount ?? 0}</span>
          </button>
        {/if}
      {/each}
      <div class="relative mr1 mb1 dib">
        <button class="f7 flex items-center ph2 pv1 br-pill pointer sans-serif sb-pill"
                onclick={(e) => { e.stopPropagation(); pickerTarget = pickerTarget === 'comment' ? null : 'comment' }}>
          <span>😀 +</span>
        </button>
        {#if pickerTarget === 'comment'}
          <div class="sb-reaction-picker absolute left-0 flex pa1 sb-bg ba sb-b-default br3 sb-shadow">
            {#each emojiEntries as [key, emoji] (key)}
              <button class="flex items-center justify-center br2 bn f6 pointer mr1"
                      class:sb-reaction-btn-active={isReacted(key)}
                      class:bg-transparent={!isReacted(key)}
                      class:sb-reaction-btn={!isReacted(key)}
                      onclick={(e) => { e.stopPropagation(); toggleReaction(key); pickerTarget = null }}>
                {emoji}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      {#if !editing && canEdit}
        <div class="dib mb1 ml-auto">
          <button class="sb-fg-muted bg-transparent bn pointer f7 underline-hover" onclick={() => { editing = true; editText = commentText }}>Edit</button>
        </div>
      {/if}
    </div>

    <!-- Replies -->
    {#if replies.length > 0}
      <div class="bt sb-b-muted pt2 mt1">
        <div class="fw6 sb-fg-muted ttu tracked mb2 sb-f-xs">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</div>
        {#each replies as reply, ri (reply.id ?? ri)}
          <div class="flex mb2">
            {#if reply.author?.avatarUrl}
              <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar-sm" src={reply.author.avatarUrl} alt={esc(reply.author.login)} />
            {/if}
            <div class="flex-auto sb-min-w-0">
              <div class="flex items-center mb1">
                <span class="f7 fw6 sb-fg mr1">{esc(reply.author?.login ?? 'unknown')}</span>
                {#if reply.createdAt}
                  <span class="sb-fg-muted sb-f-xs">{timeAgo(reply.createdAt)}</span>
                {/if}
                {#if user && reply.author?.login === user.login}
                  <div class="flex gap-2 ml-auto flex-shrink-0">
                    {#if editingReply !== ri}
                      <button class="sb-fg-muted bg-transparent bn pointer underline-hover sb-f-xs"
                              onclick={() => { editingReply = ri; editReplyText = replyTexts[ri] }}>Edit</button>
                      <button class="sb-fg-danger bg-transparent bn pointer underline-hover sb-f-xs"
                              onclick={() => deleteReplyAt(ri)}>Delete</button>
                    {/if}
                  </div>
                {/if}
              </div>
              {#if editingReply !== ri}
                <p class="lh-copy sb-fg ma0 word-wrap sb-f-sm">{replyTexts[ri] ?? reply.text ?? reply.body}</p>
              {:else}
                <div>
                  <textarea class="sb-input sb-textarea-sm w-100 ph2 pv1 br2 sans-serif lh-copy db mb1 f7"
                            bind:value={editReplyText}></textarea>
                  <div class="flex justify-end mb1">
                    <button class="sb-btn-cancel ph2 pv1 br2 f7 fw5 sans-serif pointer mr1" onclick={() => editingReply = -1}>Cancel</button>
                    <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                            disabled={savingReply} onclick={() => saveReply(ri)}>
                      {savingReply ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              {/if}
              <!-- Reply reactions -->
              <div class="flex items-center flex-wrap mt1">
                {#each (replyReactions[ri] ?? []) as rg, rgi (rg.content)}
                  {#if (rg.users?.totalCount ?? 0) > 0}
                    <button class="dib flex f7 items-center ph2 br-pill pointer sans-serif mr1 mb1"
                            class:sb-pill={!rg.viewerHasReacted}
                            class:sb-pill-active={rg.viewerHasReacted}
                            onclick={(e) => { e.stopPropagation(); toggleReplyReaction(ri, rg.content, rgi) }}>
                      <span class="mr1">{emojiFor(rg.content)}</span>
                      <span>{rg.users?.totalCount ?? 0}</span>
                    </button>
                  {/if}
                {/each}
                <div class="relative mr1 mb1">
                  <button class="f7 flex items-center ph2 pv1 br-pill pointer sans-serif sb-pill"
                          onclick={(e) => { e.stopPropagation(); pickerTarget = pickerTarget === `reply-${ri}` ? null : `reply-${ri}` }}>
                    😀 +
                  </button>
                  {#if pickerTarget === `reply-${ri}`}
                    <div class="sb-reaction-picker absolute left-0 flex pa1 sb-bg ba sb-b-default br3 sb-shadow">
                      {#each emojiEntries as [key, emoji] (key)}
                        <button class="flex items-center justify-center br2 bn f6 pointer mr1"
                                class:sb-reaction-btn-active={isReplyReacted(ri, key)}
                                class:bg-transparent={!isReplyReacted(ri, key)}
                                class:sb-reaction-btn={!isReplyReacted(ri, key)}
                                onclick={(e) => { e.stopPropagation(); toggleReplyReaction(ri, key); pickerTarget = null }}>
                          {emoji}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Reply form -->
  {#if canReply}
    <div class="bt sb-b-muted ph3 pv3 flex flex-column">
      <textarea class="sb-input sb-textarea-sm w-100 ph2 pv1 br2 f7 sans-serif lh-copy db mb1"
                placeholder="Reply…"
                bind:value={replyText}
                onkeydown={handleReplyKeydown}></textarea>
      <div class="flex justify-end mt2">
        <button class="sb-btn-success ph3 pv2 br2 f7 fw5 sans-serif pointer bn"
                disabled={!replyText.trim() || submittingReply}
                onclick={submitReply}>
          {submittingReply ? 'Posting…' : 'Reply'}
        </button>
      </div>
    </div>
  {/if}
</div>
