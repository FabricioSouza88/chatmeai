import { getInitials } from '@/utils/initials'

describe('getInitials', () => {
  it('returns first and last initials for two-word name', () => {
    expect(getInitials('Fabricio Souza')).toBe('FS')
  })

  it('returns first and last initials for multi-word name', () => {
    expect(getInitials('Rayanne Lorrayne dos Santos')).toBe('RS')
  })

  it('returns single letter for one-word name', () => {
    expect(getInitials('João')).toBe('J')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles extra whitespace', () => {
    expect(getInitials('  Ana   Lima  ')).toBe('AL')
  })
})
