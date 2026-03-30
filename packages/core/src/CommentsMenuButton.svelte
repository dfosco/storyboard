<!--
  CommentsMenuButton — auth-aware floating button for comments.
  Appears in the CoreUIBar when comments are enabled.

  Logged out: click opens the auth panel to sign in.
  Logged in: click toggles comment mode directly.
-->

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as Panel from '$lib/components/ui/panel/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import AuthModal from './comments/ui/AuthModal.svelte'
  import { isAuthenticated } from './comments/auth.js'
  import { isCommentModeActive, toggleCommentMode, subscribeToCommentMode } from './comments/commentMode.js'

  interface Props {
    config?: { ariaLabel?: string; icon?: string; meta?: Record<string, any> }
    tabindex?: number
  }

  let { config = {}, tabindex }: Props = $props()

  let authPanelOpen = $state(false)
  let commentModeOn = $state(isCommentModeActive())

  const unsubscribe = subscribeToCommentMode((active: boolean) => {
    commentModeOn = active
  })
  onDestroy(unsubscribe)

  function handleClick() {
    if (!isAuthenticated()) {
      authPanelOpen = true
      return
    }
    toggleCommentMode()
  }

  function handleAuthDone() {
    authPanelOpen = false
    toggleCommentMode()
  }

  function handleAuthClose() {
    authPanelOpen = false
  }
</script>

<TriggerButton
  active={authPanelOpen || commentModeOn}
  size="icon-xl"
  aria-label={config.ariaLabel || 'Comments'}
  {tabindex}
  onclick={handleClick}
>
  <Icon name={config.icon || 'primer/comment'} size={16} {...(config.meta || {})} />
</TriggerButton>

<Panel.Root bind:open={authPanelOpen}>
  <Panel.Content>
    <AuthModal onDone={handleAuthDone} onClose={handleAuthClose} />
  </Panel.Content>
</Panel.Root>
