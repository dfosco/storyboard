import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MarkdownBlock from './MarkdownBlock.jsx'

describe('MarkdownBlock', () => {
  it('does not enter edit mode when onUpdate is unavailable (read-only/prod)', () => {
    const { container } = render(<MarkdownBlock props={{ content: 'Hello', width: 420 }} />)

    fireEvent.doubleClick(screen.getByText('Hello'))

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(container.querySelector('[data-canvas-allow-text-selection]')).not.toBeNull()
  })

  it('enters edit mode when onUpdate is available', () => {
    const onUpdate = vi.fn()
    render(<MarkdownBlock props={{ content: 'Hello', width: 420 }} onUpdate={onUpdate} />)

    fireEvent.doubleClick(screen.getByText('Hello'))

    expect(screen.queryByRole('textbox')).not.toBeNull()
  })

  it('shows a non-editable empty-state message in read-only mode', () => {
    render(<MarkdownBlock props={{ content: '', width: 420 }} />)

    expect(screen.getByText('No content')).toBeTruthy()
    expect(screen.queryByText('Double-click to edit…')).toBeNull()
  })
})
