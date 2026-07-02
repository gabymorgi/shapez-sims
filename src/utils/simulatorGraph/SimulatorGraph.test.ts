import { describe, expect, it } from 'vitest'
import { Belt } from '../simulator/Belt.ts'
import { Painter } from '../simulator/Painter.ts'
import { Rotator } from '../simulator/Rotator.ts'
import { SimulatorGraph } from './SimulatorGraph.ts'
import { Pipe } from '../simulator/Pipe.ts'
import { Rotation } from '../simulator/utils.ts'
import { Stacker } from '../simulator/Stacker.ts'
import { Generator } from '../simulator/Generator.ts'
import { codeToShape } from '../Shape.ts'

function getNodeType(node: { constructor: { name: string } }): string {
  return node.constructor.name
}

function getNodeSignature(node: {
  constructor: { name: string }
  inputs: Array<{ edgeType: string }>
  outputs: Array<{ edgeType: string }>
}): string {
  const shapeInputs = node.inputs.filter((edge) => edge.edgeType === 'shape').length
  const colorInputs = node.inputs.filter((edge) => edge.edgeType === 'color').length
  const shapeOutputs = node.outputs.filter((edge) => edge.edgeType === 'shape').length
  const colorOutputs = node.outputs.filter((edge) => edge.edgeType === 'color').length

  return [getNodeType(node), shapeInputs, colorInputs, shapeOutputs, colorOutputs].join('|')
}

function areGraphsEquivalent(left: SimulatorGraph, right: SimulatorGraph): boolean {
  if (left.nodes.length !== right.nodes.length || left.edges.length !== right.edges.length) {
    return false
  }

  const leftNodes = left.nodes
  const rightNodes = right.nodes

  const leftById = new Map(leftNodes.map((node) => [node.id, node]))
  const rightById = new Map(rightNodes.map((node) => [node.id, node]))

  const rightIdsBySignature = new Map<string, string[]>()
  for (const node of rightNodes) {
    const signature = getNodeSignature(node)
    const bucket = rightIdsBySignature.get(signature)
    if (bucket) {
      bucket.push(node.id)
    } else {
      rightIdsBySignature.set(signature, [node.id])
    }
  }

  const leftIdsByRarity = [...leftNodes]
    .sort((a, b) => {
      const aCount = rightIdsBySignature.get(getNodeSignature(a))?.length ?? 0
      const bCount = rightIdsBySignature.get(getNodeSignature(b))?.length ?? 0
      return aCount - bCount
    })
    .map((node) => node.id)

  const leftToRight = new Map<string, string>()
  const usedRightIds = new Set<string>()

  const hasMappedEdge = (
    fromRightId: string,
    toRightId: string,
    edgeType: string,
    direction: 'output' | 'input'
  ): boolean => {
    const fromNode = rightById.get(fromRightId)
    const toNode = rightById.get(toRightId)
    if (!fromNode || !toNode) {
      return false
    }

    if (direction === 'output') {
      return fromNode.outputs.some((edge) => edge.toId === toRightId && edge.edgeType === edgeType)
    }

    return toNode.inputs.some((edge) => edge.fromId === fromRightId && edge.edgeType === edgeType)
  }

  const mappingIsLocallyValid = (leftId: string, rightId: string): boolean => {
    const leftNode = leftById.get(leftId)
    if (!leftNode) {
      return false
    }

    for (const output of leftNode.outputs) {
      const mappedTarget = leftToRight.get(output.toId)
      if (!mappedTarget) {
        continue
      }

      if (!hasMappedEdge(rightId, mappedTarget, output.edgeType, 'output')) {
        return false
      }
    }

    for (const input of leftNode.inputs) {
      const mappedSource = leftToRight.get(input.fromId)
      if (!mappedSource) {
        continue
      }

      if (!hasMappedEdge(mappedSource, rightId, input.edgeType, 'input')) {
        return false
      }
    }

    return true
  }

  const buildMapping = (index: number): boolean => {
    if (index === leftIdsByRarity.length) {
      return true
    }

    const leftId = leftIdsByRarity[index]
    const leftNode = leftById.get(leftId)
    if (!leftNode) {
      return false
    }

    const candidates = rightIdsBySignature.get(getNodeSignature(leftNode)) ?? []
    for (const candidateId of candidates) {
      if (usedRightIds.has(candidateId)) {
        continue
      }

      if (!mappingIsLocallyValid(leftId, candidateId)) {
        continue
      }

      leftToRight.set(leftId, candidateId)
      usedRightIds.add(candidateId)

      if (buildMapping(index + 1)) {
        return true
      }

      usedRightIds.delete(candidateId)
      leftToRight.delete(leftId)
    }

    return false
  }

  if (!buildMapping(0)) {
    return false
  }

  const mappedEdges = new Set<string>()
  for (const edge of left.edges) {
    const fromMapped = leftToRight.get(edge.fromId)
    const toMapped = leftToRight.get(edge.toId)
    if (!fromMapped || !toMapped) {
      return false
    }
    mappedEdges.add(`${fromMapped}->${toMapped}|${edge.edgeType}`)
  }

  const rightEdges = new Set(
    right.edges.map((edge) => `${edge.fromId}->${edge.toId}|${edge.edgeType}`)
  )

  if (mappedEdges.size !== rightEdges.size) {
    return false
  }

  for (const edge of mappedEdges) {
    if (!rightEdges.has(edge)) {
      return false
    }
  }

  return true
}

