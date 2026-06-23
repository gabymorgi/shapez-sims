import type { ColorEdge, ColorProduct, EdgeProductType } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

const MAX_CAPACITY = 1200

export class FluidLauncher extends SimulatorNode<ColorEdge[], ColorEdge[]> {
  public inputEdges: ColorEdge[] = []
  public outputEdges: ColorEdge[] = []
  private bufferedProduct: ColorProduct = { color: 'r', amount: 0 }

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color'
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color'
  }

  public simulate(): void {
    if (this.bufferedProduct.amount < MAX_CAPACITY) {
      const inputProducts: Record<string, number> = this.inputEdges.reduce((products: Record<string, number>, edge) => {
        const product = edge.takeProduct()
        if (product) {
          products[product.color] = (products[product.color] || 0) + product.amount
        }
        return products
      }, {} as Record<string, number>)

      const maxInputProduct = Object.entries(inputProducts).reduce(
      (max, [color, amount]) => amount > max[1] ? [ color, amount ] : max, ['r', 0] as const)

      if (maxInputProduct[1] > 0) {
        if (this.bufferedProduct.color === maxInputProduct[0]) {
          this.bufferedProduct.amount += maxInputProduct[1]
        } else {
          this.bufferedProduct = {
            color: maxInputProduct[0] as ColorProduct['color'],
            amount: maxInputProduct[1],
          }
        }
      }
    }
    const emptyOutputs = this.outputEdges.filter((edge) => edge.hasProduct)
    if (emptyOutputs.length === 0) {
      return
    }
    
    const outputAmount = Math.min(this.bufferedProduct.amount, MAX_CAPACITY) / this.outputEdges.length

    this.outputEdges.forEach((edge) => {
      edge.putProduct({
        color: this.bufferedProduct.color,
        amount: outputAmount,
      })
    })
  }
}
