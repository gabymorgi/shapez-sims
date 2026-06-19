import { cloneShape, type Shape } from '../Shape.ts'
import type { EdgeProductType, ShapeEdge, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'
import { SimulatorNode } from '../simulatorGraph/SimulatorNode.ts'
import { emptyQuarter, getDroppableGroups, isEmptyQuarter } from './utils.ts'

const MAX_DELAY = 4
const LEFT_SIDE_INDICES = new Set([2, 3])
const RIGHT_SIDE_INDICES = new Set([0, 1])

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

function removeSide(shape: Shape, sideIndices: Set<number>): void {
  for (const layer of shape.layers) {
    sideIndices.forEach(index => {
      layer.quarters[index] = emptyQuarter()
    })
  }
}

function trimTopEmptyLayers(shape: Shape): void {
  while (shape.layers.length > 1) {
    const topLayer = shape.layers[shape.layers.length - 1]
    if (topLayer.quarters.some(quarter => !isEmptyQuarter(quarter))) {
      break
    }
    shape.layers.pop()
  }
}

function settleSideWithCrystalBreak(shape: Shape): void {
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

export function cutShape(shape: ShapeProduct): [ShapeProduct, ShapeProduct] {
  const cutResolvedShape = cloneShape(shape.shape)
  breakCutCrystals(cutResolvedShape)

  const leftShape = cloneShape(cutResolvedShape)
  const rightShape = cloneShape(cutResolvedShape)

  removeSide(leftShape, RIGHT_SIDE_INDICES)
  removeSide(rightShape, LEFT_SIDE_INDICES)

  settleSideWithCrystalBreak(leftShape)
  settleSideWithCrystalBreak(rightShape)

  return [{ shape: leftShape },{ shape: rightShape }]
}

export class Cutter extends SimulatorNode<ShapeEdge[], ShapeEdge[]> {
  public inputEdges: ShapeEdge[] = []
  public outputEdges: ShapeEdge[] = []
  private delay = 0

  protected canAcceptInputConnection(edgeType: EdgeProductType): boolean {
    return edgeType === 'shape' && this.inputEdges.length < 1
  }

  protected canAcceptOutputConnection(edgeType: EdgeProductType, index: number): boolean {
    return edgeType === 'shape' && this.outputEdges[index] === undefined
  }

  public attachOutputEdge(edge: ShapeEdge, index: number): void {
    if (this.outputEdges.includes(edge)) {
      return
    }

    const outputIndex = index || this.outputEdges.length
    if (!this.canAcceptOutputConnection(edge.edgeType, outputIndex)) {
      throw new Error(`Node ${this.id} cannot accept ${edge.edgeType} input at index ${outputIndex}.`)
    }

    this.outputEdges[outputIndex] = edge
  }

  public simulate(): void {
    this.delay = Math.max(0, this.delay - 1)
    const inputEdge = this.inputEdges[0]
    const outputLeft = this.outputEdges[0]
    const outputRight = this.outputEdges[1]

    if (!inputEdge || !outputLeft || !outputRight || this.delay > 0 || outputLeft.hasProduct || outputRight.hasProduct || !inputEdge.hasProduct) {
      return
    }
    this.delay = MAX_DELAY

    const inputShape = inputEdge.takeProduct()!

    const [leftShape, rightShape] = cutShape(inputShape)
    
    outputLeft.putProduct(leftShape)
    outputRight.putProduct(rightShape)
  }
}
