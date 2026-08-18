import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createBackup, initializeStore, newId, parseBackup, persistState, seedDemoData, timestamp } from './storage'
import { NativeBarcodeScanner } from './nativeScanner'
import { printTransactionBluetooth } from './thermalPrinter'
import { calculateCart, calculateChange, dateKey, formatDate, formatRupiah, todayKey, validateQuantity } from './pos'
import type { CartItem, Page, PaymentMethod, PosState, Product, Transaction } from './types'
import { LOCAL_BACKUP_FOLDER } from './constants'
import type { LocalBackupFile, ScannerNotice } from './components/componentTypes'
import { BottomNav } from './components/navigation'
import { Dashboard, Cashier, Products, Transactions, Inventory, SettingsPage } from './components/pages'
import { BackupModal, ConfirmModal, PaymentModal, ProductModal, StockAdjustModal, TransactionModal } from './components/modals'
import './styles.css'

function scannerFeedback() {
  try { if (typeof navigator.vibrate === 'function') navigator.vibrate([70, 45, 70]) } catch { /* vibration is optional */ }
  try {
    const context = new window.AudioContext()
    const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = 'sine'; oscillator.frequency.value = 880; gain.gain.value = 0.08
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.12)
    oscillator.addEventListener('ended', () => void context.close())
  } catch { /* sound is optional when audio is unavailable */ }
}


