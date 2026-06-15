import type { ColorLetter, Shape } from "./Shape";

interface EdgeProduct<T, P> {
  type: T
  product: P
  throughput: number
  fromId: string
  toId: string
}

type ShapeProduct = EdgeProduct<'shape', Shape>

interface ColorProduct extends EdgeProduct<'color', ColorLetter> {
  amount: number
}

type Product = ShapeProduct | ColorProduct

interface Flow {
  products: Product[]
}

export abstract class Simulator {
  public speed: number;
  public delay: number = 0;

  constructor(speed: number) {
    this.speed = speed;
  }

  public abstract simulate(inputs: Flow[]): Flow[] | null;
}

export class Belt extends Simulator {
  public inputsAmount: number
  public outputsAmount: number
  private inputIndex: number = 0
  private outputIndex: number = 0
  constructor(speed: number = 120, inputsAmount: number = 1, outputsAmount: number = 1) {
    super(speed);
    this.inputsAmount = inputsAmount
    this.outputsAmount = outputsAmount
  }

  public simulate(inputs: Flow[]): Flow[] {
    return inputs
  }
}

export const Rotation = {
  Clockwise: 'clockwise',
  Anticlockwise: 'anticlockwise',
  HalfTurn: 'half-turn',
} as const

export type Rotation = (typeof Rotation)[keyof typeof Rotation]

export class Rotator extends Simulator {
  public rotation: Rotation

  constructor(speed: number, rotation: Rotation) {
    super(speed);
    this.rotation = rotation
  }

  public simulate(flows: Flow[]): Flow[] | null {
    this.delay--;
    if (this.delay > 0) {
      return null
    }
    this.delay = 2

    const rotatedQuarterIndexes = {
      [Rotation.Clockwise]: [3, 0, 1, 2],
      [Rotation.Anticlockwise]: [1, 2, 3, 0],
      [Rotation.HalfTurn]: [2, 3, 0, 1],
    }[this.rotation]

    return flows.map(flows => ({
      products: flows.products.map(product => {
        return product.type === 'shape' ? {
          ...product,
          layers: product.product.layers.map(layer => ({
            quarters: rotatedQuarterIndexes.map(index => layer.quarters[index])
          }))
        } : product
      })
    }))
  }
}

export class Cutter extends Simulator {
  constructor(speed: number = 120) {
    super(speed);
  }

  public simulate(inputs: Flow[]): Flow[] {
    return inputs
  }
}

export class HalfDestroyer extends Simulator {
  constructor(speed: number = 120) {
    super(speed);
  }

  public simulate(inputs: Flow[]): Flow[] {
    return inputs
  }
}

export class Trash extends Simulator {
  constructor(speed: number = 120) {
    super(speed);
  }

  public simulate(inputs: Flow[]): Flow[] {
    return inputs
  }
}

