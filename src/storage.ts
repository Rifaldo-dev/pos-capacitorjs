import { Capacitor } from '@capacitor/core'
import type { BackupFile, Category, PosState, Product, Transaction } from './types'

const STORAGE_KEY = 'offline-pos-state-v1'
const DB_NAME = 'offline_pos'
const DB_VERSION = 1

export const timestamp = () => new Date().toISOString()
export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

const demoCategories: Category[] = [
  { id: 'cat-food', name: 'Makanan', color: '#f59e0b' },
  { id: 'cat-drink', name: 'Minuman', color: '#22c55e' },
  { id: 'cat-daily', name: 'Kebutuhan Harian', color: '#6366f1' },
]

const demoProducts: Product[] = [
  { id: 'prod-indomie', sku: 'MKN-001', barcode: '8992388101001', name: 'Indomie Goreng', categoryId: 'cat-food', purchasePrice: 2500, sellingPrice: 3500, stock: 48, minimumStock: 10, unit: 'pcs', isActive: true, createdAt: timestamp(), updatedAt: timestamp() },
  { id: 'prod-aqua', sku: 'MNM-001', barcode: '8992775101001', name: 'Aqua 600ml', categoryId: 'cat-drink', purchasePrice: 2500, sellingPrice: 4000, stock: 36, minimumStock: 12, unit: 'botol', isActive: true, createdAt: timestamp(), updatedAt: timestamp() },
  { id: 'prod-teh', sku: 'MNM-002', barcode: '8998866101001', name: 'Teh Botol Sosro', categoryId: 'cat-drink', purchasePrice: 3500, sellingPrice: 5000, stock: 22, minimumStock: 8, unit: 'botol', isActive: true, createdAt: timestamp(), updatedAt: timestamp() },
  { id: 'prod-kopi', sku: 'MKN-002', barcode: '8991002101001', name: 'Kopi Sachet', categoryId: 'cat-food', purchasePrice: 1200, sellingPrice: 2000, stock: 8, minimumStock: 10, unit: 'pcs', isActive: true, createdAt: timestamp(), updatedAt: timestamp() },
  { id: 'prod-roti', sku: 'MKN-003', barcode: '8999999101001', name: 'Roti Tawar', categoryId: 'cat-food', purchasePrice: 9000, sellingPrice: 12000, stock: 3, minimumStock: 4, unit: 'bungkus', isActive: true, createdAt: timestamp(), updatedAt: timestamp() },
]

const demoTransactions: Transaction[] = [
  {
    id: 'trx-1',
    invoiceNumber: 'INV-20260817-001',
    items: [
      { productId: 'prod-indomie', name: 'Indomie Goreng', sku: 'MKN-001', price: 3500, cost: 2500, quantity: 5, discount: 0, subtotal: 17500 },
      { productId: 'prod-aqua', name: 'Aqua 600ml', sku: 'MNM-001', price: 4000, cost: 2500, quantity: 3, discount: 0, subtotal: 12000 },
    ],
    subtotal: 29500,
    discount: 0,
    tax: 0,
    total: 29500,
    paidAmount: 50000,
    changeAmount: 20500,
    paymentMethod: 'Tunai',
    status: 'completed',
    createdAt: timestamp(),
  },
  {
    id: 'trx-2',
    invoiceNumber: 'INV-20260817-002',
    items: [
      { productId: 'prod-teh', name: 'Teh Botol Sosro', sku: 'MNM-002', price: 5000, cost: 3500, quantity: 4, discount: 0, subtotal: 20000 },
      { productId: 'prod-roti', name: 'Roti Tawar', sku: 'MKN-003', price: 12000, cost: 9000, quantity: 2, discount: 0, subtotal: 24000 },
    ],
    subtotal: 44000,
    discount: 0,
    tax: 0,
    total: 44000,
    paidAmount: 50000,
    changeAmount: 6000,
    paymentMethod: 'QRIS',
    status: 'completed',
    createdAt: timestamp(),
  },
  {
    id: 'trx-3',
    invoiceNumber: 'INV-20260817-003',
    items: [
      { productId: 'prod-kopi', name: 'Kopi Sachet', sku: 'MKN-002', price: 2000, cost: 1200, quantity: 10, discount: 0, subtotal: 20000 },
    ],
    subtotal: 20000,
    discount: 0,
    tax: 0,
    total: 20000,
    paidAmount: 20000,
    changeAmount: 0,
    paymentMethod: 'Transfer',
    status: 'completed',
    createdAt: timestamp(),
  }
]

