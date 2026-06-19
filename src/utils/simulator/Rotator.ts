import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'

export const Rotation = {
  Clockwise: 'clockwise',
  Anticlockwise: 'anticlockwise',
  HalfTurn: 'half-turn',
} as const

export type Rotation = (typeof Rotation)[keyof typeof Rotation]

const quarterIndexes = {
    [Rotation.Clockwise]: [3, 0, 1, 2],
    [Rotation.Anticlockwise]: [1, 2, 3, 0],
    [Rotation.HalfTurn]: [2, 3, 0, 1],
  } as const

export function rotateShapeProduct(product: ShapeProduct, rotation: Rotation): ShapeProduct {
  const quarterIndex = quarterIndexes[rotation]

  const rotated = cloneShape(product.shape)

  for (const layer of rotated.layers) {
    const sourceQuarters = layer.quarters.map((quarter) => ({ ...quarter }))
    for (let index = 0; index < 4; index += 1) {
      layer.quarters[index] = sourceQuarters[quarterIndex[index]]
    }
  }

  return {
    shape: rotated,
  }
}

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
    const inputdge = this.inputEdges[0]
    const outputEdge = this.outputEdges[0]
    if (this.delay > 0 || !outputEdge || !inputdge || !inputdge.hasProduct || outputEdge.hasProduct) {
      return
    }

    this.delay = MAX_DELAY
    const product = inputdge.takeProduct()!
    const rotated = rotateShapeProduct(product, this.rotation)
    outputEdge.putProduct(rotated)
  }
}
