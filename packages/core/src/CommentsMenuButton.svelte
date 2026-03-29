<!--
  CommentsMenuButton — auth-aware floating button for comments.
  Appears in the CoreUIBar when comments are enabled.

  When not signed in: shows "Sign in to enable comments" menu item.
  Clicking it opens the PAT login panel next to the trigger.
  When signed in: shows Comments header, Toggle comments checkbox,
  separator, and Log out.
-->

<script lang="ts">
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Panel from '$lib/components/ui/panel/index.js'
  import Octicon from './svelte-plugin-ui/components/Octicon.svelte'
  import AuthModal from './comments/ui/AuthModal.svelte'
  import { isAuthenticated } from './comments/auth.js'
  import { isCommentModeActive, toggleCommentMode } from './comments/commentMode.js'
  import { signOut } from './comments/ui/authModal.js'

  interface Props {
    config?: { ariaLabel?: string; icon?: string }
  }

  let { config = {} }: Props = $props()

  let menuOpen = $state(false)
  let authPanelOpen = $state(false)
  let authed = $state(false)
  let commentModeOn = $state(false)

  function refreshState() {
    authed = isAuthenticated()
    commentModeOn = isCommentModeActive()
  }

  function handleOpenChange(open: boolean) {
    if (open) refreshState()
  }

  function handleSignIn() {
    menuOpen = false
    authPanelOpen = true
  }

  function handleAuthDone() {
    authPanelOpen = false
    refreshState()
  }

  function handleAuthClose() {
    authPanelOpen = false
  }

  function handleToggle(e: Event) {
    e.preventDefault()
    toggleCommentMode()
    commentModeOn = isCommentModeActive()
  }

  function handleLogOut() {
    menuOpen = false
    signOut()
    refreshState()
  }
</script>

<DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleOpenChange}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen || authPanelOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || 'Comments'}
        {...props}
      >
        <Octicon name={config.icon || 'comment'} size={16} />
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="end" sideOffset={16} class="min-w-[200px]">
    {#if !authed}
      <DropdownMenu.Item onclick={handleSignIn}>
        Sign in to enable comments
      </DropdownMenu.Item>
    {:else}
      <DropdownMenu.Label>Comments</DropdownMenu.Label>
      <DropdownMenu.CheckboxItem
        checked={commentModeOn}
        onSelect={handleToggle}
      >
        Toggle comments
      </DropdownMenu.CheckboxItem>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={handleLogOut}>
        Log out
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Panel.Root bind:open={authPanelOpen}>
  <Panel.Content>
    <AuthModal onDone={handleAuthDone} onClose={handleAuthClose} />
  </Panel.Content>
</Panel.Root>
