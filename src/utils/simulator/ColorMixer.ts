import type { ColorLetter } from '../Shape.ts'
import type { ColorEdge, EdgeProductType } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'

const REQUIRED_COLOR_AMOUNT = 300
const OUTPUT_CAPACITY = REQUIRED_COLOR_AMOUNT * 2
const MAX_DELAY = 4

const PRIMARY_COLORS = new Set(['r', 'g', 'b'])
const SECONDARY_COLORS = new Set(['c', 'm', 'y'])

const PRIMARY_PAIR_TO_SECONDARY: Record<string, 'c' | 'm' | 'y'> = {
  bg: 'c',
  br: 'm',
  gr: 'y',
}

function isPrimary(color: string): boolean {
  return PRIMARY_COLORS.has(color)
}

function isSecondary(color: string): boolean {
  return SECONDARY_COLORS.has(color)
}

function secondaryContainsPrimary(secondary: string, primary: string): boolean {
  if (secondary === 'c') {
    return primary === 'g' || primary === 'b'
  }
  if (secondary === 'm') {
    return primary === 'r' || primary === 'b'
  }
  if (secondary === 'y') {
    return primary === 'r' || primary === 'g'
  }
  return false
}

function mixColors(left: string, right: string): ColorLetter {
  if (left === 'w') {
    return right as ColorLetter
  }
  if (right === 'w') {
    return left as ColorLetter
  }

  if (isSecondary(left) && isSecondary(right)) {
    return 'w'
  }

  if (isPrimary(left) && isSecondary(right)) {
    return secondaryContainsPrimary(right, left) ? (left as ColorLetter) : 'w'
  }
  if (isSecondary(left) && isPrimary(right)) {
    return secondaryContainsPrimary(left, right) ? (right as ColorLetter) : 'w'
  }

  if (isPrimary(left) && isPrimary(right)) {
    if (left === right) {
      return left as ColorLetter
    }

    const key = [left, right].sort().join('')
    return PRIMARY_PAIR_TO_SECONDARY[key]
  }

  return left as ColorLetter
}

export class Pipe extends SimulatorNode<ColorEdge[], ColorEdge[]> {
  public inputEdges: ColorEdge[] = []
  public outputEdges: ColorEdge[] = []
  private delay = 0

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color' && this.inputEdges.length < 2
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'color' && this.outputEdges.length < 1
  }

  public attachInputEdge(edge: ColorEdge, index?: number): void {
    if (this.inputEdges.includes(edge)) {
      return
    }

    const inputIndex = index || this.inputEdges.length
    if (!this.canAcceptInputConnection(edge.edgeType)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${inputIndex}.`)
    }

    this.inputEdges.push(edge)
    edge.capacity = REQUIRED_COLOR_AMOUNT
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const inputLeft = this.inputEdges[0]
    const inputRight = this.inputEdges[1]
    const outputEdge = this.outputEdges[0]
    if (!inputLeft
      || !inputRight
      || !outputEdge
      || this.delay > 0
      || !inputRight.hasProduct
      || !inputLeft.hasProduct
      || outputEdge.hasProduct
    ) {
      return
    }

    const leftProduct = inputLeft.takeProduct(REQUIRED_COLOR_AMOUNT)!
    const rightProduct = inputRight.takeProduct(REQUIRED_COLOR_AMOUNT)!
    const mixedColor = mixColors(leftProduct.color, rightProduct.color)

    this.delay = MAX_DELAY
    outputEdge.putProduct({
      color: mixedColor,
      amount: OUTPUT_CAPACITY,
    })
  }
}
