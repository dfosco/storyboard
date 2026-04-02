import { describe, expect, it } from 'vitest'
import { getEmbedChromeVars } from './PrototypeEmbed.jsx'

describe('getEmbedChromeVars', () => {
  it('follows toolbar theme variants for embed edit chrome', () => {
    expect(getEmbedChromeVars('light')['--bgColor-default']).toBe('#ffffff')
    expect(getEmbedChromeVars('dark')['--bgColor-default']).toBe('#161b22')
    expect(getEmbedChromeVars('dark_dimmed')['--bgColor-default']).toBe('#22272e')
  })
})
