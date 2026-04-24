<!--
  PwaInstallBanner — mobile-only "Add to Home Screen" prompt.

  Listens for the `beforeinstallprompt` event (Chrome/Edge) and shows a
  dismissible banner. Never shows on desktop or when already installed.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { isMobile, isTouchDevice, subscribeToMobile } from './mobileViewport.js'

  const DISMISS_KEY = 'sb-pwa-install-dismissed'

  let showBanner = $state(false)
  let deferredPrompt: any = null

  function isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  }

  function isDismissed(): boolean {
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  }

  function handleBeforeInstallPrompt(e: Event) {
    e.preventDefault()
    deferredPrompt = e
    if (isMobile() && isTouchDevice() && !isStandalone() && !isDismissed()) {
      showBanner = true
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    showBanner = false
    if (outcome === 'dismissed') {
      try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    }
  }

  function handleDismiss() {
    showBanner = false
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  let unsubMobile: (() => void) | null = null

  onMount(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => { showBanner = false })

    unsubMobile = subscribeToMobile((mobile: boolean) => {
      if (!mobile) showBanner = false
      else if (deferredPrompt && isTouchDevice() && !isStandalone() && !isDismissed()) {
        showBanner = true
      }
    })
  })

  onDestroy(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    if (unsubMobile) unsubMobile()
  })
</script>

{#if showBanner}
  <div class="pwa-banner" role="alert">
    <span class="pwa-banner-text">Add Storyboard to your home screen</span>
    <button class="pwa-banner-btn install" onclick={handleInstall}>Install</button>
    <button class="pwa-banner-btn dismiss" onclick={handleDismiss} aria-label="Dismiss">✕</button>
  </div>
{/if}

<style>
  .pwa-banner {
    position: fixed;
    bottom: 5rem;
    left: 1rem;
    right: 1rem;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--bgColor-default, #0d1117);
    color: var(--fgColor-default, #e6edf3);
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 0.75rem;
    font-family: "Mona Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 0.8125rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .pwa-banner-text {
    flex: 1;
  }

  .pwa-banner-btn {
    border: none;
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    cursor: pointer;
    font-weight: 500;
  }

  .pwa-banner-btn.install {
    background: var(--button-primary-bgColor-rest, #238636);
    color: #fff;
  }

  .pwa-banner-btn.dismiss {
    background: transparent;
    color: var(--fgColor-muted, #8d96a0);
    padding: 0.375rem;
  }
</style>
