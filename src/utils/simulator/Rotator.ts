import type { EdgeProductType, ShapeEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { rotateShape, Rotation } from './utils.ts'

export class Rotator extends SimulatorNode {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  public readonly rotation: Rotation

  constructor(options: SimulatorNodeOptions, rotation: Rotation = Rotation.Clockwise) {
    super({
      delay: 2,
      ...options,
    })
    this.rotation = rotation
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.outputEdges.length < 1
  }

  public simulate(): void {
    const inputEdge = this.inputEdges[0]
    const outputEdge = this.outputEdges[0]
    if (super.isTickReady() || !inputEdge?.hasProduct || outputEdge?.hasProduct === true) {
      return
    }

    super.resetTick()
    const product = inputEdge.takeProduct()!
    const rotated = {
      shape: rotateShape(product.shape, this.rotation)
    }
    outputEdge.putProduct(rotated)
  }
}
