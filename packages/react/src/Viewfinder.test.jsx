import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @dfosco/storyboard-core
vi.mock('@dfosco/storyboard-core', () => {
  let _storage = {}
  return {
    buildPrototypeIndex: vi.fn(() => ({
      folders: [],
      prototypes: [],
      canvases: [],
      globalFlows: [],
      sorted: {
        title: { prototypes: [], canvases: [], folders: [] },
        updated: { prototypes: [], canvases: [], folders: [] },
      },
    })),
    getLocal: vi.fn((key) => _storage[key] ?? null),
    setLocal: vi.fn((key, value) => { _storage[key] = String(value) }),
    _resetStorage: () => { _storage = {} },
  }
})

// Mock octicons as simple spans
vi.mock('@primer/octicons-react', () => ({
  ChevronDownIcon: (props) => <span data-testid="chevron-down" {...props} />,
  ChevronRightIcon: (props) => <span data-testid="chevron-right" {...props} />,
  LinkExternalIcon: (props) => <span data-testid="link-external" {...props} />,
  FileDirectoryFillIcon: (props) => <span data-testid="folder-closed" {...props} />,
  FileDirectoryOpenFillIcon: (props) => <span data-testid="folder-open" {...props} />,
  GitBranchIcon: (props) => <span data-testid="git-branch" {...props} />,
  AlertIcon: (props) => <span data-testid="alert-icon" {...props} />,
}))

import Viewfinder from './Viewfinder.jsx'
import { buildPrototypeIndex, getLocal, setLocal, _resetStorage } from '@dfosco/storyboard-core'

beforeEach(() => {
  vi.clearAllMocks()
  _resetStorage()
  delete window.__SB_BRANCHES__
})

// ── Helpers ──

function makeProto(overrides = {}) {
  return {
    name: 'Example',
    dirName: 'Example',
    description: null,
    author: null,
    gitAuthor: null,
    lastModified: null,
    icon: null,
    team: null,
    tags: null,
    hideFlows: true,
    folder: null,
    isExternal: false,
    externalUrl: null,
    flows: [],
    ...overrides,
  }
}

function makeCanvas(overrides = {}) {
  return {
    name: 'My Canvas',
    dirName: 'my-canvas',
    description: null,
    route: '/canvas/my-canvas',
    folder: null,
    isCanvas: true,
    author: null,
    gitAuthor: null,
    ...overrides,
  }
}

function setIndex(data) {
  buildPrototypeIndex.mockReturnValue({
    folders: [],
    prototypes: [],
    canvases: [],
    globalFlows: [],
    sorted: {
      title: { prototypes: data.prototypes || [], canvases: data.canvases || [], folders: data.folders || [] },
      updated: { prototypes: data.prototypes || [], canvases: data.canvases || [], folders: data.folders || [] },
    },
    ...data,
  })
}

// ── Tests ──

