import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { rotateShape, Rotation } from './utils.ts'

const MAX_DELAY = 2

export class Rotator extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  public readonly rotation: Rotation
  private delay = 0

  constructor(options: SimulatorNodeOptions, rotation: Rotation = Rotation.Clockwise) {
    super(options)
    this.rotation = rotation
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.outputEdges.length < 1
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const inputEdge = this.inputEdges[0]
    const outputEdge = this.outputEdges[0]
    if (this.delay > 0 || !outputEdge || !inputEdge || !inputEdge.hasProduct || outputEdge.hasProduct) {
      return
    }

    this.delay = MAX_DELAY
    const product = inputEdge.takeProduct()!
    const rotated = {
      shape: rotateShape(product.shape, this.rotation)
    }
    outputEdge.putProduct(rotated)
  }
}
