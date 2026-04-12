import { handler as createDevtoolsHandler } from './devtools.js'

function getProdModeItem(children) {
  return children.find(item => item.id === 'core/prod-mode')
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
