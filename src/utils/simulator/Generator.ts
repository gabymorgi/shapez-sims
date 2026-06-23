import type { EdgeProductType, Product, SimulatorEdge } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'

export class Generator extends SimulatorNode<SimulatorEdge[], SimulatorEdge[]> {
  public inputEdges: SimulatorEdge[] = []
  public outputEdges: SimulatorEdge[] = []
  private delay = 0
  private maxDelay = 1
  private product: Product

  constructor(options: SimulatorNodeOptions, product: Product, delay = 1) {
    super(options)
    this.product = product
    this.maxDelay = delay
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
    this.delay = Math.max(0, this.delay - 1)
    const outputEdge = this.outputEdges[0]
    if (this.delay > 0 || !outputEdge || outputEdge.hasProduct) {
      return
    }

    this.delay = this.maxDelay
    outputEdge.putProduct(this.product)
  }
}
