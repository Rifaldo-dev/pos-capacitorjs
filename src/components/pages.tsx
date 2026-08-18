import { useRef, useState, type ChangeEvent } from 'react'
import { connectBluetoothPrinter, enableBluetooth, isBluetoothEnabled, listPairedPrinters, type BluetoothDevice } from '../bluetoothPrinter'
import { exportTransactionsExcel, exportTransactionsPDF } from '../reports'
import { calculateCart, dateKey, formatDate, formatRupiah, todayKey } from '../pos'
import type { CartItem, Page, PosState, Product, StoreSettings, Transaction } from '../types'
import { Empty, ProductVisual, TransactionRow } from './common'
import type { ScannerNotice } from './componentTypes'

export function Dashboard({ state, totalToday, totalProfit, lowStock, onNavigate }: { state: PosState; totalToday: number; totalProfit: number; lowStock: Product[]; onNavigate: (page: Page) => void }) {
  const today = state.transactions.filter((item) => dateKey(item.createdAt) === todayKey() && item.status === 'completed'); const productCounts = new Map<string, number>(); today.flatMap((item) => item.items).forEach((item) => productCounts.set(item.name, (productCounts.get(item.name) ?? 0) + item.quantity)); const best = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  return <section className="page-body"><div className="dashboard-header"><div><p className="dashboard-kicker">Ringkasan usaha</p><h2>{state.settings.storeName}</h2><p>Penjualan, stok, dan aktivitas toko hari ini.</p></div><button className="button primary dashboard-primary-action" onClick={() => onNavigate('kasir')}>＋ Transaksi baru</button></div><div className="dashboard-note"><span>●</span><div><strong>Operasional hari ini</strong><small>{today.length ? `${today.length} transaksi tercatat` : 'Belum ada transaksi hari ini'} · Data tersimpan di perangkat</small></div><button className="text-button" onClick={() => onNavigate('transaksi')}>Lihat transaksi</button></div><div className="metric-grid"><Metric label="Penjualan hari ini" value={formatRupiah(totalToday)} detail={`${today.length} transaksi`} tone="green" /><Metric label="Laba kotor" value={formatRupiah(totalProfit)} detail="Estimasi hari ini" tone="blue" /><Metric label="Produk terlaris" value={best ? `${best[0]} (${best[1]})` : 'Belum ada'} detail="Hari ini" tone="purple" /><Metric label="Stok menipis" value={String(lowStock.length)} detail={lowStock.length ? 'Perlu restock' : 'Semua aman'} tone={lowStock.length ? 'orange' : 'green'} /></div><div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><h3>Transaksi terbaru</h3><p>Penjualan terakhir</p></div><button className="text-button" onClick={() => onNavigate('transaksi')}>Lihat semua →</button></div>{state.transactions.length === 0 ? <Empty title="Belum ada transaksi" description="Transaksi pertama akan muncul di sini." action="Buka kasir" onAction={() => onNavigate('kasir')} /> : <div className="transaction-list">{state.transactions.slice(0, 5).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}</div>}</div><div className="panel"><div className="panel-heading"><div><h3>Perlu perhatian</h3><p>Stok di bawah batas minimum</p></div><button className="text-button" onClick={() => onNavigate('stok')}>Kelola →</button></div>{lowStock.length === 0 ? <div className="success-empty"><span>✓</span><strong>Stok aman</strong><p>Belum ada produk yang perlu di-restock.</p></div> : <div className="attention-list">{lowStock.slice(0, 5).map((product) => <div className="attention-item" key={product.id}><ProductVisual product={product} className="product-avatar" /><div><strong>{product.name}</strong><small>Minimum {product.minimumStock} {product.unit}</small></div><span className={product.stock === 0 ? 'stock-badge danger' : 'stock-badge warning'}>{product.stock === 0 ? 'Habis' : `${product.stock} tersisa`}</span></div>)}</div>}</div></div><div className="quick-actions"><h3>Akses cepat</h3><div className="quick-grid"><button onClick={() => onNavigate('kasir')}><span>＋</span><strong>Transaksi baru</strong><small>Mulai penjualan</small></button><button onClick={() => onNavigate('produk')}><span>▦</span><strong>Tambah produk</strong><small>Kelola katalog</small></button><button onClick={() => onNavigate('stok')}><span>↥</span><strong>Tambah stok</strong><small>Restock barang</small></button></div></div></section>
}
export function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`metric-card ${tone}`}><div className="metric-label"><span className="metric-dot" />{label}</div><strong>{value}</strong><small>{detail}</small></div> }

