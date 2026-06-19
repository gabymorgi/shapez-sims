import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { createShapeProduct } from './utils.ts'
import { rotateShapeProduct, Rotation } from './Rotator.ts'

describe('rotateShapes', () => {
  it('rotate clockwise', () => {
    const result = rotateShapeProduct(
      createShapeProduct(codeToShape('CrSgRbWw')),
      Rotation.Clockwise
    )

    expect(shapeToCode(result.shape)).toBe('WwCrSgRb')
  })

  it('rotates with empty quarters', () => {
    const result = rotateShapeProduct(
      createShapeProduct(codeToShape('WbSy----:--WcCr--')),
      Rotation.Clockwise
    )

    expect(shapeToCode(result.shape)).toBe('--WbSy--:----WcCr')
  })

  it('rotate with pin and cristals', () => {
    const result = rotateShapeProduct(
      createShapeProduct(codeToShape('Cucmcm--:P-P-Sw--:RmCb----')),
      Rotation.Clockwise
    )


    expect(shapeToCode(result.shape)).toBe('--Cucmcm:--P-P-Sw:--RmCb--')
  })

  it('rotate anticlockwise', () => {
    const result = rotateShapeProduct(
      createShapeProduct(codeToShape('CrSgRbWw')),
      Rotation.Anticlockwise
    )

    expect(shapeToCode(result.shape)).toBe('SgRbWwCr')
  })

  it('rotate 180 degrees', () => {
    const result = rotateShapeProduct(
      createShapeProduct(codeToShape('CrSgRbWw')),
      Rotation.HalfTurn
    )

    expect(shapeToCode(result.shape)).toBe('RbWwCrSg')
  })
})