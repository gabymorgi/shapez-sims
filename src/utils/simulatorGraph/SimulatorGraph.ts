import { SimulatorNode } from './SimulatorNode.ts'
import { ColorEdge, type EdgeProductType, type Product, ShapeEdge, type SimulatorEdge } from './SimulatorEdge.ts'
import { Belt } from '../simulator/Belt.ts'
import { Pipe } from '../simulator/Pipe.ts'
import { Generator } from '../simulator/Generator.ts'
import { Trash } from '../simulator/Trash.ts'
import { Stacker } from '../simulator/Stacker.ts'
import { Painter } from '../simulator/Painter.ts'
import { Crystalizer } from '../simulator/Crystalizer.ts'
import { ColorMixer } from '../simulator/ColorMixer.ts'
import { Swapper } from '../simulator/Swapper.ts'

type NodeId = string
type VisitState = 'gray' | 'black'

type Node = SimulatorNode<SimulatorEdge<Product>[], SimulatorEdge<Product>[]>
type Edge = SimulatorEdge<Product>

export class SimulatorGraph {
  private readonly nodeMap: Map<NodeId, Node>
  private readonly edgeMap: Map<string, Edge>

  constructor() {
    const map = new Map<NodeId, Node>()

    this.nodeMap = map
    this.edgeMap = new Map<string, Edge>()
  }

  public clone(): SimulatorGraph {
    const newGraph = new SimulatorGraph()

    for (const node of this.nodeMap.values()) {
      newGraph.addNode(node)
    }
    for (const edge of this.edgeMap.values()) {
      newGraph.addEdge(edge.fromId, edge.toId, edge.edgeType)
    }

    return newGraph
  }

  public get size(): number {
    return this.nodeMap.size
  }

  public get nodes(): Node[] {
    return Array.from(this.nodeMap.values())
  }

  public get edges(): Edge[] {
    return Array.from(this.edgeMap.values())
  }

  public get roots(): Node[] {
    return this.nodes.filter((node) => node.inputEdges.length === 0)
  }

  public get rootIds(): string[] {
    return this.roots.map((node) => node.id)
  }

  public get leaves(): Node[] {
    return this.nodes.filter((node) => node.outputEdges.length === 0)
  }

  public get leafIds(): string[] {
    return this.leaves.map((node) => node.id)
  }

  public hasNode(nodeId: string): boolean {
    return this.nodeMap.has(nodeId)
  }

  public getNode(nodeId: string): Node | undefined {
    return this.nodeMap.get(nodeId)
  }

