import { describe, expect, it } from 'vitest'
import { Belt } from '../simulator/Belt.ts'
import { Painter } from '../simulator/Painter.ts'
import { Rotator } from '../simulator/Rotator.ts'
import { SimulatorGraph } from './SimulatorGraph.ts'
import { Pipe } from '../simulator/Pipe.ts'
import { Rotation } from '../simulator/utils.ts'

describe('SimulatorGraph edge validation', () => {
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

    graph.addEdge(shapeSource.id, painter.id, 'shape')
    graph.addEdge(colorSource.id, painter.id, 'color')

    expect(painter.inputEdges).toHaveLength(2)
    expect(painter.inputEdges[0]?.edgeType).toBe('shape')
    expect(painter.inputEdges[1]?.edgeType).toBe('color')
  })

  it('doesnt reject Painter connections when index types are swapped', () => {
    const graph = new SimulatorGraph()
    const shapeSource = new Belt({ id: 'shape-source' })
    const colorSource = new Pipe({ id: 'color-source' })
    const painter = new Painter({ id: 'painter' })

    graph.addNode(shapeSource)
    graph.addNode(colorSource)
    graph.addNode(painter)

    expect(() => graph.addEdge(colorSource.id, painter.id, 'color')).not.toThrow()
    expect(() => graph.addEdge(shapeSource.id, painter.id, 'shape')).not.toThrow()
  })

  it('still rejects edges that would create cycles', () => {
    const graph = new SimulatorGraph()
    const first = new Belt({ id: 'first' })
    const second = new Belt({ id: 'second' })

    graph.addNode(first)
    graph.addNode(second)

    graph.addEdge(first.id, second.id, 'shape')

    expect(() => graph.addEdge(second.id, first.id, 'shape')).toThrow(/create a cycle/i)
  })
})
