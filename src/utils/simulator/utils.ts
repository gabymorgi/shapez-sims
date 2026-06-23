import type { ColorLetter, Layer, Quarter, Shape } from '../Shape.ts'
import { cloneShape } from '../Shape.ts'
import type { ColorProduct, Product, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'

const LEFT_SIDE_INDICES = new Set([2, 3])
const RIGHT_SIDE_INDICES = new Set([0, 1])
const emptyLetters = new Set(['-', 'P'])
const nonShapeLetters = new Set(['-', 'P', 'c'])

export const Rotation = {
  Clockwise: 'clockwise',
  Anticlockwise: 'anticlockwise',
  HalfTurn: 'half-turn',
} as const

export type Rotation = (typeof Rotation)[keyof typeof Rotation]

const quarterIndexes = {
  [Rotation.Clockwise]: [3, 0, 1, 2],
  [Rotation.Anticlockwise]: [1, 2, 3, 0],
  [Rotation.HalfTurn]: [2, 3, 0, 1],
} as const

export function createShapeProduct(shape: Shape): ShapeProduct {
  return {
    shape: cloneShape(shape),
  }
}

export function createColorProduct(color: ColorLetter, amount: number): ColorProduct {
  return {
    color,
    amount,
  }
}

export function cloneProduct(product: Product): Product {
  if ('shape' in product) {
    return createShapeProduct(product.shape)
  }

  return {
    ...product,
  }
}

function isEmptyQuarter(quarter: Quarter): boolean {
  return quarter.shape === '-'
}

function isPinQuarter(quarter: Quarter): boolean {
  return quarter.shape === 'P'
}

function emptyQuarter(): Quarter {
  return {
    shape: '-',
    color: null,
  }
}

function getDroppableGroups(layer: Layer): number[][] {
  const groups: number[][] = []
  const visited = new Set<number>()

  for (let index = 0; index < layer.quarters.length; index += 1) {
    const quarter = layer.quarters[index]
    if (visited.has(index) || isEmptyQuarter(quarter)) {
      continue
    }

    const group = [index]
    visited.add(index)

    if (isPinQuarter(quarter)) {
      groups.push(group)
      continue
    }

    let previousIndex = (index + 3) % 4
    while (!visited.has(previousIndex)) {
      const previousQuarter = layer.quarters[previousIndex]
      if (isEmptyQuarter(previousQuarter) || isPinQuarter(previousQuarter)) {
        break
      }
      group.unshift(previousIndex)
      visited.add(previousIndex)
      previousIndex = (previousIndex + 3) % 4
      if (previousIndex === index) {
        break
      }
    }

    let nextIndex = (index + 1) % 4
    while (!visited.has(nextIndex)) {
      const nextQuarter = layer.quarters[nextIndex]
      if (isEmptyQuarter(nextQuarter) || isPinQuarter(nextQuarter)) {
        break
      }
      group.push(nextIndex)
      visited.add(nextIndex)
      nextIndex = (nextIndex + 1) % 4
      if (nextIndex === index) {
        break
      }
    }

    groups.push(group)
  }

  return groups
}

function breakTopCrystals(shape: Shape, topStartLayer: number): void {
  for (let layerIndex = topStartLayer; layerIndex < shape.layers.length; layerIndex += 1) {
    for (const quarter of shape.layers[layerIndex].quarters) {
      if (quarter.shape === 'c') {
        quarter.shape = '-'
        quarter.color = null
      }
    }
  }
}

function settleUnsupportedGroups(shape: Shape): void {
  let moved = true

  while (moved) {
    moved = false

    for (let layerIndex = 1; layerIndex < shape.layers.length; layerIndex += 1) {
      const layer = shape.layers[layerIndex]
      const belowLayer = shape.layers[layerIndex - 1]

      for (const group of getDroppableGroups(layer)) {
        const canDrop = group.every(index => isEmptyQuarter(belowLayer.quarters[index]))
        if (!canDrop) {
          continue
        }

        for (const index of group) {
          belowLayer.quarters[index] = { ...layer.quarters[index] }
          layer.quarters[index] = emptyQuarter()
        }

        moved = true
      }
    }
  }

  while (shape.layers.length > 1) {
    const topLayer = shape.layers[shape.layers.length - 1]
    if (topLayer.quarters.some(quarter => !isEmptyQuarter(quarter))) {
      break
    }
    shape.layers.pop()
  }
}

function crystalKey(layerIndex: number, quarterIndex: number): string {
  return `${layerIndex}:${quarterIndex}`
}

function parseCrystalKey(key: string): { layerIndex: number, quarterIndex: number } {
  const [layerIndex, quarterIndex] = key.split(':').map(Number)
  return { layerIndex, quarterIndex }
}

function isCrystal(shape: Shape, layerIndex: number, quarterIndex: number): boolean {
  return shape.layers[layerIndex]?.quarters[quarterIndex]?.shape === 'c'
}

function collectDirectlyCutCrystalKeys(shape: Shape): Set<string> {
  const directBreaks = new Set<string>()

  for (let layerIndex = 0; layerIndex < shape.layers.length; layerIndex += 1) {
    // bottom
    if (isCrystal(shape, layerIndex, 1) && isCrystal(shape, layerIndex, 2)) {
      directBreaks.add(crystalKey(layerIndex, 1))
      directBreaks.add(crystalKey(layerIndex, 2))
    }

    // top
    if (isCrystal(shape, layerIndex, 3) && isCrystal(shape, layerIndex, 0)) {
      directBreaks.add(crystalKey(layerIndex, 3))
      directBreaks.add(crystalKey(layerIndex, 0))
    }
  }

  return directBreaks
}

function getCrystalNeighbors(shape: Shape, layerIndex: number, quarterIndex: number): string[] {
  const neighbors: string[] = []
  const previousQuarter = (quarterIndex + 3) % 4
  const nextQuarter = (quarterIndex + 1) % 4

  if (isCrystal(shape, layerIndex, previousQuarter)) {
    neighbors.push(crystalKey(layerIndex, previousQuarter))
  }

  if (isCrystal(shape, layerIndex, nextQuarter)) {
    neighbors.push(crystalKey(layerIndex, nextQuarter))
  }

  const belowLayer = layerIndex - 1
  if (belowLayer >= 0 && isCrystal(shape, belowLayer, quarterIndex)) {
    neighbors.push(crystalKey(belowLayer, quarterIndex))
  }

  const aboveLayer = layerIndex + 1
  if (aboveLayer < shape.layers.length && isCrystal(shape, aboveLayer, quarterIndex)) {
    neighbors.push(crystalKey(aboveLayer, quarterIndex))
  }

  return neighbors
}

function breakCutCrystals(shape: Shape): void {
  const queue = [...collectDirectlyCutCrystalKeys(shape)]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    // if (visited.has(current)) {
    //   continue
    // }

    visited.add(current)
    const { layerIndex, quarterIndex } = parseCrystalKey(current)
    // if (!isCrystal(shape, layerIndex, quarterIndex)) {
    //   continue
    // }

    shape.layers[layerIndex].quarters[quarterIndex] = emptyQuarter()

    for (const neighbor of getCrystalNeighbors(shape, layerIndex, quarterIndex)) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor)
      }
    }
  }
}

