import { describe, expect, it } from 'vitest'
import { codeToShape } from '../Shape.ts'
import { createShapeProduct } from '../simulator/utils.ts'
import { ShapeEdge } from './SimulatorEdge.ts'

describe('SimulatorEdge', () => {
  it('accepts products matching the edge type', () => {
    const edge = new ShapeEdge('source', 'target')
    const shapeProduct = createShapeProduct(codeToShape('CrRgSbWm'))

    expect(edge.putProduct(shapeProduct)).toBe(true)
    expect(edge.hasProduct).toBe(true)
  })

  it('rejects inserting a second shape while occupied', () => {
    const edge = new ShapeEdge('source', 'target')
    const firstShape = createShapeProduct(codeToShape('CrRgSbWm'))
    const secondShape = createShapeProduct(codeToShape('CrRgSbWm'))

    expect(edge.putProduct(firstShape)).toBe(true)
    expect(edge.putProduct(secondShape)).toBe(false)
  })
})
