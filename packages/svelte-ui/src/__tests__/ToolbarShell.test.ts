import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import {
  registerMode,
  activateMode,
} from '@dfosco/storyboard-core'
import { _resetModes } from '@test/modes'
import ToolbarShell from '../components/ToolbarShell.svelte'

afterEach(() => {
  _resetModes()
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

describe('ToolbarShell', () => {
  it('renders nothing when current mode has no tools', () => {
    registerMode('prototype', { label: 'Navigate' })
    const { container } = render(ToolbarShell)
    expect(container.querySelector('[role="toolbar"]')).toBeNull()
  })

  it('renders tool buttons for mode with tools', () => {
    registerMode('prototype', {
      label: 'Navigate',
      tools: [
        { id: 'zoom', label: 'Zoom', action: () => {} },
        { id: 'pan', label: 'Pan', action: () => {} },
      ],
    })

    render(ToolbarShell)

    expect(screen.getByTitle('Zoom')).toBeInTheDocument()
    expect(screen.getByTitle('Pan')).toBeInTheDocument()
  })

  it('renders dev tools section when mode has devTools', () => {
    registerMode('prototype', {
      label: 'Navigate',
      devTools: [
        { id: 'debug', label: 'Debug', action: () => {} },
      ],
    })

    render(ToolbarShell)

    expect(screen.getByTitle('Debug')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('renders both tool groups when mode has both', () => {
    registerMode('prototype', {
      label: 'Navigate',
      tools: [{ id: 'zoom', label: 'Zoom', action: () => {} }],
      devTools: [{ id: 'debug', label: 'Debug', action: () => {} }],
    })

    render(ToolbarShell)

    const toolbars = screen.getAllByRole('toolbar')
    expect(toolbars).toHaveLength(2)
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })
})
