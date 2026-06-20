import { cloneShape, type Shape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { settleUnsupportedGroups } from './utils.ts'

function breakTopCrystals(shape: Shape, topStartLayer: number): void {
  for (let layerIndex = topStartLayer; layerIndex < shape.layers.length; layerIndex += 1) {
    for (const quarter of shape.layers[layerIndex].quarters) {
      if (quarter.shape === 'c') {
        quarter.shape = '-'
        quarter.color = null
      }
    }
  }
}

export function stackShapes(bottom: ShapeProduct, top: ShapeProduct): ShapeProduct {
  const merged = cloneShape(bottom.shape)
  const topStartLayer = merged.layers.length
  merged.layers.push(...cloneShape(top.shape).layers)
  breakTopCrystals(merged, topStartLayer)
  settleUnsupportedGroups(merged)

  return { shape: merged }
}

export const StackerType = {
  Straight: 'Straight',
  Bent: 'Bent',
} as const

export type StackerType = (typeof StackerType)[keyof typeof StackerType]

export class Stacker extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private delay = 0
  private maxDelay: number;

  constructor(options: SimulatorNodeOptions, type: StackerType = StackerType.Straight) {
    super(options)
    this.maxDelay = type === StackerType.Bent ? 4 : 6
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

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const inputBottom = this.inputEdges[0]
    const inputTop = this.inputEdges[1]
    const outputEdge = this.outputEdges[0]

    if (!inputBottom || !inputTop || !outputEdge || this.delay > 0 || outputEdge.hasProduct || !inputBottom.hasProduct || !inputTop.hasProduct) {
      return
    }
    this.delay = this.maxDelay

    const bottomShape = inputBottom.takeProduct()!
    const topShape = inputTop.takeProduct()!

    const stacked = stackShapes(bottomShape, topShape)
    outputEdge.putProduct(stacked)
  }
}
