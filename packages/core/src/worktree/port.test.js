import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, realpathSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// We test the pure functions by importing and overriding cwd
import { portsFilePath, getPort, resolvePort, slugify } from './port.js'

describe('slugify', () => {
  it('lowercases and replaces dots with hyphens', () => {
    expect(slugify('v3.11.0')).toBe('v3-11-0')
  })

  it('replaces underscores and spaces', () => {
    expect(slugify('my_cool.feature')).toBe('my-cool-feature')
  })

  it('lowercases', () => {
    expect(slugify('UPPER.Case')).toBe('upper-case')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('a..b__c')).toBe('a-b-c')
  })

  it('trims hyphens per segment', () => {
    expect(slugify('.leading')).toBe('leading')
  })

  it('preserves slashes', () => {
    expect(slugify('feat/my.branch')).toBe('feat/my-branch')
  })
})

describe('portsFilePath', () => {
  let tempRoot

  beforeEach(() => {
    tempRoot = realpathSync(mkdtempSync(join(tmpdir(), 'sb-port-test-')))
  })

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true })
  })

  it('returns root .worktrees/ports.json from repo root', () => {
    const result = portsFilePath(tempRoot)
    expect(result).toBe(join(tempRoot, '.worktrees', 'ports.json'))
  })

  it('returns shared ports.json from inside a worktree dir', () => {
    // Simulate .worktrees/my-branch/
    const worktreeDir = join(tempRoot, '.worktrees', 'my-branch')
    mkdirSync(worktreeDir, { recursive: true })
    const result = portsFilePath(worktreeDir)
    expect(result).toBe(join(tempRoot, '.worktrees', 'ports.json'))
  })

  it('returns shared ports.json from worktree even when ports.json does not exist', () => {
    // This is the key bug fix — first run from a worktree with no ports.json
    const worktreeDir = join(tempRoot, '.worktrees', 'first-run')
    mkdirSync(worktreeDir, { recursive: true })
    const result = portsFilePath(worktreeDir)
    // Must point to root, NOT to .worktrees/first-run/.worktrees/ports.json
    expect(result).toBe(join(tempRoot, '.worktrees', 'ports.json'))
    expect(result).not.toContain('first-run/.worktrees')
  })
})

describe('getPort / resolvePort', () => {
  let tempRoot
  let originalCwd

  beforeEach(() => {
    tempRoot = realpathSync(mkdtempSync(join(tmpdir(), 'sb-port-test-')))
    mkdirSync(join(tempRoot, '.worktrees'), { recursive: true })
    originalCwd = process.cwd()
    process.chdir(tempRoot)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(tempRoot, { recursive: true, force: true })
  })

  it('returns 1234 for main', () => {
    expect(getPort('main')).toBe(1234)
  })

  it('assigns 1235 to the first worktree', () => {
    const port = getPort('my-feature')
    expect(port).toBe(1235)
  })

  it('assigns sequential ports to multiple worktrees', () => {
    getPort('branch-a')
    const portB = getPort('branch-b')
    expect(portB).toBe(1236)
  })

  it('returns the same port on subsequent calls', () => {
    const first = getPort('stable-branch')
    const second = getPort('stable-branch')
    expect(first).toBe(second)
  })

  it('persists to ports.json', () => {
    getPort('persisted')
    const portsFile = join(tempRoot, '.worktrees', 'ports.json')
    expect(existsSync(portsFile)).toBe(true)
    const data = JSON.parse(readFileSync(portsFile, 'utf8'))
    expect(data.persisted).toBe(1235)
    expect(data.main).toBe(1234)
  })

  it('resolvePort returns fallback when no ports.json exists', () => {
    expect(resolvePort('unknown')).toBe(1234)
  })

  it('resolvePort returns assigned port', () => {
    getPort('known')
    expect(resolvePort('known')).toBe(1235)
  })

  it('handles corrupted ports.json gracefully', () => {
    const portsFile = join(tempRoot, '.worktrees', 'ports.json')
    writeFileSync(portsFile, 'not valid json')
    // Should not throw — starts fresh
    const port = getPort('recovery')
    expect(port).toBe(1235)
  })
})
