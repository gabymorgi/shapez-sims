import { describe, expect, it } from 'vitest'
import { Rotator } from './Simulator'
import { codeToShape, shapeToCode } from './Shape'

// describe('Simulator', () => {
//   it('stores speed and runs operation over inputs', () => {
//     const simulator = new Rotator(60, 'clockwise')
//     const input = codeToShape('CrRgSbWm')

//     const output = simulator.simulate([input])

//     expect(simulator.speed).toBe(60)
//     expect(output).toHaveLength(1)
//     expect(shapeToCode(output[0])).toBe('WmCrRgSb')
//   })
// })