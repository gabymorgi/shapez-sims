import type { SimulatorGraph } from './SimulatorGraph.ts'
import type { EdgeProductType } from './SimulatorEdge.ts'

export interface GraphVisualizerNode {
  id: string
  type: string
  depth: number
  lane: number
  x: number
  y: number
  inputCount: number
  outputCount: number
  inputHashFlow: string
  outputHashFlow: string
}

export interface GraphVisualizerEdge {
  id: string
  sourceId: string
  targetId: string
  edgeType: EdgeProductType
  laneY: number
  throughput: number
  hashFlow: string
}

export interface GraphVisualizerLayout {
  width: number
  height: number
  nodeWidth: number
  nodeHeight: number
  nodes: GraphVisualizerNode[]
  edges: GraphVisualizerEdge[]
}

export interface GraphVisualizerOptions {
  nodeWidth?: number
  nodeHeight?: number
  horizontalGap?: number
  verticalGap?: number
  padding?: number
}

const DEFAULT_OPTIONS: Required<GraphVisualizerOptions> = {
  nodeWidth: 150,
  nodeHeight: 82,
  horizontalGap: 72,
  verticalGap: 28,
  padding: 36,
}

type ProductFlowMap = Map<string, number>

function sequenceLabel(index: number): string {
  let cursor = index + 1
  let result = ''

  while (cursor > 0) {
    cursor -= 1
    result = String.fromCharCode(65 + (cursor % 26)) + result
    cursor = Math.floor(cursor / 26)
  }

  return result
}

function nodeTypeLetter(nodeType: string): string {
  return nodeType.charAt(0).toLowerCase() || 'n'
}

function appendNodeLetter(flow: ProductFlowMap, suffix: string): ProductFlowMap {
  const next = new Map<string, number>()

  let index = 0
  for (const [hash, throughput] of flow.entries()) {
    const expandedSuffix = flow.size > 1 ? `${suffix}${index + 1}` : suffix
    const nextHash = `${hash}${expandedSuffix}`
    next.set(nextHash, (next.get(nextHash) ?? 0) + throughput)
    index += 1
  }

  return next
}

function mergeFlow(maps: ProductFlowMap[]): ProductFlowMap {
  const merged = new Map<string, number>()

  for (const flow of maps) {
    for (const [hash, throughput] of flow.entries()) {
      merged.set(hash, (merged.get(hash) ?? 0) + throughput)
    }
  }

  return merged
}

function divideFlow(flow: ProductFlowMap, divisor: number): ProductFlowMap {
  if (divisor <= 0) {
    return new Map<string, number>()
  }

  const divided = new Map<string, number>()
  for (const [hash, throughput] of flow.entries()) {
    divided.set(hash, throughput / divisor)
  }

  return divided
}

