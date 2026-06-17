import type { ColorLetter, Shape } from '../Shape.ts'

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

export { SimulatorNode, type SimulatorNodeOptions, type NodeSimulator } from '../simulatorGraph/SimulatorNode.ts'
export { Belt } from './Belt.ts'
export { Rotator } from './Rotator.ts'
export { Stacker } from './Stacker.ts'
export { Painter } from './Painter.ts'
