import type { EdgeProductType, SimulatorEdge } from './SimulatorEdge.ts'

export interface SimulatorNodeOptions {
  id: string
  delay?: number
  multiplier?: number
}

export type MaybeSimulatorEdge = SimulatorEdge | undefined

export abstract class SimulatorNode {
  public readonly id: string
  protected abstract inputEdges: MaybeSimulatorEdge[]
  protected abstract outputEdges: MaybeSimulatorEdge[]
  protected delay = 1
  protected tick = 0

  public get inputs(): SimulatorEdge[] {
    return this.inputEdges.filter((edge) => edge !== undefined)
  }

  public get outputs(): SimulatorEdge[] {
    return this.outputEdges.filter((edge) => edge !== undefined)
  }

  constructor({ id, delay, multiplier }: SimulatorNodeOptions) {
    this.id = id
    this.delay = (delay || 1) / (multiplier || 1)
    this.tick = this.delay
  }

  protected canAcceptInputConnection(_edgeType: EdgeProductType, _inputIndex?: number): boolean {
    void _edgeType
    void _inputIndex
    return true
  }

  protected canAcceptOutputConnection(_edgeType: EdgeProductType, _outputIndex?: number): boolean {
    void _edgeType
    void _outputIndex
    return true
  }

  public attachInputEdge(edge: SimulatorEdge, index?: number): void {
    if (!this.canAcceptInputConnection(edge.edgeType, index)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${index || this.inputEdges.length}.`)
    }

    if (index === undefined) {
      this.inputEdges.push(edge)
    } else {
      this.inputEdges[index] = edge
    }
  }

  public attachOutputEdge(edge: SimulatorEdge, index?: number): void {
    if (!this.canAcceptOutputConnection(edge.edgeType, index)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} output at index ${index || this.outputEdges.length}.`)
    }

    if (index === undefined) {
      this.outputEdges.push(edge)
    } else {
      this.outputEdges[index] = edge
    }
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

  protected emptyOutputEdge(toId: string): void {
    const index = this.outputEdges.findIndex((edge) => edge?.fromId === this.id && edge?.toId === toId)
    if (index >= 0) {
      this.outputEdges[index] = undefined
    }
  }

  protected emptyInputEdge(fromId: string): void {
    const index = this.inputEdges.findIndex((edge) => edge?.fromId === fromId && edge?.toId === this.id)
    if (index >= 0) {
      this.inputEdges[index] = undefined
    }
  }

  protected isTickReady(): boolean {
    if (this.tick >= this.delay) {
      return true
    }
    this.tick++
    return false
  }

  protected resetTick(): void {
    this.tick = 0
  }

  public abstract simulate(): void
}
