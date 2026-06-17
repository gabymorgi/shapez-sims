import type { Product } from '../simulator/Simulator.ts'
import type { SimulatorEdge } from './SimulatorEdge.ts'

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

  public simulate(): void {
    this.simulator.simulate(this)
  }

  public peekInputProduct(edge: SimulatorEdge): Product | null {
    return edge.peekProduct()
  }

  public takeNextInput(): TakenInput | null {
    const edgeCount = this.inputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextInputCursor + offset) % edgeCount
      const edge = this.inputEdges[index]

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

  public pushToNextOutput(product: Product): boolean {
    const edgeCount = this.outputEdges.length
    for (let offset = 0; offset < edgeCount; offset += 1) {
      const index = (this.nextOutputCursor + offset) % edgeCount
      const edge = this.outputEdges[index]

      if (edge.hasProduct) {
        continue
      }

      if (!edge.putProduct(product)) {
        continue
      }

      this.nextOutputCursor = (index + 1) % edgeCount
      return true
    }

    return false
  }
}