export function Cashier({ state, cart, search, setSearch, filteredProducts, addToCart, updateCartQuantity, clearCart, onScan, scannerBusy, scannerNotice, onPay }: { state: PosState; cart: CartItem[]; search: string; setSearch: (value: string) => void; filteredProducts: Product[]; addToCart: (product: Product) => void; updateCartQuantity: (id: string, quantity: number) => void; clearCart: () => void; onScan: () => void; scannerBusy: boolean; scannerNotice: ScannerNotice; onPay: () => void }) {
  const totals = calculateCart(cart, state.settings.taxRate)
  return <section className="page-body cashier-page"><div className="cashier-layout"><div className="catalog-panel"><div className="cashier-search-row"><div className="search-box large"><span>⌕</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, SKU, atau barcode..." /></div><button className="button scan-button" type="button" onClick={onScan} disabled={scannerBusy}>{scannerBusy ? 'Membuka kamera...' : '▣ Scan banyak produk'}</button></div><div className={`scanner-feedback scanner-${scannerNotice.status}`} role="status" aria-live="polite"><span className="scanner-feedback-icon">{scannerNotice.status === 'success' ? '✓' : scannerNotice.status === 'opening' ? '…' : scannerNotice.status === 'error' ? '!' : '⌕'}</span><div><strong>{scannerNotice.message}</strong><small>{scannerNotice.code ? `${scannerNotice.format ?? 'Kode'} · ${scannerNotice.code}` : 'QR dan barcode produk didukung'}</small></div>{['error', 'cancelled', 'not-found', 'duplicate'].includes(scannerNotice.status) && <button type="button" className="text-button" onClick={onScan} disabled={scannerBusy}>Coba lagi</button>}</div><div className="section-line"><h3>Produk tersedia</h3><span>{filteredProducts.length} produk</span></div>{filteredProducts.length === 0 ? <Empty title="Produk tidak ditemukan" description="Coba kata kunci lain atau tambahkan produk." /> : <div className="product-grid">{filteredProducts.map((product) => <button className="product-card" key={product.id} onClick={() => addToCart(product)}><ProductVisual product={product} className="product-image" /><div className="product-copy"><strong>{product.name}</strong><small>{product.sku} · {product.stock} {product.unit}</small><b>{formatRupiah(product.sellingPrice)}</b></div></button>)}</div>}</div><div className="cart-panel"><div className="cart-heading"><div><h3>Keranjang</h3><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} item</span></div><button className="text-button" onClick={() => cart.length && window.confirm('Kosongkan keranjang?') && clearCart()}>Kosongkan</button></div>{cart.length === 0 ? <div className="cart-empty"><div className="cart-icon">＋</div><strong>Keranjang masih kosong</strong><p>Pilih produk untuk memulai transaksi.</p></div> : <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.productId}><div className="cart-item-main"><ProductVisual product={item} className="product-avatar" /><div><strong>{item.name}</strong><small>{formatRupiah(item.price)} / unit</small></div></div><div className="quantity-control"><button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>+</button></div><strong className="line-total">{formatRupiah(item.price * item.quantity)}</strong></div>)}</div>}<div className="cart-summary"><div><span>Subtotal</span><strong>{formatRupiah(totals.subtotal)}</strong></div><div><span>Pajak ({state.settings.taxRate}%)</span><strong>{formatRupiah(totals.tax)}</strong></div><div className="total-line"><span>Total</span><strong>{formatRupiah(totals.total)}</strong></div><button className="button primary pay-button" disabled={!cart.length} onClick={onPay}>Bayar sekarang <span>→</span></button></div></div></div></section>
}

