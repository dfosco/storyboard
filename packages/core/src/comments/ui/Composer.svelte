<!--
  Composer — inline comment textarea that appears at click position.

  Shows user avatar, textarea for comment text, cancel/submit buttons.
  Cmd/Ctrl+Enter to submit. Escape to cancel.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    user?: { login: string; avatarUrl: string } | null
    onCancel?: () => void
    onSubmit?: (text: string) => void
  }

  let { user = null, onCancel, onSubmit }: Props = $props()

  let text = $state('')
  let textareaEl: HTMLTextAreaElement | undefined = $state()

  onMount(() => {
    textareaEl?.focus()
  })

  function submit() {
    const val = text.trim()
    if (!val) return
    onSubmit?.(val)
  }

  function cancel() {
    onCancel?.()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }
</script>

<div class="flex flex-column" onkeydown={handleKeydown}>
  {#if user}
    <div class="flex items-center ph3 pt2">
      <img class="br-100 ba sb-b-default flex-shrink-0 mr2 sb-avatar" src={user.avatarUrl} alt={user.login} />
      <span class="f7 sb-fg-muted fw5">{user.login}</span>
    </div>
  {/if}
  <div class="ph3 pt3">
    <textarea class="sb-input sb-textarea w-100 ph2 pv2 br2 f6 sans-serif lh-copy db sb-f-sm"
              placeholder="Leave a comment…"
              bind:value={text}
              bind:this={textareaEl}></textarea>
  </div>
  <div class="flex items-center justify-end pa3">
    <button class="sb-btn-cancel ph3 pv2 br2 f7 fw5 pointer mr1" onclick={cancel}>Cancel</button>
    <button class="sb-btn-success ph3 pv2 br2 f7 fw5 pointer bn" onclick={submit}>Comment</button>
  </div>
</div>
