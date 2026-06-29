import type { Shape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { cutShape } from './utils.ts'

export class Cutter extends SimulatorNode {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: [ShapeEdge?, ShapeEdge?] = []

  constructor(options: SimulatorNodeOptions) {
    super({
      delay: 4,
      ...options,
    })
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.outputEdges[index] === undefined
  }

  public detachOutputEdge(toId: string): void {
    super.emptyOutputEdge(toId)
  }

  public simulate(): void {
    const inputEdge = this.inputEdges[0]

    if (!super.isTickReady() || !inputEdge) {
      return
    }

    const inputShape = inputEdge.peekProduct()
    if (!inputShape) {
      return
    }

    const indexedShapes: [number, Shape][] = []
    cutShape(inputShape.shape).forEach((shape, index) => {
      if (shape) {
        indexedShapes.push([index, shape] as const)
      }
    })

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
