import type { ColorLetter } from '../Shape'
import { cloneShape } from '../Shape.ts'
import type { ColorProduct, Product, ShapeProduct } from '../simulatorGraph/SimulatorEdge.ts'

export function createShapeProduct(shape: Parameters<typeof cloneShape>[0]): ShapeProduct {
  return {
    type: 'shape',
    shape: cloneShape(shape),
  }
}

export function createColorProduct(color: ColorLetter, amount: number): ColorProduct {
  return {
    type: 'color',
    color,
    amount,
  }
}

export function cloneProduct(product: Product): Product {
  if (product.type === 'shape') {
    return createShapeProduct(product.shape)
  }

  return {
    ...product,
  }
}
