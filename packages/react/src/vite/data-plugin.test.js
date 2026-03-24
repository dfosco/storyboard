import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import storyboardDataPlugin, { resolveTemplateVars, computeTemplateVars } from './data-plugin.js'

const RESOLVED_ID = '\0virtual:storyboard-data-index'

let tmpDir

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), 'sb-test-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

function createPlugin(root) {
  const plugin = storyboardDataPlugin()
  plugin.configResolved({ root: root ?? tmpDir })
  return plugin
}

function writeDataFiles(dir) {
  writeFileSync(
    path.join(dir, 'default.scene.json'),
    JSON.stringify({ title: 'Test' }),
  )
  writeFileSync(
    path.join(dir, 'user.object.json'),
    JSON.stringify({ name: 'Jane' }),
  )
  writeFileSync(
    path.join(dir, 'posts.record.json'),
    JSON.stringify([{ id: '1', title: 'First' }]),
  )
}

describe('storyboardDataPlugin', () => {
  it("has name 'storyboard-data'", () => {
    const plugin = storyboardDataPlugin()
    expect(plugin.name).toBe('storyboard-data')
  })

  it("has enforce 'pre'", () => {
    const plugin = storyboardDataPlugin()
    expect(plugin.enforce).toBe('pre')
  })

  it('config() excludes @dfosco/storyboard-react from optimizeDeps', () => {
    const plugin = storyboardDataPlugin()
    const config = plugin.config()
    expect(config.optimizeDeps.exclude).toContain('@dfosco/storyboard-react')
  })

  it("resolveId returns resolved ID for 'virtual:storyboard-data-index'", () => {
    const plugin = createPlugin()
    expect(plugin.resolveId('virtual:storyboard-data-index')).toBe(RESOLVED_ID)
  })

  it('resolveId returns undefined for other IDs', () => {
    const plugin = createPlugin()
    expect(plugin.resolveId('some-other-module')).toBeUndefined()
  })

  it('load generates valid module code with init() call', () => {
    writeDataFiles(tmpDir)
    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain("import { init } from '@dfosco/storyboard-core'")
    expect(code).toContain('init({ flows, objects, records, prototypes, folders })')
    expect(code).toContain('"Test"')
    expect(code).toContain('"Jane"')
    expect(code).toContain('"First"')
    // Backward-compat alias
    expect(code).toContain('const scenes = flows')
    expect(code).toContain('export { flows, scenes, objects, records, prototypes, folders }')
  })

  it('load returns null for other IDs', () => {
    const plugin = createPlugin()
    expect(plugin.load('other-id')).toBeNull()
  })

  it('duplicate data files throw an error', () => {
    writeFileSync(
      path.join(tmpDir, 'dup.scene.json'),
      JSON.stringify({ a: 1 }),
    )
    const subDir = path.join(tmpDir, 'nested')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(
      path.join(subDir, 'dup.scene.json'),
      JSON.stringify({ a: 2 }),
    )

    const plugin = createPlugin()
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Duplicate flow "dup"/)
  })

  it('allows same object name in global and prototype without clash', () => {
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'user.object.json'),
      JSON.stringify({ name: 'Global' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'user.object.json'),
      JSON.stringify({ name: 'Local' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Both should exist without error
    expect(code).toContain('"user"')
    expect(code).toContain('"Dashboard/user"')
    expect(code).toContain('"Global"')
    expect(code).toContain('"Local"')
  })

  it('allows same object name in different prototypes without clash', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'A'), { recursive: true })
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'B'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'A', 'nav.object.json'),
      JSON.stringify({ from: 'A' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'B', 'nav.object.json'),
      JSON.stringify({ from: 'B' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"A/nav"')
    expect(code).toContain('"B/nav"')
  })

  it('handles JSONC files (with comments)', () => {
    writeFileSync(
      path.join(tmpDir, 'commented.scene.jsonc'),
      '{\n  // This is a comment\n  "title": "JSONC Scene"\n}\n',
    )
    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"JSONC Scene"')
  })

  it('normalizes .scene files into flow category in the index', () => {
    writeFileSync(
      path.join(tmpDir, 'legacy.scene.json'),
      JSON.stringify({ title: 'Legacy Scene' }),
    )
    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // .scene.json files should be normalized to the flows category
    expect(code).toContain('"Legacy Scene"')
    expect(code).toContain('init({ flows, objects, records, prototypes, folders })')
  })

  it('buildStart resets the index cache', () => {
    writeDataFiles(tmpDir)
    const plugin = createPlugin()

    // First load builds the index
    const code1 = plugin.load(RESOLVED_ID)
    expect(code1).toContain('"Test"')

    // Add a new file
    writeFileSync(
      path.join(tmpDir, 'extra.scene.json'),
      JSON.stringify({ title: 'Extra' }),
    )

    // Without buildStart, cached index is used — "Extra" won't appear
    const code2 = plugin.load(RESOLVED_ID)
    expect(code2).not.toContain('"Extra"')

    // After buildStart, index is rebuilt
    plugin.buildStart()
    const code3 = plugin.load(RESOLVED_ID)
    expect(code3).toContain('"Extra"')
  })
})

