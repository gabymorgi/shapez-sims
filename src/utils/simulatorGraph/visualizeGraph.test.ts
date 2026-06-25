import { describe, expect, it } from 'vitest'
import { codeToShape } from '../Shape.ts'
import { Belt } from '../simulator/Belt.ts'
import { Generator } from '../simulator/Generator.ts'
import { Pipe } from '../simulator/Pipe.ts'
import { Rotator } from '../simulator/Rotator.ts'
import { Trash } from '../simulator/Trash.ts'
import { Rotation } from '../simulator/utils.ts'
import { SimulatorGraph } from './SimulatorGraph.ts'
import { buildGraphVisualizerLayout } from './visualizeGraph.ts'

function edgeById(layout: ReturnType<typeof buildGraphVisualizerLayout>, id: string) {
  const edge = layout.edges.find((candidate) => candidate.id === id)
  expect(edge).toBeDefined()
  return edge!
}

describe('buildGraphVisualizerLayout hash flow', () => {
  it('assigns unique generator letters and appends node letter for non-belt non-pipe nodes', () => {
    const graph = new SimulatorGraph()
    const genA = new Generator({ id: 'gen-a' }, { shape: codeToShape('CrCrCrCr') })
    const genB = new Generator({ id: 'gen-b' }, { shape: codeToShape('CgCgCgCg') })
    const belt = new Belt({ id: 'belt-1' })
    const rotator = new Rotator({ id: 'rot-1' }, Rotation.Clockwise)
    const sink = new Trash({ id: 'trash-1' })

    graph.addNode(genA)
    graph.addNode(genB)
    graph.addNode(belt)
    graph.addNode(rotator)
    graph.addNode(sink)

    graph.addEdge(genA.id, belt.id, 'shape')
    graph.addEdge(genB.id, belt.id, 'shape')
    graph.addEdge(belt.id, rotator.id, 'shape')
    graph.addEdge(rotator.id, sink.id, 'shape')

    const layout = buildGraphVisualizerLayout(graph)

    expect(edgeById(layout, 'gen-a->belt-1').hashFlow).toBe('A:120')
    expect(edgeById(layout, 'gen-b->belt-1').hashFlow).toBe('B:120')
    expect(edgeById(layout, 'belt-1->rot-1').hashFlow).toBe('A:120-B:120')
    expect(edgeById(layout, 'rot-1->trash-1').hashFlow).toBe('AR:120-BR:120')

    const rotatorNode = layout.nodes.find((node) => node.id === rotator.id)
    expect(rotatorNode).toBeDefined()
    expect(rotatorNode?.inputHashFlow).toBe('A:120-B:120')
    expect(rotatorNode?.outputHashFlow).toBe('AR:120-BR:120')
  })

  it('sums and evenly divides belt flows across outputs', () => {
    const graph = new SimulatorGraph()
    const genA = new Generator({ id: 'gen-a' }, { shape: codeToShape('CrCrCrCr') })
    const genB = new Generator({ id: 'gen-b' }, { shape: codeToShape('CgCgCgCg') })
    const belt = new Belt({ id: 'belt-main' })
    const outA = new Belt({ id: 'out-a' })
    const outB = new Belt({ id: 'out-b' })

    graph.addNode(genA)
    graph.addNode(genB)
    graph.addNode(belt)
    graph.addNode(outA)
    graph.addNode(outB)

    graph.addEdge(genA.id, belt.id, 'shape')
    graph.addEdge(genB.id, belt.id, 'shape')
    graph.addEdge(belt.id, outA.id, 'shape')
    graph.addEdge(belt.id, outB.id, 'shape')

    const layout = buildGraphVisualizerLayout(graph)

    const edgeToA = edgeById(layout, 'belt-main->out-a')
    const edgeToB = edgeById(layout, 'belt-main->out-b')

    expect(edgeToA.hashFlow).toBe('A:60-B:60')
    expect(edgeToB.hashFlow).toBe('A:60-B:60')
    expect(edgeToA.hashFlow.includes(':')).toBe(true)
    expect(edgeToA.hashFlow.includes('-')).toBe(true)
  })

  it('sums and evenly divides pipe flows across outputs', () => {
    const graph = new SimulatorGraph()
    const genA = new Generator({ id: 'gen-a' }, { color: 'r', amount: 300 })
    const genB = new Generator({ id: 'gen-b' }, { color: 'g', amount: 300 })
    const pipe = new Pipe({ id: 'pipe-main' })
    const outA = new Pipe({ id: 'out-a' })
    const outB = new Pipe({ id: 'out-b' })

    graph.addNode(genA)
    graph.addNode(genB)
    graph.addNode(pipe)
    graph.addNode(outA)
    graph.addNode(outB)

    graph.addEdge(genA.id, pipe.id, 'color')
    graph.addEdge(genB.id, pipe.id, 'color')
    graph.addEdge(pipe.id, outA.id, 'color')
    graph.addEdge(pipe.id, outB.id, 'color')

    const layout = buildGraphVisualizerLayout(graph)

    expect(edgeById(layout, 'pipe-main->out-a').hashFlow).toBe('A:60-B:60')
    expect(edgeById(layout, 'pipe-main->out-b').hashFlow).toBe('A:60-B:60')

    const pipeNode = layout.nodes.find((node) => node.id === pipe.id)
    expect(pipeNode).toBeDefined()
    expect(pipeNode?.inputHashFlow).toBe('A:120-B:120')
    expect(pipeNode?.outputHashFlow).toBe('A:120-B:120')
  })
})

