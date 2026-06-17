import type { Product } from './Simulator.ts'
import type { NodeSimulator, SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

export class Belt implements NodeSimulator {
  private bufferedProduct: Product | null = null

  public simulate(node: SimulatorNode): void {
    if (!this.bufferedProduct) {
      const taken = node.takeNextInput()
      if (taken) {
        this.bufferedProduct = taken.product
      }
    }

    if (!this.bufferedProduct) {
      return
    }

    if (node.pushToNextOutput(this.bufferedProduct)) {
      this.bufferedProduct = null
    }
  }
}
