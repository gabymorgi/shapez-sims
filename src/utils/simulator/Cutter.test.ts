import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { createShapeProduct } from './utils.ts'
import { cutShape } from './Cutter.ts'

describe('cutShape', () => {
  it('cuts a simple shape', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('CrSbWgRy')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----WgRy')
    expect(shapeToCode(right.shape)).toBe('CrSb----')
  })

  it('cuts multiple layered shape', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('CrSbWgRy:--WyCc--:RuCmWySw')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----WgRy:----Cc--:----WySw')
    expect(shapeToCode(right.shape)).toBe('CrSb----:--Wy----:RuCm----')
  })

  it('cuts shape with empty left layers', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('CrSbWgRy:--P-----:RuCm----')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----WgRy')
    expect(shapeToCode(right.shape)).toBe('CrSb----:--P-----:RuCm----')
  })

  it('cuts shape with drop', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('Cr--WgRy:--CmRwSb')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----WgRy:----RwSb')
    expect(shapeToCode(right.shape)).toBe('CrCm----')
  })

  it('keeps crystal intact if dont cut through', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('crcbWrRc')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----WrRc')
    expect(shapeToCode(right.shape)).toBe('crcb----')
  })

  it('breaks crystals if cut through', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('RccrcbWr')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('------Wr')
    expect(shapeToCode(right.shape)).toBe('Rc------')
  })

  it('breaks crystals if cut through and those touching affected crystals', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cgcbRuRu:RucrcrRu')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----RuRu:------Ru')
    expect(shapeToCode(right.shape)).toBe('Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, keep the rest', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('RucbRucg:RucrcrRu')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----Rucg:------Ru')
    expect(shapeToCode(right.shape)).toBe('Ru------:Ru------')
  })

  it('breaks crystals if cut through and those touching affected crystals, cascade effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbRucgRu:crcrRuRu:RucbcbRu')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----cgRu:----RuRu:------Ru')
    expect(shapeToCode(right.shape)).toBe('RuRu----')
  })

  it('broken through, drop effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbcbRucb:RuRuRuRu:cbcbRuRu')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----Ru--:----RuRu:----RuRu')
    expect(shapeToCode(right.shape)).toBe('RuRu----')
  })

  it('broken through, no drop effect', () => {
    const result = cutShape(
      createShapeProduct(codeToShape('cbRuRucb:RuRuRuRu:cbcbRuRu')),
    )

    const [left, right] = result

    expect(shapeToCode(left.shape)).toBe('----Ru--:----RuRu:----RuRu')
    expect(shapeToCode(right.shape)).toBe('--Ru----:RuRu----:cbcb----')
  })
})