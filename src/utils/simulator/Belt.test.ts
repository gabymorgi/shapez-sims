import { describe, expect, it } from 'vitest'
import { codeToShape, shapeToCode } from '../Shape.ts'
import { Belt } from './Belt.ts'
import { createShapeProduct } from './utils.ts'
import { ColorEdge, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'

describe('Belt', () => {
  it('accepts shape edges and rejects color edges', () => {
    const belt = new Belt({ id: 'belt' })

    const shapeInput = new ShapeEdge('source-shape', belt.id)
    const shapeOutput = new ShapeEdge(belt.id, 'target-shape')
    belt.attachInputEdge(shapeInput)
    belt.attachOutputEdge(shapeOutput)

    expect(belt.inputEdges).toEqual([shapeInput])
    expect(belt.outputEdges).toEqual([shapeOutput])

    expect(() => belt.attachInputEdge(new ColorEdge('source-color', belt.id))).toThrow(
      `Node ${belt.id} cannot accept color input at index 1.`
    )
    expect(() => belt.attachOutputEdge(new ColorEdge(belt.id, 'target-color'))).toThrow(
      `Node ${belt.id} cannot accept color output at index 1.`
    )
  })

  it('takes product from an input and pushes it to an output', () => {
    const belt = new Belt({ id: 'belt' })
    const input = new ShapeEdge('source-1', belt.id)
    const output = new ShapeEdge(belt.id, 'target-1')

    belt.attachInputEdge(input)
    belt.attachOutputEdge(output)

    input.putProduct(createShapeProduct(codeToShape('CrSbWgRy')))
    belt.simulate()

    const moved = output.takeProduct()
    expect(moved).not.toBeNull()
    expect(shapeToCode(moved!.shape)).toBe('CrSbWgRy')
    expect(input.peekProduct()).toBeNull()
    expect(output.peekProduct()).toBeNull()
  })

  it('round-robins across input and output edges', () => {
    const belt = new Belt({ id: 'belt' })
    const inputA = new ShapeEdge('source-a', belt.id)
    const inputB = new ShapeEdge('source-b', belt.id)
    const outputA = new ShapeEdge(belt.id, 'target-a')
    const outputB = new ShapeEdge(belt.id, 'target-b')

    belt.attachInputEdge(inputA)
    belt.attachInputEdge(inputB)
    belt.attachOutputEdge(outputA)
    belt.attachOutputEdge(outputB)

    inputA.putProduct(createShapeProduct(codeToShape('Cr------')))
    inputB.putProduct(createShapeProduct(codeToShape('----WgRy')))

    belt.simulate()
    const firstOut = outputA.takeProduct()
    expect(firstOut).not.toBeNull()
    expect(shapeToCode(firstOut!.shape)).toBe('Cr------')

    belt.simulate()
    const secondOut = outputB.takeProduct()
    expect(secondOut).not.toBeNull()
    expect(shapeToCode(secondOut!.shape)).toBe('----WgRy')
  })

  it('keeps buffered product when outputs are full and pushes once one is cleared', () => {
    const belt = new Belt({ id: 'belt' })
    const input = new ShapeEdge('source', belt.id)
    const output = new ShapeEdge(belt.id, 'target')

    belt.attachInputEdge(input)
    belt.attachOutputEdge(output)

    output.putProduct(createShapeProduct(codeToShape('WgRyCrSb')))
    input.putProduct(createShapeProduct(codeToShape('CrSbWgRy')))

    belt.simulate()

    const blocked = output.peekProduct()
    expect(blocked).not.toBeNull()
    expect(shapeToCode(blocked!.shape)).toBe('WgRyCrSb')
    expect(input.peekProduct()).toBeNull()

    output.takeProduct()
    belt.simulate()

    const released = output.takeProduct()
    expect(released).not.toBeNull()
    expect(shapeToCode(released!.shape)).toBe('CrSbWgRy')
  })

  it('detaches edges and only removes matching direction', () => {
    const belt = new Belt({ id: 'belt' })
    const keepInput = new ShapeEdge('keep-input', belt.id)
    const removeInput = new ShapeEdge('remove-input', belt.id)
    const keepOutput = new ShapeEdge(belt.id, 'keep-output')
    const removeOutput = new ShapeEdge(belt.id, 'remove-output')

    belt.attachInputEdge(keepInput)
    belt.attachInputEdge(removeInput)
    belt.attachOutputEdge(keepOutput)
    belt.attachOutputEdge(removeOutput)

    belt.detachInputEdge('remove-input')
    belt.detachOutputEdge('remove-output')

    expect(belt.inputEdges).toEqual([keepInput])
    expect(belt.outputEdges).toEqual([keepOutput])

    belt.detachInputEdge('does-not-exist')
    belt.detachOutputEdge('does-not-exist')

    expect(belt.inputEdges).toEqual([keepInput])
    expect(belt.outputEdges).toEqual([keepOutput])
  })
})