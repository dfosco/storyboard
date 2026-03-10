import { init } from './loader.js'
import { hash, resolveFlowRoute, getFlowMeta, resolveSceneRoute, getSceneMeta } from './viewfinder.js'

const makeIndex = () => ({
  flows: {
    default: { title: 'Default Scene' },
    Dashboard: { heading: 'Dashboard' },
    'custom-route': { route: 'Overview', title: 'Custom' },
    'absolute-route': { route: '/Forms', title: 'Absolute' },
    'no-route': { title: 'No route key' },
    'meta-route': { flowMeta: { route: 'Repositories' }, title: 'Meta Route' },
    'meta-author': { flowMeta: { author: 'dfosco' }, title: 'With Author' },
    'meta-authors': { flowMeta: { author: ['dfosco', 'heyamie', 'branonconor'] }, title: 'Multi Author' },
    'meta-both': { flowMeta: { route: '/Overview', author: 'octocat' }, title: 'Both' },
  },
  objects: {},
  records: {},
})

beforeEach(() => {
  init(makeIndex())
})

describe('hash', () => {
  it('returns a number', () => {
    expect(typeof hash('test')).toBe('number')
  })

  it('is deterministic', () => {
    expect(hash('hello')).toBe(hash('hello'))
  })

  it('produces different values for different strings', () => {
    expect(hash('foo')).not.toBe(hash('bar'))
  })

  it('returns non-negative values', () => {
    expect(hash('abc')).toBeGreaterThanOrEqual(0)
    expect(hash('')).toBeGreaterThanOrEqual(0)
    expect(hash('a very long string with lots of characters')).toBeGreaterThanOrEqual(0)
  })
})

describe('resolveFlowRoute', () => {
  const routes = ['Dashboard', 'Overview', 'Forms', 'Repositories']

  it('matches flow name to route (exact case)', () => {
    expect(resolveFlowRoute('Dashboard', routes)).toBe('/Dashboard')
  })

  it('matches flow name to route (case-insensitive)', () => {
    expect(resolveFlowRoute('dashboard', routes)).toBe('/Dashboard')
  })

  it('uses route key from flow data when no route matches', () => {
    expect(resolveFlowRoute('custom-route', routes)).toBe('/Overview?scene=custom-route')
  })

  it('handles absolute route key (with leading slash)', () => {
    expect(resolveFlowRoute('absolute-route', routes)).toBe('/Forms?scene=absolute-route')
  })

  it('falls back to root when no match and no route key', () => {
    expect(resolveFlowRoute('no-route', routes)).toBe('/?scene=no-route')
  })

  it('falls back to root for default flow', () => {
    expect(resolveFlowRoute('default', routes)).toBe('/?scene=default')
  })

  it('falls back to root when flow does not exist', () => {
    expect(resolveFlowRoute('nonexistent', routes)).toBe('/?scene=nonexistent')
  })

  it('works with empty routes array', () => {
    expect(resolveFlowRoute('Dashboard', [])).toBe('/?scene=Dashboard')
  })

  it('works with no routes argument', () => {
    expect(resolveFlowRoute('custom-route')).toBe('/Overview?scene=custom-route')
  })

  it('encodes special characters in flow name', () => {
    init({
      flows: { 'has spaces': { title: 'Spaces' } },
      objects: {},
      records: {},
    })
    expect(resolveFlowRoute('has spaces', [])).toBe('/?scene=has%20spaces')
  })

  it('uses flowMeta.route when no route matches', () => {
    expect(resolveFlowRoute('meta-route', routes)).toBe('/Repositories?scene=meta-route')
  })

  it('uses flowMeta.route with absolute path', () => {
    expect(resolveFlowRoute('meta-both', routes)).toBe('/Overview?scene=meta-both')
  })

  it('prefers flowMeta.route over top-level route key', () => {
    init({
      flows: { conflict: { route: 'Forms', flowMeta: { route: 'Dashboard' } } },
      objects: {},
      records: {},
    })
    expect(resolveFlowRoute('conflict', [])).toBe('/Dashboard?scene=conflict')
  })
})

describe('getFlowMeta', () => {
  it('returns flowMeta when present', () => {
    expect(getFlowMeta('meta-author')).toEqual({ author: 'dfosco' })
  })

  it('returns flowMeta with both fields', () => {
    expect(getFlowMeta('meta-both')).toEqual({ route: '/Overview', author: 'octocat' })
  })

  it('returns flowMeta with array author', () => {
    expect(getFlowMeta('meta-authors')).toEqual({ author: ['dfosco', 'heyamie', 'branonconor'] })
  })

  it('returns null when no flowMeta', () => {
    expect(getFlowMeta('default')).toBeNull()
  })

  it('returns null for nonexistent flow', () => {
    expect(getFlowMeta('nonexistent')).toBeNull()
  })
})

// ── Deprecated aliases ──

describe('resolveSceneRoute (deprecated alias)', () => {
  it('is the same function as resolveFlowRoute', () => {
    expect(resolveSceneRoute).toBe(resolveFlowRoute)
  })

  it('resolves a flow route', () => {
    expect(resolveSceneRoute('Dashboard', ['Dashboard'])).toBe('/Dashboard')
  })
})

describe('getSceneMeta (deprecated alias)', () => {
  it('is the same function as getFlowMeta', () => {
    expect(getSceneMeta).toBe(getFlowMeta)
  })

  it('returns flow meta', () => {
    expect(getSceneMeta('meta-author')).toEqual({ author: 'dfosco' })
  })
})
