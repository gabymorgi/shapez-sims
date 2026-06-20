import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { createShapeProduct } from './utils.ts'
import { cutShape } from './Cutter.ts'
import { swapShapes } from './Swapper'
import type { ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'

type NonNullableResult = [ShapeProduct, ShapeProduct]

describe('swapShapes', () => {
  it('swap some simple shapes', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('CrSbWgRy')),
      createShapeProduct(codeToShape('WgRyCrSb')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('CrSbCrSb')
    expect(shapeToCode(right.shape)).toBe('WgRyWgRy')
  })

  it('swap multiple layered shapes', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('CrSbWgRy:--WyCc--:RuCmWySw')),
      createShapeProduct(codeToShape('P-RuSbP-:CuCuCuCu:WbWgWr--')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('CrSbSbP-:--WyCuCu:RuCmWr--')
    expect(shapeToCode(right.shape)).toBe('P-RuWgRy:CuCuCc--:WbWgWySw')
  })

  it('swap shapes with empty left layers', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('CrSbWgRy:--P-----:RuCm----')),
      createShapeProduct(codeToShape('WgRyCrSb:------P-:----RuCm')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('CrSbCrSb:--P---P-:RuCmRuCm')
    expect(shapeToCode(right.shape)).toBe('WgRyWgRy')
  })

  it('swap shapes with empty left shape', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('CrSb----')),
      createShapeProduct(codeToShape('----CrSb')),
    ])

    const [left, right] = result as [ShapeProduct, ShapeProduct]

    expect(shapeToCode(left.shape)).toBe('CrSbCrSb')
    expect(right).toBe(undefined)
  })

  it('swap shapes with both empty shape', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('cbcrcbcy')),
      createShapeProduct(codeToShape('cmcccycy')),
    ])

    const [left, right] = result

    expect(left).toBe(undefined)
    expect(right).toBe(undefined)
  })

  it('swap shapes with drop', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('Cr--WgRy:--CmRwSb')),
      createShapeProduct(codeToShape('WgRyCr--:RwSb--Cm')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('CrCmCrCm')
    expect(shapeToCode(right.shape)).toBe('WgRyWgRy:RwSbRwSb')
  })

  it('keeps crystal intact if dont cut through', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('crcbWrRc')),
      createShapeProduct(codeToShape('WrRccrcb')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('crcbcrcb')
    expect(shapeToCode(right.shape)).toBe('WrRcWrRc')
  })

  it('breaks crystals if cut through', () => {
    const result = swapShapes([
      createShapeProduct(codeToShape('RccrcbWr')),
      createShapeProduct(codeToShape('cbWrRccr')),
    ])

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('Rc--Rc--')
    expect(shapeToCode(right.shape)).toBe('--Wr--Wr')
  })

  it('breaks crystals if cut through and those touching affected crystals', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cgcbRuRu:RucrcrRu')),
    )

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('----RuRu:------Ru')
    expect(shapeToCode(right.shape)).toBe('Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, keep the rest', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('RucbRucg:RucrcrRu')),
    )

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('----Rucg:------Ru')
    expect(shapeToCode(right.shape)).toBe('Ru------:Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, cascade effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbRucgRu:crcrRuRu:RucbcbRu')),
    )

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('----cgRu:----RuRu:------Ru')
    expect(shapeToCode(right.shape)).toBe('RuRu----')
  })

  it('broken through, drop effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbcbRucb:RuRuRuRu:cbcbRuRu')),
    )

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('----Ru--:----RuRu:----RuRu')
    expect(shapeToCode(right.shape)).toBe('RuRu----')
  })

  it('broken through, no drop effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbRuRucb:RuRuRuRu:cbcbRuRu')),
    )

    const [left, right] = result as NonNullableResult

    expect(shapeToCode(left.shape)).toBe('----Ru--:----RuRu:----RuRu')
    expect(shapeToCode(right.shape)).toBe('--Ru----:RuRu----:cbcb----')
  })
})