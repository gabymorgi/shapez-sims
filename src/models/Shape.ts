export type Quadrant = 'nw' | 'ne' | 'se' | 'sw'

type ShapeLetter = 'C' | 'R' | 'S' | 'W' | 'c'
type ColorLetter = 'r' | 'g' | 'b' | 'c' | 'm' | 'y' | 'w' | 'u'
type QuarterToken = `${ShapeLetter}${ColorLetter}` | 'P-' | '--'

export const Rotation = {
  Clockwise: 'clockwise',
  Anticlockwise: 'anticlockwise',
  HalfTurn: 'half-turn',
} as const

export type Rotation = (typeof Rotation)[keyof typeof Rotation]

const quarterTokenRegex = /(?:[CRSWc][rgbcmywu]|P-|--)/
const layerRegex = new RegExp(`^(?:${quarterTokenRegex.source}){4}$`)
const maxStackLayers = 4

function isColorLetter(value: string): value is ColorLetter {
  return /^[rgbcmywu]$/.test(value)
}

export class Quarter {
  public readonly color: ColorLetter | null
  private readonly shape: ShapeLetter | 'P' | '-'

  constructor(shape: ShapeLetter | 'P' | '-', color: ColorLetter | null) {
    if (color && !isColorLetter(color)) {
      throw new Error(`Invalid color letter: ${color}`)
    }

    this.shape = shape
    this.color = color || null
  }

  public static fromToken(token: QuarterToken): Quarter {
    if (token === '--') {
      return new Quarter('-', null)
    }

    if (token === 'P-') {
      return new Quarter('P', null)
    }

    return new Quarter(token[0] as ShapeLetter, token[1] as ColorLetter)
  }

  public toToken(): QuarterToken {
    if (this.shape === 'P') {
      return 'P-'
    }
    if (this.shape === '-') {
      return '--'
    }

    return `${this.shape}${this.color}` as QuarterToken
  }

  public clone(): Quarter {
    return new Quarter(this.shape, this.color)
  }
}

export class Layer {
  public readonly quarters: Quarter[]

  constructor(quarters: Quarter[]) {
    if (quarters.length !== 4) {
      throw new Error('A layer must contain exactly 4 quarters.')
    }

    this.quarters = [...quarters]
  }

  public static fromCode(layerCode: string): Layer {
    if (!layerRegex.test(layerCode)) {
      throw new Error(`Invalid layer code: ${layerCode}`)
    }

    const quarters = Array.from({ length: 4 }, (_, index) => {
      const tokenStart = index * 2
      const token = layerCode.slice(tokenStart, tokenStart + 2) as QuarterToken
      return Quarter.fromToken(token)
    })

    return new Layer(quarters)
  }

  public toCode(): string {
    return this.quarters
      .map((quarter) => quarter.toToken())
      .join('')
  }

  public clone(): Layer {
    return new Layer(this.quarters.map((quarter) => quarter.clone()))
  }

  public rotate(rotation: Rotation): Layer {
    const rotatedQuarterIndexes = {
      [Rotation.Clockwise]: [3, 0, 1, 2],
      [Rotation.Anticlockwise]: [1, 2, 3, 0],
      [Rotation.HalfTurn]: [2, 3, 0, 1],
    }[rotation]

    return new Layer(rotatedQuarterIndexes.map((index) => this.quarters[index].clone()))
  }
}

export class Shape {
  public readonly layers: Layer[]

  constructor(layers: Layer[]) {
    if (layers.length < 1 || layers.length > maxStackLayers) {
      throw new Error(`A shape must have between 1 and ${maxStackLayers} layers.`)
    }

    this.layers = [...layers]
  }

  public static fromCode(shapeCode: string): Shape {
    const layers = shapeCode
      .split(':')

    if (layers.length < 1 || layers.length > maxStackLayers) {
      throw new Error(`Invalid shape code: ${shapeCode}`)
    }

    return new Shape(layers.map((layer) => Layer.fromCode(layer)))
  }

  public toString(): string {
    return this.layers.map((layer) => layer.toCode()).join(':')
  }

  public clone(): Shape {
    return new Shape(this.layers.map((layer) => layer.clone()))
  }

  public rotate(rotation: Rotation): Shape {
    return new Shape(this.layers.map((layer) => layer.rotate(rotation)))
  }
}
