import { shallowEqual } from '../src/utils'

describe('shallowEqual', () => {
  it('returns true for the same reference', () => {
    const obj = { a: 1 }
    expect(shallowEqual(obj, obj)).toBe(true)
  })

  it('returns true for shallowly equal objects with different references', () => {
    const a = { x: 1, y: 'hi' }
    const b = { x: 1, y: 'hi' }
    expect(shallowEqual(a, b)).toBe(true)
  })

  it('returns false when a value differs', () => {
    const a = { x: 1 }
    const b = { x: 2 }
    expect(shallowEqual(a, b)).toBe(false)
  })

  it('returns false when keys differ', () => {
    const a = { x: 1 }
    const b = { x: 1, y: 2 }
    expect(shallowEqual(a as any, b as any)).toBe(false)
  })

  it('uses Object.is semantics (NaN equals NaN)', () => {
    const a = { x: NaN }
    const b = { x: NaN }
    expect(shallowEqual(a, b)).toBe(true)
  })
})
