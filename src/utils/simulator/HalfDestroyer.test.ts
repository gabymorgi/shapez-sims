import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { createShapeProduct } from './utils.ts'
import { destroyHalfShape } from './HalfDestroyer.ts'
import type { ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'

describe('destroyHalfShape', () => {
  it('cuts a simple shape', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('CrSbWgRy')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('CrSb----')
  })

  it('cuts multiple layered shape', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('CrSbWgRy:--WyCc--:RuCmWySw')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('CrSb----:--Wy----:RuCm----')
  })

  it('cuts shape with empty left layers', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('CrSbWgRy:--P-----:RuCm----')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('CrSb----:--P-----:RuCm----')
  })

  it('cut shape with empty output', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('cgcrcbcy')),
    )

    expect(result).toBe(undefined)
  })

  it('cuts shape with drop', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('Cr--WgRy:--CmRwSb')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('CrCm----')
  })

  it('keeps crystal intact if dont cut through', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('crcbWrRc')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('crcb----')
  })

  it('breaks crystals if cut through', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('RccrcbWr')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('Rc------')
  })

  it('breaks crystals if cut through and those touching affected crystals', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('cgcbRuRu:RucrcrRu')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, keep the rest', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('RucbRucg:RucrcrRu')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('Ru------:Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, cascade effect', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('cbRucgRu:crcrRuRu:RucbcbRu')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('RuRu----')
  })

  it('broken through, drop effect', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('cbcbRucb:RuRuRuRu:cbcbRuRu')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('RuRu----')
  })

  it('broken through, no drop effect', () => {
    const result = destroyHalfShape(
      createShapeProduct(codeToShape('cbRuRucb:RuRuRuRu:cbcbRuRu')),
    ) as ShapeProduct

    expect(shapeToCode(result.shape)).toBe('--Ru----:RuRu----:cbcb----')
  })
})