import type { ColorLetter, Shape } from './Shape.ts'

export interface ShapeProduct {
  type: 'shape'
  shape: Shape
}

export interface ColorProduct {
  type: 'color'
  color: ColorLetter
  amount: number
}

export type Product = ShapeProduct | ColorProduct

export const Rotation = {
  Clockwise: 'clockwise',
  Anticlockwise: 'anticlockwise',
  HalfTurn: 'half-turn',
} as const

export type Rotation = (typeof Rotation)[keyof typeof Rotation]

export { SimulatorEdge } from './simulator/Edge.ts'
export { SimulatorNode, type SimulatorNodeOptions, type NodeSimulator } from './simulator/SimulatorNode.ts'
export { Belt } from './simulator/Belt.ts'
export { Rotator } from './simulator/Rotator.ts'
export { Stacker } from './simulator/Stacker.ts'
export { Painter } from './simulator/Painter.ts'
