import { shapeToCode } from '../Shape.ts'
import type { SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

export class Trash extends SimulatorNode {
  public inputEdges: SimulatorEdge[] = []
  public outputEdges: SimulatorEdge[] = []
  public destroyedProducts = new Map<string, number>()

  protected canAcceptInputConnection(): boolean {
    return true
  }

  protected canAcceptOutputConnection(): boolean {
    return false
  }

  public simulate(): void {
    if (!super.isTickReady()) {
      return
    }

    let consumedProduct = false
    for (const inputEdges of this.inputEdges) {
      if (inputEdges.hasProduct) {
        const inProd = inputEdges.takeProduct(1200)!
        if ('shape' in inProd) {
          const shapeCode = shapeToCode(inProd.shape)
          this.destroyedProducts.set(shapeCode, (this.destroyedProducts.get(shapeCode) || 0) + 1)
        } else {
          const colorType = inProd.color
          this.destroyedProducts.set(colorType, (this.destroyedProducts.get(colorType) || 0) + inProd.amount)
        }
        consumedProduct = true
      }
    }

    if (consumedProduct) {
      super.resetTick()
    }
  }
}
