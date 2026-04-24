<!--
  CommentsMenuButton — auth-aware floating button for comments.
  Appears in the CoreUIBar when comments are enabled.

  Logged out: click opens the auth panel to sign in.
  Logged in: click toggles comment mode directly.
-->

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { isAuthenticated } from './comments/auth.js'
  import { isCommentModeActive, toggleCommentMode, subscribeToCommentMode } from './comments/commentMode.js'
  import { openAuthModal } from './comments/ui/authModal.js'

  interface Props {
    config?: { ariaLabel?: string; icon?: string; meta?: Record<string, any> }
    data?: any
    localOnly?: boolean
    tabindex?: number
  }

  let { config = {}, data, localOnly, tabindex }: Props = $props()

  let commentModeOn = $state(isCommentModeActive())

  const unsubscribe = subscribeToCommentMode((active: boolean) => {
    commentModeOn = active
  })
  onDestroy(unsubscribe)

  async function handleClick() {
    if (!isAuthenticated()) {
      const user = await openAuthModal()
      if (user) {
        toggleCommentMode()
      }
      return
    }
    toggleCommentMode()
  }
</script>

<TriggerButton
  active={commentModeOn}
  size="icon-xl"
  aria-label={config.ariaLabel || 'Comments'}
  {tabindex}
  onclick={handleClick}
>
  <Icon name={config.icon || 'primer/comment'} size={16} {...(config.meta || {})} />
</TriggerButton>
