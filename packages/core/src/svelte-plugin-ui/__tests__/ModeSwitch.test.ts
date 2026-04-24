import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import React from 'react'
import {
  registerMode,
  activateMode,
  initModesConfig,
} from '@dfosco/storyboard-core'
import { _resetModes } from '@test/modes'
import ModeSwitch from '../components/ModeSwitch.jsx'

afterEach(() => {
  _resetModes()
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

describe('ModeSwitch', () => {
  it('renders nothing when fewer than 2 modes registered', () => {
    registerMode('prototype', { label: 'Navigate' })
    const { container } = render(React.createElement(ModeSwitch))
    expect(container.querySelector('[role="tablist"]')).toBeNull()
  })

  it('renders a tab for each registered mode', () => {
    initModesConfig({ enabled: true })
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })
    registerMode('present', { label: 'Collaborate' })

    render(React.createElement(ModeSwitch))

    expect(screen.getByRole('tab', { name: 'Navigate' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Develop' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Collaborate' })).toBeInTheDocument()
  })

  it('marks the active mode tab as selected', () => {
    initModesConfig({ enabled: true })
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    render(React.createElement(ModeSwitch))

    const navigateTab = screen.getByRole('tab', { name: 'Navigate' })
    const developTab = screen.getByRole('tab', { name: 'Develop' })

    expect(navigateTab).toHaveAttribute('aria-selected', 'true')
    expect(developTab).toHaveAttribute('aria-selected', 'false')
  })

  it('switches mode on button click', async () => {
    initModesConfig({ enabled: true })
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    render(React.createElement(ModeSwitch))
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Develop' }))

    expect(screen.getByRole('tab', { name: 'Develop' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Navigate' })).toHaveAttribute('aria-selected', 'false')
  })

  it('renders nothing when modes are locked', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })
    initModesConfig({ enabled: true, locked: 'prototype' })

    const { container } = render(React.createElement(ModeSwitch))
    expect(container.querySelector('[role="tablist"]')).toBeNull()
  })
})
