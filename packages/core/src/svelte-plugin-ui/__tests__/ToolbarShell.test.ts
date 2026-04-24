import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  registerMode,
  initTools,
  setToolAction,
  setToolState,
} from '@dfosco/storyboard-core'
import { _resetModes } from '@test/modes'
import ToolbarShell from '../components/ToolbarShell.jsx'

afterEach(() => {
  _resetModes()
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

describe('ToolbarShell', () => {
  it('renders nothing when no tools are declared', () => {
    registerMode('prototype', { label: 'Navigate' })
    const { container } = render(React.createElement(ToolbarShell))
    expect(container.querySelector('[role="toolbar"]')).toBeNull()
  })

  it('renders tool buttons from the tool registry', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [
        { id: 'zoom', label: 'Zoom', group: 'tools' },
        { id: 'pan', label: 'Pan', group: 'tools' },
      ],
    })
    setToolAction('zoom', () => {})
    setToolAction('pan', () => {})

    render(React.createElement(ToolbarShell))

    expect(screen.getByTitle('Zoom')).toBeInTheDocument()
    expect(screen.getByTitle('Pan')).toBeInTheDocument()
  })

  it('renders dev tools section', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [{ id: 'debug', label: 'Debug', group: 'dev' }],
    })
    setToolAction('debug', () => {})

    render(React.createElement(ToolbarShell))

    expect(screen.getByTitle('Debug')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('renders both tool groups', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [
        { id: 'zoom', label: 'Zoom', group: 'tools' },
        { id: 'debug', label: 'Debug', group: 'dev' },
      ],
    })
    setToolAction('zoom', () => {})
    setToolAction('debug', () => {})

    render(React.createElement(ToolbarShell))

    const toolbars = screen.getAllByRole('toolbar')
    expect(toolbars).toHaveLength(2)
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('disables tools without an action', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [{ id: 'no-action', label: 'No Action', group: 'tools' }],
    })

    render(React.createElement(ToolbarShell))

    const btn = screen.getByTitle('No Action')
    expect(btn).toBeDisabled()
  })

  it('disables tools with enabled: false state', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [{ id: 'disabled-tool', label: 'Disabled', group: 'tools' }],
    })
    setToolAction('disabled-tool', () => {})
    setToolState('disabled-tool', { enabled: false })

    render(React.createElement(ToolbarShell))

    const btn = screen.getByTitle('Disabled')
    expect(btn).toBeDisabled()
  })

  it('hides tools with hidden: true state', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [{ id: 'hidden-tool', label: 'Hidden', group: 'tools' }],
    })
    setToolState('hidden-tool', { hidden: true })

    const { container } = render(React.createElement(ToolbarShell))

    expect(container.querySelector('[role="toolbar"]')).toBeNull()
  })

  it('renders badge when present', () => {
    registerMode('prototype', { label: 'Navigate' })
    initTools({
      '*': [{ id: 'badged', label: 'Badged', group: 'tools' }],
    })
    setToolAction('badged', () => {})
    setToolState('badged', { badge: 5 })

    render(React.createElement(ToolbarShell))

    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
