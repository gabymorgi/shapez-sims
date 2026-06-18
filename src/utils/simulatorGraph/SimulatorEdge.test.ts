import { describe, expect, it } from 'vitest'
import { codeToShape } from '../Shape.ts'
import { createColorProduct, createShapeProduct } from '../simulator/productHelpers.ts'
import { SimulatorEdge } from './SimulatorEdge.ts'

describe('SimulatorEdge', () => {
  it('accepts products matching the edge type', () => {
    const edge = new SimulatorEdge('source', 'target', 'shape')
    const shapeProduct = createShapeProduct(codeToShape('CrRgSbWm'))

    expect(edge.putProduct(shapeProduct)).toBe(true)
    expect(edge.peekProduct()?.type).toBe('shape')
  })

  it('rejects products mismatching the edge type', () => {
    const edge = new SimulatorEdge('source', 'target', 'shape')
    const colorProduct = createColorProduct('r', 300)

    expect(edge.putProduct(colorProduct)).toBe(false)
    expect(edge.hasProduct).toBe(false)
  })
})
