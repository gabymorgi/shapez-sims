import type { Product } from '../Simulator.ts'
import { cloneProduct } from './productHelpers.ts'
import type { SimulatorEdge } from './Edge.ts'

export interface SimulatorNodeOptions {
  id: string
  simulator: NodeSimulator
  throughput?: [number, number]
  inputIds?: Iterable<string>
  outputIds?: Iterable<string>
}

export interface NodeSimulator {
  simulate(node: SimulatorNode): void
}

interface TakenInput {
  edge: SimulatorEdge | null
  product: Product
}

export class SimulatorNode {
  public readonly id: string
  public readonly simulator: NodeSimulator
  public readonly inputEdges: SimulatorEdge[] = []
  public readonly outputEdges: SimulatorEdge[] = []

  private readonly externalInputQueue: Product[] = []
  private readonly emittedProducts: Product[] = []
  private nextInputCursor = 0
  private nextOutputCursor = 0

  constructor({ id, simulator }: SimulatorNodeOptions) {
    this.id = id
    this.simulator = simulator
  }

  public attachInputEdge(edge: SimulatorEdge): void {
    if (!this.inputEdges.includes(edge)) {
      this.inputEdges.push(edge)
    }
  }

  public attachOutputEdge(edge: SimulatorEdge): void {
    if (!this.outputEdges.includes(edge)) {
      this.outputEdges.push(edge)
    }
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge.fromId === fromId && edge.toId === this.id)
    if (index >= 0) {
      this.inputEdges.splice(index, 1)
      this.nextInputCursor = this.inputEdges.length === 0 ? 0 : this.nextInputCursor % this.inputEdges.length
    }
  }

  public detachOutputEdge(toId: string): void {
    const index = this.outputEdges.findIndex((edge) => edge.fromId === this.id && edge.toId === toId)
    if (index >= 0) {
      this.outputEdges.splice(index, 1)
      this.nextOutputCursor = this.outputEdges.length === 0 ? 0 : this.nextOutputCursor % this.outputEdges.length
    }
  }

  public enqueueExternalInput(product: Product): void {
    this.externalInputQueue.push(cloneProduct(product))
  }

  // ???
  public resetTickState(): void {
    this.emittedProducts.length = 0
  }

  // ???
  public drainTickOutputs(): Product[] {
    return this.emittedProducts.splice(0, this.emittedProducts.length)
  }

  public simulate(): void {
    this.simulator.simulate(this)
  }

  // ???
  public orderedInputEdges(): SimulatorEdge[] {
    if (this.inputEdges.length === 0) {
      return []
    }

    return this.inputEdges
      .slice(this.nextInputCursor)
      .concat(this.inputEdges.slice(0, this.nextInputCursor))
  }

  public peekInputProduct(edge: SimulatorEdge): Product | null {
    return edge.peekProduct()
  }

  public consumeInputFromEdge(edge: SimulatorEdge): Product | null {
    const edgeIndex = this.inputEdges.indexOf(edge)
    const product = edge.takeProduct()

    if (product && edgeIndex >= 0 && this.inputEdges.length > 0) {
      this.nextInputCursor = (edgeIndex + 1) % this.inputEdges.length
    }

    return product
  }

  // match probably can mbe removed
  public takeNextInput(match?: (product: Product, edge: SimulatorEdge | null) => boolean): TakenInput | null {
    // ???
    if (this.inputEdges.length === 0) {
      const queueIndex = this.externalInputQueue.findIndex((product) => !match || match(product, null))
      if (queueIndex < 0) {
        return null
      }

      const [product] = this.externalInputQueue.splice(queueIndex, 1)
      return product ? { edge: null, product } : null
    }

    const edgeCount = this.inputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextInputCursor + offset) % edgeCount
      const edge = this.inputEdges[index]
      // redundant start?
      const product = edge.peekProduct()

      if (!product || (match && !match(product, edge))) {
        continue
      }
      // end redundant

      const consumed = edge.takeProduct()
      if (!consumed) {
        continue
      }

      this.nextInputCursor = (index + 1) % edgeCount
      // probably just need product
      return {
        edge,
        product: consumed,
      }
    }

    return null
  }

  public pushToNextOutput(product: Product, match?: (edge: SimulatorEdge) => boolean): boolean {
    // nononono, si no hay outputs, se skipea
    if (this.outputEdges.length === 0) {
      this.emittedProducts.push(cloneProduct(product))
      return true
    }

    const edgeCount = this.outputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextOutputCursor + offset) % edgeCount
      const edge = this.outputEdges[index]

      // remove match probably
      if (edge.hasProduct || (match && !match(edge))) {
        continue
      }

      if (!edge.putProduct(product)) {
        continue
      }

      this.nextOutputCursor = (index + 1) % edgeCount
      this.emittedProducts.push(cloneProduct(product)) // remove
      return true
    }

    return false
  }
}
