import type { EdgeProductType, Product, SimulatorEdge } from './SimulatorEdge.ts'

export interface SimulatorNodeOptions {
  id: string
  throughput?: [number, number]
  inputIds?: Iterable<string>
  outputIds?: Iterable<string>
}

export type AnySimulatorEdge = SimulatorEdge<Product>

export abstract class SimulatorNode<T extends AnySimulatorEdge[], U extends AnySimulatorEdge[]> {
  public readonly id: string
  public abstract inputEdges: T
  public abstract outputEdges: U

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

  public attachInputEdge(edge: AnySimulatorEdge, index?: number): void {
    if (this.inputEdges.includes(edge)) {
      return
    }

    const inputIndex = index || this.inputEdges.length
    if (!this.canAcceptInputConnection(edge.edgeType, inputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${inputIndex}.`)
    }

    this.inputEdges.push(edge)
  }

  public attachOutputEdge(edge: AnySimulatorEdge, index?: number): void {
    if (this.outputEdges.includes(edge)) {
      return
    }

    const outputIndex = index || this.outputEdges.length
    if (!this.canAcceptOutputConnection(edge.edgeType, outputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} output at index ${outputIndex}.`)
    }

    this.outputEdges.push(edge)
  }

  public detachInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge?.fromId === fromId && edge?.toId === this.id)
    if (index >= 0) {
      this.inputEdges.splice(index, 1)
    }
  }

  public detachOutputEdge(toId: string): void {
    const index = this.outputEdges.findIndex((edge) => edge?.fromId === this.id && edge?.toId === toId)
    if (index >= 0) {
      this.outputEdges.splice(index, 1)
    }
  }

  public abstract simulate(): void
}
