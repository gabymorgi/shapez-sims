import type { Product, ShapeProduct } from '../Simulator.ts'
import { cloneShape } from '../Shape.ts'
import type { NodeSimulator, SimulatorNode } from './SimulatorNode.ts'

export class Painter implements NodeSimulator {
  private readonly requiredColorAmount: number
  private pendingOutput: ShapeProduct | null = null

  constructor(requiredColorAmount = 300) {
    this.requiredColorAmount = requiredColorAmount
  }

  public simulate(node: SimulatorNode): void {
    if (this.pendingOutput) {
      if (node.pushToNextOutput(this.pendingOutput)) {
        this.pendingOutput = null
      }
      return
    }

    const shapeInput = node.takeNextInput((product: Product) => product.type === 'shape')
    if (!shapeInput || shapeInput.product.type !== 'shape') {
      return
    }

    const colorInput = node.takeNextInput((product: Product) => product.type === 'color' && product.amount >= this.requiredColorAmount)
    if (!colorInput || colorInput.product.type !== 'color') {
      return
    }

    const paintedShape: ShapeProduct = {
      type: 'shape',
      shape: cloneShape(shapeInput.product.shape),
    }

    for (const layer of paintedShape.shape.layers) {
      for (const quarter of layer.quarters) {
        if (quarter.shape !== '-' && quarter.shape !== 'P') {
          quarter.color = colorInput.product.color
        }
      }
    }

    if (!node.pushToNextOutput(paintedShape)) {
      this.pendingOutput = paintedShape
    }
  }
}
