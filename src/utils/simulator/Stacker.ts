import type { Product, ShapeProduct } from '../Simulator.ts'
import { cloneShape } from '../Shape.ts'
import type { NodeSimulator, SimulatorNode } from './SimulatorNode.ts'

function mergeShapes(bottom: ShapeProduct, top: ShapeProduct): ShapeProduct {
  const merged = cloneShape(bottom.shape)
  merged.layers.push(...cloneShape(top.shape).layers)

  return {
    type: 'shape',
    shape: merged,
  }
}

export class Stacker implements NodeSimulator {
  private pendingOutput: ShapeProduct | null = null

  public simulate(node: SimulatorNode): void {
    if (this.pendingOutput) {
      if (node.pushToNextOutput(this.pendingOutput)) {
        this.pendingOutput = null
      }
      return
    }

    if (node.orderedInputEdges().length < 2) {
      return
    }

    const firstEdge = node.orderedInputEdges()[0]
    const secondEdge = node.orderedInputEdges()[1]

    const firstProduct = firstEdge ? node.peekInputProduct(firstEdge) : null
    const secondProduct = secondEdge ? node.peekInputProduct(secondEdge) : null

    if (!firstProduct || !secondProduct || firstProduct.type !== 'shape' || secondProduct.type !== 'shape') {
      return
    }

    const consumedFirst = node.consumeInputFromEdge(firstEdge)
    const consumedSecond = node.consumeInputFromEdge(secondEdge)

    if (!consumedFirst || !consumedSecond) {
      return
    }

    const stacked = mergeShapes(consumedFirst as ShapeProduct, consumedSecond as ShapeProduct)
    if (!node.pushToNextOutput(stacked)) {
      this.pendingOutput = stacked
    }
  }
}