function App() {
  const [state, setState] = useState<PosState | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [prefilledBarcode, setPrefilledBarcode] = useState('')
  const [pendingProductBarcodes, setPendingProductBarcodes] = useState<string[]>([])
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [scannerBusy, setScannerBusy] = useState(false)
  const [scannerNotice, setScannerNotice] = useState<ScannerNotice>({ status: 'idle', message: 'Siap memindai QR atau barcode produk.' })
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [printerBusy, setPrinterBusy] = useState(false)
  const [localBackups, setLocalBackups] = useState<LocalBackupFile[]>([])
  const [backupBusy, setBackupBusy] = useState(false)

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

  if (!state) return <div className="boot-screen"><div className="logo-mark">IP</div><h1>Ini POS</h1><p>Menyiapkan kasir offline...</p></div>

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
    setCart(existing ? cart.map((item) => item.productId === product.id ? { ...item, quantity } : item) : [...cart, { productId: product.id, name: product.name, sku: product.sku, price: product.sellingPrice, cost: product.purchasePrice, quantity: 1, discount: 0, image: product.image }])
    setToast(`${product.name} masuk keranjang`)
  }

  const scanProductCode = async (): Promise<string | null> => {
    if (scannerBusy) return null
    setScannerBusy(true)
    setScannerNotice({ status: 'opening', message: 'Membuka native camera scanner offline...' })
    try {
      const result = await NativeBarcodeScanner.scan()
      const code = result.content?.trim() || null
      if (!code) {
        setScannerNotice({ status: 'cancelled', message: 'Scan dibatalkan. Tekan tombol scan untuk mencoba lagi.' })
        return null
      }
      const now = Date.now()
      const format = result.format || 'Barcode / QR'
      if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.at < 1800) {
        setScannerNotice({ status: 'duplicate', message: 'Kode yang sama baru saja terbaca. Scan ganda diabaikan.', code, format })
        return null
      }
      lastScanRef.current = { code, at: now }
      scannerFeedback()
      setScannerNotice({ status: 'success', message: 'Kode berhasil terbaca oleh scanner native.', code, format })
      return code
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scanner native tidak tersedia.'
      const cancelled = message.includes('SCAN_CANCELLED') || message.includes('SCAN_INTERRUPTED') || message.toLowerCase().includes('dibatalkan')
      setScannerNotice({ status: cancelled ? 'cancelled' : 'error', message: cancelled ? 'Scan dibatalkan. Tekan tombol scan untuk mencoba lagi.' : message })
      return null
    } finally {
      setScannerBusy(false)
    }
  }

  const openAddProduct = (barcode = '') => {
    setEditingProduct(null)
    setPrefilledBarcode(barcode)
    setShowProductForm(true)
  }

  const scanProductCodes = async (): Promise<string[]> => {
    if (scannerBusy) return []
    setScannerBusy(true)
    setScannerNotice({ status: 'opening', message: 'Membuka native camera untuk scan banyak produk...' })
    try {
      const result = await NativeBarcodeScanner.scan({ multiScan: true })
      const codes = [...new Set((result.contents?.length ? result.contents : result.content ? [result.content] : []).map((code) => code.trim()).filter(Boolean))]
      if (!codes.length) {
        setScannerNotice({ status: 'cancelled', message: 'Belum ada kode yang dipindai.' })
        return []
      }
      scannerFeedback()
      setScannerNotice({ status: 'success', message: `${codes.length} barcode berhasil dipindai.`, code: codes.join(', '), format: 'Multi-scan' })
      return codes
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scanner native tidak tersedia.'
      const cancelled = message.includes('SCAN_CANCELLED') || message.includes('SCAN_INTERRUPTED') || message.toLowerCase().includes('dibatalkan')
      setScannerNotice({ status: cancelled ? 'cancelled' : 'error', message: cancelled ? 'Scan dibatalkan.' : message })
      return []
    } finally {
      setScannerBusy(false)
    }
  }

  const addScannedProductsToCart = (codes: string[]) => {
    const products = codes.map((code) => activeProducts.find((item) => item.barcode === code || item.sku === code)).filter((product): product is Product => Boolean(product))
    let blocked = 0
    const nextCart = [...cart]
    products.forEach((product) => {
      const existingIndex = nextCart.findIndex((item) => item.productId === product.id)
      const nextQuantity = (existingIndex >= 0 ? nextCart[existingIndex].quantity : 0) + 1
      const validation = validateQuantity(product, nextQuantity, state.settings.allowNegativeStock)
      if (validation) {
        blocked += 1
        return
      }
      if (existingIndex >= 0) nextCart[existingIndex] = { ...nextCart[existingIndex], quantity: nextQuantity }
      else nextCart.push({ productId: product.id, name: product.name, sku: product.sku, price: product.sellingPrice, cost: product.purchasePrice, quantity: 1, discount: 0, image: product.image })
    })
    setCart(nextCart)
    return { added: products.length - blocked, blocked }
  }

  const scanForCashier = async () => {
    const codes = await scanProductCodes()
    if (!codes.length) return
    setSearch(codes.join(' '))
    const knownCodes = codes.filter((code) => activeProducts.some((item) => item.barcode === code || item.sku === code))
    const unknownCodes = codes.filter((code) => !knownCodes.includes(code))
    const cartResult = addScannedProductsToCart(knownCodes)
    if (unknownCodes.length) {
      setPendingProductBarcodes(unknownCodes.slice(1))
      setScannerNotice((current) => ({ ...current, status: 'not-found', message: `${unknownCodes.length} barcode belum terdaftar. Form produk pertama dibuka.` }))
      setToast(`${cartResult.added} produk masuk keranjang. Lengkapi ${unknownCodes.length} produk baru.`)
      openAddProduct(unknownCodes[0])
      return
    }
    setScannerNotice((current) => ({ ...current, status: 'success', message: `${cartResult.added} produk ditambahkan ke keranjang.` }))
    setToast(`${cartResult.added} produk hasil scan masuk ke keranjang.`)
  }

  const scanForNewProduct = async () => {
    const code = await scanProductCode()
    if (!code) return
    const existing = state.products.find((item) => item.barcode === code)
    if (existing) {
      setSearch(code)
      setToast(`Kode sudah terdaftar pada produk ${existing.name}.`)
      setScannerNotice((current) => ({ ...current, status: 'duplicate', message: `Kode sudah terdaftar pada ${existing.name}.`, code }))
      return
    }
    openAddProduct(code)
    setScannerNotice((current) => ({ ...current, status: 'success', message: 'Barcode siap digunakan. Lengkapi form produk baru.' }))
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
    if (state.settings.autoPrintBluetooth && state.settings.bluetoothPrinterAddress) window.setTimeout(() => { void printBluetoothReceipt(transaction) }, 450)
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const productId = String(form.get('productId') ?? '').trim()
    const existing = state.products.find((item) => item.id === productId)
    const name = String(form.get('name') ?? '').trim(); const barcode = String(form.get('barcode') ?? '').trim(); const image = String(form.get('image') ?? '').trim(); const sellingPrice = Number(form.get('sellingPrice')); const purchasePrice = Number(form.get('purchasePrice')); const stock = Number(form.get('stock')); const minimumStock = Number(form.get('minimumStock'))
    if (!name || sellingPrice <= 0 || purchasePrice < 0 || stock < 0 || minimumStock < 0) { setToast('Lengkapi nama, harga, dan stok dengan nilai yang benar.'); return }
    if (barcode && state.products.some((item) => item.barcode === barcode && item.id !== productId)) { setToast('Barcode sudah digunakan produk lain. Gunakan barcode yang berbeda.'); return }
    const createdAt = timestamp()
    const product: Product = { id: existing?.id ?? newId('prod'), sku: String(form.get('sku') ?? '').trim() || `SKU-${Date.now()}`, barcode, name, categoryId: String(form.get('categoryId') ?? state.categories[0]?.id ?? ''), image: image || undefined, purchasePrice: purchasePrice || 0, sellingPrice, stock, minimumStock: minimumStock || 0, unit: String(form.get('unit') ?? 'pcs').trim() || 'pcs', isActive: existing?.isActive ?? true, createdAt: existing?.createdAt ?? createdAt, updatedAt: createdAt }
    const stockDelta = existing ? stock - existing.stock : stock
    const movement = stockDelta === 0 ? [] : [{ id: newId('mov'), productId: product.id, type: existing ? 'adjustment' as const : 'restock' as const, quantity: Math.abs(stockDelta), stockBefore: existing?.stock ?? 0, stockAfter: stock, note: existing ? 'Penyesuaian stok dari edit produk' : 'Stok awal produk', createdAt }]
    const products = existing ? state.products.map((item) => item.id === product.id ? product : item) : [product, ...state.products]
    await save({ ...state, products, stockMovements: [...movement, ...state.stockMovements] }, existing ? 'Produk berhasil diperbarui' : 'Produk berhasil disimpan')
    const nextBarcode = !existing ? pendingProductBarcodes[0] : ''
    if (nextBarcode) {
      setPendingProductBarcodes((current) => current.slice(1))
      setEditingProduct(null)
      setPrefilledBarcode(nextBarcode)
      setShowProductForm(true)
      setToast(`Produk tersimpan. Lanjut lengkapi barcode ${nextBarcode}.`)
    } else {
      setShowProductForm(false); setEditingProduct(null); setPrefilledBarcode('')
    }
  }

  const adjustStock = async (product: Product, mode: 'add' | 'remove' | 'set', amount: number, note: string) => {
    const value = Math.floor(Number(amount))
    if (!Number.isFinite(value) || value < 0 || (mode !== 'set' && value === 0)) { setToast('Masukkan jumlah stok yang valid.'); return }
    const stockAfter = mode === 'add' ? product.stock + value : mode === 'remove' ? product.stock - value : value
    if (stockAfter < 0) { setToast('Stok tidak boleh kurang dari nol.'); return }
    if (stockAfter === product.stock) { setToast('Tidak ada perubahan stok.'); return }
    const createdAt = timestamp()
    const movement = { id: newId('mov'), productId: product.id, type: mode === 'add' ? 'restock' as const : 'adjustment' as const, quantity: Math.abs(stockAfter - product.stock), stockBefore: product.stock, stockAfter, note: note.trim() || (mode === 'add' ? 'Restock manual' : mode === 'remove' ? 'Pengurangan stok manual' : 'Set stok manual'), createdAt }
    await save({ ...state, products: state.products.map((item) => item.id === product.id ? { ...item, stock: stockAfter, updatedAt: createdAt } : item), stockMovements: [movement, ...state.stockMovements] }, 'Stok berhasil diperbarui')
    setStockProduct(null)
  }

  const toggleProductActive = async (product: Product) => {
    const updatedAt = timestamp()
    const nextActive = !product.isActive
    await save({ ...state, products: state.products.map((item) => item.id === product.id ? { ...item, isActive: nextActive, updatedAt } : item) }, nextActive ? 'Produk diaktifkan kembali' : 'Produk dinonaktifkan dari kasir')
  }

  const deleteProduct = async (product: Product) => {
    const hasHistory = state.transactions.some((transaction) => transaction.items.some((item) => item.productId === product.id))
    if (hasHistory) { setToast('Produk memiliki histori transaksi. Nonaktifkan produk agar histori tetap aman.'); return }
    if (!window.confirm(`Hapus produk ${product.name} secara permanen?`)) return
    await save({ ...state, products: state.products.filter((item) => item.id !== product.id), stockMovements: state.stockMovements.filter((movement) => movement.productId !== product.id) }, 'Produk berhasil dihapus')
  }

  const voidTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`Batalkan ${transaction.invoiceNumber}? Stok akan dikembalikan.`)) return
    const createdAt = timestamp()
    const products = state.products.map((product) => { const item = transaction.items.find((line) => line.productId === product.id); return item ? { ...product, stock: product.stock + item.quantity, updatedAt: createdAt } : product })
    const movements = transaction.items.map((item) => { const product = state.products.find((p) => p.id === item.productId); return { id: newId('mov'), productId: item.productId, type: 'refund' as const, quantity: item.quantity, stockBefore: product?.stock ?? 0, stockAfter: (product?.stock ?? 0) + item.quantity, note: `Void ${transaction.invoiceNumber}`, createdAt } })
    await save({ ...state, products, transactions: state.transactions.map((item) => item.id === transaction.id ? { ...item, status: 'voided' as const } : item), stockMovements: [...movements, ...state.stockMovements] }, 'Transaksi dibatalkan dan stok dikembalikan'); setSelectedTransaction(null)
  }

  const refreshLocalBackups = async () => {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const result = await Filesystem.readdir({ path: LOCAL_BACKUP_FOLDER, directory: Directory.Documents })
      const files = result.files
        .filter((file) => file.type === 'file' && file.name.toLowerCase().endsWith('.json'))
        .map((file) => ({ name: file.name, size: file.size, mtime: file.mtime }))
        .sort((a, b) => b.mtime - a.mtime)
      setLocalBackups(files)
    } catch {
      setLocalBackups([])
    }
  }

  const openBackup = async () => {
    setShowBackup(true)
    await refreshLocalBackups()
  }

  const saveBackupToLocalFolder = async () => {
    if (backupBusy) return
    setBackupBusy(true)
    const fileName = `ini-pos-backup-${todayKey()}-${Date.now()}.json`
    const fileContent = JSON.stringify(createBackup(state), null, 2)
    const backupTime = timestamp()
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
      await Filesystem.writeFile({ path: `${LOCAL_BACKUP_FOLDER}/${fileName}`, directory: Directory.Documents, data: fileContent, encoding: Encoding.UTF8, recursive: true })
      await save({ ...state, settings: { ...state.settings, lastBackupAt: backupTime } }, `Backup tersimpan di Documents/${LOCAL_BACKUP_FOLDER}`)
      await refreshLocalBackups()
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Backup lokal tidak dapat disimpan.')
    } finally {
      setBackupBusy(false)
    }
  }

  const restoreLocalBackup = async (fileName: string) => {
    if (backupBusy) return
    setBackupBusy(true)
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
      const result = await Filesystem.readFile({ path: `${LOCAL_BACKUP_FOLDER}/${fileName}`, directory: Directory.Documents, encoding: Encoding.UTF8 })
      const content = typeof result.data === 'string' ? result.data : await result.data.text()
      const backup = parseBackup(content)
      if (window.confirm(`Pulihkan backup ${formatDate(backup.createdAt)}? Data saat ini akan diganti.`)) {
        await save(backup.data, 'Data berhasil dipulihkan dari backup lokal')
        setShowBackup(false)
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Backup lokal tidak dapat dibaca.')
    } finally {
      setBackupBusy(false)
    }
  }

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => { try { const backup = parseBackup(String(reader.result)); if (window.confirm(`Pulihkan backup ${formatDate(backup.createdAt)}? Data saat ini akan diganti.`)) { await save(backup.data, 'Data berhasil dipulihkan'); setShowBackup(false) } } catch (error) { setToast(error instanceof Error ? error.message : 'Backup tidak dapat dibaca.') } }
    reader.readAsText(file); event.target.value = ''
  }

  const printBluetoothReceipt = async (transaction: Transaction) => {
    if (printerBusy) return
    setPrinterBusy(true)
    try { await printTransactionBluetooth(state, transaction); setToast(`Struk ${transaction.invoiceNumber} dikirim ke printer Bluetooth.`) }
    catch (error) { setToast(error instanceof Error ? error.message : 'Struk gagal dicetak melalui Bluetooth.') }
    finally { setPrinterBusy(false) }
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

  const catalogProducts = state.products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = activeProducts.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="app-shell">
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}</p><h1>{pageTitle(page)}</h1></div><div className="top-actions"><span className="offline-chip"><i /> Offline</span><div className="cashier-avatar">{state.settings.storeLogo ? <img src={state.settings.storeLogo} alt="Logo toko" /> : state.settings.storeName.slice(0, 1).toUpperCase()}</div></div></header>
      {page === 'dashboard' && <Dashboard state={state} totalToday={totalToday} totalProfit={totalProfit} lowStock={lowStock} onNavigate={navigate} />}
      {page === 'kasir' && <Cashier state={state} cart={cart} search={search} setSearch={setSearch} filteredProducts={filteredProducts} addToCart={addToCart} updateCartQuantity={updateCartQuantity} clearCart={() => setCart([])} onScan={scanForCashier} scannerBusy={scannerBusy} scannerNotice={scannerNotice} onPay={() => cart.length ? setShowPayment(true) : setToast('Tambahkan produk ke keranjang terlebih dahulu.')} />}
      {page === 'produk' && <Products state={state} products={catalogProducts} search={search} setSearch={setSearch} onAdd={() => openAddProduct()} onScanAdd={scanForNewProduct} scannerBusy={scannerBusy} onEdit={setEditingProduct} onAdjust={setStockProduct} onToggleActive={toggleProductActive} onDelete={deleteProduct} />}
      {page === 'transaksi' && <Transactions state={state} onSelect={setSelectedTransaction} />}
      {page === 'stok' && <Inventory state={state} lowStock={lowStock} onEdit={setEditingProduct} onAdjust={setStockProduct} />}
      {page === 'lainnya' && <SettingsPage state={state} onSave={save} onBackup={openBackup} onSeed={() => setShowSeedConfirm(true)} />}
    </main>
    <BottomNav page={page} onNavigate={navigate} />
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
    {(showProductForm || editingProduct) && <ProductModal key={`${editingProduct?.id ?? 'new'}-${prefilledBarcode}`} state={state} product={editingProduct} prefilledBarcode={prefilledBarcode} onClose={() => { setShowProductForm(false); setEditingProduct(null); setPrefilledBarcode(''); setPendingProductBarcodes([]) }} onSubmit={saveProduct} onScan={scanProductCode} />}
    {stockProduct && <StockAdjustModal product={stockProduct} onClose={() => setStockProduct(null)} onSubmit={adjustStock} />}
    {showPayment && <PaymentModal state={state} cart={cart} onClose={() => setShowPayment(false)} onSubmit={completeTransaction} />}
    {selectedTransaction && <TransactionModal state={state} transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onVoid={() => voidTransaction(selectedTransaction)} onPrint={() => window.print()} onBluetoothPrint={() => printBluetoothReceipt(selectedTransaction)} onShare={() => shareReceipt(selectedTransaction)} />}
    {showBackup && <BackupModal state={state} backups={localBackups} busy={backupBusy} onClose={() => setShowBackup(false)} onSave={saveBackupToLocalFolder} onRestore={restoreLocalBackup} onImport={() => importRef.current?.click()} />}
    <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
    {showSeedConfirm && <ConfirmModal title="Gunakan data demo?" description="Data saat ini akan diganti dengan produk contoh untuk mencoba alur Ini POS." onClose={() => setShowSeedConfirm(false)} onConfirm={async () => { const seeded = await seedDemoData(); setState(seeded); setShowSeedConfirm(false); setToast('Data demo berhasil dimuat') }} />}
  </div>
}



function pageTitle(page: Page) { return ({ dashboard: 'Beranda', kasir: 'Kasir', produk: 'Produk', transaksi: 'Transaksi', stok: 'Stok', lainnya: 'Pengaturan' })[page] }



function makeReceiptText(state: PosState, transaction: Transaction) { return [state.settings.storeName, state.settings.storeAddress, state.settings.storePhone, state.settings.storeLogo ? '[Logo toko terpasang]' : '', `Struk ${transaction.invoiceNumber}`, formatDate(transaction.createdAt), '', ...transaction.items.map((item) => `${item.name} x${item.quantity}  ${formatRupiah(item.subtotal)}`), '', `Total: ${formatRupiah(transaction.total)}`, `Bayar: ${formatRupiah(transaction.paidAmount)}`, `Kembalian: ${formatRupiah(transaction.changeAmount)}`, state.settings.receiptFooter].filter(Boolean).join('\n') }

export default App
