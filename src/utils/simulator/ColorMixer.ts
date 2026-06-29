import type { ColorEdge, EdgeProductType } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode, type SimulatorNodeOptions } from '../simulatorGraph/SimulatorNode.ts'
import { mixColors } from './utils.ts'

export class ColorMixer extends SimulatorNode {
  public inputEdges: ColorEdge[] = []
  public outputEdges: ColorEdge[] = []
  private requiredColorAmount: number
  private outputCapacity: number
  
  constructor(options: SimulatorNodeOptions) {
    super({
      delay: 1, //delay handled by requiredColorAmount
      ...options,
    })
    this.requiredColorAmount = 75 * (options.multiplier ?? 1)
    this.outputCapacity = this.requiredColorAmount * 2
  }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color' && this.inputEdges.length < 2
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color' && this.outputEdges.length < 1
  }

  public attachInputEdge(edge: ColorEdge, index?: number): void {
    super.attachInputEdge(edge, index)
    edge.capacity = this.requiredColorAmount
  }

  public simulate(): void {
    const inputLeft = this.inputEdges[0]
    const inputRight = this.inputEdges[1]
    const outputEdge = this.outputEdges[0]
    if (!super.isTickReady()
      || !inputLeft?.hasProduct
      || !inputRight?.hasProduct
      || outputEdge?.hasProduct === true
    ) {
      return
    }

    const leftProduct = inputLeft.takeProduct(this.requiredColorAmount)!
    const rightProduct = inputRight.takeProduct(this.requiredColorAmount)!
    const mixedColor = mixColors(leftProduct.color, rightProduct.color)

    super.resetTick()
    outputEdge.putProduct({
      color: mixedColor,
      amount: this.outputCapacity,
    })
  }
}
