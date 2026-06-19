import { cloneShape, type ColorLetter, type Shape } from '../Shape.ts'

export interface ShapeProduct {
  shape: Shape
}

export interface ColorProduct {
  color: ColorLetter
  amount: number
}

export interface ProductByType {
  shape: ShapeProduct
  color: ColorProduct
}

export type Product = ShapeProduct | ColorProduct
export type EdgeProductType = 'shape' | 'color'

export abstract class SimulatorEdge<T extends Product = Product> {
  public readonly fromId: string
  public readonly toId: string
  public readonly throughput: number
  public readonly edgeType: EdgeProductType
  protected product: T | null = null

  constructor(fromId: string, toId: string, edgeType: EdgeProductType, throughput = 120) {
    this.fromId = fromId
    this.toId = toId
    this.edgeType = edgeType
    this.throughput = throughput
  }

  public get hasProduct(): boolean {
    return this.product !== null
  }

  public peekProduct(): T | null {
    return this.product
  }

  public abstract takeProduct(amount?: number): T | null

  public abstract putProduct(product: T): boolean
}

export class ShapeEdge extends SimulatorEdge<ShapeProduct> {
  constructor(fromId: string, toId: string, throughput = 120) {
    super(fromId, toId, 'shape', throughput)
  }

  public takeProduct(): ShapeProduct | null {
    const taken = this.product
    this.product = null
    return taken
  }

  public putProduct(product: ShapeProduct): boolean {
    if (this.hasProduct) {
      return false
    }
    this.product = {
      shape: cloneShape(product.shape),
    }
    return true
  }
}

export class ColorEdge extends SimulatorEdge<ColorProduct> {
  constructor(fromId: string, toId: string, throughput = 120) {
    super(fromId, toId, 'color', throughput)
  }

  public takeProduct(amount?: number): ColorProduct | null {
    if (!this.product) {
      return null
    }

    const requestedAmount = amount ?? this.product.amount
    if (this.product.amount < requestedAmount) {
      return null
    }

    this.product.amount -= requestedAmount
    const consumed: ColorProduct = {
      color: this.product.color,
      amount: requestedAmount,
    }

    if (this.product.amount === 0) {
      this.product = null
    }

    return consumed
  }

  public putProduct(product: ColorProduct): boolean {
    if (!this.product) {
      this.product = {
        ...product,
      }
      return true
    }

    if (this.product.color === product.color) {
      const resultAmount = this.product.amount + product.amount
      if (resultAmount > 500) {
        return false
      }
      this.product.amount = resultAmount
      return true
    }

    return false
  }
}