function formatThroughput(throughput: number): string {
  if (Number.isInteger(throughput)) {
    return String(throughput)
  }

  return throughput.toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function formatHashFlow(flow: ProductFlowMap): string {
  const entries = [...flow.entries()].filter(([, throughput]) => throughput > 0)
  if (entries.length === 0) {
    return 'none:0'
  }

  entries.sort((left, right) => left[0].localeCompare(right[0]))
  return entries
    .map(([hash, throughput]) => `${hash}:${formatThroughput(throughput)}`)
    .join('-')
}

function getGraphLanes2(
  graph: SimulatorGraph,
  nodeId: string,
  laneByNodeId: Map<string, number>,
  laneByEdgeId: Map<string, number>,
  laneCursor: { value: number },
) {
  if (laneByNodeId.has(nodeId)) {
    return
  }
  laneByNodeId.set(nodeId, laneCursor.value)

  const node = graph.getNode(nodeId)
  if (!node) {
    return
  }

  node.outputEdges.forEach((outputEdge, index) => {
    if (index > 0) {
      laneCursor.value += 1
    }
    laneByEdgeId.set(outputEdge.id, laneCursor.value)
    getGraphLanes2(graph, outputEdge.toId, laneByNodeId, laneByEdgeId, laneCursor)
  })
}

function getGraphLanes(graph: SimulatorGraph): { laneByNodeId: Map<string, number>, laneByEdgeId: Map<string, number> } {
  const rootIds = graph.rootIds
  const laneByNodeId = new Map<string, number>()
  const laneByEdgeId = new Map<string, number>()

  const laneCursor = { value: 0 }
  rootIds.forEach((rootId) => {
    const rootNode = graph.getNode(rootId)
    if (!rootNode) {
      return
    }

    laneByNodeId.set(rootId, laneCursor.value)

    rootNode.outputEdges.forEach((outputEdge, outputIndex) => {
      if (outputIndex > 0) {
        laneCursor.value += 1
      }
      laneByEdgeId.set(outputEdge.id, laneCursor.value)
      getGraphLanes2(graph, outputEdge.toId, laneByNodeId, laneByEdgeId, laneCursor)
    })

    laneCursor.value += 1
  })

  return { laneByNodeId, laneByEdgeId }
}

export function buildGraphVisualizerLayout(
  graph: SimulatorGraph,
  options: GraphVisualizerOptions = {},
): GraphVisualizerLayout {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const orderedIds = graph.topologicalOrder()
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const edgeFlowById = new Map<string, ProductFlowMap>()
  const inputFlowByNodeId = new Map<string, ProductFlowMap>()
  const outputFlowByNodeId = new Map<string, ProductFlowMap>()

  let generatorCursor = 0

  for (const nodeId of orderedIds) {
    const node = nodeById.get(nodeId)
    if (!node) {
      continue
    }

    const nodeType = node.constructor.name
    
    const inputFlow = mergeFlow(node.inputEdges.map((edge) => edgeFlowById.get(edge.id) ?? new Map<string, number>()))
    inputFlowByNodeId.set(nodeId, inputFlow)

    const outputCount = node.outputEdges.length
    let outputFlow: ProductFlowMap = new Map<string, number>()

    switch (nodeType) {
      case 'Generator':
        outputFlow.set(sequenceLabel(generatorCursor), 120)
        generatorCursor += 1
        break
      case 'Belt': case 'Pipe': {
        
        for (const [hash, throughput] of inputFlow.entries()) {
          outputFlow.set(hash, throughput / (outputCount || 1))
        }
        break
      }
      default: {
        if (node.inputEdges.length === 1) {
          outputFlow = appendNodeLetter(inputFlow, nodeTypeLetter(nodeType))
        } else {
          const inputFlow = mergeFlow(node.inputEdges.map((edge) => edgeFlowById.get(edge.id) ?? new Map<string, number>()))
          inputFlowByNodeId.set(nodeId, inputFlow)
          const mergedHash: string = `(${[...inputFlow.keys()].sort().join('|')})`
          const minThroughput = Math.min(...[...inputFlow.values()])

          outputFlow = appendNodeLetter(new Map([[mergedHash, minThroughput]]), nodeTypeLetter(nodeType))
        }
      }
    }

    outputFlowByNodeId.set(nodeId, outputFlow)
    const perEdgeFlow = divideFlow(outputFlow, outputCount)

    for (const edge of node.outputEdges) {
      edgeFlowById.set(edge.id, perEdgeFlow)
    }
  }

  const depthById = new Map<string, number>()

  for (const nodeId of orderedIds) {
    const node = nodeById.get(nodeId)
    if (!node) {
      continue
    }

    const depth = node.inputEdges.reduce((maxDepth, inputEdge) => {
      const parentDepth = depthById.get(inputEdge.fromId) ?? 0
      return Math.max(maxDepth, parentDepth + 1)
    }, 0)

    depthById.set(nodeId, depth)
  }

  const { laneByNodeId, laneByEdgeId } = getGraphLanes(graph)
  console.log({ laneByNodeId, laneByEdgeId, depthById })

  const nodes: GraphVisualizerNode[] = []

  for (const [nodeId, depth] of depthById.entries()) {
    const node = nodeById.get(nodeId)
    if (!node) {
      continue
    }

    const lane = laneByNodeId.get(nodeId) ?? 0

    nodes.push({
      id: node.id,
      type: node.constructor.name,
      depth,
      lane,
      x: config.padding + depth * (config.nodeWidth + config.horizontalGap),
      y: config.padding + lane * (config.nodeHeight + config.verticalGap),
      inputCount: node.inputEdges.length,
      outputCount: node.outputEdges.length,
      inputHashFlow: formatHashFlow(inputFlowByNodeId.get(node.id) ?? new Map<string, number>()),
      outputHashFlow: formatHashFlow(outputFlowByNodeId.get(node.id) ?? new Map<string, number>()),
    })
  }

  const edges: GraphVisualizerEdge[] = []
  for (const node of graph.nodes) {
    for (const edge of node.outputEdges) {
      const lane = laneByEdgeId.get(edge.id) ?? 0
      edges.push({
        id: `${edge.fromId}->${edge.toId}`,
        sourceId: edge.fromId,
        targetId: edge.toId,
        edgeType: edge.edgeType,
        laneY: config.padding + lane * (config.nodeHeight + config.verticalGap) + config.nodeHeight / 2,
        throughput: edge.throughput,
        hashFlow: formatHashFlow(edgeFlowById.get(edge.id) ?? new Map<string, number>()),
      })
    }
  }

  const depthCount = Math.max(...depthById.values())
  const maxAssignedLane = Math.max(...nodes.map((node) => node.lane), 0)
  const laneCount = Math.max(maxAssignedLane + 1, 1)

  return {
    width: config.padding * 2 + depthCount * config.nodeWidth + Math.max(0, depthCount - 1) * config.horizontalGap,
    height: config.padding * 2 + laneCount * config.nodeHeight + Math.max(0, laneCount - 1) * config.verticalGap,
    nodeWidth: config.nodeWidth,
    nodeHeight: config.nodeHeight,
    nodes,
    edges,
  }
}
