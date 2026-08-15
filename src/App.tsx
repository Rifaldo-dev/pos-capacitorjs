import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { createBackup, initializeStore, newId, parseBackup, persistState, seedDemoData, timestamp } from './storage'
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerAndroidScanningLibrary, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
import { calculateCart, calculateChange, dateKey, formatDate, formatRupiah, todayKey, validateQuantity } from './pos'
import type { CartItem, Page, PaymentMethod, PosState, Product, Transaction } from './types'
import './styles.css'

const paymentMethods: PaymentMethod[] = ['Tunai', 'QRIS', 'Transfer', 'Debit', 'Kredit', 'E-wallet', 'Lainnya']

function App() {
  const [state, setState] = useState<PosState | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [scannerBusy, setScannerBusy] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { initializeStore().then(setState) }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const save = async (next: PosState, message?: string) => {
    setState(next)
    await persistState(next)
    if (message) setToast(message)
  }

  if (!state) return <div className="boot-screen"><div className="logo-mark">RF</div><h1>POS UMKM</h1><p>Menyiapkan kasir offline...</p></div>

  const activeProducts = state.products.filter((product) => product.isActive)
  const lowStock = activeProducts.filter((product) => product.stock <= product.minimumStock)
  const todayTransactions = state.transactions.filter((transaction) => dateKey(transaction.createdAt) === todayKey() && transaction.status === 'completed')
  const totalToday = todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
  const totalProfit = todayTransactions.reduce((sum, transaction) => sum + transaction.items.reduce((profit, item) => profit + (item.price - item.cost) * item.quantity, 0), 0)
  const navigate = (nextPage: Page) => { setPage(nextPage); setSearch('') }

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id)
    const quantity = (existing?.quantity ?? 0) + 1
    const validation = validateQuantity(product, quantity, state.settings.allowNegativeStock)
    if (validation) { setToast(validation); return }
    setCart(existing ? cart.map((item) => item.productId === product.id ? { ...item, quantity } : item) : [...cart, { productId: product.id, name: product.name, sku: product.sku, price: product.sellingPrice, cost: product.purchasePrice, quantity: 1, discount: 0 }])
    setToast(`${product.name} masuk keranjang`)
  }

  const scanProductCode = async (): Promise<string | null> => {
    if (scannerBusy) return null
    setScannerBusy(true)
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Arahkan kamera ke QR atau barcode produk',
        scanButton: true,
        scanText: 'Scan kode',
        cancelButtonAccessibilityLabel: 'Batal scan',
        torchButtonOnAccessibilityLabel: 'Matikan lampu',
        torchButtonOffAccessibilityLabel: 'Nyalakan lampu',
        android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING },
      })
      return result.ScanResult?.trim() || null
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Kamera tidak dapat digunakan. Periksa izin kamera.')
      return null
    } finally {
      setScannerBusy(false)
    }
  }

  const scanForCashier = async () => {
    const code = await scanProductCode()
    if (!code) return
    setSearch(code)
    const product = activeProducts.find((item) => item.barcode === code || item.sku === code)
    if (product) addToCart(product)
    else setToast(`Kode ${code} belum terdaftar. Tambahkan barcode pada menu Produk.`)
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = state.products.find((item) => item.id === productId)
    if (!product) return
    if (quantity <= 0) { setCart(cart.filter((item) => item.productId !== productId)); return }
    const validation = validateQuantity(product, quantity, state.settings.allowNegativeStock)
    if (validation) { setToast(validation); return }
    setCart(cart.map((item) => item.productId === productId ? { ...item, quantity } : item))
  }

  const completeTransaction = async (paymentMethod: PaymentMethod, paidAmount: number, discount: number) => {
    const totals = calculateCart(cart, state.settings.taxRate, discount)
    if (!cart.length || paidAmount < totals.total) { setToast('Nominal pembayaran belum mencukupi.'); return }
    const createdAt = timestamp()
    const invoiceNumber = `INV-${createdAt.slice(0, 10).replaceAll('-', '')}-${String(state.transactions.length + 1).padStart(4, '0')}`
    const items = cart.map((item, index) => ({ ...item, subtotal: totals.itemSubtotals[index] }))
    const transaction: Transaction = { id: newId('trx'), invoiceNumber, items, subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax, total: totals.total, paidAmount, changeAmount: calculateChange(totals.total, paidAmount), paymentMethod, createdAt, status: 'completed' }
    const stockMovements = [...state.stockMovements]
    const products = state.products.map((product) => {
      const sold = cart.find((item) => item.productId === product.id)
      if (!sold) return product
      const stockBefore = product.stock; const stockAfter = stockBefore - sold.quantity
      stockMovements.push({ id: newId('mov'), productId: product.id, type: 'sale', quantity: sold.quantity, stockBefore, stockAfter, note: invoiceNumber, createdAt })
      return { ...product, stock: stockAfter, updatedAt: createdAt }
    })
    await save({ ...state, products, transactions: [transaction, ...state.transactions], stockMovements }, 'Transaksi berhasil disimpan')
    setCart([]); setShowPayment(false); setSelectedTransaction(transaction); setPage('transaksi')
    if (state.settings.autoPrintReceipt) window.setTimeout(() => window.print(), 350)
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim(); const sellingPrice = Number(form.get('sellingPrice')); const purchasePrice = Number(form.get('purchasePrice')); const stock = Number(form.get('stock'))
    if (!name || !sellingPrice || stock < 0) { setToast('Lengkapi nama, harga jual, dan stok dengan benar.'); return }
    const createdAt = timestamp()
    const product: Product = { id: newId('prod'), sku: String(form.get('sku') ?? '').trim() || `SKU-${Date.now()}`, barcode: String(form.get('barcode') ?? '').trim(), name, categoryId: String(form.get('categoryId') ?? state.categories[0]?.id ?? ''), purchasePrice: purchasePrice || 0, sellingPrice, stock, minimumStock: Number(form.get('minimumStock')) || 0, unit: String(form.get('unit') ?? 'pcs'), isActive: true, createdAt, updatedAt: createdAt }
    await save({ ...state, products: [product, ...state.products] }, 'Produk berhasil disimpan'); setShowProductForm(false)
  }

  const restockProduct = async (product: Product) => {
    const amount = Number(window.prompt(`Tambah stok untuk ${product.name}`, '10'))
    if (!amount || amount < 1) return
    const createdAt = timestamp(); const stockAfter = product.stock + amount
    await save({ ...state, products: state.products.map((item) => item.id === product.id ? { ...item, stock: stockAfter, updatedAt: createdAt } : item), stockMovements: [{ id: newId('mov'), productId: product.id, type: 'restock', quantity: amount, stockBefore: product.stock, stockAfter, note: 'Restock manual', createdAt }, ...state.stockMovements] }, 'Stok berhasil diperbarui')
  }

  const voidTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`Batalkan ${transaction.invoiceNumber}? Stok akan dikembalikan.`)) return
    const createdAt = timestamp()
    const products = state.products.map((product) => { const item = transaction.items.find((line) => line.productId === product.id); return item ? { ...product, stock: product.stock + item.quantity, updatedAt: createdAt } : product })
    const movements = transaction.items.map((item) => { const product = state.products.find((p) => p.id === item.productId); return { id: newId('mov'), productId: item.productId, type: 'refund' as const, quantity: item.quantity, stockBefore: product?.stock ?? 0, stockAfter: (product?.stock ?? 0) + item.quantity, note: `Void ${transaction.invoiceNumber}`, createdAt } })
    await save({ ...state, products, transactions: state.transactions.map((item) => item.id === transaction.id ? { ...item, status: 'voided' as const } : item), stockMovements: [...movements, ...state.stockMovements] }, 'Transaksi dibatalkan dan stok dikembalikan'); setSelectedTransaction(null)
  }

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(createBackup(state), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `pos-umkm-backup-${todayKey()}.json`; anchor.click(); URL.revokeObjectURL(url)
    save({ ...state, settings: { ...state.settings, lastBackupAt: timestamp() } }, 'Backup berhasil dibuat')
  }

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => { try { const backup = parseBackup(String(reader.result)); if (window.confirm(`Pulihkan backup ${formatDate(backup.createdAt)}? Data saat ini akan diganti.`)) { await save(backup.data, 'Data berhasil dipulihkan'); setShowBackup(false) } } catch (error) { setToast(error instanceof Error ? error.message : 'Backup tidak dapat dibaca.') } }
    reader.readAsText(file); event.target.value = ''
  }

  const shareReceipt = async (transaction: Transaction) => {
    const text = makeReceiptText(state, transaction)
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: `${state.settings.storeName} - ${transaction.invoiceNumber}`, text, dialogTitle: 'Bagikan atau cetak struk' })
    } catch {
      try { await navigator.clipboard.writeText(text); setToast('Struk disalin. Tempelkan ke aplikasi printer atau chat.') } catch { setToast('Bagikan struk melalui tombol cetak di perangkat.') }
    }
  }

  const filteredProducts = activeProducts.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="app-shell">
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}</p><h1>{pageTitle(page)}</h1></div><div className="top-actions"><span className="offline-chip"><i /> Offline</span><div className="cashier-avatar">{state.settings.storeLogo ? <img src={state.settings.storeLogo} alt="Logo toko" /> : state.settings.storeName.slice(0, 1).toUpperCase()}</div></div></header>
      {page === 'dashboard' && <Dashboard state={state} totalToday={totalToday} totalProfit={totalProfit} lowStock={lowStock} onNavigate={navigate} />}
      {page === 'kasir' && <Cashier state={state} cart={cart} search={search} setSearch={setSearch} filteredProducts={filteredProducts} addToCart={addToCart} updateCartQuantity={updateCartQuantity} clearCart={() => setCart([])} onScan={scanForCashier} onPay={() => cart.length ? setShowPayment(true) : setToast('Tambahkan produk ke keranjang terlebih dahulu.')} />}
      {page === 'produk' && <Products state={state} products={filteredProducts} search={search} setSearch={setSearch} onAdd={() => setShowProductForm(true)} onRestock={restockProduct} />}
      {page === 'transaksi' && <Transactions state={state} onSelect={setSelectedTransaction} />}
      {page === 'stok' && <Inventory state={state} lowStock={lowStock} onRestock={restockProduct} />}
      {page === 'lainnya' && <SettingsPage state={state} onSave={save} onBackup={() => setShowBackup(true)} onSeed={() => setShowSeedConfirm(true)} />}
    </main>
    <BottomNav page={page} onNavigate={navigate} />
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
    {showProductForm && <ProductModal state={state} onClose={() => setShowProductForm(false)} onSubmit={saveProduct} onScan={scanProductCode} />}
    {showPayment && <PaymentModal state={state} cart={cart} onClose={() => setShowPayment(false)} onSubmit={completeTransaction} />}
    {selectedTransaction && <TransactionModal state={state} transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onVoid={() => voidTransaction(selectedTransaction)} onPrint={() => window.print()} onShare={() => shareReceipt(selectedTransaction)} />}
    {showBackup && <BackupModal state={state} onClose={() => setShowBackup(false)} onDownload={downloadBackup} onImport={() => importRef.current?.click()} />}
    <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
    {showSeedConfirm && <ConfirmModal title="Gunakan data demo?" description="Data saat ini akan diganti dengan produk contoh untuk mencoba alur POS UMKM." onClose={() => setShowSeedConfirm(false)} onConfirm={async () => { const seeded = await seedDemoData(); setState(seeded); setShowSeedConfirm(false); setToast('Data demo berhasil dimuat') }} />}
  </div>
}

