import { useState, useEffect } from 'react'
import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
import Icon from './svelte-plugin-ui/components/Icon.jsx'
import { themeState, setTheme, THEMES, themeSyncState, setThemeSyncTarget } from './stores/themeStore.js'

export default function ThemeMenuButton({ config = {}, data, localOnly, tabindex = -1 }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [canvasActive, setCanvasActive] = useState(false)
  const [theme, setThemeState] = useState(themeState.theme)
  const [syncState, setSyncState] = useState({ ...themeSyncState })

  useEffect(() => {
    // Subscribe to theme store changes
    const interval = setInterval(() => {
      setThemeState(themeState.theme)
      setSyncState({ ...themeSyncState })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleCanvasMounted() { setCanvasActive(true) }
    function handleCanvasUnmounted() { setCanvasActive(false) }
    document.addEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.addEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)

    const state = window.__storyboardCanvasBridgeState
    const active = state?.active === true
    setCanvasActive(active)
    if (!active) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    }

    return () => {
      document.removeEventListener('storyboard:canvas:mounted', handleCanvasMounted)
      document.removeEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    }
  }, [])

  function handleSelect(value) {
    setTheme(value)
    setMenuOpen(false)
  }

  function handleSyncToggle(e, target) {
    e.preventDefault()
    setThemeSyncTarget(target, !syncState[target])
  }

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenu.Trigger asChild>
          <TriggerButton
            active={menuOpen}
            size="icon-xl"
            aria-label={config.ariaLabel || 'Theme'}
            tabIndex={tabindex}
          >
            <Icon name={config.icon || 'primer/sun'} size={16} {...(config.meta || {})} />
          </TriggerButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="end"
        sideOffset={16}
        style={config.menuWidth ? { minWidth: config.menuWidth } : undefined}
        className="min-w-[200px]"
      >
        {config.label && <DropdownMenu.Label>{config.label}</DropdownMenu.Label>}

        <DropdownMenu.RadioGroup value={theme}>
          {THEMES.map((option) => (
            <DropdownMenu.RadioItem
              key={option.value}
              value={option.value}
              onClick={() => handleSelect(option.value)}
            >
              {option.name}
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>

        <DropdownMenu.Separator />

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Theme settings</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent className="min-w-[180px]">
            <DropdownMenu.Label>Apply theme to</DropdownMenu.Label>
            {canvasActive ? (
              <DropdownMenu.CheckboxItem
                checked={syncState.canvas}
                onSelect={(e) => handleSyncToggle(e, 'canvas')}
              >
                Canvas
              </DropdownMenu.CheckboxItem>
            ) : (
              <DropdownMenu.CheckboxItem
                checked={syncState.prototype}
                onSelect={(e) => handleSyncToggle(e, 'prototype')}
              >
                Prototype
              </DropdownMenu.CheckboxItem>
            )}
            <DropdownMenu.CheckboxItem
              checked={syncState.toolbar}
              onSelect={(e) => handleSyncToggle(e, 'toolbar')}
            >
              Tools
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem
              checked={syncState.codeBoxes}
              onSelect={(e) => handleSyncToggle(e, 'codeBoxes')}
            >
              Code boxes
            </DropdownMenu.CheckboxItem>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