describe('prototype scoping', () => {
  it('prefixes flows inside src/prototypes/{Name}/ with the prototype name', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'default.flow.json'),
      JSON.stringify({ title: 'Dashboard Default' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'signup.flow.json'),
      JSON.stringify({ title: 'Dashboard Signup' }),
    )
    // Global flow in src/data/
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'default.flow.json'),
      JSON.stringify({ title: 'Global Default' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Dashboard/default"')
    expect(code).toContain('"Dashboard/signup"')
    expect(code).toContain('"default"')
    expect(code).toContain('"Dashboard Default"')
    expect(code).toContain('"Global Default"')
  })

  it('prefixes records inside src/prototypes/{Name}/ with the prototype name', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Blog'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Blog', 'posts.record.json'),
      JSON.stringify([{ id: '1', title: 'Scoped Post' }]),
    )
    // Global record
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'posts.record.json'),
      JSON.stringify([{ id: '1', title: 'Global Post' }]),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Blog/posts"')
    expect(code).toContain('"posts"')
    expect(code).toContain('"Scoped Post"')
    expect(code).toContain('"Global Post"')
  })

  it('prefixes objects inside src/prototypes/{Name}/', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'helpers.object.json'),
      JSON.stringify({ util: true }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Object should be scoped as "Dashboard/helpers"
    expect(code).toContain('"Dashboard/helpers"')
  })

  it('allows same flow name in different prototypes without clash', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'A'), { recursive: true })
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'B'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'A', 'default.flow.json'),
      JSON.stringify({ from: 'A' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'B', 'default.flow.json'),
      JSON.stringify({ from: 'B' }),
    )

    const plugin = createPlugin()
    // Should not throw (no duplicate)
    const code = plugin.load(RESOLVED_ID)
    expect(code).toContain('"A/default"')
    expect(code).toContain('"B/default"')
  })

  it('normalizes .scene.json inside prototypes to scoped flow', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Legacy'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Legacy', 'old.scene.json'),
      JSON.stringify({ compat: true }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Should be indexed as a scoped flow, not a scene
    expect(code).toContain('"Legacy/old"')
    expect(code).toContain('flows')
  })
})

