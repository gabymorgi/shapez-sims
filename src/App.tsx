import './App.css'
import {
  EncodedShape,
} from './components/QuarterShapes'
import { Shape } from './models/Shape'

function App() {
  const examples = [
    'CrRgSbWm',
    'cr------',
    'cwcwCgCw',
    'CrRgSbWm:WuCgSyRb',
    'SrCgWbRy:CmWgSbRu:--CrSgRb',
    'CrCbP-Cw:cyCrP-Rb:WucgP---:cwcwccRy',
  ]

  return (
    <main className="shape-showcase">
      <section>
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
          <EncodedShape code={Shape.fromCode(
            "CrCbP-Cw:cyCrP-Rb:WucgP---:cwcwccRy"
          ).rotate('clockwise').toString()} />
        </div>
      </section>
    </main>
  )
}

export default App
