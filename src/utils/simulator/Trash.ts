import { shapeToCode } from '../Shape.ts'
import type { SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'

export class Trash extends SimulatorNode<SimulatorEdge[], SimulatorEdge[]> {
  public inputEdges: SimulatorEdge[] = []
  public outputEdges: SimulatorEdge[] = []
  private delay = 0
  private maxDelay = 1
  public destroyedProducts = new Map<string, number>()

  constructor(options: SimulatorNodeOptions, delay = 1) {
    super(options)
    this.maxDelay = delay
  }

  protected canAcceptInputConnection(): boolean {
    return true
  }

  protected canAcceptOutputConnection(): boolean {
    return false
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    if (this.delay > 0) {
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
      this.delay = this.maxDelay
    }
  }
}
