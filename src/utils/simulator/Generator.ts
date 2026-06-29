import type { EdgeProductType, Product, SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'

export class Generator extends SimulatorNode {
  public inputEdges: SimulatorEdge[] = []
  public outputEdges: SimulatorEdge[] = []
  private product: Product

  constructor(options: SimulatorNodeOptions, product: Product) {
    super(options)
    this.product = product
  }

  protected canAcceptInputConnection(): boolean {
    return false
  }

  private get productType(): EdgeProductType {
    return 'shape' in this.product ? 'shape' : 'color'
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return this.outputEdges.length < 1 && edgeType === this.productType
  }

  public simulate(): void {
    const outputEdge = this.outputEdges[0]
    if (super.isTickReady() || !outputEdge || outputEdge.hasProduct) {
      return
    }

    super.resetTick()
    outputEdge.putProduct(this.product)
  }
}
