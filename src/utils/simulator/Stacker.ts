import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { stackShapes } from './utils.ts'

export const StackerType = {
  Straight: 'Straight',
  Bent: 'Bent',
} as const

export type StackerType = (typeof StackerType)[keyof typeof StackerType]

export class Stacker extends SimulatorNode {
  public inputEdges: [ShapeEdge?, ShapeEdge?] = []
  public outputEdges: ShapeEdge[] = []

  constructor(options: SimulatorNodeOptions, type: StackerType = StackerType.Straight) {
    super({
      delay: type === StackerType.Bent ? 4 : 6,
      ...options,
    })
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.inputEdges[index] === undefined
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.outputEdges.length < 1
  }

  public attachInputEdge(edge: ShapeEdge, index: number): void {
    if (this.inputEdges.includes(edge)) {
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

  public simulate(): void {
    const inputBottom = this.inputEdges[0]
    const inputTop = this.inputEdges[1]
    const outputEdge = this.outputEdges[0]

    if (super.isTickReady() || !inputBottom?.hasProduct || !inputTop?.hasProduct || outputEdge?.hasProduct === true) {
      return
    }
    super.resetTick()

    const bottomShape = inputBottom.takeProduct()!
    const topShape = inputTop.takeProduct()!

    const stacked = stackShapes(bottomShape.shape, topShape.shape)
    outputEdge.putProduct({ shape: stacked })
  }
}
