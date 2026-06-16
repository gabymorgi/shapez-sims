import type { Product } from '../Simulator.ts'
import { cloneProduct } from './productHelpers.ts'

export class SimulatorEdge {
  public readonly fromId: string // nodo
  public readonly toId: string // nodo
  public readonly throughput: number
  private product: Product | null = null

  constructor(fromId: string, toId: string, throughput = 120) {
    this.fromId = fromId
    this.toId = toId
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

  public putProduct(product: Product): boolean {
    if (this.product) {
      return false
    }

    this.product = cloneProduct(product)
    return true
  }
}
