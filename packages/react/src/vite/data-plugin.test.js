import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import storyboardDataPlugin from './data-plugin.js'

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

  it('duplicate objects show globally-scoped hint', () => {
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
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/Duplicate object "user"/)
    expect(() => plugin.load(RESOLVED_ID)).toThrow(/globally scoped/)
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

  it('does NOT prefix objects inside src/prototypes/{Name}/', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'Dashboard'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'Dashboard', 'helpers.object.json'),
      JSON.stringify({ util: true }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    // Object should be plain "helpers", NOT "Dashboard/helpers"
    expect(code).toContain('"helpers"')
    expect(code).not.toContain('"Dashboard/helpers"')
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

  it('does NOT prefix objects inside .folder/ directories', () => {
    mkdirSync(path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Proto'), { recursive: true })
    writeFileSync(
      path.join(tmpDir, 'src', 'prototypes', 'X.folder', 'Proto', 'helpers.object.json'),
      JSON.stringify({ util: true }),
    )

    const plugin = createPlugin()
    const code = plugin.load(RESOLVED_ID)

    expect(code).toContain('"helpers"')
    expect(code).not.toContain('"X/helpers"')
    expect(code).not.toContain('"Proto/helpers"')
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