  private getNodeOrThrow(nodeId: string): Node {
    const node = this.nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Unknown node: ${nodeId}`)
    }

    return node
  }

  public addNode(node: Node): void {
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

  public addEdge(
    fromId: string,
    toId: string,
    edgeType: EdgeProductType,
    inputIndex?: number,
    outputIndex?: number
  ): void {
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
      const edge = this.createEdge(fromId, toId, edgeType)
      fromNode.attachOutputEdge(edge, outputIndex)
      try {
        toNode.attachInputEdge(edge, inputIndex)
      } catch (error) {
        fromNode.detachOutputEdge(toId)
        throw error
      }

      this.edgeMap.set(SimulatorGraph.edgeKey(fromId, toId), edge)
      this.assertAcyclicForNode(fromId)
      this.assertAcyclicForNode(toId)

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

  public simulate(): void {
    const orderedNodeIds = this.topologicalOrder()
    
    for (const nodeId of orderedNodeIds) {
      const node = this.getNodeOrThrow(nodeId)
      node.simulate()
    }
  }

  private createEdge(fromId: string, toId: string, edgeType: EdgeProductType): Edge {
    if (edgeType === 'shape') {
      return new ShapeEdge(fromId, toId)
    }

    return new ColorEdge(fromId, toId)
  }

  private getEdge(fromId: string, toId: string): Edge | undefined {
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

  private static hasPath(nodeMap: Map<NodeId, Node>, fromId: string, targetId: string): boolean {
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

  public optimizeBelts = (): void => {
    for (const node of this.nodes) {
      if (node instanceof Belt && node.inputEdges.length === 1 && node.outputEdges.length === 1) {
        const inEdge = node.inputEdges[0];
        const outEdge = node.outputEdges[0];
        
        this.removeEdge(inEdge.fromId, node.id);
        this.removeEdge(node.id, outEdge.toId);
        this.removeNode(node.id);
        this.addEdge(inEdge.fromId, outEdge.toId, inEdge.edgeType);
      }
    }
  };

  public optimizePipes = (): void => {
    // debugger;
    const visited = new Set<string>();

    for (const node of this.nodes) {
      const nodeType = node.constructor.name;
      if (!(nodeType === 'Pipe' || nodeType === 'Belt') || visited.has(node.id)) continue;

      const cluster = new Set<string>();
      const stack = [node.id];
      const inputNodes = new Map<string, number>();
      const outputNodes = new Map<string, number>();

      while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (!visited.has(currentId)) {
          visited.add(currentId);
          cluster.add(currentId);

          const currentNode = this.getNodeOrThrow(currentId);
          for (const inputEdge of currentNode.inputEdges) {
            const inputNode = this.getNodeOrThrow(inputEdge.fromId);
            if (inputNode.constructor.name === nodeType) {
              stack.push(inputEdge.fromId);
            } else {
              const edgeIndex = inputNode.outputEdges.findIndex((edge) => edge.toId === currentId);
              inputNodes.set(inputEdge.fromId, edgeIndex);
            }
          }

          for (const outputEdge of currentNode.outputEdges) {
            const outputNode = this.getNodeOrThrow(outputEdge.toId);
            if (outputNode.constructor.name === nodeType) {
              stack.push(outputEdge.toId);
            } else {
              const edgeIndex = outputNode.inputEdges.findIndex((edge) => edge.fromId === currentId);
              outputNodes.set(outputEdge.toId, edgeIndex);
            }
          }
        }
      }

      if (cluster.size > 1) {
        // Remove all edges and nodes in the cluster
        for (const pipeId of cluster) {
          const pipeNode = this.getNodeOrThrow(pipeId);
          for (const inputEdge of pipeNode.inputEdges) {
            this.removeEdge(inputEdge.fromId, pipeId);
          }
          for (const outputEdge of pipeNode.outputEdges) {
            this.removeEdge(pipeId, outputEdge.toId);
          }
          this.removeNode(pipeId);
        }

        // Connect all inputs and outputs to a single new Pipe node
        this.addNode(nodeType === 'Pipe' ? new Pipe({ id: node.id }) : new Belt({ id: node.id }));
        const edgeType: EdgeProductType = nodeType === 'Pipe' ? 'color' : 'shape';
        for (const inputId of inputNodes) {
          this.addEdge(inputId[0], node.id, edgeType, inputId[1]);
        }
        for (const outputId of outputNodes) {
          this.addEdge(node.id, outputId[0], edgeType, undefined, outputId[1]);
        }
      }
    }
  };

  private removeDeadEnds = (): void => {
    const deadEndNodeIds = this.nodes.filter((node) => {
      if (node.inputEdges.length === 0 && !(node instanceof Generator)) {
        return true
      }
      if (node.inputEdges.length === 1 && (node instanceof Stacker
        || node instanceof Painter
        || node instanceof Crystalizer
        || node instanceof ColorMixer
        || node instanceof Swapper)
      ) {
        return true
      }
      if (node.outputEdges.length === 0 && !(node instanceof Trash)) {
        return true
      }
    }).map((node) => node.id);

    const visited = new Set<string>(deadEndNodeIds);

    while (deadEndNodeIds.length > 0) {
      const nodeId = deadEndNodeIds.pop()!;
      const node = this.getNodeOrThrow(nodeId);
      for (const inputEdge of node.inputEdges) {
        this.removeEdge(inputEdge.fromId, nodeId);
        if (!visited.has(inputEdge.fromId)) {
          visited.add(inputEdge.fromId);
          deadEndNodeIds.push(inputEdge.fromId);
        }
      }
      for (const outputEdge of node.outputEdges) {
        this.removeEdge(nodeId, outputEdge.toId);
        if (!visited.has(outputEdge.toId)) {
          visited.add(outputEdge.toId);
          deadEndNodeIds.push(outputEdge.toId);
        }
      }
      this.removeNode(nodeId);
    }
  }
}
