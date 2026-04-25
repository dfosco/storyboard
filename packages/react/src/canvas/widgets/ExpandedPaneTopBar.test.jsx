import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExpandedPaneTopBar from './ExpandedPaneTopBar.jsx'

describe('ExpandedPaneTopBar', () => {
  const basePanes = [
    { id: 'pane-a', label: 'Terminal · pearl-wren' },
    { id: 'pane-b', label: 'Prototype · /Signup' },
  ]

  it('renders left and right pane labels', () => {
    render(
      <ExpandedPaneTopBar panes={basePanes} activePaneIndex={0} onClose={vi.fn()} />
    )
    expect(screen.getByText('Terminal · pearl-wren')).toBeTruthy()
    expect(screen.getByText('Prototype · /Signup')).toBeTruthy()
  })

  it('renders a single pane label when only one pane exists', () => {
    render(
      <ExpandedPaneTopBar panes={[basePanes[0]]} activePaneIndex={0} onClose={vi.fn()} />
    )
    expect(screen.getByText('Terminal · pearl-wren')).toBeTruthy()
    expect(screen.queryByText('Prototype · /Signup')).toBeNull()
  })

  it('applies active style to focused pane and muted to unfocused', () => {
    const { container } = render(
      <ExpandedPaneTopBar panes={basePanes} activePaneIndex={1} onClose={vi.fn()} />
    )
    const leftLabel = container.querySelector('[class*="leftLabel"]')
    const rightLabel = container.querySelector('[class*="rightLabel"]')
    expect(leftLabel.className).toMatch(/muted/)
    expect(rightLabel.className).toMatch(/active/)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ExpandedPaneTopBar panes={basePanes} activePaneIndex={0} onClose={onClose} />
    )
    fireEvent.click(screen.getByLabelText('Close expanded view'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not render add or remove buttons', () => {
    render(
      <ExpandedPaneTopBar panes={basePanes} activePaneIndex={0} onClose={vi.fn()} />
    )
    expect(screen.queryByLabelText('Add pane')).toBeNull()
    expect(screen.queryAllByLabelText(/Remove .+ pane/).length).toBe(0)
  })
})
