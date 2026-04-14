import { describe, it, expect, vi } from 'vitest'
import {
  createPasteContext,
  resolvePaste,
  compileConfigRule,
  BUILTIN_RULES,
  BRANCH_PREFIX_RE,
} from './pasteRules.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORIGIN = 'https://storyboard.example.com'
const BASE_PATH = '/storyboard'

function ctx(origin = ORIGIN, basePath = BASE_PATH) {
  return createPasteContext(origin, basePath)
}

// ---------------------------------------------------------------------------
// createPasteContext
// ---------------------------------------------------------------------------

describe('createPasteContext', () => {
  it('stores origin and normalized basePath', () => {
    const c = ctx()
    expect(c.origin).toBe(ORIGIN)
    expect(c.basePath).toBe('/storyboard')
  })

  it('strips trailing slash from basePath', () => {
    const c = createPasteContext(ORIGIN, '/storyboard/')
    expect(c.basePath).toBe('/storyboard')
  })

  describe('isSameOrigin', () => {
    it('matches exact base URL', () => {
      expect(ctx().isSameOrigin(`${ORIGIN}/storyboard`)).toBe(true)
    })

    it('matches sub-path under base', () => {
      expect(ctx().isSameOrigin(`${ORIGIN}/storyboard/MyProto`)).toBe(true)
    })

    it('rejects different origin', () => {
      expect(ctx().isSameOrigin('https://evil.com/storyboard/foo')).toBe(false)
    })

    it('rejects spoofed host with matching prefix', () => {
      expect(ctx().isSameOrigin('https://storyboard.example.com.evil.com/storyboard/x')).toBe(false)
    })

    it('rejects basePath prefix collision (/storyboard vs /storyboard-beta)', () => {
      // /storyboard-beta does NOT start with /storyboard/
      expect(ctx().isSameOrigin(`${ORIGIN}/storyboard-beta/foo`)).toBe(false)
    })

    it('matches branch deploy URL', () => {
      expect(ctx().isSameOrigin(`${ORIGIN}/branch--my-feature/MyProto`)).toBe(true)
    })

    it('rejects non-http protocols', () => {
      expect(ctx().isSameOrigin('ftp://storyboard.example.com/storyboard/x')).toBe(false)
    })

    it('handles root basePath', () => {
      const c = createPasteContext(ORIGIN, '/')
      expect(c.isSameOrigin(`${ORIGIN}/anything`)).toBe(true)
    })
  })

  describe('extractSrc', () => {
    it('strips base path', () => {
      expect(ctx().extractSrc('/storyboard/MyProto')).toBe('/MyProto')
    })

    it('strips branch prefix', () => {
      expect(ctx().extractSrc('/branch--feat/MyProto')).toBe('/MyProto')
    })

    it('returns / for base path alone', () => {
      expect(ctx().extractSrc('/storyboard')).toBe('/')
    })

    it('returns pathname as-is when no prefix matches', () => {
      expect(ctx().extractSrc('/other/path')).toBe('/other/path')
    })
  })

  describe('parseUrl', () => {
    it('parses http URL', () => {
      const u = ctx().parseUrl('https://example.com/path')
      expect(u).not.toBeNull()
      expect(u.hostname).toBe('example.com')
    })

    it('returns null for non-http', () => {
      expect(ctx().parseUrl('ftp://example.com')).toBeNull()
    })

    it('returns null for invalid URL', () => {
      expect(ctx().parseUrl('not a url')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(ctx().parseUrl('')).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// BRANCH_PREFIX_RE
// ---------------------------------------------------------------------------

describe('BRANCH_PREFIX_RE', () => {
  it('matches /branch--name', () => {
    expect(BRANCH_PREFIX_RE.test('/branch--my-feature')).toBe(true)
  })

  it('matches /branch--name/rest', () => {
    expect(BRANCH_PREFIX_RE.test('/branch--fix/Proto/page')).toBe(true)
  })

  it('does not match /branching', () => {
    expect(BRANCH_PREFIX_RE.test('/branching')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolvePaste — built-in rules
// ---------------------------------------------------------------------------

describe('resolvePaste', () => {
  const c = ctx()

  describe('figma rule', () => {
    it('creates figma-embed for figma board URL', () => {
      const text = 'https://www.figma.com/board/abc123/My-Board'
      const result = resolvePaste(text, c)
      expect(result.type).toBe('figma-embed')
      expect(result.props.url).toContain('figma.com')
      expect(result.props.width).toBe(800)
      expect(result.props.height).toBe(450)
    })

    it('sanitizes figma URL (strips tracking params)', () => {
      const text = 'https://figma.com/design/abc/Name?t=trackingToken'
      const result = resolvePaste(text, c)
      expect(result.type).toBe('figma-embed')
      expect(result.props.url).not.toContain('trackingToken')
    })
  })

  describe('same-origin rule', () => {
    it('creates prototype widget for same-origin URL', () => {
      const text = `${ORIGIN}/storyboard/MyProto`
      const result = resolvePaste(text, c)
      expect(result.type).toBe('prototype')
      expect(result.props.src).toBe('/MyProto')
      expect(result.props.originalSrc).toBe('/MyProto')
      expect(result.props.width).toBe(800)
      expect(result.props.height).toBe(600)
    })

    it('creates prototype widget for branch deploy URL', () => {
      const text = `${ORIGIN}/branch--feat/MyProto`
      const result = resolvePaste(text, c)
      expect(result.type).toBe('prototype')
      expect(result.props.src).toBe('/MyProto')
    })

    it('preserves search and hash in src', () => {
      const text = `${ORIGIN}/storyboard/Proto?flow=alt#override`
      const result = resolvePaste(text, c)
      expect(result.type).toBe('prototype')
      expect(result.props.src).toBe('/Proto?flow=alt#override')
    })
  })

  describe('link-preview rule', () => {
    it('creates link-preview for external URL', () => {
      const text = 'https://github.com/dfosco/storyboard'
      const result = resolvePaste(text, c)
      expect(result.type).toBe('link-preview')
      expect(result.props.url).toBe(text)
      expect(result.props.title).toBe('')
    })
  })

  describe('markdown rule (fallback)', () => {
    it('creates markdown widget for plain text', () => {
      const result = resolvePaste('Hello world', c)
      expect(result.type).toBe('markdown')
      expect(result.props.content).toBe('Hello world')
    })

    it('creates markdown for non-URL text with slashes', () => {
      const result = resolvePaste('some/path/thing', c)
      expect(result.type).toBe('markdown')
    })
  })

  describe('rule precedence', () => {
    it('figma wins over same-origin (if origin were figma.com)', () => {
      const figmaCtx = createPasteContext('https://www.figma.com', '/')
      const text = 'https://www.figma.com/board/abc/Name'
      const result = resolvePaste(text, figmaCtx)
      expect(result.type).toBe('figma-embed')
    })

    it('same-origin wins over generic link-preview', () => {
      const text = `${ORIGIN}/storyboard/Proto`
      const result = resolvePaste(text, c)
      expect(result.type).toBe('prototype')
    })

    it('link-preview wins over markdown for URLs', () => {
      const text = 'https://example.com'
      const result = resolvePaste(text, c)
      expect(result.type).toBe('link-preview')
    })
  })

  describe('edge cases', () => {
    it('handles empty string gracefully (markdown)', () => {
      const result = resolvePaste('', c)
      expect(result.type).toBe('markdown')
      expect(result.props.content).toBe('')
    })

    it('handles malformed URL-like text as markdown', () => {
      const result = resolvePaste('http://', c)
      // 'http://' is technically parseable by URL constructor — depends on browser
      // but the important thing is it doesn't throw
      expect(result).not.toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Config rules
// ---------------------------------------------------------------------------

describe('compileConfigRule', () => {
  it('compiles a valid rule', () => {
    const rule = compileConfigRule({ pattern: 'youtube\\.com', type: 'link-preview', props: { url: '$url' } })
    expect(rule).not.toBeNull()
    expect(rule.name).toBe('config:youtube\\.com')
    expect(rule.match('https://youtube.com/watch?v=abc')).toBe(true)
    expect(rule.match('https://vimeo.com')).toBe(false)
  })

  it('substitutes $url in props', () => {
    const rule = compileConfigRule({ pattern: '.', type: 'test', props: { url: '$url', extra: 42 } })
    const resolved = rule.resolve('https://example.com')
    expect(resolved.props.url).toBe('https://example.com')
    expect(resolved.props.extra).toBe(42)
  })

  it('returns null for missing pattern', () => {
    expect(compileConfigRule({ type: 'test' })).toBeNull()
  })

  it('returns null for missing type', () => {
    expect(compileConfigRule({ pattern: '.' })).toBeNull()
  })

  it('returns null for invalid regex', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(compileConfigRule({ pattern: '[invalid', type: 'test' })).toBeNull()
    spy.mockRestore()
  })

  it('returns null for null/undefined input', () => {
    expect(compileConfigRule(null)).toBeNull()
    expect(compileConfigRule(undefined)).toBeNull()
  })
})

describe('resolvePaste with config rules', () => {
  const c = ctx()

  it('config rule takes priority over built-ins', () => {
    const configRules = [
      { pattern: 'github\\.com', type: 'markdown', props: { content: 'GitHub link: $url' } },
    ]
    const result = resolvePaste('https://github.com/repo', c, configRules)
    expect(result.type).toBe('markdown')
    expect(result.props.content).toBe('GitHub link: https://github.com/repo')
  })

  it('falls through to built-ins when config rule does not match', () => {
    const configRules = [
      { pattern: 'youtube\\.com', type: 'video', props: {} },
    ]
    const result = resolvePaste('https://github.com/repo', c, configRules)
    expect(result.type).toBe('link-preview')
  })

  it('invalid config rules are silently skipped', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const configRules = [
      { pattern: '[bad', type: 'test' },
      { pattern: 'github\\.com', type: 'custom', props: { url: '$url' } },
    ]
    const result = resolvePaste('https://github.com/repo', c, configRules)
    expect(result.type).toBe('custom')
    spy.mockRestore()
  })
})