describe('Viewfinder', () => {
  it('renders title', () => {
    setIndex({})
    render(<Viewfinder title="My Project" basePath="/" />)
    expect(screen.getByText('My Project')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    setIndex({})
    render(<Viewfinder title="Test" subtitle="A subtitle" basePath="/" />)
    expect(screen.getByText('A subtitle')).toBeInTheDocument()
  })

  it('shows empty state when no prototypes', () => {
    setIndex({})
    render(<Viewfinder basePath="/" />)
    expect(screen.getByText(/No flows found/)).toBeInTheDocument()
  })

  it('shows canvas empty state', () => {
    setIndex({})
    // Set viewMode to canvases via localStorage
    setLocal('viewfinder.viewMode', 'canvases')
    render(<Viewfinder basePath="/" />)
    expect(screen.getByText(/No canvases found/)).toBeInTheDocument()
  })

  describe('prototype rendering', () => {
    it('renders ungrouped prototype as a link', () => {
      const proto = makeProto({ name: 'Dashboard', dirName: 'Dashboard', flows: [] })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/storyboard/" />)
      const link = screen.getByText('Dashboard').closest('a')
      expect(link).toHaveAttribute('href', '/storyboard/Dashboard')
    })

    it('renders external prototype with badge and new tab', () => {
      const proto = makeProto({
        name: 'External App',
        isExternal: true,
        externalUrl: 'https://example.com',
      })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)
      const link = screen.getByText('External App').closest('a')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(screen.getByText('external')).toBeInTheDocument()
    })

    it('renders single hidden flow as direct link', () => {
      const proto = makeProto({
        name: 'Single Flow',
        hideFlows: true,
        flows: [{ key: 'Single Flow/default', name: 'default', route: '/Single Flow', meta: null }],
      })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)
      const link = screen.getByText('Single Flow').closest('a')
      expect(link).toHaveAttribute('href', '/Single Flow')
    })

    it('renders expandable prototype with chevron', () => {
      const proto = makeProto({
        name: 'Multi',
        dirName: 'Multi',
        hideFlows: false,
        flows: [
          { key: 'Multi/one', name: 'one', route: '/Multi?flow=Multi%2Fone', meta: null },
          { key: 'Multi/two', name: 'two', route: '/Multi?flow=Multi%2Ftwo', meta: null },
        ],
      })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)
      // Should render as a button, not a link
      const button = screen.getByText('Multi').closest('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands prototype to show flows on click', () => {
      const proto = makeProto({
        name: 'Multi',
        dirName: 'Multi',
        hideFlows: false,
        flows: [
          { key: 'Multi/one', name: 'one', route: '/Multi?flow=one', meta: { title: 'Flow One' } },
          { key: 'Multi/two', name: 'two', route: '/Multi?flow=two', meta: null },
        ],
      })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)

      // Click to expand
      const button = screen.getByText('Multi').closest('button')
      fireEvent.click(button)

      // Flows should be visible
      expect(screen.getByText('Flow One')).toBeInTheDocument()
      expect(screen.getByText('Two')).toBeInTheDocument() // formatName('two')
    })

    it('persists expanded state to localStorage', () => {
      const proto = makeProto({
        name: 'Multi',
        dirName: 'Multi',
        hideFlows: false,
        flows: [
          { key: 'Multi/one', name: 'one', route: '/Multi', meta: null },
        ],
      })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)

      fireEvent.click(screen.getByText('Multi').closest('button'))

      expect(setLocal).toHaveBeenCalledWith(
        'viewfinder.expanded',
        expect.stringContaining('"Multi":true'),
      )
    })
  })

  describe('author display', () => {
    it('renders author avatars', () => {
      const proto = makeProto({ name: 'Authored', author: ['dfosco', 'octocat'] })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)
      const avatars = screen.getAllByRole('img')
      expect(avatars).toHaveLength(2)
      expect(avatars[0]).toHaveAttribute('src', 'https://github.com/dfosco.png?size=48')
      expect(avatars[1]).toHaveAttribute('src', 'https://github.com/octocat.png?size=48')
    })

    it('falls back to gitAuthor when no author', () => {
      const proto = makeProto({ name: 'Git Only', gitAuthor: 'Jane Doe' })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/" />)
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })

  describe('folder grouping', () => {
    it('renders folders with expand/collapse', () => {
      const folder = {
        name: 'Design System',
        dirName: 'design-system',
        description: 'DS prototypes',
        icon: null,
        prototypes: [makeProto({ name: 'Buttons', dirName: 'Buttons' })],
        canvases: [],
      }
      setIndex({ folders: [folder] })
      render(<Viewfinder basePath="/" />)

      // Folder header visible
      expect(screen.getByText('Design System')).toBeInTheDocument()
      expect(screen.getByText('DS prototypes')).toBeInTheDocument()

      // Prototype NOT visible before expand
      expect(screen.queryByText('Buttons')).not.toBeInTheDocument()

      // Click to expand
      fireEvent.click(screen.getByText('Design System').closest('button'))
      expect(screen.getByText('Buttons')).toBeInTheDocument()
    })

    it('persists folder expanded state with folder: prefix', () => {
      const folder = {
        name: 'Folder',
        dirName: 'my-folder',
        description: null,
        icon: null,
        prototypes: [makeProto({ name: 'Inside' })],
        canvases: [],
      }
      setIndex({ folders: [folder] })
      render(<Viewfinder basePath="/" />)
      fireEvent.click(screen.getByText('Folder').closest('button'))

      expect(setLocal).toHaveBeenCalledWith(
        'viewfinder.expanded',
        expect.stringContaining('"folder:my-folder":true'),
      )
    })
  })

  describe('view mode toggle', () => {
    it('defaults to prototypes view', () => {
      setIndex({ prototypes: [makeProto()] })
      render(<Viewfinder basePath="/" />)
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument()
    })

    it('switches to canvas view and persists', () => {
      setIndex({
        prototypes: [makeProto()],
        canvases: [makeCanvas()],
      })
      render(<Viewfinder basePath="/" />)

      fireEvent.click(screen.getByText('Canvas'))

      // Canvas warning should appear
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByText('My Canvas')).toBeInTheDocument()

      expect(setLocal).toHaveBeenCalledWith('viewfinder.viewMode', 'canvases')
    })

    it('reads persisted view mode from localStorage', () => {
      setLocal('viewfinder.viewMode', 'canvases')
      setIndex({ canvases: [makeCanvas()] })
      render(<Viewfinder basePath="/" />)
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })
  })

  describe('canvas view', () => {
    it('renders canvas entries as links', () => {
      setLocal('viewfinder.viewMode', 'canvases')
      setIndex({ canvases: [makeCanvas({ name: 'Design Board', route: '/canvas/design' })] })
      render(<Viewfinder basePath="/app/" />)
      const link = screen.getByText('Design Board').closest('a')
      expect(link).toHaveAttribute('href', '/app/canvas/design')
    })
  })

  describe('branch switching', () => {
    it('renders branch dropdown when __SB_BRANCHES__ is set', () => {
      window.__SB_BRANCHES__ = [
        { branch: 'main', folder: 'storyboard/' },
        { branch: 'feature', folder: 'branch--feature/' },
      ]
      setIndex({ prototypes: [makeProto()] })
      render(<Viewfinder basePath="/storyboard/" />)
      expect(screen.getByLabelText('Switch branch')).toBeInTheDocument()
    })

    it('does not render branch dropdown without __SB_BRANCHES__', () => {
      setIndex({ prototypes: [makeProto()] })
      render(<Viewfinder basePath="/" />)
      expect(screen.queryByLabelText('Switch branch')).not.toBeInTheDocument()
    })

    it('shows current branch from basePath', () => {
      window.__SB_BRANCHES__ = [
        { branch: 'main', folder: 'storyboard/' },
        { branch: 'my-feature', folder: 'branch--my-feature/' },
      ]
      setIndex({ prototypes: [makeProto()] })
      render(<Viewfinder basePath="/branch--my-feature/" />)
      // The current branch is shown as disabled option text
      const select = screen.getByLabelText('Switch branch')
      expect(select.querySelector('option[disabled]').textContent).toBe('my-feature')
    })
  })

  describe('other flows', () => {
    it('renders global flows as "Other flows" group', () => {
      setIndex({
        prototypes: [makeProto()],
        globalFlows: [
          { key: 'global-one', name: 'global-one', route: '/?flow=global-one', meta: null },
        ],
      })
      render(<Viewfinder basePath="/" />)
      expect(screen.getByText('Other flows')).toBeInTheDocument()
    })

    it('hides default flow when hideDefaultFlow is true', () => {
      setIndex({
        prototypes: [makeProto()],
        globalFlows: [
          { key: 'default', name: 'default', route: '/', meta: null },
          { key: 'other', name: 'other', route: '/?flow=other', meta: null },
        ],
      })
      render(<Viewfinder basePath="/" hideDefaultFlow />)
      // Should still show "Other flows" (for the 'other' flow), but 'default' should be filtered
      const otherFlows = screen.getByText('Other flows')
      expect(otherFlows).toBeInTheDocument()
    })
  })

  describe('basePath handling', () => {
    it('prepends basePath to prototype routes', () => {
      const proto = makeProto({ name: 'Test', dirName: 'Test' })
      setIndex({ prototypes: [proto] })
      render(<Viewfinder basePath="/branch--feat/" />)
      const link = screen.getByText('Test').closest('a')
      expect(link).toHaveAttribute('href', '/branch--feat/Test')
    })
  })
})
