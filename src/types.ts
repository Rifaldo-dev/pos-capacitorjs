export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer' | 'Debit' | 'Kredit' | 'E-wallet' | 'Lainnya'
export type Page = 'dashboard' | 'kasir' | 'produk' | 'transaksi' | 'stok' | 'lainnya'

export interface Category {
  id: string
  name: string
  color: string
}

export interface Product {
  id: string
  sku: string
  barcode: string
  name: string
  categoryId: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minimumStock: number
  unit: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
}

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  cost: number
  quantity: number
  discount: number
}

export interface TransactionItem extends CartItem {
  subtotal: number
}

export interface Transaction {
  id: string
  invoiceNumber: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paidAmount: number
  changeAmount: number
  paymentMethod: PaymentMethod
  createdAt: string
  status: 'completed' | 'voided' | 'refunded'
}

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  type: 'sale' | 'restock' | 'adjustment' | 'refund'
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string
  createdAt: string
}

export interface StoreSettings {
  storeName: string
  storeLogo?: string
  storeAddress: string
  storePhone: string
  taxRate: number
  allowNegativeStock: boolean
  theme: 'light' | 'dark' | 'system'
  receiptFooter: string
  autoPrintReceipt: boolean
  lastBackupAt?: string
}

export interface PosState {
  version: number
  categories: Category[]
  products: Product[]
  customers: Customer[]
  transactions: Transaction[]
  expenses: Expense[]
  stockMovements: StockMovement[]
  settings: StoreSettings
}

export interface BackupFile {
  format: 'POS Backup'
  version: number
  createdAt: string
  data: PosState
}