describe('buildGraphVisualizerLayout lane assignment', () => {
  it('keeps all nodes on one lane for a non-branching chain', () => {
    const graph = new SimulatorGraph()

    const generator = new Generator({ id: 'gen' }, { shape: codeToShape('CrCrCrCr') })
    const beltA = new Belt({ id: 'belt-a' })
    const beltB = new Belt({ id: 'belt-b' })
    const sink = new Trash({ id: 'sink' })

    graph.addNode(generator)
    graph.addNode(beltA)
    graph.addNode(beltB)
    graph.addNode(sink)

    graph.addEdge(generator.id, beltA.id, 'shape')
    graph.addEdge(beltA.id, beltB.id, 'shape')
    graph.addEdge(beltB.id, sink.id, 'shape')

    const layout = buildGraphVisualizerLayout(graph)

    expect(layout.nodes.every((node) => node.lane === 0)).toBe(true)
  })

  it('keeps a longer branch on its own row before rejoin', () => {
    const graph = new SimulatorGraph()

    const generator = new Generator({ id: 'gen' }, { shape: codeToShape('CrCrCrCr') })
    const splitter = new Belt({ id: 'split' })
    const shortBranch = new Belt({ id: 'short' })
    const longBranchStart = new Belt({ id: 'long-start' })
    const longBranchEnd = new Belt({ id: 'long-end' })
    const merge = new Belt({ id: 'merge' })
    const sink = new Trash({ id: 'sink' })

    graph.addNode(generator)
    graph.addNode(splitter)
    graph.addNode(shortBranch)
    graph.addNode(longBranchStart)
    graph.addNode(longBranchEnd)
    graph.addNode(merge)
    graph.addNode(sink)

    graph.addEdge(generator.id, splitter.id, 'shape')
    graph.addEdge(splitter.id, shortBranch.id, 'shape')
    graph.addEdge(splitter.id, longBranchStart.id, 'shape')
    graph.addEdge(shortBranch.id, merge.id, 'shape')
    graph.addEdge(longBranchStart.id, longBranchEnd.id, 'shape')
    graph.addEdge(longBranchEnd.id, merge.id, 'shape')
    graph.addEdge(merge.id, sink.id, 'shape')

    const layout = buildGraphVisualizerLayout(graph)
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))

    const shortBranchNode = nodeById.get(shortBranch.id)
    const longBranchStartNode = nodeById.get(longBranchStart.id)
    const longBranchEndNode = nodeById.get(longBranchEnd.id)

    expect(shortBranchNode).toBeDefined()
    expect(longBranchStartNode).toBeDefined()
    expect(longBranchEndNode).toBeDefined()

    expect(shortBranchNode?.lane).not.toBe(longBranchStartNode?.lane)
    expect(longBranchEndNode?.lane).toBe(longBranchStartNode?.lane)
  })

  it('produces the same lane mapping for equivalent graphs with different node insertion order', () => {
    function buildLaneMap(nodeOrder: string[]): Map<string, number> {
      const graph = new SimulatorGraph()

      const nodes = {
        gen: new Generator({ id: 'gen' }, { shape: codeToShape('CrCrCrCr') }),
        split: new Belt({ id: 'split' }),
        short: new Belt({ id: 'short' }),
        longStart: new Belt({ id: 'long-start' }),
        longEnd: new Belt({ id: 'long-end' }),
        merge: new Belt({ id: 'merge' }),
        sink: new Trash({ id: 'sink' }),
      }

      const nodeByKey = new Map<string, Belt | Generator | Trash>([
        ['gen', nodes.gen],
        ['split', nodes.split],
        ['short', nodes.short],
        ['longStart', nodes.longStart],
        ['longEnd', nodes.longEnd],
        ['merge', nodes.merge],
        ['sink', nodes.sink],
      ])

      for (const key of nodeOrder) {
        const node = nodeByKey.get(key)
        expect(node).toBeDefined()
        graph.addNode(node!)
      }

      graph.addEdge(nodes.gen.id, nodes.split.id, 'shape')
      graph.addEdge(nodes.split.id, nodes.short.id, 'shape')
      graph.addEdge(nodes.split.id, nodes.longStart.id, 'shape')
      graph.addEdge(nodes.short.id, nodes.merge.id, 'shape')
      graph.addEdge(nodes.longStart.id, nodes.longEnd.id, 'shape')
      graph.addEdge(nodes.longEnd.id, nodes.merge.id, 'shape')
      graph.addEdge(nodes.merge.id, nodes.sink.id, 'shape')

      const layout = buildGraphVisualizerLayout(graph)
      return new Map(layout.nodes.map((node) => [node.id, node.lane]))
    }

    const first = buildLaneMap(['gen', 'split', 'short', 'longStart', 'longEnd', 'merge', 'sink'])
    const second = buildLaneMap(['sink', 'merge', 'longEnd', 'longStart', 'short', 'split', 'gen'])

    expect([...first.entries()].sort((left, right) => left[0].localeCompare(right[0]))).toEqual(
      [...second.entries()].sort((left, right) => left[0].localeCompare(right[0])),
    )
  })
})
