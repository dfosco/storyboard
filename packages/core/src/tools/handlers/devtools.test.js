import { handler as createDevtoolsHandler } from './devtools.js'

function getProdModeItem(children) {
  return children.find(item => item.id === 'core/prod-mode')
}

function getCanvasHmrItem(children) {
  return children.find(item => item.id === 'core/canvas-hmr')
}

describe('devtools production mode toggle', () => {
  const originalLocalDev = window.__SB_LOCAL_DEV__

  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    delete window.__SB_LOCAL_DEV__
  })

  afterAll(() => {
    if (typeof originalLocalDev === 'undefined') delete window.__SB_LOCAL_DEV__
    else window.__SB_LOCAL_DEV__ = originalLocalDev
  })

  it('shows the toggle in local dev', async () => {
    window.__SB_LOCAL_DEV__ = true

    const devtools = await createDevtoolsHandler({})
    const prodModeItem = getProdModeItem(devtools.getChildren())

    expect(prodModeItem).toBeTruthy()
    expect(prodModeItem.active).toBe(false)
  })

  it('shows the toggle as active in local-dev prodMode simulation', async () => {
    window.__SB_LOCAL_DEV__ = true
    window.history.replaceState({}, '', '/?prodMode')

    const devtools = await createDevtoolsHandler({})
    const prodModeItem = getProdModeItem(devtools.getChildren())

    expect(prodModeItem).toBeTruthy()
    expect(prodModeItem.active).toBe(true)
  })

  it('hides the toggle in true production mode', async () => {
    window.__SB_LOCAL_DEV__ = false

    const devtools = await createDevtoolsHandler({})
    const prodModeItem = getProdModeItem(devtools.getChildren())

    expect(prodModeItem).toBeUndefined()
  })
})

describe('devtools canvas HMR toggle', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('shows the toggle as inactive by default', async () => {
    const devtools = await createDevtoolsHandler({})
    const item = getCanvasHmrItem(devtools.getChildren())

    expect(item).toBeTruthy()
    expect(item.type).toBe('toggle')
    expect(item.active).toBe(false)
  })

  it('shows the toggle as active when ?canvas-hmr is present', async () => {
    window.history.replaceState({}, '', '/?canvas-hmr')

    const devtools = await createDevtoolsHandler({})
    const item = getCanvasHmrItem(devtools.getChildren())

    expect(item.active).toBe(true)
  })
})
