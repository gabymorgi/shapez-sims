import { describe, expect, it } from 'vitest'
import { cloneShape, codeToShape, shapeToCode } from './Shape'

describe('Shape parsing and serialization', () => {
  it('round-trips a single layer with mixed tokens', () => {
    const code = 'CrP---Wc'

    const shape = codeToShape(code)

    expect(shapeToCode(shape)).toBe(code)
  })

  it('round-trips multiple layers', () => {
    const code = 'CrRgSbWm:WuCgSyRb'

    const shape = codeToShape(code)

    expect(shape.layers).toHaveLength(2)
    expect(shapeToCode(shape)).toBe(code)
  })

  it('throws for invalid layer token', () => {
    expect(() => codeToShape('CrRzSbWm')).toThrow(/Invalid layer code/)
  })
})

describe('Cloning', () => {
  it('clones a shape without sharing layer or quarter references', () => {
    const shape = codeToShape('CrRgSbWm:WuCgSyRb')

    const clonedShape = cloneShape(shape)

    expect(clonedShape).not.toBe(shape)
    expect(shapeToCode(clonedShape)).toBe(shapeToCode(shape))

    for (let i = 0; i < shape.layers.length; i += 1) {
      expect(clonedShape.layers[i]).not.toBe(shape.layers[i])

      for (let j = 0; j < shape.layers[i].quarters.length; j += 1) {
        expect(clonedShape.layers[i].quarters[j]).not.toBe(shape.layers[i].quarters[j])
      }
    }
  })
})
