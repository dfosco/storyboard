<!--
  AuthModal — PAT entry modal for comments authentication.

  Validates a GitHub Personal Access Token, shows user info on success.
  Communicates results via onDone/onClose callbacks.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { setToken, validateToken } from '../auth.js'

  interface Props {
    onDone?: (user: { login: string; avatarUrl: string }) => void
    onClose?: () => void
  }

  let { onDone, onClose }: Props = $props()

  let token = $state('')
  let submitting = $state(false)
  let error: string | null = $state(null)
  let user: { login: string; avatarUrl: string } | null = $state(null)

  let inputEl: HTMLInputElement | undefined = $state()

  onMount(() => {
    inputEl?.focus()
  })

  async function submit() {
    const val = token.trim()
    if (!val) return

    submitting = true
    error = null

    try {
      const result = await validateToken(val)
      setToken(val)
      user = result
    } catch (err: any) {
      error = err.message
    } finally {
      submitting = false
    }
  }

  function done() {
    if (user) onDone?.(user)
  }

  function close() {
    onClose?.()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !user) submit()
  }
</script>

<div class="sb-auth-modal sb-bg ba sb-b-default br3 sb-shadow sb-fg overflow-hidden">
  <div class="flex items-center justify-between ph4 pv3 bb sb-b-muted">
    <h2 class="ma0 f5 fw6 sb-fg">Sign in for comments</h2>
    <button class="flex items-center justify-center bg-transparent bn br2 sb-fg-muted pointer sb-close-btn" onclick={close} aria-label="Close">×</button>
  </div>
  <div class="pa4">
    <p class="ma0 mb3 lh-copy sb-fg-muted sb-f-sm">
      Create a <a class="sb-fg-accent no-underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub Fine-Grained Personal Access Token</a> with access to <b>github/storyboard</b> repository and <b>Discussions</b> read/write scope. Then enter the token below to sign in and enable commenting features.
    </p>
    <label class="db mb1 fw5 sb-fg sb-f-sm" for="sb-auth-token-input">Personal Access Token</label>
    <input class="sb-input w-100 ph3 pv2 br2 f6 code db" id="sb-auth-token-input" type="password"
           placeholder="github_pat_… or ghp_…" autocomplete="off" spellcheck="false"
           bind:value={token} bind:this={inputEl} onkeydown={handleKeydown} />
    <div class="mt2 ph3 pv2 sb-bg-inset ba sb-b-muted br2 f7 sb-fg-muted lh-copy">
      <div class="mb1"><strong class="sb-fg">Fine-grained</strong> (recommended): <code class="dib ph1 sb-bg-muted br1 code sb-fg sb-code-badge">Discussions: Read and write</code></div>
      <div><strong class="sb-fg">Classic</strong>: <code class="dib ph1 sb-bg-muted br1 code sb-fg sb-code-badge">repo</code></div>
    </div>
    {#if error}
      <div class="mt2 ph3 pv2 br2 sb-fg-danger sb-f-sm sb-error-alert">{error}</div>
    {/if}
    {#if user}
      <div class="flex items-center pv1">
        <img class="br-100 ba sb-b-default mr3 sb-avatar-lg" src={user.avatarUrl} alt={user.login} />
        <div class="f6 sb-fg">
          <span>{user.login}</span>
          <span class="db f7 sb-fg-success mt1">✓ Signed in</span>
        </div>
      </div>
    {/if}
  </div>
  <div class="flex items-center justify-end ph4 pv3 bt sb-b-muted">
    <button class="sb-btn-cancel ph3 pv1 br2 fw5 sans-serif pointer mr2 sb-f-sm" onclick={close}>Cancel</button>
    <button class="sb-btn-success ph3 pv1 br2 fw5 sans-serif pointer bn sb-f-sm" disabled={submitting}
            onclick={user ? done : submit}>
      {user ? 'Done' : (submitting ? 'Validating…' : 'Sign in')}
    </button>
  </div>
</div>
