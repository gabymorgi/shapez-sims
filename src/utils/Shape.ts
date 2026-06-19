type ShapeLetter = 'C' | 'R' | 'S' | 'W' | 'c'
export type ColorLetter = 'r' | 'g' | 'b' | 'c' | 'm' | 'y' | 'w' | 'u'
type QuarterToken = `${ShapeLetter}${ColorLetter}` | 'P-' | '--'

export interface Quarter {
  shape: ShapeLetter | 'P' | '-'
  color: ColorLetter | null
}

export interface Layer {
  quarters: Quarter[]
}

export interface Shape {
  layers: Layer[]
}

export function codeToShape(shapeCode: string): Shape {
  const quarterTokenRegex = /(?:[CRSWc][rgbcmywu]|P-|--)/
  const layerRegex = new RegExp(`^(?:${quarterTokenRegex.source}){4}$`)

  const layers = shapeCode.split(':').map(layerCode => {
    if (!layerRegex.test(layerCode)) {
      throw new Error(`Invalid layer code: ${layerCode}`)
    }

    const layer: Layer = {
      quarters: Array.from({ length: 4 }, (_, index) => {
        const tokenStart = index * 2
        const token = layerCode.slice(tokenStart, tokenStart + 2) as QuarterToken
        if (token === '--') {
          return {
            shape: '-', color: null
          }
        }

        if (token === 'P-') {
          return {
            shape: 'P', color: null
          }
        }

        return {
          shape: token[0] as ShapeLetter, color: token[1] as ColorLetter
        }
      })
    }

    return layer
  })

  return {
    layers
  }
}

export function shapeToCode(shape: Shape): string {
  return shape.layers.map(layer => {
    return layer.quarters.map(quarter => {
      if (quarter.shape === 'P') {
        return 'P-'
      }
      if (quarter.shape === '-') {
        return '--'
      }
      return `${quarter.shape}${quarter.color}` as QuarterToken
    }).join('')
  }).join(':')
}

export function cloneShape(shape: Shape): Shape {
  return {
    layers: shape.layers.map(layer => ({
      quarters: layer.quarters.map(quarter => ({ ...quarter }))
    }))
  }
}
