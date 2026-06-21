import type { ColorEdge, ColorProduct, EdgeProductType } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

export class Pipe extends SimulatorNode<ColorEdge[], ColorEdge[]> {
  public inputEdges: ColorEdge[] = []
  public outputEdges: ColorEdge[] = []

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color'
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color'
  }

  public simulate(): void {
    const emptyOutputs = this.outputEdges.filter((edge) => edge.hasProduct)
    if (emptyOutputs.length === 0) {
      return
    }
    const inputProducts: Record<string, number> = this.inputEdges.reduce((products: Record<string, number>, edge) => {
      const product = edge.takeProduct()
      if (product) {
        products[product.color] = (products[product.color] || 0) + product.amount
      }
      return products
    }, {} as Record<string, number>)

    const maxInputProduct = Object.entries(inputProducts).reduce(
      (max, [color, amount]) => amount > max[1] ? [ color, amount ] : max, ['r', 0] as const)

    if (maxInputProduct[1] === 0) {
      return
    }

    maxInputProduct[1] = maxInputProduct[1] / this.outputEdges.length

    this.outputEdges.forEach((edge) => {
      edge.putProduct({
        color: maxInputProduct[0] as ColorProduct['color'],
        amount: maxInputProduct[1],
      })
    })
  }
}
