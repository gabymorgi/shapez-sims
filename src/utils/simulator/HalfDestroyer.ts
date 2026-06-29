import type { Shape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { destroyHalfShape } from './utils.ts'

export class HalfDestroyer extends SimulatorNode {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []

  constructor(options: SimulatorNodeOptions) {
    super({
      delay: 4,
      ...options,
    })
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.outputEdges.length < 2
  }

  public simulate(): void {
    const inputEdge = this.inputEdges[0]

    if (super.isTickReady() || !inputEdge) {
      return
    }

    const inputShape = inputEdge.peekProduct()
    if (!inputShape) {
      return
    }

    const result = destroyHalfShape(inputShape.shape)

    const indexedShapes: [number, Shape][] = []
    if (result) {
      indexedShapes.push([0, result] as const)
    }

    if (indexedShapes.some(([index]) => !this.outputEdges[index] || this.outputEdges[index].hasProduct)) {
      return
    }

    super.resetTick()
    inputEdge.takeProduct()

    indexedShapes.forEach(([index, shape]) => {
      this.outputEdges[index]!.putProduct({ shape })
    })
  }
}
