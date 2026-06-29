import './App.css'
import { useMemo, useState } from 'react'
import type { SubmitEvent } from 'react'
import {
  EncodedShape,
} from './components/QuarterShapes'
import { SimulatorGraphVisualizer } from './components/SimulatorGraphVisualizer'
import exampleGraphFactories from './utils/examples'
import { SimulatorGraph } from './utils/simulatorGraph/SimulatorGraph.ts'

type DemoGraphFactory = () => SimulatorGraph

type DemoGraphOption = {
  id: string
  label: string
  createGraph: DemoGraphFactory
}

function formatExampleLabel(exampleId: string): string {
  return exampleId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
}

const demoGraphOptions: DemoGraphOption[] = Object.entries(exampleGraphFactories)
  .filter(([, graphFactory]) => typeof graphFactory === 'function')
  .map(([id, graphFactory]) => ({
    id,
    label: formatExampleLabel(id),
    createGraph: graphFactory as DemoGraphFactory,
  }))

function App() {
  const [newShapeCode, setNewShapeCode] = useState('')
  const [submittedShapes, setSubmittedShapes] = useState<string[]>([])
  const [selectedExampleId, setSelectedExampleId] = useState<string>(demoGraphOptions[0]?.id ?? '')

  const selectedExample = useMemo(
    () => demoGraphOptions.find((option) => option.id === selectedExampleId),
    [selectedExampleId]
  )

  const selectedGraphs = useMemo(() => {
    if (!selectedExample) {
      return null
    }

    const originalGraph = selectedExample.createGraph()
    const optimizedGraph = selectedExample.createGraph()
    optimizedGraph.optimizeBelts()
    // optimizedGraph.optimizePipes()

    return {
      originalGraph,
      optimizedGraph,
    }
  }, [selectedExample])

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
        <div className="shape-form">
          <label htmlFor="example-graph-select">Example graph</label>
          <select
            id="example-graph-select"
            value={selectedExampleId}
            onChange={(event) => setSelectedExampleId(event.target.value)}
          >
            {demoGraphOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedGraphs && (
          <>
            <h3>Original</h3>
            <SimulatorGraphVisualizer graph={selectedGraphs.originalGraph} />
            <h3>Optimized</h3>
            <SimulatorGraphVisualizer graph={selectedGraphs.optimizedGraph} />
          </>
        )}
      </section>
    </main>
  )
}

export default App
