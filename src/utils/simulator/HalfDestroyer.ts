import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'
import { breakCutCrystals, destroySide, LEFT_SIDE_INDICES, settleWithCrystalBreak } from './utils.ts'

const MAX_DELAY = 4

export function destroyHalfShape(shape: ShapeProduct): ShapeProduct | undefined {
  const halfShape = cloneShape(shape.shape)
  breakCutCrystals(halfShape)

  destroySide(halfShape, LEFT_SIDE_INDICES)

  settleWithCrystalBreak(halfShape)

  return halfShape.layers.length > 0 ? { shape: halfShape } : undefined
}

export class Cutter extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private delay = 0

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.outputEdges.length < 2
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const inputEdge = this.inputEdges[0]

    if (!inputEdge || this.delay > 0) {
      return
    }

    const inputShape = inputEdge.peekProduct()
    if (!inputShape) {
      return
    }


    const result = destroyHalfShape(inputShape)

    const indexedShapes: [number, ShapeProduct][] = []
    if (result) {
      indexedShapes.push([0, result] as const)
    }

    if (indexedShapes.some(([index]) => !this.outputEdges[index] || this.outputEdges[index].hasProduct)) {
      return
    }

    this.delay = MAX_DELAY
    inputEdge.takeProduct()

    indexedShapes.forEach(([index, shape]) => {
      this.outputEdges[index]!.putProduct(shape)
    })
  }
}
