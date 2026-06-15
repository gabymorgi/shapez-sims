import { cloneShape, type Shape } from './Shape'
import type { Simulator } from './Simulator'

export type Throughput = [number, number]

type NodeId = string
type VisitState = 'gray' | 'black'

export interface SimulatorNodeOptions {
  id: string
  simulator: Simulator
  throughput: Throughput
  inputIds?: Iterable<string>
  outputIds?: Iterable<string>
}

export class SimulatorNode {
  public readonly id: string
  public readonly simulator: Simulator
  public readonly throughput: Throughput
  public readonly inputIds: Set<string>
  public readonly outputIds: Set<string>

  constructor({ id, simulator, throughput = [120, 120], inputIds = [], outputIds = [] }: SimulatorNodeOptions) {
    if (id.trim().length === 0) {
      throw new Error('Node id cannot be empty.')
    }

    this.id = id
    this.simulator = simulator
    this.throughput = [throughput[0], throughput[1]]
    this.inputIds = new Set(inputIds)
    this.outputIds = new Set(outputIds)
  }

  public addInput(inputId: string): boolean {
    const beforeSize = this.inputIds.size
    this.inputIds.add(inputId)
    return this.inputIds.size > beforeSize
  }

  public removeInput(inputId: string): boolean {
    return this.inputIds.delete(inputId)
  }

  public addOutput(outputId: string): boolean {
    const beforeSize = this.outputIds.size
    this.outputIds.add(outputId)
    return this.outputIds.size > beforeSize
  }

  public removeOutput(outputId: string): boolean {
    return this.outputIds.delete(outputId)
  }
}

export class SimulatorGraph {
  private readonly nodeMap: Map<NodeId, SimulatorNode>

  constructor(nodes: SimulatorNode[] = []) {
    const map = new Map<NodeId, SimulatorNode>()

    for (const node of nodes) {
      if (map.has(node.id)) {
        throw new Error(`Duplicate node id: ${node.id}`)
      }
      map.set(node.id, node)
    }

    SimulatorGraph.assertAdjacencyConsistency(map)
    SimulatorGraph.assertAcyclic(map)

    this.nodeMap = map
  }

  public static empty(): SimulatorGraph {
    return new SimulatorGraph()
  }

  public get size(): number {
    return this.nodeMap.size
  }

  public get nodes(): SimulatorNode[] {
    return Array.from(this.nodeMap.values())
  }

  public get roots(): SimulatorNode[] {
    return this.nodes.filter((node) => node.inputIds.size === 0)
  }

  public get rootIds(): string[] {
    return this.roots.map((node) => node.id)
  }

  public get leaves(): SimulatorNode[] {
    return this.nodes.filter((node) => node.outputIds.size === 0)
  }

  public get leafIds(): string[] {
    return this.leaves.map((node) => node.id)
  }

  public hasNode(nodeId: string): boolean {
    return this.nodeMap.has(nodeId)
  }

  public getNode(nodeId: string): SimulatorNode | undefined {
    return this.nodeMap.get(nodeId)
  }

  public getInputs(nodeId: string): SimulatorNode[] {
    const node = this.getNodeOrThrow(nodeId)
    return Array.from(node.inputIds, (inputId) => this.getNodeOrThrow(inputId))
  }

  public getOutputs(nodeId: string): SimulatorNode[] {
    const node = this.getNodeOrThrow(nodeId)
    return Array.from(node.outputIds, (outputId) => this.getNodeOrThrow(outputId))
  }

  public addNode(node: SimulatorNode): void {
    if (this.nodeMap.has(node.id)) {
      throw new Error(`Node already exists: ${node.id}`)
    }

    this.nodeMap.set(node.id, node)
    SimulatorGraph.assertAdjacencyConsistencyForNode(this.nodeMap, node.id)
    SimulatorGraph.assertAcyclicForNode(this.nodeMap, node.id, new Map<NodeId, VisitState>())
  }

  public removeNode(nodeId: string): void {
    if (!this.nodeMap.has(nodeId)) {
      return
    }

    const markedNode = this.getNodeOrThrow(nodeId)
    for (const inputId of markedNode.inputIds) {
      const inputNode = this.getNodeOrThrow(inputId)
      inputNode.removeOutput(nodeId)
    }
    for (const outputId of markedNode.outputIds) {
      const outputNode = this.getNodeOrThrow(outputId)
      outputNode.removeInput(nodeId)
    }

    this.nodeMap.delete(nodeId)
  }

  public addEdge(fromId: string, toId: string): void {
    if (fromId === toId) {
      throw new Error('A node cannot be connected to itself.')
    }

    const fromNode = this.getNodeOrThrow(fromId)
    const toNode = this.getNodeOrThrow(toId)

    if (this.hasEdge(fromId, toId)) {
      return
    }

    if (!SimulatorGraph.hasPath(this.nodeMap, toId, fromId)) {
      fromNode.addOutput(toId)
      toNode.addInput(fromId)
      return
    }
  }

  public disconnect(fromId: string, toId: string): void {
    const sourceNode = this.getNodeOrThrow(fromId)
    const targetNode = this.getNodeOrThrow(toId)

    sourceNode.removeOutput(toId)
    targetNode.removeInput(fromId)
  }

