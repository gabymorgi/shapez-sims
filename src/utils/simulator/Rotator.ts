import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

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

function rotateShapeProduct(product: ShapeProduct, rotation: Rotation): ShapeProduct {
  const quarterIndex = quarterIndexes[rotation]

  const rotated = cloneShape(product.shape)

  for (const layer of rotated.layers) {
    const sourceQuarters = layer.quarters.map((quarter) => ({ ...quarter }))
    for (let index = 0; index < 4; index += 1) {
      layer.quarters[index] = sourceQuarters[quarterIndex[index]]
    }
  }

  return {
    type: 'shape',
    shape: rotated,
  }
}

const MAX_DELAY = 2

export class Rotator extends SimulatorNode {
  public readonly rotation: Rotation
  private delay = 0

  constructor(id: string, rotation: Rotation = Rotation.Clockwise) {
    super({ id })
    this.rotation = rotation
  }

  protected getMaxInputs(): number {
    return 1
  }

  protected getMaxOutputs(): number {
    return 1
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape'
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape'
  }

  public simulate(): void {
    this.delay -= 1
    if (this.delay <= 0 && !this.outputEdges[0]?.hasProduct) {
      this.delay = MAX_DELAY
      const product = this.inputEdges[0]?.takeProduct()
      if (product) {
        const rotated = rotateShapeProduct(product as ShapeProduct, this.rotation)
        this.outputEdges[0].putProduct(rotated)
      }
    }
  }
}
