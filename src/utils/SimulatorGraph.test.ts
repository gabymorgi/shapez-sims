import { describe, expect, it } from 'vitest'
import { SimulatorGraph } from './SimulatorGraph.ts'
import { Belt, Rotation, Rotator, SimulatorNode } from './Simulator.ts'
import { codeToShape, shapeToCode } from './Shape.ts'

describe('SimulatorGraph structure', () => {
  it('tracks multiple roots/leaves and allows navigation both ways', () => {
    const a = new SimulatorNode({ id: 'A', simulator: new Belt(), throughput: [1, 2] })
    const b = new SimulatorNode({ id: 'B', simulator: new Belt(), throughput: [1, 2] })
    const c = new SimulatorNode({ id: 'C', simulator: new Belt(), throughput: [2, 3] })

    const graph = SimulatorGraph.empty()
    graph.addNode(a)
    graph.addNode(b)
    graph.addNode(c)
    graph.addEdge('A', 'C')
    graph.addEdge('B', 'C')

    expect(graph.rootIds).toEqual(['A', 'B'])
    expect(graph.leafIds).toEqual(['C'])

    expect(graph.getInputs('C').map((node) => node.id)).toEqual(['A', 'B'])
    expect(graph.getOutputs('A').map((node) => node.id)).toEqual(['C'])

    const cNode = graph.getNode('C')
    expect(cNode ? Array.from(cNode.inputIds) : undefined).toEqual(['A', 'B'])
    expect(cNode ? Array.from(cNode.outputIds) : undefined).toEqual([])
  })

  it('truncates source outputs if connect would create a cycle', () => {
    const graph = SimulatorGraph.empty()
    graph.addNode(new SimulatorNode({ id: 'A', simulator: new Belt(), throughput: [1, 1] }))
    graph.addNode(new SimulatorNode({ id: 'B', simulator: new Belt(), throughput: [1, 1] }))
    graph.addNode(new SimulatorNode({ id: 'C', simulator: new Belt(), throughput: [1, 1] }))
    graph.addNode(new SimulatorNode({ id: 'D', simulator: new Belt(), throughput: [1, 1] }))
    graph.addEdge('A', 'B')
    graph.addEdge('B', 'C')
    graph.addEdge('C', 'D')

    graph.addEdge('C', 'A')

    expect(Array.from(graph.getNode('C')?.outputIds ?? [])).toEqual(['D'])
    expect(Array.from(graph.getNode('D')?.inputIds ?? [])).toEqual(['C'])
    expect(Array.from(graph.getNode('A')?.inputIds ?? [])).toEqual([])
    expect(graph.topologicalOrder()).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('SimulatorGraph simulation', () => {
  it('propagates root outputs through connected nodes', () => {
    const source = new SimulatorNode({
      id: 'source',
      simulator: new Belt(),
      throughput: [1, 1],
    })

    const transform = new SimulatorNode({
      id: 'transform',
      simulator: new Rotator(120, Rotation.Clockwise),
      throughput: [2, 2],
    })

    const sink = new SimulatorNode({
      id: 'sink',
      simulator: new Belt(),
      throughput: [1, 1],
    })

    const graph = SimulatorGraph.empty()
    graph.addNode(source)
    graph.addNode(transform)
    graph.addNode(sink)
    graph.addEdge('source', 'transform')
    graph.addEdge('transform', 'sink')

    const outputs = graph.simulate({
      source: [codeToShape('CrRgSbWm')],
    })

    expect(outputs.source.map((shape) => shapeToCode(shape))).toEqual(['CrRgSbWm'])
    expect(outputs.transform.map((shape) => shapeToCode(shape))).toEqual(['WmCrRgSb'])
    expect(outputs.sink.map((shape) => shapeToCode(shape))).toEqual(['WmCrRgSb'])
  })

  it('aggregates inputs from multiple parents', () => {
    const graph = SimulatorGraph.empty()
    graph.addNode(new SimulatorNode({ id: 'left', simulator: new Belt(), throughput: [1, 1] }))
    graph.addNode(new SimulatorNode({ id: 'right', simulator: new Belt(), throughput: [1, 1] }))
    graph.addNode(new SimulatorNode({ id: 'merge', simulator: new Belt(), throughput: [2, 2] }))
    graph.addEdge('left', 'merge')
    graph.addEdge('right', 'merge')

    const outputs = graph.simulate({
      left: [codeToShape('CrRgSbWm')],
      right: [codeToShape('WuCgSyRb')],
    })

    expect(outputs.merge.map((shape) => shapeToCode(shape))).toEqual(['CrRgSbWm'])

    const secondTickOutputs = graph.simulate()
    expect(secondTickOutputs.merge.map((shape) => shapeToCode(shape))).toEqual(['WuCgSyRb'])
  })
})