  // public simulate(rootInputs: Readonly<Record<string, Shape[]>> = {}): Record<string, Shape[]> {
  //   const orderedNodeIds = this.topologicalOrder()
  //   const nodeOutputs: Record<string, Shape[]> = {}

  //   for (const nodeId of orderedNodeIds) {
  //     const node = this.getNodeOrThrow(nodeId)
  //     const upstreamInputs: Shape[] = []
  //     for (const inputId of node.inputIds) {
  //       const output = nodeOutputs[inputId]
  //       if (!output) {
  //         continue
  //       }

  //       upstreamInputs.push(...output.map(cloneShape))
  //     }

  //     const rootInput = rootInputs[nodeId] ? rootInputs[nodeId].map(cloneShape) : []
  //     const effectiveInputs = node.inputIds.size === 0 ? rootInput : upstreamInputs

  //     nodeOutputs[nodeId] = node.simulator.simulate(effectiveInputs)
  //   }

  //   return nodeOutputs
  // }

  private hasEdge(fromId: string, toId: string): boolean {
    const node = this.getNodeOrThrow(fromId)
    return node.outputIds.has(toId)
  }

  private getNodeOrThrow(nodeId: string): SimulatorNode {
    const node = this.nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    return node
  }

  public topologicalOrder(): string[] {
    const indegrees = new Map<string, number>()

    for (const node of this.nodeMap.values()) {
      indegrees.set(node.id, node.inputIds.size)
    }

    const queue = Array.from(indegrees.entries())
      .filter(([, indegree]) => indegree === 0)
      .map(([nodeId]) => nodeId)

    const ordered: string[] = []

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (!nodeId) {
        continue
      }

      ordered.push(nodeId)

      const node = this.nodeMap.get(nodeId)
      if (!node) {
        continue
      }

      for (const outputId of node.outputIds) {
        const current = indegrees.get(outputId)
        if (current === undefined) {
          continue
        }

        const nextIndegree = current - 1
        indegrees.set(outputId, nextIndegree)

        if (nextIndegree === 0) {
          queue.push(outputId)
        }
      }
    }

    if (ordered.length !== this.nodeMap.size) {
      throw new Error('Graph must be acyclic.')
    }

    return ordered
  }

  private static assertAdjacencyConsistencyForNode(nodeMap: Map<NodeId, SimulatorNode>, nodeId: string): void {
    const node = nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    for (const inputId of node.inputIds) {
      const inputNode = nodeMap.get(inputId)
      if (!inputNode) {
        throw new Error(`Node ${node.id} has unknown input node: ${inputId}`)
      }

      if (!inputNode.outputIds.has(node.id)) {
        throw new Error(`Input/output mismatch for ${inputId} -> ${node.id}`)
      }
    }

    for (const outputId of node.outputIds) {
      const outputNode = nodeMap.get(outputId)
      if (!outputNode) {
        throw new Error(`Node ${node.id} has unknown output node: ${outputId}`)
      }

      if (!outputNode.inputIds.has(node.id)) {
        throw new Error(`Output/input mismatch for ${node.id} -> ${outputId}`)
      }
    }
  }

  private static assertAdjacencyConsistency(nodeMap: Map<NodeId, SimulatorNode>): void {
    for (const node of nodeMap.values()) {
      SimulatorGraph.assertAdjacencyConsistencyForNode(nodeMap, node.id)
    }
  }

  private static assertAcyclicForNode(nodeMap: Map<NodeId, SimulatorNode>, nodeId: string, visitState: Map<NodeId, VisitState>): void {
    const state = visitState.get(nodeId)

    // Back-edge to a node in the current DFS stack means a cycle.
    if (state === 'gray') {
      throw new Error('Graph must be acyclic.')
    }

    // A fully processed node cannot lead to a cycle.
    if (state === 'black') {
      return
    }

    visitState.set(nodeId, 'gray')

    const node = nodeMap.get(nodeId)

    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    for (const outputId of node.outputIds) {
      SimulatorGraph.assertAcyclicForNode(nodeMap, outputId, visitState)
    }

    visitState.set(nodeId, 'black')
  }

  private static assertAcyclic(nodeMap: Map<NodeId, SimulatorNode>): void {
    const visitState = new Map<NodeId, VisitState>()

    for (const node of nodeMap.values()) {
      if (visitState.get(node.id) === 'black') {
        continue
      }

      SimulatorGraph.assertAcyclicForNode(nodeMap, node.id, visitState)
    }
  }

  private static hasPath(nodeMap: Map<NodeId, SimulatorNode>, fromId: string, targetId: string): boolean {
    if (fromId === targetId) {
      return true
    }

    const visited = new Set<string>()
    const queue: string[] = [fromId]

    while (queue.length > 0) {
      const currentId = queue.shift()
      if (!currentId || visited.has(currentId)) {
        continue
      }

      visited.add(currentId)

      const currentNode = nodeMap.get(currentId)
      if (!currentNode) {
        continue
      }

      for (const nextId of currentNode.outputIds) {
        if (nextId === targetId) {
          return true
        }

        if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      }
    }

    return false
  }
}