function destroySide(shape: Shape, sideIndices: Set<number>): void {
  for (const layer of shape.layers) {
    sideIndices.forEach(index => {
      layer.quarters[index] = emptyQuarter()
    })
  }
}

function trimTopEmptyLayers(shape: Shape): void {
  while (shape.layers.length > 0) {
    const topLayer = shape.layers[shape.layers.length - 1]
    if (topLayer.quarters.some(quarter => !isEmptyQuarter(quarter))) {
      break
    }
    shape.layers.pop()
  }
}

function settleWithCrystalBreak(shape: Shape): void {
  let moved = true

  while (moved) {
    moved = false

    for (let layerIndex = 1; layerIndex < shape.layers.length; layerIndex += 1) {
      const layer = shape.layers[layerIndex]
      const belowLayer = shape.layers[layerIndex - 1]

      for (const group of getDroppableGroups(layer)) {
        const canDrop = group.every(index => isEmptyQuarter(belowLayer.quarters[index]))
        if (!canDrop) {
          continue
        }

        for (const index of group) {
          const fallingQuarter = layer.quarters[index]
          belowLayer.quarters[index] = fallingQuarter.shape === 'c' ? emptyQuarter() : { ...fallingQuarter }
          layer.quarters[index] = emptyQuarter()
        }

        moved = true
      }
    }
  }

  trimTopEmptyLayers(shape)
}

const PRIMARY_COLORS = new Set(['r', 'g', 'b'])
const SECONDARY_COLORS = new Set(['c', 'm', 'y'])

const colorMixingTable: Record<string, ColorLetter> = {
  bg: 'c',
  br: 'm',
  by: 'w',
  gm: 'w',
  gr: 'y',
  rc: 'w',
  cm: 'w',
  cy: 'w',
  my: 'w',
}

