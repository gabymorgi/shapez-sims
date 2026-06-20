import './App.css'
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import {
  EncodedShape,
} from './components/QuarterShapes'
import { codeToShape, shapeToCode } from './utils/Shape'
import { rotateShapeProduct, Rotation } from './utils/simulator/Rotator'

function App() {
  const examples = [
    'CrRgSbWm',
    'cr------',
    'cwcwCgCw',
    'CrRgSbWm:WuCgSyRb',
    'SrCgWbRy:CmWgSbRu:--CrSgRb',
    'CrCbP-Cw:cyCrP-Rb:WucgP---:cwcwccRy',
  ]

  const [newShapeCode, setNewShapeCode] = useState('')
  const [submittedShapes, setSubmittedShapes] = useState<string[]>([])

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

  console.log(shapeToCode(rotateShapeProduct({ shape: codeToShape("crcbWrRc") }, Rotation.HalfTurn).shape))

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
        <h2>Encoded Shape Examples</h2>
        <div className="examples-grid">
          {examples.map((example) => (
            <article key={example} className="card">
              <EncodedShape code={example} />
              <p className="example-code">{example}</p>
            </article>
          ))}
        </div>
          <hr />
        <div className="examples-grid">
          <EncodedShape code="CrCbP-Cw:cyCrP-Rb:WucgP---:cwcwccRy" />
        </div>

        <hr />

        
      </section>
    </main>
  )
}

export default App
