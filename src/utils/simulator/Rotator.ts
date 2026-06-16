import type { Product, Rotation, ShapeProduct } from '../Simulator.ts'
import { Rotation as RotationType } from '../Simulator.ts'
import { cloneShape } from '../Shape.ts'
import type { NodeSimulator, SimulatorNode } from './SimulatorNode.ts'

function rotateShapeProduct(product: ShapeProduct, rotation: Rotation): ShapeProduct {
  const quarterIndexes = {
    [RotationType.Clockwise]: [3, 0, 1, 2],
    [RotationType.Anticlockwise]: [1, 2, 3, 0],
    [RotationType.HalfTurn]: [2, 3, 0, 1],
  }[rotation]

  const rotated = cloneShape(product.shape)

  for (const layer of rotated.layers) {
    const sourceQuarters = layer.quarters.map((quarter) => ({ ...quarter }))
    for (let index = 0; index < 4; index += 1) {
      layer.quarters[index] = sourceQuarters[quarterIndexes[index]]
    }
  }

  return {
    type: 'shape',
    shape: rotated,
  }
}

export class Rotator implements NodeSimulator {
  public readonly throughput: number
  public readonly rotation: Rotation
  private delay = 0
  private pendingOutput: ShapeProduct | null = null

  constructor(throughput = 120, rotation: Rotation = RotationType.Clockwise) {
    this.throughput = throughput
    this.rotation = rotation
  }

  public simulate(node: SimulatorNode): void {
    if (this.pendingOutput) {
      if (node.pushToNextOutput(this.pendingOutput)) {
        this.pendingOutput = null
      }
      return
    }

    this.delay -= 1
    if (this.delay > 0) {
      return
    }

    this.delay = 2

    const taken = node.takeNextInput((product: Product) => product.type === 'shape')
    if (!taken) {
      return
    }

    const rotated = rotateShapeProduct(taken.product as ShapeProduct, this.rotation)
    if (!node.pushToNextOutput(rotated)) {
      this.pendingOutput = rotated
    }
  }
}
