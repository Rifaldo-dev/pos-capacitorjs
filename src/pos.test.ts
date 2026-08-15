import { describe, expect, it } from 'vitest'
import { calculateCart, calculateChange, validateQuantity } from './pos'
import type { CartItem, Product } from './types'

const cart: CartItem[] = [{ productId: 'p1', name: 'Item', sku: 'SKU-1', price: 10000, cost: 7000, quantity: 2, discount: 1000 }]
const product: Product = { id: 'p1', sku: 'SKU-1', barcode: '', name: 'Item', categoryId: '', purchasePrice: 7000, sellingPrice: 10000, stock: 5, minimumStock: 1, unit: 'pcs', isActive: true, createdAt: '', updatedAt: '' }

describe('POS calculations', () => {
  it('calculates subtotal, discount, tax, and total with integer rupiah values', () => {
    expect(calculateCart(cart, 10, 500)).toEqual({ subtotal: 19000, discount: 500, tax: 1850, total: 20350, itemSubtotals: [19000] })
  })
  it('calculates safe cash change and never returns negative change', () => {
    expect(calculateChange(25000, 50000)).toBe(25000)
    expect(calculateChange(25000, 10000)).toBe(0)
  })
  it('blocks a sale when requested stock exceeds availability', () => {
    expect(validateQuantity(product, 6, false)).toContain('Stok tidak mencukupi')
    expect(validateQuantity(product, 6, true)).toBeNull()
  })
})
