import { cloneShape } from '../Shape.ts'
import type { ColorEdge, EdgeProductType, ShapeEdge, ShapeProduct, SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'

const REQUIRED_COLOR_AMOUNT = 300
const MAX_DELAY = 4

const nonShapeLetters: string[] = ['-', 'P', 'c']

export class Painter extends SimulatorNode<[ShapeEdge, ColorEdge], ShapeEdge[]> {
  public inputEdges: [ShapeEdge, ColorEdge] = [undefined, undefined] as unknown as [ShapeEdge, ColorEdge]
  public outputEdges: ShapeEdge[] = []
  private delay = 0

  constructor(options: SimulatorNodeOptions) {
    super(options)
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType, inputIndex: number): boolean {
    if (inputIndex === 0) {
      return edgeType === 'shape' && this.inputEdges[0] === undefined
    }

    if (inputIndex === 1) {
      return edgeType === 'color' && this.inputEdges[1] === undefined
    }

    return false
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape'
  }

  public attachInputEdge(edge: SimulatorEdge): void {
    if (this.inputEdges[0] === edge || this.inputEdges[1] === edge) {
      return
    }

    const inputIndex = this.inputEdges[0] === undefined ? 0 : this.inputEdges[1] === undefined ? 1 : 2
    if (!this.canAcceptInputConnection(edge.edgeType, inputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${inputIndex}.`)
    }

    if (inputIndex === 0) {
      this.inputEdges[0] = edge as ShapeEdge
      return
    }

    this.inputEdges[1] = edge as ColorEdge
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge?.fromId === fromId && edge?.toId === this.id)
    if (index >= 0) {
      this.inputEdges[index] = undefined as never
    }
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const shapeEdge = this.inputEdges[0]
    const colorEdge = this.inputEdges[1]
    const outputEdge = this.outputEdges[0]
    if (!shapeEdge || !colorEdge || !outputEdge || this.delay > 0) {
      return
    }

    const colorInput = colorEdge.peekProduct()
    if (!colorInput || colorInput.amount < REQUIRED_COLOR_AMOUNT || !shapeEdge.hasProduct || outputEdge.hasProduct) {
      return
    }

    this.delay = MAX_DELAY
    const shapeInput = shapeEdge.takeProduct()!

    colorEdge.takeProduct(REQUIRED_COLOR_AMOUNT)

    const paintedShape: ShapeProduct = {
      type: 'shape',
      shape: cloneShape(shapeInput.shape),
    }

    for (const quarter of paintedShape.shape.layers.at(-1)?.quarters ?? []) {
      if (!nonShapeLetters.includes(quarter.shape)) {
        quarter.color = colorInput.color
      }
    }

    outputEdge.putProduct(paintedShape)
  }
}
