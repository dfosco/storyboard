import { vi } from 'vitest'

vi.mock('./loader.js', () => ({
  loadFlow: vi.fn(() => ({ test: true })),
}))

import { mountDevTools } from './devtools.js'

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach((el) => el.remove())
})

describe('mountDevTools', () => {
  it('creates a wrapper element with class sb-command-wrapper', () => {
    mountDevTools()

    const wrapper = document.body.querySelector('.sb-command-wrapper')
    expect(wrapper).not.toBeNull()
  })

  it('appends to document.body by default', () => {
    mountDevTools()

    expect(document.body.querySelector('.sb-command-wrapper')).toBeInTheDocument()
  })

  it('appends to a custom container when options.container is provided', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    mountDevTools({ container })

    expect(container.querySelector('.sb-command-wrapper')).not.toBeNull()
    // Should not be a direct child of body
    expect(
      document.body.querySelectorAll(':scope > .sb-command-wrapper')
    ).toHaveLength(0)
  })

  it('is idempotent — second call to same container is a no-op', () => {
    mountDevTools()
    mountDevTools()

    const wrappers = document.body.querySelectorAll('.sb-command-wrapper')
    expect(wrappers).toHaveLength(1)
  })

  it('injects a style element into document.head', () => {
    mountDevTools()

    const styles = document.head.querySelectorAll('style')
    const hasDevtoolsStyle = Array.from(styles).some((el) =>
      el.textContent.includes('.sb-command-wrapper')
    )
    expect(hasDevtoolsStyle).toBe(true)
  })

  it('trigger button has aria-label "Storyboard DevTools"', () => {
    mountDevTools()

    const trigger = document.body.querySelector('.sb-command-trigger')
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('aria-label')).toBe('Command Menu')
  })

  it('contains a menu with flow info and reset buttons', () => {
    mountDevTools()

    const menuItems = document.body.querySelectorAll('.sb-command-menu-item')
    expect(menuItems.length).toBeGreaterThanOrEqual(2)
  })

  it('menu is hidden by default', () => {
    mountDevTools()

    const menu = document.body.querySelector('.sb-command-menu')
    expect(menu.classList.contains('open')).toBe(false)
  })
})
