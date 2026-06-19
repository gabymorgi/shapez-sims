import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { stackShapes } from './Stacker.ts'
import { createShapeProduct } from './utils.ts'

describe('stackShapes', () => {
  it('drops a single unsupported quarter by one layer until stable', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('Cr------')),
      createShapeProduct(codeToShape('--Cg----')),
    )

    expect(shapeToCode(result.shape)).toBe('CrCg----')
  })

  it('drops an unsupported consecutive group together', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('Cr------')),
      createShapeProduct(codeToShape('--CgCb--')),
    )

    expect(shapeToCode(result.shape)).toBe('CrCgCb--')
  })

  it('keeps a consecutive group in place when any quarter is supported', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('--Rg----')),
      createShapeProduct(codeToShape('--CgCb--')),
    )

    expect(shapeToCode(result.shape)).toBe('--Rg----:--CgCb--')
  })

  it('does not connect pins to neighboring quarters when deciding drops', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('--RgP---')),
      createShapeProduct(codeToShape('CrP-Wb--')),
    )

    expect(shapeToCode(result.shape)).toBe('CrRgP---:--P-Wb--')
  })

  it('does not breaks crystals on bottom', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('cbcg----')),
      createShapeProduct(codeToShape('CrWbSw--')),
    )

    expect(shapeToCode(result.shape)).toBe('cbcg----:CrWbSw--')
  })

  it('breaks crystals on top', () => {
    const result = stackShapes(
      createShapeProduct(codeToShape('cbcg----')),
      createShapeProduct(codeToShape('Rrcbcw--')),
    )

    expect(shapeToCode(result.shape)).toBe('cbcg----:Rr------')
  })
})