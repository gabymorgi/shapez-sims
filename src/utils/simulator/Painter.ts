import { cloneShape } from '../Shape.ts'
import type { EdgeProductType, ShapeProduct, SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

const REQUIRED_COLOR_AMOUNT = 300

export class Painter extends SimulatorNode {
  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    if (edgeType === 'shape') {
      return this.inputEdges[0] === undefined
    }

    if (edgeType === 'color') {
      return this.inputEdges[1] === undefined
    }

    return false
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape'
  }

  public attachInputEdge(edge: SimulatorEdge): void {
    if (this.inputEdges.includes(edge)) {
      return
    }

    if (!this.canAcceptInputConnection(edge.edgeType)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType}.`)
    }

    this.inputEdges[edge.edgeType === 'shape' ? 0 : 1] = edge
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge.fromId === fromId && edge.toId === this.id)
    if (index >= 0) {
      this.inputEdges[index] = undefined as never
    }
  }

  public simulate(): void {
    const shapeEdge = this.inputEdges[0]
    const colorEdge = this.inputEdges[1]
    if (!shapeEdge || !colorEdge) {
      return
    }

    const colorCandidate = this.inputEdges[1]?.peekProduct()
    if (!colorCandidate || colorCandidate.type !== 'color' || colorCandidate.amount < REQUIRED_COLOR_AMOUNT) {
      return
    }

    const shapeInput = this.consumeInputFromEdge(shapeEdge)
    const colorInput = this.consumeInputFromEdge(colorEdge)
    if (!shapeInput || !colorInput || shapeInput.type !== 'shape' || colorInput.type !== 'color') {
      return
    }

    const paintedShape: ShapeProduct = {
      type: 'shape',
      shape: cloneShape(shapeInput.shape),
    }

    for (const layer of paintedShape.shape.layers) {
      for (const quarter of layer.quarters) {
        if (quarter.shape !== '-' && quarter.shape !== 'P') {
          quarter.color = colorInput.color
        }
      }
    }
  }
}
