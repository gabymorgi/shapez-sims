import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'
import { breakCutCrystals, emptyQuarter, settleWithCrystalBreak } from './utils.ts'

const MAX_DELAY = 4

export function swapShapes(shape: [ShapeProduct, ShapeProduct]): [ShapeProduct?, ShapeProduct?] {
  const shape1 = cloneShape(shape[0].shape)
  const shape2 = cloneShape(shape[1].shape)
  breakCutCrystals(shape1)
  breakCutCrystals(shape2)

  const maxLayers = Math.max(shape1.layers.length, shape2.layers.length)
  while (shape1.layers.length < maxLayers) {
    shape1.layers.push({ quarters: [emptyQuarter(), emptyQuarter(), emptyQuarter(), emptyQuarter()] })
  }
  while (shape2.layers.length < maxLayers) {
    shape2.layers.push({ quarters: [emptyQuarter(), emptyQuarter(), emptyQuarter(), emptyQuarter()] })
  }

  for (let l = 0; l < maxLayers; l++) {
    // bottom left
    let aux = shape1.layers[l].quarters[2]
    shape1.layers[l].quarters[2] = shape2.layers[l].quarters[2]
    shape2.layers[l].quarters[2] = aux

    // top left
    aux = shape1.layers[l].quarters[3]
    shape1.layers[l].quarters[3] = shape2.layers[l].quarters[3]
    shape2.layers[l].quarters[3] = aux
  }

  settleWithCrystalBreak(shape1)
  settleWithCrystalBreak(shape2)

  return [
    shape1.layers.length > 0 ? { shape: shape1 } : undefined,
    shape2.layers.length > 0 ? { shape: shape2 } : undefined
  ]
}

export class Cutter extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private delay = 0

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
    const inputLeft = this.inputEdges[0]
    const inputRight = this.inputEdges[1]

    if (!inputLeft || !inputRight || this.delay > 0) {
      return
    }

    const inputShapeLeft = inputLeft.peekProduct()
    const inputShapeRight = inputLeft.peekProduct()
    if (!inputShapeLeft || !inputShapeRight) {
      return
    }

    const indexedShapes: [number, ShapeProduct][] = []
    swapShapes([inputShapeLeft, inputShapeRight]).forEach((shape, index) => {
      if (shape) {
        indexedShapes.push([index, shape] as const)
      }
    })

    if (indexedShapes.some(([index]) => !this.outputEdges[index] || this.outputEdges[index].hasProduct)) {
      return
    }

    this.delay = MAX_DELAY
    inputLeft.takeProduct()
    inputRight.takeProduct()

    indexedShapes.forEach(([index, shape]) => {
      this.outputEdges[index]!.putProduct(shape)
    })
  }
}