export const createEmptyState = (): PosState => ({
  version: DB_VERSION,
  categories: [],
  products: [],
  customers: [],
  transactions: [],
  expenses: [],
  stockMovements: [],
  settings: { storeName: 'POS UMKM Rifaldo', storeLogo: '', storeAddress: 'Jl. Ahmad Yani No. 12, Bandung', storePhone: '081298765432', taxRate: 0, allowNegativeStock: false, theme: 'light', receiptFooter: 'Terima kasih atas kunjungan Anda!', autoPrintReceipt: false },
})

const normalizeState = (value: PosState): PosState => ({ ...createEmptyState(), ...value, settings: { ...createEmptyState().settings, ...value.settings } })

const createSeedState = (): PosState => ({
  ...createEmptyState(),
  categories: demoCategories,
  products: demoProducts,
  transactions: demoTransactions,
  settings: {
    storeName: 'POS UMKM Rifaldo',
    storeLogo: '',
    storeAddress: 'Jl. Ahmad Yani No. 12, Bandung',
    storePhone: '081298765432',
    taxRate: 0,
    allowNegativeStock: false,
    theme: 'light',
    receiptFooter: 'Terima kasih atas kunjungan Anda!',
    autoPrintReceipt: false,
  },
})

let nativeDb: any = null

async function getNativeDb() {
  if (!Capacitor.isNativePlatform()) return null
  if (nativeDb) return nativeDb
  try {
    const module = await import('@capacitor-community/sqlite')
    const connection = new module.SQLiteConnection(module.CapacitorSQLite)
    nativeDb = await connection.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
    await nativeDb.open()
    await nativeDb.execute(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', color TEXT DEFAULT '#2457e6', icon TEXT DEFAULT '',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL, sku TEXT NOT NULL UNIQUE, barcode TEXT DEFAULT '', name TEXT NOT NULL, description TEXT DEFAULT '',
        category_id TEXT, purchase_price INTEGER NOT NULL DEFAULT 0, selling_price INTEGER NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'pcs', image_path TEXT DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY NOT NULL, invoice_number TEXT NOT NULL UNIQUE, customer_id TEXT, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, paid_amount INTEGER NOT NULL, change_amount INTEGER NOT NULL DEFAULT 0, payment_method TEXT NOT NULL, status TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
      CREATE TABLE IF NOT EXISTS transaction_items (id TEXT PRIMARY KEY NOT NULL, transaction_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name_snapshot TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, subtotal INTEGER NOT NULL, FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE IF NOT EXISTS stock_movements (id TEXT PRIMARY KEY NOT NULL, product_id TEXT NOT NULL, type TEXT NOT NULL, quantity INTEGER NOT NULL, stock_before INTEGER NOT NULL, stock_after INTEGER NOT NULL, reference_type TEXT DEFAULT '', reference_id TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TEXT NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY NOT NULL, category TEXT NOT NULL, description TEXT DEFAULT '', amount INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `)
    await nativeDb.run('INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)', [DB_VERSION, timestamp()])
    return nativeDb
  } catch (error) {
    console.warn('Native SQLite unavailable; using durable local fallback.', error)
    return null
  }
}

export async function initializeStore(): Promise<PosState> {
  const db = await getNativeDb()
  if (db) {
    const result = await db.query('SELECT value FROM app_state WHERE key = ?', ['pos_state'])
    if (result.values?.[0]?.value) return normalizeState(JSON.parse(result.values[0].value) as PosState)
    const initial = createSeedState()
    await persistState(initial)
    return initial
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { return normalizeState(JSON.parse(stored) as PosState) } catch { localStorage.removeItem(STORAGE_KEY) }
  }
  const initial = createSeedState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return initial
}

export async function persistState(state: PosState): Promise<void> {
  const db = await getNativeDb()
  if (db) {
    await db.run('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)', ['pos_state', JSON.stringify(state)])
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function seedDemoData(): Promise<PosState> {
  const seeded = createSeedState()
  await persistState(seeded)
  return seeded
}

export function createBackup(state: PosState): BackupFile {
  return { format: 'POS Backup', version: DB_VERSION, createdAt: timestamp(), data: state }
}

export function parseBackup(raw: string): BackupFile {
  const parsed = JSON.parse(raw) as BackupFile
  if (parsed.format !== 'POS Backup' || parsed.version !== DB_VERSION || !parsed.data?.products || !parsed.data?.transactions) {
    throw new Error('Format backup tidak valid atau versinya tidak didukung.')
  }
  return { ...parsed, data: normalizeState(parsed.data) }
}
