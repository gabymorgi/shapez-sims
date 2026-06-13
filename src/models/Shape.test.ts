import { describe, expect, it } from 'vitest'
import { Layer, Quarter, Rotation, Shape } from './Shape'

describe('Shape parsing and serialization', () => {
  it('round-trips a single layer with mixed tokens', () => {
    const code = 'CrP---Wc'

    const shape = Shape.fromCode(code)

    expect(shape.toString()).toBe(code)
  })

  it('round-trips multiple layers', () => {
    const code = 'CrRgSbWm:WuCgSyRb'

    const shape = Shape.fromCode(code)

    expect(shape.layers).toHaveLength(2)
    expect(shape.toString()).toBe(code)
  })

  it('throws for invalid layer token', () => {
    expect(() => Shape.fromCode('CrRzSbWm')).toThrowError(/Invalid layer code/)
  })

  it('throws for too many layers', () => {
    const tooManyLayers = 'CrRgSbWm:CrRgSbWm:CrRgSbWm:CrRgSbWm:CrRgSbWm'

    expect(() => Shape.fromCode(tooManyLayers)).toThrowError(/Invalid shape code/)
  })
})

describe('Layer', () => {
  it('throws if constructed with not exactly four quarters', () => {
    const q = new Quarter('C', 'r')

    expect(() => new Layer([q, q, q])).toThrowError(/exactly 4 quarters/)
  })
})

describe('Cloning', () => {
  it('clones a quarter without sharing reference', () => {
    const quarter = new Quarter('c', 'g')

    const clonedQuarter = quarter.clone()

    expect(clonedQuarter).not.toBe(quarter)
    expect(clonedQuarter.toToken()).toBe(quarter.toToken())
  })

  it('clones a layer without sharing quarter references', () => {
    const layer = Layer.fromCode('CrP---Wc')

    const clonedLayer = layer.clone()

    expect(clonedLayer).not.toBe(layer)
    expect(clonedLayer.toCode()).toBe(layer.toCode())
    for (let i = 0; i < layer.quarters.length; i += 1) {
      expect(clonedLayer.quarters[i]).not.toBe(layer.quarters[i])
    }
  })

  it('clones a shape without sharing layer or quarter references', () => {
    const shape = Shape.fromCode('CrRgSbWm:WuCgSyRb')

    const clonedShape = shape.clone()

    expect(clonedShape).not.toBe(shape)
    expect(clonedShape.toString()).toBe(shape.toString())

    for (let i = 0; i < shape.layers.length; i += 1) {
      expect(clonedShape.layers[i]).not.toBe(shape.layers[i])

      for (let j = 0; j < shape.layers[i].quarters.length; j += 1) {
        expect(clonedShape.layers[i].quarters[j]).not.toBe(shape.layers[i].quarters[j])
      }
    }
  })
})

describe('Rotation', () => {
  it('rotates a single layer clockwise', () => {
    const shape = Shape.fromCode('CrRgSbWm')

    const rotatedShape = shape.rotate(Rotation.Clockwise)

    expect(rotatedShape.toString()).toBe('WmCrRgSb')
    expect(rotatedShape).not.toBe(shape)
    expect(rotatedShape.layers[0]).not.toBe(shape.layers[0])
  })

  it('rotates a single layer anticlockwise', () => {
    const shape = Shape.fromCode('CrRgSbWm')

    const rotatedShape = shape.rotate(Rotation.Anticlockwise)

    expect(rotatedShape.toString()).toBe('RgSbWmCr')
  })

  it('rotates all layers by a half turn', () => {
    const shape = Shape.fromCode('CrRgSbWm:WuCgSyRb')

    const rotatedShape = shape.rotate(Rotation.HalfTurn)

    expect(rotatedShape.toString()).toBe('SbWmCrRg:SyRbWuCg')
  })
})
