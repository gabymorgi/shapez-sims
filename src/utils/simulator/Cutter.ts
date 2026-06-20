import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'
import { breakCutCrystals, destroySide, LEFT_SIDE_INDICES, RIGHT_SIDE_INDICES, settleWithCrystalBreak } from './utils.ts'

const MAX_DELAY = 4

export function cutShape(shape: ShapeProduct): [ShapeProduct?, ShapeProduct?] {
  const cutResolvedShape = cloneShape(shape.shape)
  breakCutCrystals(cutResolvedShape)

  const leftShape = cloneShape(cutResolvedShape)
  const rightShape = cloneShape(cutResolvedShape)

  destroySide(leftShape, RIGHT_SIDE_INDICES)
  destroySide(rightShape, LEFT_SIDE_INDICES)

  settleWithCrystalBreak(leftShape)
  settleWithCrystalBreak(rightShape)

  return [
    leftShape.layers.length > 0 ? { shape: leftShape } : undefined,
    rightShape.layers.length > 0 ? { shape: rightShape } : undefined,
  ]
}

export class Cutter extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private delay = 0

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.outputEdges[index] === undefined
  }

  public attachOutputEdge(edge: ShapeEdge, index: number): void {
    if (this.outputEdges.includes(edge)) {
      return
    }

    const outputIndex = index || this.outputEdges.length
    if (!this.canAcceptOutputConnection(edge.edgeType, outputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} output at index ${outputIndex}.`)
    }

    this.outputEdges[outputIndex] = edge
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

    const indexedShapes: [number, ShapeProduct][] = []
    cutShape(inputShape).forEach((shape, index) => {
      if (shape) {
        indexedShapes.push([index, shape] as const)
      }
    })

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
