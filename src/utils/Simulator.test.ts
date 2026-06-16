import { describe, expect, it } from 'vitest'
import { Belt, Painter, Rotation, Rotator, SimulatorEdge, SimulatorNode, Stacker } from './Simulator.ts'
import { codeToShape, shapeToCode } from './Shape.ts'
import { createColorProduct, createShapeProduct } from './simulator/productHelpers.ts'

describe('Belt', () => {
	it('processes inputs and outputs in insertion order', () => {
		const beltNode = new SimulatorNode({ id: 'belt', simulator: new Belt() })
		const inA = new SimulatorEdge('inA', 'belt')
		const inB = new SimulatorEdge('inB', 'belt')
		const outA = new SimulatorEdge('belt', 'outA')
		const outB = new SimulatorEdge('belt', 'outB')

		beltNode.attachInputEdge(inA)
		beltNode.attachInputEdge(inB)
		beltNode.attachOutputEdge(outA)
		beltNode.attachOutputEdge(outB)

		inA.putProduct(createShapeProduct(codeToShape('CrRgSbWm')))
		inB.putProduct(createShapeProduct(codeToShape('WuCgSyRb')))

		beltNode.simulate()
		const firstOutput = outA.peekProduct()
		expect(firstOutput?.type).toBe('shape')
		if (firstOutput?.type === 'shape') {
			expect(shapeToCode(firstOutput.shape)).toBe('CrRgSbWm')
		}

		outA.takeProduct()
		beltNode.simulate()
		const secondOutput = outB.peekProduct()
		expect(secondOutput?.type).toBe('shape')
		if (secondOutput?.type === 'shape') {
			expect(shapeToCode(secondOutput.shape)).toBe('WuCgSyRb')
		}
	})
})

describe('Rotator', () => {
	it('rotates a shape clockwise', () => {
		const node = new SimulatorNode({ id: 'rotator', simulator: new Rotator(120, Rotation.Clockwise) })
		node.enqueueExternalInput(createShapeProduct(codeToShape('CrRgSbWm')))

		node.simulate()
		const outputs = node.drainTickOutputs()

		expect(outputs).toHaveLength(1)
		const output = outputs[0]
		expect(output.type).toBe('shape')
		if (output.type === 'shape') {
			expect(shapeToCode(output.shape)).toBe('WmCrRgSb')
		}
	})
})

describe('Stacker', () => {
	it('consumes two shape inputs and emits a stacked shape', () => {
		const node = new SimulatorNode({ id: 'stacker', simulator: new Stacker() })
		const inA = new SimulatorEdge('a', 'stacker')
		const inB = new SimulatorEdge('b', 'stacker')
		node.attachInputEdge(inA)
		node.attachInputEdge(inB)

		inA.putProduct(createShapeProduct(codeToShape('CrRgSbWm')))
		inB.putProduct(createShapeProduct(codeToShape('WuCgSyRb')))

		node.simulate()
		const outputs = node.drainTickOutputs()

		expect(outputs).toHaveLength(1)
		const output = outputs[0]
		expect(output.type).toBe('shape')
		if (output.type === 'shape') {
			expect(shapeToCode(output.shape)).toBe('CrRgSbWm:WuCgSyRb')
		}
	})
})

describe('Painter', () => {
	it('consumes shape and color amount to emit painted shape', () => {
		const node = new SimulatorNode({ id: 'painter', simulator: new Painter(300) })
		node.enqueueExternalInput(createShapeProduct(codeToShape('CrRgSbWm')))
		node.enqueueExternalInput(createColorProduct('g', 300))

		node.simulate()
		const outputs = node.drainTickOutputs()

		expect(outputs).toHaveLength(1)
		const output = outputs[0]
		expect(output.type).toBe('shape')
		if (output.type === 'shape') {
			expect(shapeToCode(output.shape)).toBe('CgRgSgWg')
		}
	})
})