describe('flow route inference', () => {
  it('injects _route for flows inside src/prototypes/', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'default.flow.json'),
      JSON.stringify({ title: 'Dashboard Flow' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"_route":"/Dashboard"')
  })

  it('injects _route for flows inside .folder/ directories', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'MyFolder.folder', 'Example'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'MyFolder.folder', 'Example', 'basic.flow.json'),
      JSON.stringify({ title: 'Example Flow' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // .folder/ should be stripped from the inferred route
    expect(code).toContain('"_route":"/Example"')
    expect(code).not.toContain('MyFolder')
  })

  it('injects _route with nested path for deeply placed flows', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'App', 'settings'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'App', 'settings', 'prefs.flow.json'),
      JSON.stringify({ title: 'Settings Prefs' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"_route":"/App/settings"')
  })

  it('does NOT inject _route for global flows outside src/prototypes/', () => {
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'global.flow.json'),
      JSON.stringify({ title: 'Global Flow' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).not.toContain('"_route"')
  })

  it('does NOT inject _route when flow has explicit route field', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'custom.flow.json'),
      JSON.stringify({ route: '/custom-page', title: 'Custom Route' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Should have the explicit route but NOT _route
    expect(code).toContain('"route":"/custom-page"')
    expect(code).not.toContain('"_route"')
  })

  it('logs info when multiple flows share the same route', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'happy.flow.json'),
      JSON.stringify({ title: 'Happy Path' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'error.flow.json'),
      JSON.stringify({ title: 'Error State' }),
    )

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const plugin = createPlugin()
    plugin.load(RESOLVED_ID)

    const routeLog = logSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('Route "/Dashboard" has 2 flows')
    )
    expect(routeLog).toBeTruthy()
    logSpy.mockRestore()
  })

  it('warns when multiple flows on same route have meta.default: true', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'a.flow.json'),
      JSON.stringify({ meta: { default: true }, title: 'A' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'b.flow.json'),
      JSON.stringify({ meta: { default: true }, title: 'B' }),
    )

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plugin = createPlugin()
    plugin.load(RESOLVED_ID)

    const warnCall = warnSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('meta.default: true')
    )
    expect(warnCall).toBeTruthy()
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

describe('folder grouping', () => {
  it('discovers .folder.json files and keys them by folder directory name', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Getting Started.folder'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Getting Started.folder', 'getting-started.folder.json'),
      JSON.stringify({ meta: { title: 'Getting Started', description: 'Intro' } }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Getting Started"')
    expect(code).toContain('"Intro"')
    expect(code).toContain('folders')
  })

  it('scopes prototypes inside .folder/ directories correctly', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'MyFolder.folder', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'MyFolder.folder', 'Dashboard', 'default.flow.json'),
      JSON.stringify({ title: 'Dashboard Default' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'MyFolder.folder', 'Dashboard', 'dashboard.prototype.json'),
      JSON.stringify({ meta: { title: 'Dashboard' } }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Flow should be scoped to prototype, not folder
    expect(code).toContain('"Dashboard/default"')
    expect(code).not.toContain('"MyFolder.folder/default"')
    expect(code).not.toContain('"MyFolder/default"')
    // Prototype should have folder field injected
    expect(code).toContain('"folder":"MyFolder"')
  })

  it('scopes objects inside .folder/ directories to their prototype', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Proto'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Proto', 'helpers.object.json'),
      JSON.stringify({ util: true }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Object should be scoped to prototype, not folder
    expect(code).toContain('"Proto/helpers"')
    expect(code).not.toContain('"X/helpers"')
  })

  it('scopes records inside .folder/ directories to their prototype', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Blog'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Blog', 'posts.record.json'),
      JSON.stringify([{ id: '1', title: 'Post' }]),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Blog/posts"')
    expect(code).not.toContain('"X/posts"')
  })

  it('allows prototypes with same name in different folders without clash', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'A.folder', 'Settings'), { recursive: true })
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'B.folder', 'Settings'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'A.folder', 'Settings', 'default.flow.json'),
      JSON.stringify({ from: 'A' }),
    )
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'B.folder', 'Settings', 'default.flow.json'),
      JSON.stringify({ from: 'B' }),
    )

    const plugin = createPlugin()
    // Same flow name in same prototype name → duplicate collision
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Duplicate flow "Settings\/default"/)
  })

  it('throws on nested .folder/ directories', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Outer.folder', 'Inner.folder', 'Proto'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Outer.folder', 'Inner.folder', 'Proto', 'default.flow.json'),
      JSON.stringify({ title: 'Nested' }),
    )

    const plugin = createPlugin()
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Nested .folder directories are not supported/)
  })

  it('throws on empty nested .folder/ directories', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Outer.folder', 'Inner.folder'), { recursive: true })

    const plugin = createPlugin()
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Nested .folder directories are not supported/)
  })
})

