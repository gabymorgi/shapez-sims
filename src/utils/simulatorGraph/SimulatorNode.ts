import type { EdgeProductType, Product, SimulatorEdge } from './SimulatorEdge.ts'

export interface SimulatorNodeOptions {
  id: string
  throughput?: [number, number]
  inputIds?: Iterable<string>
  outputIds?: Iterable<string>
}

export abstract class SimulatorNode {
  public readonly id: string
  public readonly inputEdges: SimulatorEdge[] = []
  public readonly outputEdges: SimulatorEdge[] = [] 

  constructor({ id }: SimulatorNodeOptions) {
    this.id = id
  }

  protected canAcceptInputConnection(_edgeType: EdgeProductType, _inputIndex: number): boolean {
    void _edgeType
    void _inputIndex
    return true
  }

  protected canAcceptOutputConnection(_edgeType: EdgeProductType, _outputIndex: number): boolean {
    void _edgeType
    void _outputIndex
    return true
  }

  public attachInputEdge(edge: SimulatorEdge): void {
    if (this.inputEdges.includes(edge)) {
      return
    }

    if (!this.canAcceptInputConnection(edge.edgeType, this.inputEdges.length)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType}.`)
    }

    this.inputEdges.push(edge)
  }

  public attachOutputEdge(edge: SimulatorEdge): void {
    if (this.outputEdges.includes(edge)) {
      return
    }

    if (!this.canAcceptOutputConnection(edge.edgeType, this.outputEdges.length)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType}.`)
    }

    this.outputEdges.push(edge)
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge.fromId === fromId && edge.toId === this.id)
    if (index >= 0) {
      this.inputEdges.splice(index, 1)
    }
  }

  public detachOutputEdge(toId: string): void {
    const index = this.outputEdges.findIndex((edge) => edge.fromId === this.id && edge.toId === toId)
    if (index >= 0) {
      this.outputEdges.splice(index, 1)
    }
  }

  public abstract simulate(): void

  // public peekInputProduct(edge: SimulatorEdge): Product | null {
  //   return edge.peekProduct()
  // }

  public consumeInputFromEdge(edge: SimulatorEdge): Product | null {
    return edge.takeProduct()
  }
}
