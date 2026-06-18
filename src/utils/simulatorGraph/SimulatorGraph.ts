import type { Shape } from '../Shape.ts'
import { SimulatorNode } from './SimulatorNode.ts'
import { type EdgeProductType, SimulatorEdge } from './SimulatorEdge.ts'

type NodeId = string
type VisitState = 'gray' | 'black'

export class SimulatorGraph {
  private readonly nodeMap: Map<NodeId, SimulatorNode>
  private readonly edgeMap: Map<string, SimulatorEdge>

  constructor() {
    const map = new Map<NodeId, SimulatorNode>()

    // for (const node of nodes) {
    //   if (map.has(node.id)) {
    //     throw new Error(`Duplicate node id: ${node.id}`)
    //   }
    //   map.set(node.id, node)
    // }

    // SimulatorGraph.assertAdjacencyConsistency(map)
    // SimulatorGraph.assertAcyclic(map)

    this.nodeMap = map
    this.edgeMap = new Map<string, SimulatorEdge>()

    // for (const node of map.values()) {
    //   for (const outputId of node.outputIds) {
    //     const edge = this.createEdge(node.id, outputId)
    //     node.attachOutputEdge(edge)
    //     this.getNodeOrThrow(outputId).attachInputEdge(edge)
    //   }
    // }
  }

  public get size(): number {
    return this.nodeMap.size
  }

  public get nodes(): SimulatorNode[] {
    return Array.from(this.nodeMap.values())
  }

  public get roots(): SimulatorNode[] {
    return this.nodes.filter((node) => node.inputEdges.length === 0)
  }

  public get rootIds(): string[] {
    return this.roots.map((node) => node.id)
  }

  public get leaves(): SimulatorNode[] {
    return this.nodes.filter((node) => node.outputEdges.length === 0)
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

  private getNodeOrThrow(nodeId: string): SimulatorNode {
    const node = this.nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    return node
  }

  public addNode(node: SimulatorNode): void {
    if (this.nodeMap.has(node.id)) {
      throw new Error(`Node already exists: ${node.id}`)
    }

    this.nodeMap.set(node.id, node)
  }

  public removeNode(nodeId: string): void {
    if (!this.nodeMap.has(nodeId)) {
      return
    }

    const markedNode = this.getNodeOrThrow(nodeId)

    for (const inputId of markedNode.inputEdges.map((edge) => edge.fromId)) {
      const inputNode = this.getNodeOrThrow(inputId)
      inputNode.detachOutputEdge(nodeId)
      this.edgeMap.delete(SimulatorGraph.edgeKey(inputId, nodeId))
    }

    for (const outputId of markedNode.outputEdges.map((edge) => edge.toId)) {
      const outputNode = this.getNodeOrThrow(outputId)
      outputNode.detachInputEdge(nodeId)
      this.edgeMap.delete(SimulatorGraph.edgeKey(nodeId, outputId))
    }

    this.nodeMap.delete(nodeId)
  }

  public addEdge(fromId: string, toId: string, edgeType: EdgeProductType): void {
    if (fromId === toId) {
      throw new Error('A node cannot be connected to itself.')
    }

    const fromNode = this.getNodeOrThrow(fromId)
    const toNode = this.getNodeOrThrow(toId)

    const existing = this.getEdge(fromId, toId)
    if (existing) {
      if (existing.edgeType !== edgeType) {
        throw new Error(`Edge ${fromId}->${toId} already exists with type ${existing.edgeType}.`)
      }
      return
    }

    if (!SimulatorGraph.hasPath(this.nodeMap, toId, fromId)) {
      const edge = new SimulatorEdge(fromId, toId, edgeType)
      fromNode.attachOutputEdge(edge)
      try {
        toNode.attachInputEdge(edge)
      } catch (error) {
        fromNode.detachOutputEdge(toId)
        throw error
      }

      this.edgeMap.set(SimulatorGraph.edgeKey(fromId, toId), edge)
      return
    }
    throw new Error('Adding this edge would create a cycle.')
  }

  public removeEdge(fromId: string, toId: string): void {
    const fromNode = this.getNodeOrThrow(fromId)
    const toNode = this.getNodeOrThrow(toId)

    this.edgeMap.delete(SimulatorGraph.edgeKey(fromId, toId))
    fromNode.detachOutputEdge(toId)
    toNode.detachInputEdge(fromId)
  }

  public simulate(rootInputs: Readonly<Record<string, Shape[]>> = {}): Record<string, Shape[]> {
    const orderedNodeIds = this.topologicalOrder()
    void rootInputs
    void orderedNodeIds
    throw new Error('Not implemented yet')
  }

  private getEdge(fromId: string, toId: string): SimulatorEdge | undefined {
    return this.edgeMap.get(SimulatorGraph.edgeKey(fromId, toId))
  }

  private static edgeKey(fromId: string, toId: string): string {
    return `${fromId}->${toId}`
  }

  public topologicalOrder(): string[] {
    const indegrees = new Map<string, number>()

    for (const node of this.nodeMap.values()) {
      indegrees.set(node.id, node.inputEdges.length)
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

      const node = this.getNodeOrThrow(nodeId)

      for (const outputId of node.outputEdges.map((edge) => edge.toId)) {
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

  private assertAcyclicForNode(
    nodeId: string,
    visitState: Map<NodeId, VisitState> = new Map<NodeId, VisitState>()
  ): void {
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

    const node = this.nodeMap.get(nodeId)

    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    for (const outputEdge of node.outputEdges) {
      this.assertAcyclicForNode(outputEdge.toId, visitState)
    }

    visitState.set(nodeId, 'black')
  }

  private assertAcyclic(): void {
    const visitState = new Map<NodeId, VisitState>()

    for (const node of this.nodeMap.values()) {
      if (visitState.get(node.id) === 'black') {
        continue
      }

      this.assertAcyclicForNode(node.id, visitState)
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

      for (const nextId of currentNode.outputEdges.map((edge) => edge.toId)) {
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