describe('underscore prefix ignoring', () => {
  it('ignores _-prefixed data files', () => {
    writeFileSync(
      path.join(tmpDir, '_draft.flow.json'),
      JSON.stringify({ title: 'Draft' }),
    )
    writeFileSync(
      path.join(tmpDir, 'visible.flow.json'),
      JSON.stringify({ title: 'Visible' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Visible"')
    expect(code).not.toContain('"Draft"')
  })

  it('ignores data files inside _-prefixed directories', () => {
    mkdirSync(path.join(tmpDir, '_archive'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, '_archive', 'old.flow.json'),
      JSON.stringify({ title: 'Archived' }),
    )
    writeFileSync(
      path.join(tmpDir, 'current.flow.json'),
      JSON.stringify({ title: 'Current' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Current"')
    expect(code).not.toContain('"Archived"')
  })

  it('ignores prototype.json inside _-prefixed directories', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', '_WIP'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', '_WIP', 'wip.prototype.json'),
      JSON.stringify({ meta: { title: 'Work in Progress' } }),
    )
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Live'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Live', 'live.prototype.json'),
      JSON.stringify({ meta: { title: 'Live' } }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Live"')
    expect(code).not.toContain('"Work in Progress"')
  })

  it('does not ignore files with _ in the middle of the name', () => {
    writeFileSync(
      path.join(tmpDir, 'my_flow.flow.json'),
      JSON.stringify({ title: 'Has Underscore' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"Has Underscore"')
  })
})

describe('resolveTemplateVars', () => {
  it('replaces variables in a simple string', () => {
    const result = resolveTemplateVars('/${currentDir}/page', { currentDir: 'src/data' })
    expect(result).toBe('/src/data/page')
  })

  it('replaces multiple variables in one string', () => {
    const result = resolveTemplateVars('${currentProto} in ${currentProtoDir}', {
      currentProto: 'src/prototypes/main.folder/Example',
      currentProtoDir: 'src/prototypes/main.folder',
    })
    expect(result).toBe('src/prototypes/main.folder/Example in src/prototypes/main.folder')
  })

  it('replaces variables in nested objects', () => {
    const input = {
      nav: { url: '/${currentDir}/page', label: 'Go' },
      meta: { proto: '${currentProto}' },
    }
    const vars = { currentDir: 'src/data', currentProto: 'src/prototypes/App' }
    const result = resolveTemplateVars(input, vars)

    expect(result.nav.url).toBe('/src/data/page')
    expect(result.nav.label).toBe('Go')
    expect(result.meta.proto).toBe('src/prototypes/App')
  })

  it('replaces variables in arrays', () => {
    const input = ['/${currentDir}/a', '/${currentDir}/b']
    const result = resolveTemplateVars(input, { currentDir: 'here' })
    expect(result).toEqual(['/here/a', '/here/b'])
  })

  it('replaces variables in deeply nested structures', () => {
    const input = {
      items: [
        { links: [{ url: '/${currentDir}/x' }] },
      ],
    }
    const result = resolveTemplateVars(input, { currentDir: 'deep' })
    expect(result.items[0].links[0].url).toBe('/deep/x')
  })

  it('does not modify non-string values', () => {
    const input = { count: 42, active: true, empty: null }
    const result = resolveTemplateVars(input, { currentDir: 'test' })
    expect(result).toEqual({ count: 42, active: true, empty: null })
  })

  it('returns input unchanged when no variables match', () => {
    const input = { url: '/static/path', name: 'no vars here' }
    const result = resolveTemplateVars(input, { currentDir: 'test' })
    expect(result).toEqual(input)
  })

  it('leaves unknown variable patterns as-is', () => {
    const result = resolveTemplateVars('${unknownVar}/path', { currentDir: 'test' })
    expect(result).toBe('${unknownVar}/path')
  })

  it('does not mutate the original object', () => {
    const input = { url: '/${currentDir}/page' }
    const original = JSON.parse(JSON.stringify(input))
    resolveTemplateVars(input, { currentDir: 'test' })
    expect(input).toEqual(original)
  })

  it('handles empty vars object', () => {
    const input = { url: '/${currentDir}/page' }
    const result = resolveTemplateVars(input, {})
    expect(result.url).toBe('/${currentDir}/page')
  })

  it('handles multiple occurrences of the same variable', () => {
    const result = resolveTemplateVars('${currentDir}/${currentDir}', { currentDir: 'x' })
    expect(result).toBe('x/x')
  })
})

describe('computeTemplateVars', () => {
  it('computes currentDir for a file in src/data/', () => {
    const root = '/project'
    const absPath = '/project/src/data/nav.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('src/data')
    expect(vars.currentProto).toBe('')
    expect(vars.currentProtoDir).toBe('')
  })

  it('computes all three vars for a file in a prototype inside a folder', () => {
    const root = '/project'
    const absPath = '/project/src/prototypes/main.folder/Example/sidenav.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('src/prototypes/main.folder/Example')
    expect(vars.currentProto).toBe('src/prototypes/main.folder/Example')
    expect(vars.currentProtoDir).toBe('src/prototypes/main.folder')
  })

  it('computes vars for a file in a subdirectory of a prototype', () => {
    const root = '/project'
    const absPath = '/project/src/prototypes/main.folder/Example/data/deep.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('src/prototypes/main.folder/Example/data')
    expect(vars.currentProto).toBe('src/prototypes/main.folder/Example')
    expect(vars.currentProtoDir).toBe('src/prototypes/main.folder')
  })

  it('computes vars for a file in a prototype without a folder', () => {
    const root = '/project'
    const absPath = '/project/src/prototypes/Dashboard/nav.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('src/prototypes/Dashboard')
    expect(vars.currentProto).toBe('src/prototypes/Dashboard')
    expect(vars.currentProtoDir).toBe('')
  })

  it('computes vars for a root-level file', () => {
    const root = '/project'
    const absPath = '/project/config.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('.')
    expect(vars.currentProto).toBe('')
    expect(vars.currentProtoDir).toBe('')
  })

  it('returns empty currentProto for a file directly inside a .folder (not in a prototype)', () => {
    const root = '/project'
    const absPath = '/project/src/prototypes/main.folder/nav.object.json'
    const vars = computeTemplateVars(absPath, root)

    expect(vars.currentDir).toBe('src/prototypes/main.folder')
    expect(vars.currentProto).toBe('')
    expect(vars.currentProtoDir).toBe('src/prototypes/main.folder')
  })
})

describe('template variable integration', () => {
  it('resolves ${currentDir} in object files', () => {
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'nav.object.json'),
      JSON.stringify({ url: '/${currentDir}/page' }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('/src/data/page')
    expect(code).not.toContain('${currentDir}')
  })

  it('resolves ${currentProto} and ${currentProtoDir} in prototype files', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'App.folder', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'App.folder', 'Dashboard', 'nav.object.json'),
      JSON.stringify({
        proto: '${currentProto}',
        folder: '${currentProtoDir}',
        dir: '${currentDir}',
      }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('src/prototypes/App.folder/Dashboard')
    expect(code).toContain('src/prototypes/App.folder')
    expect(code).not.toContain('${currentProto}')
    expect(code).not.toContain('${currentProtoDir}')
    expect(code).not.toContain('${currentDir}')
  })

  it('resolves variables in flow files', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Example.folder', 'Demo'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Example.folder', 'Demo', 'default.flow.json'),
      JSON.stringify({
        nav: [{ label: 'Home', url: '/${currentDir}' }],
      }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('/src/prototypes/Example.folder/Demo')
    expect(code).not.toContain('${currentDir}')
  })

  it('resolves variables in record files', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Blog'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Blog', 'posts.record.json'),
      JSON.stringify([
        { id: '1', link: '/${currentProto}/post/1' },
      ]),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('/src/prototypes/Blog/post/1')
    expect(code).not.toContain('${currentProto}')
  })

  it('warns when ${currentProto} is used outside a prototype', () => {
    mkdirSync(path.join(tmpDir, 'src', 'data'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'data', 'nav.object.json'),
      JSON.stringify({ url: '/${currentProto}/page' }),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plugin = createPlugin()
    plugin.load(RESOLVED_ID)

    const warnCall = warnSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('${currentProto}')
    )
    expect(warnCall).toBeTruthy()
    warnSpy.mockRestore()
  })

  it('warns when ${currentProtoDir} is used outside a .folder', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'nav.object.json'),
      JSON.stringify({ folder: '${currentProtoDir}' }),
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plugin = createPlugin()
    plugin.load(RESOLVED_ID)

    const warnCall = warnSpy.mock.calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('${currentProtoDir}')
    )
    expect(warnCall).toBeTruthy()
    warnSpy.mockRestore()
  })
})
