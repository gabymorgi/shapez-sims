import { useId } from 'react'
import { codeToShape } from '../utils/Shape'

type Orientation = 'nw' | 'ne' | 'se' | 'sw'
type QuarterKind = 'circle' | 'square' | 'spike' | 'wedge'
type ShapeLetter = 'C' | 'R' | 'S' | 'W' | 'P' | 'c'
type ColorLetter = 'r' | 'g' | 'b' | 'c' | 'm' | 'y' | 'w' | 'u'

type QuarterProps = {
  fill: string
  orientation?: Orientation
  size?: number
  stroke?: string
  strokeWidth?: number
}

type EncodedShapeProps = {
  code: string
  quarterSize?: number
  gap?: number
}

type PlainShapePart = {
  shape: ShapeLetter | null
  color: string | null
  orientation: Orientation
  row: number
  col: number
}

const colorByLetter: Record<ColorLetter, string> = {
  r: '#ef4444',
  g: '#22c55e',
  b: '#3b82f6',
  c: '#06b6d4',
  m: '#ec4899',
  y: '#facc15',
  w: '#ffffff',
  u: '#9ca3af',
}

const rotationByOrientation: Record<Orientation, number> = {
  nw: 0,
  ne: 90,
  se: 180,
  sw: 270,
}

function getPath(kind: QuarterKind, size: number): string {
  const c = size

  if (kind === 'circle') {
    return `M ${c} ${c} L ${c} 0 A ${c} ${c} 0 0 0 0 ${c} Z`
  }

  if (kind === 'square') {
    return `M ${c} ${c} L ${c} 0 L 0 0 L 0 ${c} Z`
  }

  if (kind === 'spike') {
    const edge = c * 0.62
    const rotatedEdge = c - edge
    return `M 0 0 L ${rotatedEdge} ${c} L ${c} ${c} L ${c} ${rotatedEdge} Z`
  }

  const quarter = c * 0.75
  return `M ${c} ${c} L ${c} 0 L ${quarter} 0 A ${c} ${c} 0 0 1 0 ${quarter} L 0 ${c} Z`
}