function pageTitle(page: Page) { return ({ dashboard: 'Beranda', kasir: 'Kasir', produk: 'Produk', transaksi: 'Transaksi', stok: 'Stok', lainnya: 'Pengaturan' })[page] }

function BottomNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const items: { page: Page; label: string; icon: string }[] = [{ page: 'dashboard', label: 'Beranda', icon: '⌂' }, { page: 'kasir', label: 'Kasir', icon: '＋' }, { page: 'produk', label: 'Produk', icon: '▦' }, { page: 'stok', label: 'Stok', icon: '▥' }, { page: 'transaksi', label: 'Transaksi', icon: '≡' }, { page: 'lainnya', label: 'Pengaturan', icon: '⚙' }]
  return <nav className="bottom-nav" aria-label="Navigasi utama">{items.map((item) => <button key={item.page} className={page === item.page ? 'active' : ''} onClick={() => onNavigate(item.page)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
}

function Dashboard({ state, totalToday, totalProfit, lowStock, onNavigate }: { state: PosState; totalToday: number; totalProfit: number; lowStock: Product[]; onNavigate: (page: Page) => void }) {
  const today = state.transactions.filter((item) => dateKey(item.createdAt) === todayKey() && item.status === 'completed'); const productCounts = new Map<string, number>(); today.flatMap((item) => item.items).forEach((item) => productCounts.set(item.name, (productCounts.get(item.name) ?? 0) + item.quantity)); const best = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  return <section className="page-body"><div className="welcome-card"><div><span className="pill">POS UMKM OFFLINE</span><h2>Selamat datang di {state.settings.storeName}</h2><p>Kelola penjualan dan stok toko dengan cepat, tanpa internet.</p></div><button className="button primary" onClick={() => onNavigate('kasir')}>Mulai jualan <span>→</span></button></div><div className="metric-grid"><Metric label="Penjualan hari ini" value={formatRupiah(totalToday)} detail={`${today.length} transaksi`} tone="green" /><Metric label="Laba kotor" value={formatRupiah(totalProfit)} detail="Estimasi hari ini" tone="blue" /><Metric label="Produk terlaris" value={best ? `${best[0]} (${best[1]})` : 'Belum ada'} detail="Hari ini" tone="purple" /><Metric label="Stok menipis" value={String(lowStock.length)} detail={lowStock.length ? 'Perlu restock' : 'Semua aman'} tone={lowStock.length ? 'orange' : 'green'} /></div><div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><h3>Transaksi terbaru</h3><p>Penjualan terakhir</p></div><button className="text-button" onClick={() => onNavigate('transaksi')}>Lihat semua →</button></div>{state.transactions.length === 0 ? <Empty title="Belum ada transaksi" description="Transaksi pertama akan muncul di sini." action="Buka kasir" onAction={() => onNavigate('kasir')} /> : <div className="transaction-list">{state.transactions.slice(0, 5).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}</div>}</div><div className="panel"><div className="panel-heading"><div><h3>Perlu perhatian</h3><p>Stok di bawah batas minimum</p></div><button className="text-button" onClick={() => onNavigate('stok')}>Kelola →</button></div>{lowStock.length === 0 ? <div className="success-empty"><span>✓</span><strong>Stok aman</strong><p>Belum ada produk yang perlu di-restock.</p></div> : <div className="attention-list">{lowStock.slice(0, 5).map((product) => <div className="attention-item" key={product.id}><span className="product-avatar">{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>Minimum {product.minimumStock} {product.unit}</small></div><span className={product.stock === 0 ? 'stock-badge danger' : 'stock-badge warning'}>{product.stock === 0 ? 'Habis' : `${product.stock} tersisa`}</span></div>)}</div>}</div></div><div className="quick-actions"><h3>Aksi cepat</h3><div className="quick-grid"><button onClick={() => onNavigate('kasir')}><span>＋</span><strong>Transaksi baru</strong><small>Mulai penjualan</small></button><button onClick={() => onNavigate('produk')}><span>▦</span><strong>Tambah produk</strong><small>Kelola katalog</small></button><button onClick={() => onNavigate('stok')}><span>↥</span><strong>Tambah stok</strong><small>Restock barang</small></button></div></div></section>
}
function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`metric-card ${tone}`}><div className="metric-label"><span className="metric-dot" />{label}</div><strong>{value}</strong><small>{detail}</small></div> }

function Cashier({ state, cart, search, setSearch, filteredProducts, addToCart, updateCartQuantity, clearCart, onScan, onPay }: { state: PosState; cart: CartItem[]; search: string; setSearch: (value: string) => void; filteredProducts: Product[]; addToCart: (product: Product) => void; updateCartQuantity: (id: string, quantity: number) => void; clearCart: () => void; onScan: () => void; onPay: () => void }) {
  const totals = calculateCart(cart, state.settings.taxRate)
  return <section className="page-body cashier-page"><div className="cashier-layout"><div className="catalog-panel"><div className="cashier-search-row"><div className="search-box large"><span>⌕</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, SKU, atau barcode..." /></div><button className="button scan-button" type="button" onClick={onScan}>▣ Scan QR / barcode</button></div><div className="section-line"><h3>Produk tersedia</h3><span>{filteredProducts.length} produk</span></div>{filteredProducts.length === 0 ? <Empty title="Produk tidak ditemukan" description="Coba kata kunci lain atau tambahkan produk." /> : <div className="product-grid">{filteredProducts.map((product) => <button className="product-card" key={product.id} onClick={() => addToCart(product)}><div className="product-image">{product.name.slice(0, 1)}</div><div className="product-copy"><strong>{product.name}</strong><small>{product.sku} · {product.stock} {product.unit}</small><b>{formatRupiah(product.sellingPrice)}</b></div></button>)}</div>}</div><div className="cart-panel"><div className="cart-heading"><div><h3>Keranjang</h3><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} item</span></div><button className="text-button" onClick={() => cart.length && window.confirm('Kosongkan keranjang?') && clearCart()}>Kosongkan</button></div>{cart.length === 0 ? <div className="cart-empty"><div className="cart-icon">＋</div><strong>Keranjang masih kosong</strong><p>Pilih produk untuk memulai transaksi.</p></div> : <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.productId}><div className="cart-item-main"><span className="product-avatar">{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{formatRupiah(item.price)} / unit</small></div></div><div className="quantity-control"><button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>+</button></div><strong className="line-total">{formatRupiah(item.price * item.quantity)}</strong></div>)}</div>}<div className="cart-summary"><div><span>Subtotal</span><strong>{formatRupiah(totals.subtotal)}</strong></div><div><span>Pajak ({state.settings.taxRate}%)</span><strong>{formatRupiah(totals.tax)}</strong></div><div className="total-line"><span>Total</span><strong>{formatRupiah(totals.total)}</strong></div><button className="button primary pay-button" disabled={!cart.length} onClick={onPay}>Bayar sekarang <span>→</span></button></div></div></div></section>
}

function Products({ state, products, search, setSearch, onAdd, onRestock }: { state: PosState; products: Product[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onRestock: (product: Product) => void }) { return <section className="page-body"><div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk, SKU, barcode..." /></div><button className="button primary" onClick={onAdd}>＋ Tambah produk</button></div><div className="panel table-panel"><div className="table-meta"><div><h3>Daftar produk</h3><p>{products.length} produk aktif dari {state.products.length} total</p></div><span className="filter-chip">Semua kategori</span></div><div className="table-scroll"><table><thead><tr><th>Produk</th><th>SKU / Barcode</th><th>Kategori</th><th>Harga jual</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><span className="product-avatar">{product.name.slice(0, 1)}</span><strong>{product.name}</strong></div></td><td><span className="mono">{product.sku}</span><small>{product.barcode || 'Tanpa barcode'}</small></td><td><span className="category-chip">{state.categories.find((category) => category.id === product.categoryId)?.name ?? 'Umum'}</span></td><td><strong>{formatRupiah(product.sellingPrice)}</strong><small>Modal {formatRupiah(product.purchasePrice)}</small></td><td><span className={product.stock === 0 ? 'stock-badge danger' : product.stock <= product.minimumStock ? 'stock-badge warning' : 'stock-badge healthy'}>{product.stock} {product.unit}</span></td><td><button className="small-button" onClick={() => onRestock(product)}>+ Stok</button></td></tr>)}</tbody></table>{products.length === 0 && <Empty title="Belum ada produk" description="Tambahkan produk pertama untuk mulai berjualan." action="＋ Tambah produk" onAction={onAdd} />}</div></div></section> }
function Transactions({ state, onSelect }: { state: PosState; onSelect: (transaction: Transaction) => void }) { return <section className="page-body"><div className="toolbar"><div><h3 className="toolbar-title">Semua transaksi</h3><p className="muted">Riwayat tersimpan di perangkat ini</p></div><span className="filter-chip">Tap transaksi untuk detail</span></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Invoice</th><th>Waktu</th><th>Item</th><th>Pembayaran</th><th>Total</th><th>Status</th></tr></thead><tbody>{state.transactions.map((transaction) => <tr className="clickable" key={transaction.id} onClick={() => onSelect(transaction)}><td><strong className="mono">{transaction.invoiceNumber}</strong></td><td>{formatDate(transaction.createdAt)}</td><td>{transaction.items.reduce((sum, item) => sum + item.quantity, 0)} item</td><td><span className="category-chip">{transaction.paymentMethod}</span></td><td><strong>{formatRupiah(transaction.total)}</strong></td><td><span className={`status-badge ${transaction.status}`}>{transaction.status === 'completed' ? 'Selesai' : transaction.status === 'voided' ? 'Void' : 'Refund'}</span></td></tr>)}</tbody></table>{state.transactions.length === 0 && <Empty title="Belum ada transaksi" description="Transaksi yang selesai akan muncul di sini." />}</div></div></section> }
function Inventory({ state, lowStock, onRestock }: { state: PosState; lowStock: Product[]; onRestock: (product: Product) => void }) { return <section className="page-body"><div className="metric-grid compact"><Metric label="Total produk" value={String(state.products.length)} detail="Dalam katalog" tone="blue" /><Metric label="Stok menipis" value={String(lowStock.length)} detail="Di bawah minimum" tone="orange" /><Metric label="Produk habis" value={String(state.products.filter((p) => p.stock === 0).length)} detail="Perlu restock" tone="purple" /></div><div className="panel table-panel"><div className="table-meta"><div><h3>Kontrol stok</h3><p>Perubahan stok tercatat otomatis</p></div></div><div className="table-scroll"><table><thead><tr><th>Produk</th><th>Stok saat ini</th><th>Minimum</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{state.products.map((product) => <tr key={product.id}><td><div className="table-product"><span className="product-avatar">{product.name.slice(0, 1)}</span><strong>{product.name}</strong></div></td><td><strong>{product.stock} {product.unit}</strong></td><td>{product.minimumStock} {product.unit}</td><td><span className={product.stock === 0 ? 'stock-badge danger' : product.stock <= product.minimumStock ? 'stock-badge warning' : 'stock-badge healthy'}>{product.stock === 0 ? 'Habis' : product.stock <= product.minimumStock ? 'Stok rendah' : 'Aman'}</span></td><td><button className="small-button" onClick={() => onRestock(product)}>＋ Restock</button></td></tr>)}</tbody></table></div></div></section> }

function SettingsPage({ state, onSave, onBackup, onSeed }: { state: PosState; onSave: (next: PosState, message?: string) => Promise<void>; onBackup: () => void; onSeed: () => void }) {
  const [settings, setSettings] = useState(state.settings)
  const logoInput = useRef<HTMLInputElement>(null)
  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setSettings((current) => ({ ...current, storeLogo: String(reader.result ?? '') }))
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  return <section className="page-body"><div className="settings-intro"><div className="store-preview">{settings.storeLogo ? <img className="store-logo-image" src={settings.storeLogo} alt="Logo toko" /> : <div className="logo-mark">{settings.storeName.slice(0, 1).toUpperCase()}</div>}<div><strong>{settings.storeName || 'Nama toko Anda'}</strong><small>{settings.storeAddress || 'Alamat toko belum diatur'}</small></div></div><span className="offline-chip"><i /> Data lokal</span></div><div className="settings-grid"><div className="panel settings-panel"><div className="panel-heading"><div><h3>Identitas dan logo toko</h3><p>Branding ini tampil di aplikasi dan setiap struk pelanggan.</p></div></div><div className="logo-setting"><div className="logo-setting-preview">{settings.storeLogo ? <img src={settings.storeLogo} alt="Preview logo" /> : <span>{settings.storeName.slice(0, 1).toUpperCase() || 'T'}</span>}</div><div><strong>Logo toko</strong><small>Gunakan PNG/JPG persegi, maksimal sekitar 1 MB.</small><div className="inline-actions"><button type="button" className="small-button" onClick={() => logoInput.current?.click()}>Pilih logo</button>{settings.storeLogo && <button type="button" className="text-button" onClick={() => setSettings({ ...settings, storeLogo: '' })}>Hapus</button>}</div><input ref={logoInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} /></div></div><label>Nama toko<input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} placeholder="Contoh: Warung Berkah" /></label><label>Alamat toko<textarea value={settings.storeAddress} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} rows={2} placeholder="Jl. ..." /></label><label>Nomor telepon<input value={settings.storePhone} onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })} placeholder="08..." /></label><button className="button primary" onClick={() => onSave({ ...state, settings }, 'Branding dan identitas toko berhasil disimpan')}>Simpan identitas toko</button></div><div className="panel settings-panel"><div className="panel-heading"><div><h3>Struk & pembayaran</h3><p>Atur tampilan dan kebiasaan cetak struk.</p></div></div><label>Pajak (%)<input type="number" min="0" max="100" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} /></label><label>Footer struk<textarea value={settings.receiptFooter} onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })} rows={2} placeholder="Terima kasih..." /></label><label className="toggle-row"><span><strong>Cetak struk otomatis</strong><small>Dialog cetak dibuka setelah pembayaran berhasil.</small></span><input type="checkbox" checked={settings.autoPrintReceipt} onChange={(e) => setSettings({ ...settings, autoPrintReceipt: e.target.checked })} /></label><label className="toggle-row"><span><strong>Izinkan stok negatif</strong><small>Penjualan tetap dapat dilakukan saat stok 0.</small></span><input type="checkbox" checked={settings.allowNegativeStock} onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })} /></label><button className="button secondary" onClick={() => onSave({ ...state, settings }, 'Pengaturan struk berhasil disimpan')}>Simpan pengaturan struk</button></div></div><div className="settings-grid compact-settings"><div className="panel settings-action-panel"><strong>Backup data</strong><p>{settings.lastBackupAt ? `Backup terakhir ${formatDate(settings.lastBackupAt)}` : 'Belum pernah membuat backup.'}</p><button className="small-button" onClick={onBackup}>Kelola backup</button></div><div className="panel settings-action-panel"><strong>Data demo UMKM</strong><p>Isi katalog contoh untuk mencoba alur kasir.</p><button className="small-button" onClick={onSeed}>Muat data demo</button></div></div></section>
}

