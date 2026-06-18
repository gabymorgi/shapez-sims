import type { ColorLetter, Shape } from '../Shape.ts'
import { cloneProduct } from '../simulator/productHelpers.ts'

export interface ShapeProduct {
  type: 'shape'
  shape: Shape
}

export interface ColorProduct {
  type: 'color'
  color: ColorLetter
  amount: number
}

export type Product = ShapeProduct | ColorProduct
export type EdgeProductType = Product['type']

export abstract class SimulatorEdge {
  public readonly fromId: string // nodo
  public readonly toId: string // nodo
  public readonly edgeType: EdgeProductType
  public readonly throughput: number
  private product: Product | null = null

  constructor(fromId: string, toId: string, edgeType: EdgeProductType, throughput = 120) {
    this.fromId = fromId
    this.toId = toId
    this.edgeType = edgeType
    this.throughput = throughput
  }

  public get hasProduct(): boolean {
    return this.product !== null
  }

  public peekProduct(): Product | null {
    return this.product
  }

  public takeProduct(): Product | null {
    const taken = this.product
    this.product = null
    return taken
  }

  public takeProductAmount(amount: number): boolean {
    if (!this.product) {
      return false
    }

    if (this.product.type === 'color') {
      if (this.product.amount < amount) {
        return false
      }
      this.product.amount -= amount
      return true
    }
    return false
  }

  public putProduct(product: Product): boolean {
    if (this.product) {
      return false
    }

    if (product.type !== this.edgeType) {
      return false
    }

    this.product = cloneProduct(product)
    return true
  }
}
