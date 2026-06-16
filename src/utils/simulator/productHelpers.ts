import type { ColorLetter } from '../Shape'
import type { ColorProduct, Product, ShapeProduct } from '../Simulator.ts'
import { cloneShape } from '../Shape.ts'

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
