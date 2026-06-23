import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode, type Shape } from '../Shape.ts'
import { cutShape, destroyHalfShape, rotateShape, Rotation, stackShapes, swapShapes } from './utils.ts'

type NonNullableResult = [Shape, Shape]

describe('shape operations', () => {
  describe('cutShape', () => {
    it('cuts a simple shape', () => {
      const result = cutShape(
        codeToShape('CrSbWgRy'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----WgRy')
      expect(shapeToCode(right)).toBe('CrSb----')
    })

    it('cuts multiple layered shape', () => {
      const result = cutShape(
        codeToShape('CrSbWgRy:--WyCc--:RuCmWySw'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----WgRy:----Cc--:----WySw')
      expect(shapeToCode(right)).toBe('CrSb----:--Wy----:RuCm----')
    })

    it('cuts shape with empty left layers', () => {
      const result = cutShape(
        codeToShape('CrSbWgRy:--P-----:RuCm----'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----WgRy')
      expect(shapeToCode(right)).toBe('CrSb----:--P-----:RuCm----')
    })

    it('cut shape with empty left output', () => {
      const result = cutShape(
        codeToShape('Rccrcb--'),
      )

      const [left, right] = result

      expect(left).toBe(undefined)
      expect(shapeToCode(right!)).toBe('Rc------')
    })

    it('cut shape with both empty outputs', () => {
      const result = cutShape(
        codeToShape('cgcrcbcy'),
      )

      const [left, right] = result

      expect(left).toBe(undefined)
      expect(right).toBe(undefined)
    })

    it('cuts shape with drop', () => {
      const result = cutShape(
        codeToShape('Cr--WgRy:--CmRwSb'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----WgRy:----RwSb')
      expect(shapeToCode(right)).toBe('CrCm----')
    })

    it('keeps crystal intact if dont cut through', () => {
      const result = cutShape(
        codeToShape('crcbWrRc'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----WrRc')
      expect(shapeToCode(right)).toBe('crcb----')
    })

    it('breaks crystals if cut through', () => {
      const result = cutShape(
        codeToShape('RccrcbWr'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('------Wr')
      expect(shapeToCode(right)).toBe('Rc------')
    })

    it('breaks crystals if cut through and those touching affected crystals', () => {
      const result = cutShape(
        codeToShape('cgcbRuRu:RucrcrRu'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----RuRu:------Ru')
      expect(shapeToCode(right)).toBe('Ru------')
    })

    it('breaks crystals if cut through and those touching affected crystals, keep the rest', () => {
      const result = cutShape(
        codeToShape('RucbRucg:RucrcrRu'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----Rucg:------Ru')
      expect(shapeToCode(right)).toBe('Ru------:Ru------')
    })

    it('breaks crystals if cut through and those touching affected crystals, cascade effect', () => {
      const result = cutShape(
        codeToShape('cbRucgRu:crcrRuRu:RucbcbRu'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----cgRu:----RuRu:------Ru')
      expect(shapeToCode(right)).toBe('RuRu----')
    })

    it('broken through, drop effect', () => {
      const result = cutShape(
        codeToShape('cbcbRucb:RuRuRuRu:cbcbRuRu'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----Ru--:----RuRu:----RuRu')
      expect(shapeToCode(right)).toBe('RuRu----')
    })

    it('broken through, no drop effect', () => {
      const result = cutShape(
        codeToShape('cbRuRucb:RuRuRuRu:cbcbRuRu'),
      )

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('----Ru--:----RuRu:----RuRu')
      expect(shapeToCode(right)).toBe('--Ru----:RuRu----:cbcb----')
    })
  })

  describe('destroyHalfShape', () => {
    it('cuts a simple shape', () => {
      const result = destroyHalfShape(
        codeToShape('CrSbWgRy'),
      )

      expect(shapeToCode(result!)).toBe('CrSb----')
    })

    it('cuts multiple layered shape', () => {
      const result = destroyHalfShape(
        codeToShape('CrSbWgRy:--WyCc--:RuCmWySw'),
      )

      expect(shapeToCode(result!)).toBe('CrSb----:--Wy----:RuCm----')
    })

    it('cuts shape with empty left layers', () => {
      const result = destroyHalfShape(
        codeToShape('CrSbWgRy:--P-----:RuCm----'),
      )

      expect(shapeToCode(result!)).toBe('CrSb----:--P-----:RuCm----')
    })

    it('cut shape with empty output', () => {
      const result = destroyHalfShape(
        codeToShape('cgcrcbcy'),
      )

      expect(result!).toBe(undefined)
    })

    it('cuts shape with drop', () => {
      const result = destroyHalfShape(
        codeToShape('Cr--WgRy:--CmRwSb'),
      )

      expect(shapeToCode(result!)).toBe('CrCm----')
    })

    it('keeps crystal intact if dont cut through', () => {
      const result = destroyHalfShape(
        codeToShape('crcbWrRc'),
      )

      expect(shapeToCode(result!)).toBe('crcb----')
    })

    it('breaks crystals if cut through', () => {
      const result = destroyHalfShape(
        codeToShape('RccrcbWr'),
      )

      expect(shapeToCode(result!)).toBe('Rc------')
    })

    it('breaks crystals if cut through and those touching affected crystals', () => {
      const result = destroyHalfShape(
        codeToShape('cgcbRuRu:RucrcrRu'),
      )

      expect(shapeToCode(result!)).toBe('Ru------')
    })

    it('breaks crystals if cut through and those touching affected crystals, keep the rest', () => {
      const result = destroyHalfShape(
        codeToShape('RucbRucg:RucrcrRu'),
      )

      expect(shapeToCode(result!)).toBe('Ru------:Ru------')
    })

    it('breaks crystals if cut through and those touching affected crystals, cascade effect', () => {
      const result = destroyHalfShape(
        codeToShape('cbRucgRu:crcrRuRu:RucbcbRu'),
      )

      expect(shapeToCode(result!)).toBe('RuRu----')
    })

    it('broken through, drop effect', () => {
      const result = destroyHalfShape(
        codeToShape('cbcbRucb:RuRuRuRu:cbcbRuRu'),
      )

      expect(shapeToCode(result!)).toBe('RuRu----')
    })

    it('broken through, no drop effect', () => {
      const result = destroyHalfShape(
        codeToShape('cbRuRucb:RuRuRuRu:cbcbRuRu'),
      )

      expect(shapeToCode(result!)).toBe('--Ru----:RuRu----:cbcb----')
    })
  })

  describe('rotateShapes', () => {
    it('rotate clockwise', () => {
      const result = rotateShape(
        codeToShape('CrSgRbWw'),
        Rotation.Clockwise
      )

      expect(shapeToCode(result)).toBe('WwCrSgRb')
    })

    it('rotates with empty quarters', () => {
      const result = rotateShape(
        codeToShape('WbSy----:--WcCr--'),
        Rotation.Clockwise
      )

      expect(shapeToCode(result)).toBe('--WbSy--:----WcCr')
    })

    it('rotate with pin and cristals', () => {
      const result = rotateShape(
        codeToShape('Cucmcm--:P-P-Sw--:RmCb----'),
        Rotation.Clockwise
      )


      expect(shapeToCode(result)).toBe('--Cucmcm:--P-P-Sw:--RmCb--')
    })

    it('rotate anticlockwise', () => {
      const result = rotateShape(
        codeToShape('CrSgRbWw'),
        Rotation.Anticlockwise
      )

      expect(shapeToCode(result)).toBe('SgRbWwCr')
    })

    it('rotate 180 degrees', () => {
      const result = rotateShape(
        codeToShape('CrSgRbWw'),
        Rotation.HalfTurn
      )

      expect(shapeToCode(result)).toBe('RbWwCrSg')
    })
  })

  describe('stackShapes', () => {
    it('drops a single unsupported quarter by one layer until stable', () => {
      const result = stackShapes(
        codeToShape('Cr------'),
        codeToShape('--Cg----'),
      )

      expect(shapeToCode(result)).toBe('CrCg----')
    })

    it('drops an unsupported consecutive group together', () => {
      const result = stackShapes(
        codeToShape('Cr------'),
        codeToShape('--CgCb--'),
      )

      expect(shapeToCode(result)).toBe('CrCgCb--')
    })

    it('keeps a consecutive group in place when any quarter is supported', () => {
      const result = stackShapes(
        codeToShape('--Rg----'),
        codeToShape('--CgCb--'),
      )

      expect(shapeToCode(result)).toBe('--Rg----:--CgCb--')
    })

    it('does not connect pins to neighboring quarters when deciding drops', () => {
      const result = stackShapes(
        codeToShape('--RgP---'),
        codeToShape('CrP-Wb--'),
      )

      expect(shapeToCode(result)).toBe('CrRgP---:--P-Wb--')
    })

    it('does not breaks crystals on bottom', () => {
      const result = stackShapes(
        codeToShape('cbcg----'),
        codeToShape('CrWbSw--'),
      )

      expect(shapeToCode(result)).toBe('cbcg----:CrWbSw--')
    })

    it('breaks crystals on top', () => {
      const result = stackShapes(
        codeToShape('cbcg----'),
        codeToShape('Rrcbcw--'),
      )

      expect(shapeToCode(result)).toBe('cbcg----:Rr------')
    })
  })

  describe('swapShapes', () => {
    it('swap some simple shapes', () => {
      const result = swapShapes([
        codeToShape('CrSbWgRy'),
        codeToShape('WgRyCrSb'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('CrSbCrSb')
      expect(shapeToCode(right)).toBe('WgRyWgRy')
    })

    it('swap multiple layered shapes', () => {
      const result = swapShapes([
        codeToShape('CrSbWgRy:--WyCc--:RuCmWySw'),
        codeToShape('P-RuSbP-:CuCuCuCu:WbWgWr--'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('CrSbSbP-:--WyCuCu:RuCmWr--')
      expect(shapeToCode(right)).toBe('P-RuWgRy:CuCuCc--:WbWgWySw')
    })

    it('swap shapes with empty left layers', () => {
      const result = swapShapes([
        codeToShape('CrSbWgRy:--P-----:RuCm----'),
        codeToShape('WgRyCrSb:------P-:----RuCm'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('CrSbCrSb:--P---P-:RuCmRuCm')
      expect(shapeToCode(right)).toBe('WgRyWgRy')
    })

    it('swap shapes with empty left shape', () => {
      const result = swapShapes([
        codeToShape('CrSb----'),
        codeToShape('----CrSb'),
      ])

      const [left, right] = result as [Shape, Shape]

      expect(shapeToCode(left)).toBe('CrSbCrSb')
      expect(right).toBe(undefined)
    })

    it('swap shapes with both empty shape', () => {
      const result = swapShapes([
        codeToShape('cbcrcbcy'),
        codeToShape('cmcccycy'),
      ])

      const [left, right] = result

      expect(left).toBe(undefined)
      expect(right).toBe(undefined)
    })

    it('swap shapes with drop', () => {
      const result = swapShapes([
        codeToShape('Cr--WgRy:--CmRwSb'),
        codeToShape('WgRyCr--:RwSb--Cm'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('CrCmCrCm')
      expect(shapeToCode(right)).toBe('WgRyWgRy:RwSbRwSb')
    })

    it('keeps crystal intact if dont cut through', () => {
      const result = swapShapes([
        codeToShape('crcbWrRc'),
        codeToShape('WrRccrcb'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('crcbcrcb')
      expect(shapeToCode(right)).toBe('WrRcWrRc')
    })

    it('breaks crystals if cut through', () => {
      const result = swapShapes([
        codeToShape('RccrcbWr'),
        codeToShape('cbWrRccr'),
      ])

      const [left, right] = result as NonNullableResult

      expect(shapeToCode(left)).toBe('Rc--Rc--')
      expect(shapeToCode(right)).toBe('--Wr--Wr')
    })

    it('create holes below crystals', () => {
      const result = swapShapes([
        codeToShape('cbcbcbRu:----CrCr:----cwcw'),
        codeToShape('Rucbcbcb:CrCr----:cwcw----'),
      ])

      const [left, right] = result as NonNullableResult

      expect(left).toBe(undefined)
      expect(shapeToCode(right)).toBe('Ru----Ru:CrCrCrCr:cwcwcwcw')
    })
  })
})