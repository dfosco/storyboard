<!--
  Composer — inline comment textarea at click position.
  Uses shadcn Textarea, Button, Avatar.
-->

<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { saveDraft, getDraft, clearDraft, composerDraftKey } from '../commentDrafts.js'

  interface Props {
    user?: { login: string; avatarUrl: string } | null
    route?: string
    onCancel?: () => void
    onSubmit?: (text: string) => void
  }

  let { user = null, route = '', onCancel, onSubmit }: Props = $props()
  const draftKey = composerDraftKey(route)
  let text = $state(getDraft(draftKey)?.text ?? '')

  function submit() {
    const val = text.trim()
    if (!val) return
    onSubmit?.(val)
  }

  function cancel() {
    onCancel?.()
  }

  function handleBlur() {
    if (text.trim()) {
      saveDraft(draftKey, { type: 'comment', text })
    } else {
      clearDraft(draftKey)
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
  }
</script>

<div class="flex flex-col font-sans" onkeydown={handleKeydown}>
  {#if user}
    <div class="flex items-center px-3 pt-2 gap-2">
      <Avatar.Root class="h-5 w-5">
        <Avatar.Image src={user.avatarUrl} alt={user.login} />
        <Avatar.Fallback class="text-[10px]">{user.login[0]?.toUpperCase()}</Avatar.Fallback>
      </Avatar.Root>
      <span class="text-xs text-muted-foreground font-medium">{user.login}</span>
    </div>
  {/if}
  <div class="px-3 pt-3">
    <Textarea class="min-h-[60px] max-h-[160px] resize-y text-sm" placeholder="Leave a comment…" bind:value={text} onblur={handleBlur} />
  </div>
  <div class="flex items-center justify-end p-3 gap-1">
    <Button variant="outline" size="sm" class="border border-input text-foreground" onclick={cancel}>Cancel</Button>
    <Button size="sm" onclick={submit}>Comment</Button>
  </div>
</div>