function ProductModal({ state, onClose, onSubmit, onScan }: { state: PosState; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onScan: () => Promise<string | null> }) { const [barcode, setBarcode] = useState(''); const scanAndFill = async () => { const code = await onScan(); if (code) setBarcode(code) }; return <Modal title="Tambah produk UMKM" onClose={onClose}><form className="form-grid" onSubmit={(event) => { const data = new FormData(event.currentTarget); if (barcode && !data.get('barcode')) { event.currentTarget.querySelector<HTMLInputElement>('input[name="barcode"]')!.value = barcode } onSubmit(event) }}><div className="form-section"><h4>Informasi produk</h4><label>Nama produk *<input name="name" autoFocus required placeholder="Contoh: Beras 5kg" /></label><div className="two-col"><label>SKU<input name="sku" placeholder="SKU-001" /></label><label>Barcode<input name="barcode" inputMode="numeric" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan atau ketik barcode" /><button type="button" className="small-button scan-inline" onClick={scanAndFill}>▣ Scan</button></label></div><label>Kategori<select name="categoryId" defaultValue={state.categories[0]?.id}>{state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><div className="form-section"><h4>Harga & stok</h4><div className="two-col"><label>Harga beli<input name="purchasePrice" type="number" min="0" inputMode="numeric" defaultValue="0" /></label><label>Harga jual *<input name="sellingPrice" type="number" min="1" inputMode="numeric" required /></label></div><div className="three-col"><label>Stok awal<input name="stock" type="number" min="0" inputMode="numeric" defaultValue="0" /></label><label>Minimum stok<input name="minimumStock" type="number" min="0" inputMode="numeric" defaultValue="5" /></label><label>Satuan<input name="unit" defaultValue="pcs" /></label></div></div><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Batal</button><button className="button primary" type="submit">Simpan produk</button></div></form></Modal> }
function PaymentModal({ state, cart, onClose, onSubmit }: { state: PosState; cart: CartItem[]; onClose: () => void; onSubmit: (method: PaymentMethod, paid: number, discount: number) => void }) { const [method, setMethod] = useState<PaymentMethod>('Tunai'); const [paid, setPaid] = useState(''); const [discount, setDiscount] = useState('0'); const totals = calculateCart(cart, state.settings.taxRate, Number(discount)); const paidValue = Number(paid) || 0; return <Modal title="Selesaikan pembayaran" onClose={onClose}><div className="payment-summary"><span>Total pembayaran</span><strong>{formatRupiah(totals.total)}</strong><small>{cart.reduce((sum, item) => sum + item.quantity, 0)} item · {method}</small></div><div className="payment-form"><label>Metode pembayaran<select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Diskon transaksi<input value={discount} type="number" min="0" onChange={(e) => setDiscount(e.target.value)} /></label>{method === 'Tunai' && <><label>Dibayar<input autoFocus value={paid} type="number" min={totals.total} inputMode="numeric" placeholder={String(totals.total)} onChange={(e) => setPaid(e.target.value)} /></label><div className="quick-pay"><button type="button" onClick={() => setPaid(String(totals.total))}>Uang pas</button><button type="button" onClick={() => setPaid(String(Math.ceil(totals.total / 50000) * 50000))}>Rp50.000</button><button type="button" onClick={() => setPaid(String(Math.ceil(totals.total / 100000) * 100000))}>Rp100.000</button></div><div className="change-row"><span>Kembalian</span><strong>{formatRupiah(calculateChange(totals.total, paidValue))}</strong></div></>}{method !== 'Tunai' && <div className="info-box">Pembayaran non-tunai dicatat sebagai metode pembayaran. Pastikan pembayaran telah diterima sebelum menyelesaikan transaksi.</div>}</div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Kembali</button><button className="button primary" disabled={method === 'Tunai' && paidValue < totals.total} onClick={() => onSubmit(method, method === 'Tunai' ? paidValue : totals.total, Number(discount))}>Konfirmasi bayar</button></div></Modal> }
function TransactionModal({ state, transaction, onClose, onVoid, onPrint, onShare }: { state: PosState; transaction: Transaction; onClose: () => void; onVoid: () => void; onPrint: () => void; onShare: () => void }) { return <Modal title="Struk transaksi" onClose={onClose}><div className="receipt receipt-sheet"><div className="receipt-header">{state.settings.storeLogo ? <img className="receipt-logo-image" src={state.settings.storeLogo} alt="Logo toko" /> : <div className="receipt-logo">{state.settings.storeName.slice(0, 1).toUpperCase()}</div>}<strong>{state.settings.storeName}</strong><span>{state.settings.storeAddress}</span>{state.settings.storePhone && <span>{state.settings.storePhone}</span>}<span>{transaction.invoiceNumber} · {formatDate(transaction.createdAt)}</span></div>{transaction.items.map((item) => <div className="receipt-line" key={item.productId}><span>{item.name} × {item.quantity}</span><strong>{formatRupiah(item.subtotal)}</strong></div>)}<div className="receipt-total"><div><span>Subtotal</span><strong>{formatRupiah(transaction.subtotal)}</strong></div><div><span>Diskon</span><strong>-{formatRupiah(transaction.discount)}</strong></div><div><span>Pajak</span><strong>{formatRupiah(transaction.tax)}</strong></div><div className="total-line"><span>Total</span><strong>{formatRupiah(transaction.total)}</strong></div><div><span>{transaction.paymentMethod}</span><strong>Dibayar {formatRupiah(transaction.paidAmount)}</strong></div><div><span>Kembalian</span><strong>{formatRupiah(transaction.changeAmount)}</strong></div></div><div className="receipt-footer">{state.settings.receiptFooter}</div></div><div className="receipt-actions"><button className="button primary" onClick={onPrint}>Cetak struk</button><button className="button secondary" onClick={onShare}>Bagikan struk</button></div><div className="modal-actions">{transaction.status === 'completed' && <button className="button danger-button" onClick={onVoid}>Void transaksi</button>}<button className="button ghost" onClick={onClose}>Tutup</button></div></Modal> }
function BackupModal({ state, onClose, onDownload, onImport }: { state: PosState; onClose: () => void; onDownload: () => void; onImport: () => void }) { return <Modal title="Backup & restore" onClose={onClose}><div className="backup-card"><div className="backup-icon">⇄</div><div><h3>Data Anda tersimpan lokal</h3><p>Backup mencakup {state.products.length} produk, {state.transactions.length} transaksi, dan seluruh pengaturan toko.</p></div></div><div className="backup-actions"><button className="button primary" onClick={onDownload}>↓ Download backup JSON</button><button className="button secondary" onClick={onImport}>↑ Import backup</button></div><div className="info-box">Restore akan mengganti data aktif setelah konfirmasi.</div></Modal> }
function ConfirmModal({ title, description, onClose, onConfirm }: { title: string; description: string; onClose: () => void; onConfirm: () => void }) { return <Modal title={title} onClose={onClose}><p className="confirm-copy">{description}</p><div className="modal-actions"><button className="button secondary" onClick={onClose}>Batal</button><button className="button primary" onClick={onConfirm}>Lanjutkan</button></div></Modal> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="close-button" onClick={onClose}>×</button></div>{children}</div></div> }
function Empty({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><div className="empty-icon">□</div><strong>{title}</strong><p>{description}</p>{action && onAction && <button className="button secondary" onClick={onAction}>{action}</button>}</div> }
function TransactionRow({ transaction }: { transaction: Transaction }) { return <div className="transaction-row"><div className="transaction-symbol">✓</div><div><strong>{transaction.invoiceNumber}</strong><small>{transaction.items.length} produk · {formatDate(transaction.createdAt)}</small></div><div className="transaction-method">{transaction.paymentMethod}</div><strong>{formatRupiah(transaction.total)}</strong></div> }
function makeReceiptText(state: PosState, transaction: Transaction) { return [state.settings.storeName, state.settings.storeAddress, state.settings.storePhone, state.settings.storeLogo ? '[Logo toko terpasang]' : '', `Struk ${transaction.invoiceNumber}`, formatDate(transaction.createdAt), '', ...transaction.items.map((item) => `${item.name} x${item.quantity}  ${formatRupiah(item.subtotal)}`), '', `Total: ${formatRupiah(transaction.total)}`, `Bayar: ${formatRupiah(transaction.paidAmount)}`, `Kembalian: ${formatRupiah(transaction.changeAmount)}`, state.settings.receiptFooter].filter(Boolean).join('\n') }

export default App