describe('SimulatorGraph', () => {
  describe('graph equivalence', () => {
    it('matches graphs with different node ids but same structure', () => {
      const left = new SimulatorGraph()
      const leftSource = new Belt({ id: 'left-source' })
      const leftTransform = new Rotator({ id: 'left-rotator' }, Rotation.Clockwise)
      const leftTarget = new Belt({ id: 'left-target' })

      left.addNode(leftSource)
      left.addNode(leftTransform)
      left.addNode(leftTarget)

      left.addEdge(leftSource.id, leftTransform.id, 'shape')
      left.addEdge(leftTransform.id, leftTarget.id, 'shape')

      const right = new SimulatorGraph()
      const rightSource = new Belt({ id: 'other-a' })
      const rightTransform = new Rotator({ id: 'other-b' }, Rotation.Clockwise)
      const rightTarget = new Belt({ id: 'other-c' })

      right.addNode(rightSource)
      right.addNode(rightTransform)
      right.addNode(rightTarget)

      right.addEdge(rightSource.id, rightTransform.id, 'shape')
      right.addEdge(rightTransform.id, rightTarget.id, 'shape')

      expect(areGraphsEquivalent(left, right)).toBe(true)
    })

    it('detects non-equivalent graphs with different connectivity', () => {
      const left = new SimulatorGraph()
      const leftA = new Belt({ id: 'a1' })
      const leftB = new Belt({ id: 'b1' })
      const leftC = new Belt({ id: 'c1' })

      left.addNode(leftA)
      left.addNode(leftB)
      left.addNode(leftC)

      left.addEdge(leftA.id, leftB.id, 'shape')
      left.addEdge(leftB.id, leftC.id, 'shape')

      const right = new SimulatorGraph()
      const rightA = new Belt({ id: 'x1' })
      const rightB = new Belt({ id: 'y1' })
      const rightC = new Belt({ id: 'z1' })

      right.addNode(rightA)
      right.addNode(rightB)
      right.addNode(rightC)

      right.addEdge(rightA.id, rightB.id, 'shape')
      right.addEdge(rightA.id, rightC.id, 'shape')

      expect(areGraphsEquivalent(left, right)).toBe(false)
    })

    it('detects non-equivalent graphs with different node types', () => {
      const left = new SimulatorGraph()
      const leftSource = new Belt({ id: 'shape-source' })
      const leftTarget = new Belt({ id: 'shape-target' })

      left.addNode(leftSource)
      left.addNode(leftTarget)
      left.addEdge(leftSource.id, leftTarget.id, 'shape')

      const right = new SimulatorGraph()
      const rightSource = new Pipe({ id: 'color-source' })
      const rightTarget = new Pipe({ id: 'color-target' })

      right.addNode(rightSource)
      right.addNode(rightTarget)
      right.addEdge(rightSource.id, rightTarget.id, 'color')

      expect(areGraphsEquivalent(left, right)).toBe(false)
    })

    it('detects non-equivalent graphs with different node sub-types', () => {
      const left = new SimulatorGraph()
      const leftSource = new Belt({ id: 'shape-source' })
      const leftTarget = new Rotator({ id: 'rot-clock' }, Rotation.Clockwise)

      left.addNode(leftSource)
      left.addNode(leftTarget)
      left.addEdge(leftSource.id, leftTarget.id, 'shape')

      const right = new SimulatorGraph()
      const rightSource = new Belt({ id: 'shape-source' })
      const rightTarget = new Rotator({ id: 'rot-anti' }, Rotation.Anticlockwise)

      right.addNode(rightSource)
      right.addNode(rightTarget)
      right.addEdge(rightSource.id, rightTarget.id, 'shape')

      expect(areGraphsEquivalent(left, right)).toBe(false)
    })

    it('detects non-equivalent graphs with different input connections', () => {
      const left = new SimulatorGraph()
      const leftSource = new Generator({ id: 'gen-a' }, { shape: codeToShape('CrCrCrCr') })
      const leftTarget = new Stacker({ id: 'stk' })

      left.addNode(leftSource)
      left.addNode(leftTarget)
      left.addEdge(leftSource.id, leftTarget.id, 'shape')

      const right = new SimulatorGraph()
      const rightSource = new Belt({ id: 'shape-source' })
      const rightTarget = new Rotator({ id: 'rot-anti' }, Rotation.Anticlockwise)

      right.addNode(rightSource)
      right.addNode(rightTarget)
      right.addEdge(rightSource.id, rightTarget.id, 'shape')

      expect(areGraphsEquivalent(left, right)).toBe(false)
    })

    it('detects non-equivalent graphs with different multipliers', () => {
      const left = new SimulatorGraph()
      const leftSource = new Belt({ id: 'shape-source' })
      const leftTarget = new Belt({ id: 'shape-target' })

      left.addNode(leftSource)
      left.addNode(leftTarget)
      left.addEdge(leftSource.id, leftTarget.id, 'shape')

      const right = new SimulatorGraph()
      const rightSource = new Pipe({ id: 'color-source' })
      const rightTarget = new Pipe({ id: 'color-target' })

      right.addNode(rightSource)
      right.addNode(rightTarget)
      right.addEdge(rightSource.id, rightTarget.id, 'color')

      expect(areGraphsEquivalent(left, right)).toBe(false)
    })
  })

  describe('edge validation', () => {
    it('creates a shape edge between compatible nodes', () => {
      const graph = new SimulatorGraph()
      const source = new Belt({ id: 'source' })
      const target = new Belt({ id: 'target' })

      graph.addNode(source)
      graph.addNode(target)

      graph.addEdge(source.id, target.id, 'shape')

      expect(source.outputEdges).toHaveLength(1)
      expect(target.inputEdges).toHaveLength(1)
      expect(source.outputEdges[0]?.edgeType).toBe('shape')
    })

    it('rejects an edge type disallowed by the source node', () => {
      const graph = new SimulatorGraph()
      const source = new Pipe({ id: 'color-source' })
      const target = new Belt({ id: 'shape-target' })

      graph.addNode(source)
      graph.addNode(target)

      expect(() => graph.addEdge(source.id, target.id, 'shape')).toThrow(/cannot accept shape output/i)
      expect(source.outputEdges).toHaveLength(0)
      expect(target.inputEdges).toHaveLength(0)
    })

    it('rejects an edge type disallowed by the target node', () => {
      const graph = new SimulatorGraph()
      const source = new Belt({ id: 'shape-source' })
      const target = new Pipe({ id: 'color-target' })

      graph.addNode(source)
      graph.addNode(target)

      expect(() => graph.addEdge(source.id, target.id, 'shape')).toThrow(/cannot accept shape input/i)
      expect(source.outputEdges).toHaveLength(0)
      expect(target.inputEdges).toHaveLength(0)
    })

    it('rejects connecting more outputs than allowed', () => {
      const graph = new SimulatorGraph()
      const source = new Rotator({id: 'r'}, Rotation.Clockwise)
      const firstTarget = new Belt({ id: 'first-target' })
      const secondTarget = new Belt({ id: 'second-target' })

      graph.addNode(source)
      graph.addNode(firstTarget)
      graph.addNode(secondTarget)

      graph.addEdge(source.id, firstTarget.id, 'shape')

      expect(() => graph.addEdge(source.id, secondTarget.id, 'shape')).toThrow(/cannot accept shape output at index 1/i)
    })

    it('rejects connecting more inputs than allowed', () => {
      const graph = new SimulatorGraph()
      const firstSource = new Belt({ id: 'first-source' })
      const secondSource = new Belt({ id: 'second-source' })
      const target = new Rotator({ id: 'target' }, Rotation.Clockwise)

      graph.addNode(firstSource)
      graph.addNode(secondSource)
      graph.addNode(target)

      graph.addEdge(firstSource.id, target.id, 'shape')

      expect(() => graph.addEdge(secondSource.id, target.id, 'shape')).toThrow(/cannot accept shape input at index 1/i)
    })

    it('enforces Painter indexed input typing', () => {
      const graph = new SimulatorGraph()
      const shapeSource = new Belt({ id: 'shape-source' })
      const colorSource = new Pipe({ id: 'color-source' }) 
      const painter = new Painter({ id: 'painter' })

      graph.addNode(shapeSource)
      graph.addNode(colorSource)
      graph.addNode(painter)

      graph.addEdge(colorSource.id, painter.id, 'color')
      graph.addEdge(shapeSource.id, painter.id, 'shape')

      expect(painter.inputEdges).toHaveLength(2)
      expect(painter.inputEdges[0]?.edgeType).toBe('shape')
      expect(painter.inputEdges[1]?.edgeType).toBe('color')
    })

    it('rejects edges that would create cycles', () => {
      const graph = new SimulatorGraph()
      const first = new Belt({ id: 'first' })
      const second = new Belt({ id: 'second' })

      graph.addNode(first)
      graph.addNode(second)

      graph.addEdge(first.id, second.id, 'shape')

      expect(() => graph.addEdge(second.id, first.id, 'shape')).toThrow(/create a cycle/i)
    })
  })

  describe('graph simplification', () => {
    it('simplifies a chain of Pipe nodes into a single Pipe node', () => {
    })

    it('remove dead end', () => {})
    it('remove dead end with half connected nodes', () => {})
    it('doesnt remove trash', () => {})

    it('simplifies Belts when only one input or output', () => {})
    it('simplifies Belts connected with sim nodes', () => {})
    
    it('simplifies swappers when same inputs and outputs', () => {})
    it('simplifies swappers when same inputs, different outputs', () => {})
    it('simplifies swappers when different inputs, same outputs', () => {})
    it('simplifies swappers when one of inputs is different', () => {})
    it('simplifies swappers when one of outputs is different', () => {})

  })
})