function QuarterGlyph({
  fill,
  orientation = 'nw',
  size = 84,
  stroke = '#000000',
  strokeWidth = 2,
  kind,
}: QuarterProps & { kind: QuarterKind }) {
  const rotate = rotationByOrientation[orientation]
  const fullSize = size + strokeWidth

  return (
    <svg width={fullSize} height={fullSize} viewBox={`0 0 ${fullSize} ${fullSize}`} role="img" aria-label={`${kind} quarter ${orientation}`}>
      <g transform={`rotate(${rotate} ${size / 2} ${size / 2})`}>
        <path d={getPath(kind, size)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </g>
    </svg>
  )
}

function blendWithWhite(hex: string, ratio: number): string {
  const safeRatio = Math.max(0, Math.min(1, ratio))
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const mix = (channel: number) => Math.round(channel + (255 - channel) * safeRatio)

  const toHex = (channel: number) => mix(channel).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function blendWithBlack(hex: string, ratio: number): string {
  const safeRatio = Math.max(0, Math.min(1, ratio))
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const mix = (channel: number) => Math.round(channel * (1 - safeRatio))

  const toHex = (channel: number) => mix(channel).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isVeryLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.9
}

export function QuarterCrystal({
  fill,
  orientation = 'nw',
  size = 84,
  stroke = '#000000',
  strokeWidth = 2,
}: QuarterProps) {
  const fullSize = size + strokeWidth
  const rotate = rotationByOrientation[orientation]
  const id = useId().replace(/:/g, '-')
  const stripeId = `crystal-stripes-${id}`
  const useDarkStripes = isVeryLightColor(fill)
  const highlightColor = useDarkStripes ? blendWithBlack(fill, 0.18) : blendWithWhite(fill, 0.35)
  const glowColor = useDarkStripes ? blendWithBlack(fill, 0.35) : blendWithWhite(fill, 0.65)

  return (
    <svg width={fullSize} height={fullSize} viewBox={`0 0 ${fullSize} ${fullSize}`} role="img" aria-label={`crystal quarter ${orientation}`}>
      <defs>
        <pattern id={stripeId} patternUnits="userSpaceOnUse" width={size * 0.34} height={size * 0.34} patternTransform="rotate(-35)">
          <rect width={size * 0.12} height={size * 0.34} fill={highlightColor} opacity={0.55} />
          <rect x={size * 0.16} width={size * 0.06} height={size * 0.34} fill={glowColor} opacity={0.75} />
        </pattern>
      </defs>
      <g transform={`rotate(${rotate} ${size / 2} ${size / 2})`}>
        <path d={getPath('circle', size)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <path d={getPath('circle', size)} fill={`url(#${stripeId})`} />
      </g>
    </svg>
  )
}

export function QuarterCircle(props: QuarterProps) {
  return <QuarterGlyph kind="circle" {...props} />
}

export function QuarterSquare(props: QuarterProps) {
  return <QuarterGlyph kind="square" {...props} />
}

export function QuarterSpike(props: QuarterProps) {
  return <QuarterGlyph kind="spike" {...props} />
}

export function QuarterWedge(props: QuarterProps) {
  return <QuarterGlyph kind="wedge" {...props} />
}

export function QuarterPin({ orientation = 'nw', size = 84 }: Pick<QuarterProps, 'orientation' | 'size'>) {
  const rotate = rotationByOrientation[orientation]
  const radius = size * 0.08
  const offset = size * 0.7

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`pin quarter ${orientation}`}>
      <g transform={`rotate(${rotate} ${size / 2} ${size / 2})`}>
        <circle cx={offset} cy={offset} r={radius} fill="#000000" />
      </g>
    </svg>
  )
}

function getShapeLetterAt(code: string, index: number): ShapeLetter {
  return code[index] as ShapeLetter
}

function getColorLetterAt(code: string, index: number): ColorLetter {
  return code[index] as ColorLetter
}

function getQuarterFromLayer(cleanCode: string, quarterIndex: number): Pick<PlainShapePart, 'shape' | 'color'> {
  const start = quarterIndex * 2
  const token = cleanCode.slice(start, start + 2)

  if (token === '--') {
    return { shape: null, color: null }
  }

  if (token === 'P-') {
    return { shape: 'P', color: null }
  }

  return {
    shape: getShapeLetterAt(cleanCode, start),
    color: colorByLetter[getColorLetterAt(cleanCode, start + 1)],
  }
}

function getPlainShapeParts(cleanCode: string): PlainShapePart[] {
  const topRight = getQuarterFromLayer(cleanCode, 0)
  const bottomRight = getQuarterFromLayer(cleanCode, 1)
  const bottomLeft = getQuarterFromLayer(cleanCode, 2)
  const topLeft = getQuarterFromLayer(cleanCode, 3)

  return [
    {
      shape: topRight.shape,
      color: topRight.color,
      orientation: 'ne' as const,
      row: 1,
      col: 2,
    },
    {
      shape: bottomRight.shape,
      color: bottomRight.color,
      orientation: 'se' as const,
      row: 2,
      col: 2,
    },
    {
      shape: bottomLeft.shape,
      color: bottomLeft.color,
      orientation: 'sw' as const,
      row: 2,
      col: 1,
    },
    {
      shape: topLeft.shape,
      color: topLeft.color,
      orientation: 'nw' as const,
      row: 1,
      col: 1,
    },
  ]
}

function renderPlainShape(cleanCode: string, quarterSize: number, gap: number, keyPrefix: string) {
  const parts = getPlainShapeParts(cleanCode)

  return (
    <div
      className="encoded-shape"
      style={{
        gridTemplateColumns: `${quarterSize}px ${quarterSize}px`,
        gridTemplateRows: `${quarterSize}px ${quarterSize}px`,
        gap: `${gap}px`,
      }}
    >
      {parts.map((part, index) => (
        <div
          key={`${keyPrefix}-${index}`}
          className="quarter-cell"
          style={{ gridRow: part.row, gridColumn: part.col }}
        >
          {part.shape
            ? renderShapeFromLetter(part.shape, part.color, part.orientation, quarterSize)
            : null}
        </div>
      ))}
    </div>
  )
}

function renderShapeFromLetter(
  letter: ShapeLetter,
  color: string | null,
  orientation: Orientation,
  quarterSize: number,
) {
  if (letter === 'P') {
    return <QuarterPin orientation={orientation} size={quarterSize} />
  }

  if (!color) {
    return null
  }

  if (letter === 'C') {
    return <QuarterCircle fill={color} orientation={orientation} size={quarterSize} />
  }
  if (letter === 'c') {
    return <QuarterCrystal fill={color} orientation={orientation} size={quarterSize} />
  }
  if (letter === 'R') {
    return <QuarterSquare fill={color} orientation={orientation} size={quarterSize} />
  }
  if (letter === 'S') {
    return <QuarterSpike fill={color} orientation={orientation} size={quarterSize} />
  }
  return <QuarterWedge fill={color} orientation={orientation} size={quarterSize} />
}

export function EncodedShape({ code, quarterSize = 72, gap = 0 }: EncodedShapeProps) {
  try {
    codeToShape(code.trim())
  } catch {
    return <div className="shape-error">Invalid code: {code} (expected 1-4 layers of 8-char shapes, using [C|R|S|W|c][color], P-, or -- per quarter)</div>
  }

  const layers = code.split(':')

  if (layers.length === 1) {
    return renderPlainShape(layers[0], quarterSize, gap, layers[0])
  }

  const stackSize = quarterSize * 2 + gap

  return (
    <div className="shape-stack" style={{ width: `${stackSize}px`, height: `${stackSize}px` }}>
      {layers.map((layer, index) => {
        const scale = 1 - index * 0.2

        return (
        <div
            key={`${layer}-${index}`}
            className="stack-layer"
            style={{ zIndex: index + 1 }}
        >
            {renderPlainShape(layer, quarterSize * scale, gap, `${layer}-${index}`)}
        </div>
        )
      })}
    </div>
  )
}