export function mixColors(left: ColorLetter, right: ColorLetter): ColorLetter {
  const sorted = [left, right].sort((a, b) => {
    const aIndex = PRIMARY_COLORS.has(a) ? 0 : SECONDARY_COLORS.has(a) ? 1 : 2
    const bIndex = PRIMARY_COLORS.has(b) ? 0 : SECONDARY_COLORS.has(b) ? 1 : 2
    const diff = aIndex - bIndex
    if (diff !== 0) {
      return diff
    }
    return a.localeCompare(b)
  })
  const color = colorMixingTable[sorted.join('')]
  if (!color) {
    return sorted[0]
  }

  return color
}

export function paintShape(shape: Shape, color: ColorLetter): Shape {
  const paintedShape = cloneShape(shape)

  for (const quarter of paintedShape.layers.at(-1)?.quarters ?? []) {
    if (!nonShapeLetters.has(quarter.shape)) {
      quarter.color = color
    }
  }

  return paintedShape
}

export function crystalizeShape(shape: Shape, color: ColorLetter): Shape {
  const crystalShape = cloneShape(shape)
  for (const layer of crystalShape.layers) {
    for (const quarter of layer.quarters) {
      if (emptyLetters.has(quarter.shape)) {
        quarter.shape = 'c'
        quarter.color = color
      }
    }
  }

  return crystalShape
}



export function rotateShape(shape: Shape, rotation: Rotation): Shape {
  const quarterIndex = quarterIndexes[rotation]

  const rotated = cloneShape(shape)

  for (const layer of rotated.layers) {
    const sourceQuarters = layer.quarters.map((quarter) => ({ ...quarter }))
    for (let index = 0; index < 4; index += 1) {
      layer.quarters[index] = sourceQuarters[quarterIndex[index]]
    }
  }

  return rotated
}

export function cutShape(shape: Shape): [Shape?, Shape?] {
  const cutResolvedShape = cloneShape(shape)
  breakCutCrystals(cutResolvedShape)

  const leftShape = cloneShape(cutResolvedShape)
  const rightShape = cloneShape(cutResolvedShape)

  destroySide(leftShape, RIGHT_SIDE_INDICES)
  destroySide(rightShape, LEFT_SIDE_INDICES)

  settleWithCrystalBreak(leftShape)
  settleWithCrystalBreak(rightShape)

  return [
    leftShape.layers.length > 0 ? leftShape : undefined,
    rightShape.layers.length > 0 ? rightShape : undefined,
  ]
}

export function destroyHalfShape(shape: Shape): Shape | undefined {
  const halfShape = cloneShape(shape)
  breakCutCrystals(halfShape)

  destroySide(halfShape, LEFT_SIDE_INDICES)

  settleWithCrystalBreak(halfShape)

  return halfShape.layers.length > 0 ? halfShape : undefined
}

export function swapShapes(shape: [Shape, Shape]): [Shape?, Shape?] {
  const shape1 = cloneShape(shape[0])
  const shape2 = cloneShape(shape[1])
  breakCutCrystals(shape1)
  breakCutCrystals(shape2)

  const maxLayers = Math.max(shape1.layers.length, shape2.layers.length)
  while (shape1.layers.length < maxLayers) {
    shape1.layers.push({ quarters: [emptyQuarter(), emptyQuarter(), emptyQuarter(), emptyQuarter()] })
  }
  while (shape2.layers.length < maxLayers) {
    shape2.layers.push({ quarters: [emptyQuarter(), emptyQuarter(), emptyQuarter(), emptyQuarter()] })
  }

  for (let l = 0; l < maxLayers; l++) {
    // bottom left
    let aux = shape1.layers[l].quarters[2]
    shape1.layers[l].quarters[2] = shape2.layers[l].quarters[2]
    shape2.layers[l].quarters[2] = aux

    // top left
    aux = shape1.layers[l].quarters[3]
    shape1.layers[l].quarters[3] = shape2.layers[l].quarters[3]
    shape2.layers[l].quarters[3] = aux
  }

  settleWithCrystalBreak(shape1)
  settleWithCrystalBreak(shape2)

  return [
    shape1.layers.length > 0 ? shape1 : undefined,
    shape2.layers.length > 0 ? shape2 : undefined
  ]
}

export function stackShapes(bottom: Shape, top: Shape): Shape {
  const merged = cloneShape(bottom)
  const topStartLayer = merged.layers.length
  merged.layers.push(...cloneShape(top).layers)
  breakTopCrystals(merged, topStartLayer)
  settleUnsupportedGroups(merged)

  return merged
}