import type { ColorLetter, Layer, Quarter, Shape } from '../Shape.ts'
import { cloneShape } from '../Shape.ts'
import type { ColorProduct, Product, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'

export const LEFT_SIDE_INDICES = new Set([2, 3])
export const RIGHT_SIDE_INDICES = new Set([0, 1])

export function createShapeProduct(shape: Parameters<typeof cloneShape>[0]): ShapeProduct {
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

export function isEmptyQuarter(quarter: Quarter): boolean {
  return quarter.shape === '-'
}

export function isPinQuarter(quarter: Quarter): boolean {
  return quarter.shape === 'P'
}

export function emptyQuarter(): Quarter {
  return {
    shape: '-',
    color: null,
  }
}

export function getDroppableGroups(layer: Layer): number[][] {
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

export function settleUnsupportedGroups(shape: Shape): void {
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

export function crystalKey(layerIndex: number, quarterIndex: number): string {
  return `${layerIndex}:${quarterIndex}`
}

export function parseCrystalKey(key: string): { layerIndex: number, quarterIndex: number } {
  const [layerIndex, quarterIndex] = key.split(':').map(Number)
  return { layerIndex, quarterIndex }
}

export function isCrystal(shape: Shape, layerIndex: number, quarterIndex: number): boolean {
  return shape.layers[layerIndex]?.quarters[quarterIndex]?.shape === 'c'
}

export function collectDirectlyCutCrystalKeys(shape: Shape): Set<string> {
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

export function getCrystalNeighbors(shape: Shape, layerIndex: number, quarterIndex: number): string[] {
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

export function breakCutCrystals(shape: Shape): void {
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

export function destroySide(shape: Shape, sideIndices: Set<number>): void {
  for (const layer of shape.layers) {
    sideIndices.forEach(index => {
      layer.quarters[index] = emptyQuarter()
    })
  }
}

export function trimTopEmptyLayers(shape: Shape): void {
  while (shape.layers.length > 0) {
    const topLayer = shape.layers[shape.layers.length - 1]
    if (topLayer.quarters.some(quarter => !isEmptyQuarter(quarter))) {
      break
    }
    shape.layers.pop()
  }
}

export function settleWithCrystalBreak(shape: Shape): void {
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