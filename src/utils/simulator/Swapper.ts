import { type Shape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { swapShapes } from './utils.ts'

export class Swapper extends SimulatorNode {
  public inputEdges: [ShapeEdge?, ShapeEdge?] = []
  public outputEdges: [ShapeEdge?, ShapeEdge?] = []

  constructor(options: SimulatorNodeOptions) {
    super({
      delay: 4,
      ...options,
    })
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.inputEdges[index] === undefined
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.outputEdges[index] === undefined
  }

  public attachInputEdge(edge: ShapeEdge, index: number): void {
    if (this.outputEdges.includes(edge)) {
      return
    }

    const inputIndex = index || this.inputEdges.length
    if (!this.canAcceptInputConnection(edge.edgeType, inputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${inputIndex}.`)
    }

    this.inputEdges[inputIndex] = edge
  }

  public detachInputEdge(fromId: string): void {
    super.emptyInputEdge(fromId)
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

  public detachOutputEdge(toId: string): void {
    super.emptyOutputEdge(toId)
  }

  public simulate(): void {
    const inputLeft = this.inputEdges[0]
    const inputRight = this.inputEdges[1]

    if (super.isTickReady() || !inputLeft || !inputRight) {
      return
    }

    const inputShapeLeft = inputLeft.peekProduct()
    const inputShapeRight = inputLeft.peekProduct()
    if (!inputShapeLeft || !inputShapeRight) {
      return
    }

    const indexedShapes: [number, Shape][] = []
    swapShapes([inputShapeLeft.shape, inputShapeRight.shape]).forEach((shape, index) => {
      if (shape) {
        indexedShapes.push([index, shape] as const)
      }
    })

    if (indexedShapes.some(([index]) => !this.outputEdges[index] || this.outputEdges[index].hasProduct)) {
      return
    }

    super.resetTick()
    inputLeft.takeProduct()
    inputRight.takeProduct()

    indexedShapes.forEach(([index, shape]) => {
      this.outputEdges[index]!.putProduct({ shape })
    })
  }
}
