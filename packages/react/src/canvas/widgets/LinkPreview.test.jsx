import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LinkPreview from './LinkPreview.jsx'

describe('LinkPreview', () => {
  it('runs refresh with pending state for GitHub embeds', async () => {
    let resolveRefresh
    const onRefreshGitHub = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
    )

    render(
      <LinkPreview
        id="link-1"
        canRefreshGitHub
        onRefreshGitHub={onRefreshGitHub}
        props={{
          url: 'https://github.com/dfosco/storyboard/issues/42',
          title: '#42 Ship GitHub embeds',
          github: {
            context: 'GitHub · dfosco/storyboard · Issue #42',
            body: 'Details from GitHub',
            authors: ['dfosco'],
          },
        }}
      />,
    )

    const refreshButton = screen.getByRole('button', { name: 'Refresh GitHub metadata' })
    fireEvent.click(refreshButton)

    expect(onRefreshGitHub).toHaveBeenCalledWith('link-1', 'https://github.com/dfosco/storyboard/issues/42')
    expect(refreshButton).toBeDisabled()
    expect(refreshButton).toHaveTextContent('Refreshing')

    resolveRefresh({ updated: true })
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled()
    })
    expect(refreshButton).toHaveTextContent('Refresh')
  })

  it('shows refresh error message when refresh fails', async () => {
    const onRefreshGitHub = vi.fn(() => Promise.reject(new Error('network')))

    render(
      <LinkPreview
        id="link-2"
        canRefreshGitHub
        onRefreshGitHub={onRefreshGitHub}
        props={{
          url: 'https://github.com/dfosco/storyboard/issues/43',
          title: '#43 Broken refresh',
          github: {
            context: 'GitHub · dfosco/storyboard · Issue #43',
            body: 'Details from GitHub',
            authors: ['dfosco'],
          },
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Refresh GitHub metadata' }))

    await waitFor(() => {
      expect(screen.getByText('Unable to refresh GitHub metadata right now.')).toBeInTheDocument()
    })
  })

  it('does not render refresh button for non-GitHub links', () => {
    render(
      <LinkPreview
        id="link-3"
        canRefreshGitHub
        onRefreshGitHub={vi.fn()}
        props={{
          url: 'https://example.com/docs',
          title: 'Example docs',
        }}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Refresh GitHub metadata' })).toBeNull()
  })
})
