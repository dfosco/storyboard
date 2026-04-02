<!--
  AuthModal — PAT entry modal for comments authentication.
  Uses shadcn Button, Input, Label, Alert, Avatar.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { setToken, validateToken } from '../auth.js'
  import { getCommentsConfig } from '../config.js'
  import { Button } from '../../lib/components/ui/button/index.js'
  import { Input } from '../../lib/components/ui/input/index.js'
  import { Label } from '../../lib/components/ui/label/index.js'
  import * as Alert from '../../lib/components/ui/alert/index.js'
  import * as Avatar from '../../lib/components/ui/avatar/index.js'

  interface Props {
    onDone?: (user: { login: string; avatarUrl: string }) => void
    onClose?: () => void
    initialError?: string | null
  }

  let { onDone, onClose, initialError = null }: Props = $props()

  let token = $state('')
  let submitting = $state(false)
  let error: string | null = $state(null)
  let user: { login: string; avatarUrl: string } | null = $state(null)
  let inputEl: HTMLInputElement | null = $state(null)
  const commentsConfig = getCommentsConfig()
  const repoOwner = commentsConfig?.repo?.owner || 'github'
  const repoName = commentsConfig?.repo?.name || 'storyboard'
  const repoSlug = `${repoOwner}/${repoName}`
  const tokenTemplateName = 'Storyboard Comments'
  const tokenTemplateDescription =
    `Token for enabling comments on ${repoSlug} prototype. Configure as:\n\n` +
    `Owner: ${repoOwner}\n` +
    'Expiration: 366 days (recommended)\n' +
    `Repository access: Only select repositories > ${repoSlug}\n` +
    'Permissions: Repositories > Discussions > Access: Read and Write'
  const tokenCreateUrl =
    `https://github.com/settings/personal-access-tokens/new?` +
    new URLSearchParams({
      name: tokenTemplateName,
      description: tokenTemplateDescription,
    }).toString()

  onMount(() => {
    error = initialError
    inputEl?.focus()
  })

  async function submit() {
    const val = token.trim()
    if (!val) return
    submitting = true; error = null
    try { const result = await validateToken(val); setToken(val); user = result }
    catch (err: any) { error = err.message }
    finally { submitting = false }
  }

  function done() { if (user) onDone?.(user) }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !user) submit()
  }
</script>

<div class="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden max-w-[600px] w-full font-sans">
  <div class="flex items-center justify-between px-4 py-3 border-b border-border">
    <h2 class="text-medium font-semibold">Sign in for comments</h2>
    <Button variant="ghost" size="icon" onclick={onClose} aria-label="Close" class="h-7 w-7 text-muted-foreground">&#215;</Button>
  </div>
  <div class="p-4 space-y-3">
    {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
    <p class="text-sm text-muted-foreground leading-relaxed">
      Leave comments for other users to see and respond, and react to! Storyboard comments use Discussions as a back-end and require a GitHub PAT to be enabled.
    </p>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Create a <a class="text-primary underline" href={tokenCreateUrl} target="_blank" rel="noopener">GitHub Fine-Grained Personal Access Token</a> with the settings below to get started:
    </p>
    <div class="px-3 py-2 bg-muted border border-border rounded text-xs text-muted-foreground leading-relaxed">
      <div class="mb-1"><strong class="text-foreground">Fine-grained Personal Access Token</strong></div>
      <div>Owner: <code class="px-1 bg-background rounded font-mono text-foreground">{repoOwner}</code></div>
      <div>Expiration: <code class="px-1 bg-background rounded font-mono text-foreground">366 days</code> (recommended)</div>
      <div>Repository access: <code class="px-1 bg-background rounded font-mono text-foreground">Only select repositories &gt; {repoSlug}</code></div>
      <div>Permissions: <code class="px-1 bg-background rounded font-mono text-foreground">Repositories > Discussions > Access: Read and Write</code></div>
    </div>
    <div class="space-y-1">
      <Label for="sb-auth-token-input">Personal Access Token</Label>
      <Input id="sb-auth-token-input" type="password" placeholder="github_pat_\u2026 or ghp_\u2026" autocomplete="off" spellcheck="false" class="font-mono" bind:value={token} bind:ref={inputEl} onkeydown={handleKeydown} />
    </div>
    {#if user}
      <div class="flex items-center py-1 gap-3">
        <Avatar.Root class="h-10 w-10"><Avatar.Image src={user.avatarUrl} alt={user.login} /><Avatar.Fallback>{user.login[0]?.toUpperCase()}</Avatar.Fallback></Avatar.Root>
        <div class="text-sm"><span class="text-foreground">{user.login}</span><span class="block text-xs text-success mt-0.5">&#10003; Signed in</span></div>
      </div>
    {/if}
  </div>
  <div class="flex items-center justify-end px-4 py-3 border-t border-border gap-2">
    <Button variant="outline" size="sm" onclick={onClose}>Cancel</Button>
    <Button size="sm" disabled={submitting} onclick={user ? done : submit}>{user ? 'Done' : (submitting ? 'Validating\u2026' : 'Sign in')}</Button>
  </div>
</div>