export function Products({ state, products, search, setSearch, onAdd, onScanAdd, scannerBusy, onEdit, onAdjust, onToggleActive, onDelete }: { state: PosState; products: Product[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onScanAdd: () => void; scannerBusy: boolean; onEdit: (product: Product) => void; onAdjust: (product: Product) => void; onToggleActive: (product: Product) => void; onDelete: (product: Product) => void }) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const closeMenu = () => setOpenMenuId(null)
  const runAction = (action: () => void) => { closeMenu(); action() }
  return <section className="page-body"><div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk, SKU, barcode..." /></div><div className="toolbar-actions"><button className="button secondary scan-add-button" onClick={onScanAdd} disabled={scannerBusy}>{scannerBusy ? 'Membuka kamera...' : '▣ Scan barcode'}</button><button className="button primary" onClick={onAdd}>＋ Tambah produk</button></div></div><div className="panel table-panel"><div className="table-meta"><div><h3>Daftar produk</h3><p>{products.filter((product) => product.isActive).length} aktif · {products.filter((product) => !product.isActive).length} nonaktif · {state.products.length} total</p></div><span className="filter-chip">Kelola katalog</span></div><div className="table-scroll"><table><thead><tr><th>Produk</th><th>SKU / Barcode</th><th>Kategori</th><th>Harga jual</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{products.map((product) => <tr className={product.isActive ? '' : 'inactive-row'} key={product.id}><td><div className="table-product"><ProductVisual product={product} className="product-avatar" /><strong>{product.name}</strong></div></td><td><span className="mono">{product.sku}</span><small>{product.barcode || 'Tanpa barcode'}</small></td><td><span className="category-chip">{state.categories.find((category) => category.id === product.categoryId)?.name ?? 'Umum'}</span></td><td><strong>{formatRupiah(product.sellingPrice)}</strong><small>Modal {formatRupiah(product.purchasePrice)}</small></td><td><span className={product.stock === 0 ? 'stock-badge danger' : product.stock <= product.minimumStock ? 'stock-badge warning' : 'stock-badge healthy'}>{product.stock} {product.unit}</span><small>Min. {product.minimumStock} {product.unit}</small></td><td><span className={product.isActive ? 'status-badge completed' : 'status-badge voided'}>{product.isActive ? 'Aktif' : 'Nonaktif'}</span></td><td><div className="table-actions"><button className="ellipsis-button" type="button" aria-label={`Buka aksi ${product.name}`} aria-expanded={openMenuId === product.id} onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === product.id ? null : product.id) }}>⋮</button>{openMenuId === product.id && <div className="action-menu" role="menu"><button type="button" role="menuitem" onClick={() => runAction(() => onEdit(product))}>Edit produk</button><button type="button" role="menuitem" onClick={() => runAction(() => onAdjust(product))}>Atur stok</button><button type="button" role="menuitem" onClick={() => runAction(() => onToggleActive(product))}>{product.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button><button type="button" role="menuitem" className="menu-danger" onClick={() => runAction(() => onDelete(product))}>Hapus produk</button></div>}</div></td></tr>)}</tbody></table>{products.length === 0 && <Empty title="Belum ada produk" description="Tambahkan produk pertama untuk mulai berjualan." action="＋ Tambah produk" onAction={onAdd} />}</div></div></section>
}
export function Transactions({ state, onSelect }: { state: PosState; onSelect: (transaction: Transaction) => void }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const filtered = state.transactions.filter((t) => {
    if (!startDate && !endDate) return true
    const d = t.createdAt.slice(0, 10)
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })
  return <section className="page-body">
    <div className="toolbar">
      <div>
        <h3 className="toolbar-title">Semua transaksi & Laporan</h3>
        <p className="muted">Riwayat tersimpan di perangkat · Unduh laporan Excel / PDF</p>
      </div>
      <div className="toolbar-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input" title="Dari tanggal" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input" title="Sampai tanggal" />
        <button className="button secondary" onClick={() => exportTransactionsExcel(state, startDate || undefined, endDate || undefined)}>📊 Export Excel</button>
        <button className="button primary" onClick={() => exportTransactionsPDF(state, startDate || undefined, endDate || undefined)}>📄 Export PDF</button>
      </div>
    </div>
    <div className="panel table-panel">
      <div className="table-meta">
        <div>
          <h3>Riwayat penjualan</h3>
          <p>Menampilkan {filtered.length} dari {state.transactions.length} transaksi</p>
        </div>
        <span className="filter-chip">Tap transaksi untuk detail</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Waktu</th>
              <th>Item</th>
              <th>Pembayaran</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((transaction) => (
              <tr className="clickable" key={transaction.id} onClick={() => onSelect(transaction)}>
                <td><strong className="mono">{transaction.invoiceNumber}</strong></td>
                <td>{formatDate(transaction.createdAt)}</td>
                <td>{transaction.items.reduce((sum, item) => sum + item.quantity, 0)} item</td>
                <td><span className="category-chip">{transaction.paymentMethod}</span></td>
                <td><strong>{formatRupiah(transaction.total)}</strong></td>
                <td><span className={`status-badge ${transaction.status}`}>{transaction.status === 'completed' ? 'Selesai' : transaction.status === 'voided' ? 'Void' : 'Refund'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty title="Tidak ada transaksi" description="Tidak ada transaksi pada rentang tanggal tersebut." />}
      </div>
    </div>
  </section>
}
export function Inventory({ state, lowStock, onEdit, onAdjust }: { state: PosState; lowStock: Product[]; onEdit: (product: Product) => void; onAdjust: (product: Product) => void }) { return <section className="page-body"><div className="metric-grid compact"><Metric label="Total produk" value={String(state.products.length)} detail="Dalam katalog" tone="blue" /><Metric label="Stok menipis" value={String(lowStock.length)} detail="Di bawah minimum" tone="orange" /><Metric label="Produk habis" value={String(state.products.filter((p) => p.stock === 0).length)} detail="Perlu restock" tone="purple" /></div><div className="panel table-panel"><div className="table-meta"><div><h3>Kontrol stok</h3><p>Tambah, kurangi, atau set stok baru. Semua perubahan tercatat.</p></div></div><div className="table-scroll"><table><thead><tr><th>Produk</th><th>Stok saat ini</th><th>Minimum</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{state.products.map((product) => <tr key={product.id}><td><div className="table-product"><ProductVisual product={product} className="product-avatar" /><strong>{product.name}</strong></div></td><td><strong>{product.stock} {product.unit}</strong></td><td>{product.minimumStock} {product.unit}</td><td><span className={product.stock === 0 ? 'stock-badge danger' : product.stock <= product.minimumStock ? 'stock-badge warning' : 'stock-badge healthy'}>{product.stock === 0 ? 'Habis' : product.stock <= product.minimumStock ? 'Stok rendah' : 'Aman'}</span></td><td><div className="table-actions"><button className="small-button" onClick={() => onAdjust(product)}>Atur stok</button><button className="small-button" onClick={() => onEdit(product)}>Edit</button></div></td></tr>)}</tbody></table></div></div><div className="panel movement-panel"><div className="panel-heading"><div><h3>Riwayat perubahan stok</h3><p>Audit restock, penjualan, refund, dan penyesuaian.</p></div></div><div className="movement-list">{state.stockMovements.slice(0, 12).map((movement) => { const product = state.products.find((item) => item.id === movement.productId); return <div className="movement-row" key={movement.id}><span className={`movement-dot ${movement.type}`} /> <div><strong>{product?.name ?? 'Produk dihapus'}</strong><small>{movement.note} · {formatDate(movement.createdAt)}</small></div><b>{movement.type === 'sale' || movement.type === 'refund' ? `${movement.type === 'sale' ? '-' : '+'}${movement.quantity}` : `${movement.stockBefore} → ${movement.stockAfter}`}</b></div> })}{state.stockMovements.length === 0 && <Empty title="Belum ada perubahan stok" description="Aktivitas stok akan tercatat di sini." />}</div></div></section> }

type SettingsSubPage = 'main' | 'identity' | 'logo' | 'operasional' | 'receipt' | 'printer' | 'backup' | 'appearance' | 'security' | 'data'

export function SettingsPage({ state, onSave, onBackup, onSeed }: { state: PosState; onSave: (next: PosState, message?: string) => Promise<void>; onBackup: () => void; onSeed: () => void }) {
  const [activeSubPage, setActiveSubPage] = useState<SettingsSubPage>('main')
  const [localSettings, setLocalSettings] = useState(state.settings)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [pairedPrinters, setPairedPrinters] = useState<BluetoothDevice[]>([])
  const [printerLoading, setPrinterLoading] = useState(false)
  const [printerMessage, setPrinterMessage] = useState('')

  const handleToggle = async (key: keyof StoreSettings, value: boolean) => {
    const nextSettings = { ...localSettings, [key]: value }
    setLocalSettings(nextSettings)
    await onSave({ ...state, settings: nextSettings })
  }

  const handleSaveSubPage = async (message?: string) => {
    await onSave({ ...state, settings: localSettings }, message)
    setActiveSubPage('main')
  }

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setLocalSettings((prev) => ({ ...prev, storeLogo: String(reader.result ?? '') }))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (activeSubPage === 'identity') {
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Identitas Toko</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="settings-form-group">
            <label>Nama Toko</label>
            <input value={localSettings.storeName} onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })} placeholder="Nama toko Anda" />
            <p className="settings-form-hint">Nama ini akan ditampilkan pada aplikasi dan struk.</p>
          </div>
          <div className="settings-form-group">
            <label>Alamat Toko</label>
            <textarea value={localSettings.storeAddress} onChange={(e) => setLocalSettings({ ...localSettings, storeAddress: e.target.value })} rows={3} placeholder="Alamat lengkap toko" />
          </div>
          <div className="settings-form-group">
            <label>Nomor Telepon</label>
            <input value={localSettings.storePhone} onChange={(e) => setLocalSettings({ ...localSettings, storePhone: e.target.value })} placeholder="08..." />
          </div>
        </div>
        <div className="settings-save-area">
          <button className="button primary" onClick={() => handleSaveSubPage('Identitas toko disimpan')}>Simpan</button>
        </div>
      </div>
    )
  }

  if (activeSubPage === 'logo') {
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Logo Toko</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="settings-logo-edit">
            <div className="settings-logo-preview-large">
              {localSettings.storeLogo ? <img src={localSettings.storeLogo} alt="Logo preview" /> : <span>{localSettings.storeName.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="settings-logo-actions">
              <button className="button secondary" onClick={() => logoInputRef.current?.click()}>Pilih dari Galeri</button>
              {localSettings.storeLogo && <button className="text-button" style={{ color: '#d32f2f' }} onClick={() => setLocalSettings({ ...localSettings, storeLogo: '' })}>Hapus Logo</button>}
              <input ref={logoInputRef} type="file" className="visually-hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
            <p className="settings-form-hint" style={{ textAlign: 'center' }}>Gunakan logo format PNG/JPG persegi untuk hasil terbaik pada struk.</p>
          </div>
        </div>
        <div className="settings-save-area">
          <button className="button primary" onClick={() => handleSaveSubPage('Logo toko diperbarui')}>Simpan</button>
        </div>
      </div>
    )
  }

  if (activeSubPage === 'operasional') {
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Operasional</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="settings-form-group">
            <label>Pajak (%)</label>
            <input type="number" min="0" max="100" value={localSettings.taxRate} onChange={(e) => setLocalSettings({ ...localSettings, taxRate: Number(e.target.value) })} />
            <p className="settings-form-hint">Persentase pajak yang akan ditambahkan pada setiap transaksi.</p>
          </div>
          <div className="settings-group" style={{ borderTop: 0 }}>
            <div className="settings-switch-row">
              <div className="settings-switch-info">
                <span className="settings-switch-label">Izinkan Stok Negatif</span>
                <span className="settings-switch-desc">Penjualan tetap dapat dilakukan meskipun stok habis.</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={localSettings.allowNegativeStock} onChange={(e) => handleToggle('allowNegativeStock', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
        <div className="settings-save-area">
          <button className="button primary" onClick={() => handleSaveSubPage('Pengaturan operasional disimpan')}>Simpan</button>
        </div>
      </div>
    )
  }

  if (activeSubPage === 'printer') {
    const refreshPrinters = async () => {
      setPrinterLoading(true); setPrinterMessage('')
      try {
        if (!(await isBluetoothEnabled())) { await enableBluetooth() }
        const devices = await listPairedPrinters()
        setPairedPrinters(devices)
        setPrinterMessage(devices.length ? `${devices.length} perangkat Bluetooth ditemukan.` : 'Belum ada perangkat berpasangan. Pasangkan printer dari Pengaturan Bluetooth Android terlebih dahulu.')
      } catch (error) { setPrinterMessage(error instanceof Error ? error.message : 'Perangkat Bluetooth tidak dapat dibaca.') }
      finally { setPrinterLoading(false) }
    }
    const choosePrinter = async (device: BluetoothDevice) => {
      setPrinterLoading(true); setPrinterMessage('Menghubungkan ke printer...')
      try { await connectBluetoothPrinter(device.address); setLocalSettings({ ...localSettings, bluetoothPrinterAddress: device.address, bluetoothPrinterName: device.name || device.address }); setPrinterMessage(`Terhubung ke ${device.name || device.address}. Tekan Simpan untuk menyimpan pilihan.`) }
      catch (error) { setPrinterMessage(error instanceof Error ? error.message : 'Printer tidak dapat dihubungkan.') }
      finally { setPrinterLoading(false) }
    }
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Printer Bluetooth</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="printer-intro"><div className="printer-icon">▤</div><div><strong>Cetak langsung ke printer thermal</strong><p>Gunakan printer Bluetooth yang sudah dipasangkan di Android. Koneksi dan pencetakan berjalan tanpa internet.</p></div></div>
          <button className="button secondary printer-scan-button" onClick={() => void refreshPrinters()} disabled={printerLoading}>{printerLoading ? 'Memproses...' : 'Cari perangkat berpasangan'}</button>
          {printerMessage && <div className="printer-message">{printerMessage}</div>}
          <div className="settings-form-group"><label>Printer terpilih</label><select value={localSettings.bluetoothPrinterAddress ?? ''} onChange={(event) => { const device = pairedPrinters.find((item) => item.address === event.target.value); if (device) void choosePrinter(device); else setLocalSettings({ ...localSettings, bluetoothPrinterAddress: '', bluetoothPrinterName: '', autoPrintBluetooth: false }) }}><option value="">Belum memilih printer</option>{pairedPrinters.map((device) => <option key={device.address} value={device.address}>{device.name || 'Printer tanpa nama'} · {device.address}</option>)}</select><p className="settings-form-hint">Jika daftar kosong, pasangkan printer melalui Pengaturan Bluetooth Android, lalu tekan tombol cari.</p></div>
          <div className="settings-form-group"><label>Lebar kertas</label><select value={localSettings.bluetoothPaperWidth ?? 58} onChange={(event) => setLocalSettings({ ...localSettings, bluetoothPaperWidth: Number(event.target.value) as 58 | 80 })}><option value="58">58 mm · 32 karakter/baris</option><option value="80">80 mm · 48 karakter/baris</option></select></div>
          <div className="settings-group" style={{ borderTop: 0 }}><div className="settings-switch-row"><div className="settings-switch-info"><span className="settings-switch-label">Cetak Bluetooth otomatis</span><span className="settings-switch-desc">Kirim struk ke printer setiap transaksi selesai.</span></div><label className="switch"><input type="checkbox" checked={Boolean(localSettings.autoPrintBluetooth)} disabled={!localSettings.bluetoothPrinterAddress} onChange={(event) => setLocalSettings({ ...localSettings, autoPrintBluetooth: event.target.checked })} /><span className="slider"></span></label></div></div>
        </div>
        <div className="settings-save-area"><button className="button primary" onClick={() => handleSaveSubPage('Pengaturan printer Bluetooth disimpan')}>Simpan</button></div>
      </div>
    )
  }

  if (activeSubPage === 'backup') {
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Cadangan & Pemulihan</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="cloud-intro"><div className="cloud-icon">▣</div><div><strong>Backup tersimpan di perangkat</strong><p>Ini POS membuat folder <strong>Documents/IniPOS_Backups</strong> secara otomatis. Semua cadangan tersimpan offline di HP Anda tanpa Google Drive atau Client ID.</p></div></div>
          <div className="info-box"><strong>Data tetap milik Anda.</strong><br />File JSON dapat ditemukan melalui File Manager Android pada folder <strong>Documents/IniPOS_Backups</strong>. Salin folder ini ke perangkat lain jika ingin menyimpan salinan tambahan.</div>
          <div className="cloud-actions"><button className="button primary" onClick={onBackup}>Buka Kelola Backup</button><button className="button secondary" onClick={() => setActiveSubPage('main')}>Kembali</button></div>
          {state.settings.lastBackupAt && <p className="settings-form-hint">Cadangan terakhir: {formatDate(state.settings.lastBackupAt)}</p>}
          <div className="settings-form-group"><label>Pemulihan data</label><p className="settings-form-hint">Pilih salah satu file JSON yang tersimpan di folder lokal, lalu pulihkan dengan konfirmasi.</p><button className="button secondary" onClick={onBackup}>Lihat file backup</button></div>
        </div>
      </div>
    )
  }

  if (activeSubPage === 'receipt') {
    return (
      <div className="settings-subpage">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => setActiveSubPage('main')}>←</button>
          <h2>Struk & Pembayaran</h2>
        </div>
        <div className="settings-subpage-content">
          <div className="settings-form-group">
            <label>Footer Struk</label>
            <textarea value={localSettings.receiptFooter} onChange={(e) => setLocalSettings({ ...localSettings, receiptFooter: e.target.value })} rows={3} placeholder="Pesan di bawah struk" />
          </div>
          <div className="settings-group" style={{ borderTop: 0 }}>
            <div className="settings-switch-row">
              <div className="settings-switch-info">
                <span className="settings-switch-label">Cetak Struk Otomatis</span>
                <span className="settings-switch-desc">Buka dialog cetak setelah transaksi selesai.</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={localSettings.autoPrintReceipt} onChange={(e) => handleToggle('autoPrintReceipt', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
        <div className="settings-save-area">
          <button className="button primary" onClick={() => handleSaveSubPage('Pengaturan struk disimpan')}>Simpan</button>
        </div>
      </div>
    )
  }

  return (
    <section className="settings-list-page">
      <div className="settings-profile">
        <div className="settings-profile-logo">
          {localSettings.storeLogo ? <img src={localSettings.storeLogo} alt="Store logo" /> : localSettings.storeName.slice(0, 1).toUpperCase()}
        </div>
        <div className="settings-profile-info">
          <h3>{localSettings.storeName}</h3>
          <p>{localSettings.storeAddress || 'Alamat belum diatur'}</p>
          <span className="settings-status-badge"><i></i> Data Lokal</span>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Identitas Toko</div>
        <div className="settings-group">
          <button className="settings-row" onClick={() => setActiveSubPage('identity')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Nama & Alamat</span>
              <span className="settings-row-value">{localSettings.storeName}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <button className="settings-row" onClick={() => setActiveSubPage('logo')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Logo Toko</span>
              <span className="settings-row-value">{localSettings.storeLogo ? 'Sudah terpasang' : 'Belum ada logo'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <button className="settings-row" onClick={() => setActiveSubPage('identity')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Nomor Telepon</span>
              <span className="settings-row-value">{localSettings.storePhone || 'Belum diatur'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Operasional</div>
        <div className="settings-group">
          <button className="settings-row" onClick={() => setActiveSubPage('operasional')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Pajak & Stok</span>
              <span className="settings-row-value">Pajak {localSettings.taxRate}% · Stok Negatif {localSettings.allowNegativeStock ? 'Aktif' : 'Mati'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <div className="settings-switch-row">
            <div className="settings-switch-info">
              <span className="settings-switch-label">Izinkan Stok Negatif</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={localSettings.allowNegativeStock} onChange={(e) => handleToggle('allowNegativeStock', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Struk & Pembayaran</div>
        <div className="settings-group">
          <button className="settings-row" onClick={() => setActiveSubPage('printer')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Printer Bluetooth</span>
              <span className="settings-row-value">{localSettings.bluetoothPrinterName || 'Belum terhubung'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <button className="settings-row" onClick={() => setActiveSubPage('receipt')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Informasi Struk</span>
              <span className="settings-row-value">Footer, auto-print, dll</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <div className="settings-switch-row">
            <div className="settings-switch-info">
              <span className="settings-switch-label">Cetak Struk Otomatis</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={localSettings.autoPrintReceipt} onChange={(e) => handleToggle('autoPrintReceipt', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Data & Backup</div>
        <div className="settings-group">
          <button className="settings-row" onClick={() => setActiveSubPage('backup')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Cadangan & Pemulihan</span>
              <span className="settings-row-value">{localSettings.lastBackupAt ? `Terakhir: ${formatDate(localSettings.lastBackupAt)}` : 'Tersimpan di Documents/IniPOS_Backups'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <button className="settings-row" onClick={onBackup}>
            <div className="settings-row-info">
              <span className="settings-row-label">Kelola Backup</span>
              <span className="settings-row-value">{localSettings.lastBackupAt ? `Terakhir: ${formatDate(localSettings.lastBackupAt)}` : 'Belum pernah backup'}</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
          <button className="settings-row" onClick={onSeed}>
            <div className="settings-row-info">
              <span className="settings-row-label">Muat Data Demo</span>
              <span className="settings-row-value">Isi produk contoh</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Tentang</div>
        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Versi Aplikasi</span>
              <span className="settings-row-value">2.4.0</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Database</span>
              <span className="settings-row-value">SQLite Lokal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title" style={{ color: '#d32f2f' }}>Zona Berbahaya</div>
        <div className="settings-group">
          <button className="settings-row settings-danger-row" onClick={() => window.confirm('Hapus semua data?') && onSave({ ...state, products: [], transactions: [], stockMovements: [] }, 'Seluruh data berhasil dihapus')}>
            <div className="settings-row-info">
              <span className="settings-row-label">Hapus Semua Data</span>
              <span className="settings-row-value">Tindakan ini tidak dapat dibatalkan</span>
            </div>
            <span className="settings-row-chevron">›</span>
          </button>
        </div>
      </div>
    </section>
  )
}
