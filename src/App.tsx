import './App.css'
import { useMemo, useState } from 'react'
import type { SubmitEvent } from 'react'
import {
  EncodedShape,
} from './components/QuarterShapes'
import { codeToShape } from './utils/Shape'
import { SimulatorGraphVisualizer } from './components/SimulatorGraphVisualizer'
import { SimulatorGraph } from './utils/simulatorGraph/SimulatorGraph.ts'
import { Generator } from './utils/simulator/Generator.ts'
import { Belt } from './utils/simulator/Belt.ts'
import { Rotator } from './utils/simulator/Rotator.ts'
import { Painter } from './utils/simulator/Painter.ts'
import { Pipe } from './utils/simulator/Pipe.ts'
import { ColorMixer } from './utils/simulator/ColorMixer.ts'
import { Trash } from './utils/simulator/Trash.ts'
import { Rotation, createColorProduct, createShapeProduct } from './utils/simulator/utils.ts'
import { Cutter } from './utils/simulator/Cutter.ts'

function createDemoSimulatorGraph(): SimulatorGraph {
  const graph = new SimulatorGraph()

  graph.addNode(new Generator({ id: 'shape-source' }, createShapeProduct(codeToShape('CrRgSbWm'))))
  graph.addNode(new Belt({ id: 'A' }))
  graph.addNode(new Belt({ id: 'B' }))
  graph.addNode(new Cutter({ id: 'C' }))
  graph.addNode(new Belt({ id: 'D' }))
  graph.addNode(new Belt({ id: 'E' }))
  graph.addNode(new Belt({ id: 'F' }))
  graph.addNode(new Belt({ id: 'G' }))
  // graph.addNode(new Belt({ id: 'H' }))
  graph.addNode(new Rotator({ id: 'I' }, Rotation.HalfTurn))
  graph.addNode(new Belt({ id: 'J' }))
  graph.addNode(new Belt({ id: 'K' }))
  graph.addNode(new Cutter({ id: 'L' }))
  graph.addNode(new Belt({ id: 'M' }))
  graph.addNode(new Belt({ id: 'N' }))
  graph.addNode(new Rotator({ id: 'O' }, Rotation.HalfTurn))
  graph.addNode(new Belt({ id: 'P' }))

  graph.addEdge('shape-source', 'A', 'shape')
  graph.addEdge('A', 'B', 'shape')
  graph.addEdge('B', 'C', 'shape')
  graph.addEdge('B', 'G', 'shape')
  graph.addEdge('C', 'D', 'shape', 0)
  graph.addEdge('C', 'I', 'shape', 1)
  graph.addEdge('D', 'E', 'shape')
  graph.addEdge('E', 'F', 'shape')
  graph.addEdge('G', 'K', 'shape')
  graph.addEdge('K', 'L', 'shape')
  graph.addEdge('I', 'J', 'shape')
  graph.addEdge('J', 'E', 'shape')
  graph.addEdge('L', 'M', 'shape', 0)
  graph.addEdge('L', 'O', 'shape', 1)
  graph.addEdge('M', 'N', 'shape')
  graph.addEdge('O', 'P', 'shape')
  graph.addEdge('P', 'N', 'shape')
  graph.addEdge('N', 'J', 'shape')

  return graph
}

function App() {
  const [newShapeCode, setNewShapeCode] = useState('')
  const [submittedShapes, setSubmittedShapes] = useState<string[]>([])
  const demoGraphs: SimulatorGraph[] = useMemo(() => {
    const g = createDemoSimulatorGraph()
    g.optimizeBelts()
    const h = createDemoSimulatorGraph()
    h.optimizePipes()
    return [
      createDemoSimulatorGraph(),
      // g,
      h,
    ]
  }, [])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedCode = newShapeCode.trim()

    if (!trimmedCode) {
      return
    }

    setSubmittedShapes((currentShapes) => [...currentShapes, trimmedCode])
    setNewShapeCode('')
  }

  function handleDeleteShape(shapeIndex: number) {
    setSubmittedShapes((currentShapes) => currentShapes.filter((_, index) => index !== shapeIndex))
  }

  return (
    <main className="shape-showcase">
      <section>
        <h2>Add A New Shape</h2>
        <form className="shape-form" onSubmit={handleSubmit}>
          <label htmlFor="shape-code-input">Shape code</label>
          <div className="shape-form-row">
            <input
              id="shape-code-input"
              type="text"
              value={newShapeCode}
              onChange={(event) => setNewShapeCode(event.target.value)}
              placeholder="e.g. CrRgSbWm"
            />
            <button type="submit">Add Shape</button>
          </div>
        </form>

        {submittedShapes.length > 0 && (
          <div>
            <h3>Submitted Shapes</h3>
            <div className="examples-grid">
              {submittedShapes.map((shape, index) => (
                <article key={`${shape}-${index}`} className="card">
                  <EncodedShape code={shape} />
                  <p className="example-code">{shape}</p>
                  <button
                    type="button"
                    className="delete-shape-button"
                    onClick={() => handleDeleteShape(index)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        <hr />
      </section>

      <section className="visualizer-section">
        <h2>Simulator Graph Visualizer</h2>
        <p className="visualizer-description">
          Layered DAG rendering of a sample production line with shape and color flows.
        </p>
        {demoGraphs.map((demoGraph, index) => (
          <SimulatorGraphVisualizer graph={demoGraph} key={index} />
        ))}
      </section>
    </main>
  )
}

export default App
