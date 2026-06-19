import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

export class Belt extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private bufferedProduct: ShapeProduct | null = null
  private nextInputCursor = 0
  private nextOutputCursor = 0

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return this.inputEdges.length < 3 && edgeType === 'shape'
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return this.outputEdges.length < 3 && edgeType === 'shape'
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge.fromId === fromId && edge.toId === this.id)
    if (index >= 0) {
      this.inputEdges.splice(index, 1)
      this.nextInputCursor = this.inputEdges.length === 0 ? 0 : this.nextInputCursor % this.inputEdges.length
    }
  }

  public detachOutputEdge(toId: string): void {
    const index = this.outputEdges.findIndex((edge) => edge.fromId === this.id && edge.toId === toId)
    if (index >= 0) {
      this.outputEdges.splice(index, 1)
      this.nextOutputCursor = this.outputEdges.length === 0 ? 0 : this.nextOutputCursor % this.outputEdges.length
    }
  }

  public takeFromNextInput(): boolean {
    if (this.bufferedProduct) {
      return true
    }
    const edgeCount = this.inputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextInputCursor + offset) % edgeCount
      const edge = this.inputEdges[index]

      const takenProduct = edge.takeProduct()
      if (!takenProduct) {
        continue
      }

      this.nextInputCursor = (index + 1) % edgeCount
      this.bufferedProduct = takenProduct

      return true
    }

    return false
  }

  public pushToNextOutput(): boolean {
    if (!this.bufferedProduct) {
      return true
    }
    const edgeCount = this.outputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextOutputCursor + offset) % edgeCount
      const edge = this.outputEdges[index]

      if (edge.hasProduct) {
        continue
      }

      if (!edge.putProduct(this.bufferedProduct)) {
        continue
      }

      this.bufferedProduct = null
      this.nextOutputCursor = (index + 1) % edgeCount
      return true
    }

    return false
  }

  public simulate(): void {
    this.takeFromNextInput()
    this.pushToNextOutput()
  }
}
