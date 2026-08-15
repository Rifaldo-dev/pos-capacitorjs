import type { CartItem, Product } from './types'

export const roundMoney = (value: number) => Math.round(value)

export function calculateCart(cart: CartItem[], taxRate: number, transactionDiscount = 0) {
  const itemSubtotals = cart.map((item) => Math.max(0, item.price * item.quantity - item.discount))
  const subtotal = roundMoney(itemSubtotals.reduce((sum, value) => sum + value, 0))
  const discount = roundMoney(Math.min(subtotal, Math.max(0, transactionDiscount)))
  const taxable = Math.max(0, subtotal - discount)
  const tax = roundMoney(taxable * Math.max(0, taxRate) / 100)
  const total = roundMoney(taxable + tax)
  return { subtotal, discount, tax, total, itemSubtotals }
}

export function calculateChange(total: number, paid: number) {
  return roundMoney(Math.max(0, paid - total))
}

export function validateQuantity(product: Product, requested: number, allowNegativeStock: boolean) {
  if (!Number.isInteger(requested) || requested < 1) return 'Jumlah harus berupa angka bulat minimal 1.'
  if (!allowNegativeStock && requested > product.stock) {
    return `Stok tidak mencukupi. Stok tersedia: ${product.stock}. Jumlah diminta: ${requested}.`
  }
  return null
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function dateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function todayKey() {
  return dateKey(new Date().toISOString())
}
