import { useState, type ChangeEvent, type FormEvent } from 'react'
import { calculateCart, calculateChange, formatDate, formatRupiah } from '../pos'
import type { CartItem, PaymentMethod, PosState, Product, Transaction } from '../types'
import { paymentMethods } from '../constants'
import { compressProductImage } from '../utils/images'
import { Modal } from './common'
import type { LocalBackupFile } from './componentTypes'

export function ProductModal({ state, product, prefilledBarcode, onClose, onSubmit, onScan }: { state: PosState; product: Product | null; prefilledBarcode: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onScan: () => Promise<string | null> }) {
  const [barcode, setBarcode] = useState(product?.barcode ?? prefilledBarcode)
  const [image, setImage] = useState(product?.image ?? '')
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState('')
  const scanAndFill = async () => { const code = await onScan(); if (code) setBarcode(code) }
  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setImageError('Pilih file gambar seperti JPG, PNG, atau WEBP.'); return }
    setImageBusy(true); setImageError('')
    try { setImage(await compressProductImage(file)) } catch (error) { setImageError(error instanceof Error ? error.message : 'Gambar tidak dapat diproses.') } finally { setImageBusy(false) }
  }
  return <Modal title={product ? 'Edit produk UMKM' : 'Tambah produk UMKM'} onClose={onClose}><form className="form-grid" onSubmit={(event) => { const data = new FormData(event.currentTarget); if (barcode && !data.get('barcode')) event.currentTarget.querySelector<HTMLInputElement>('input[name="barcode"]')!.value = barcode; onSubmit(event) }}><input type="hidden" name="productId" value={product?.id ?? ''} /><input type="hidden" name="image" value={image} /><div className="form-section"><h4>Informasi produk</h4>{!product && prefilledBarcode && <div className="scanner-prefill-notice"><span>✓</span><div><strong>Barcode berhasil dipindai</strong><small>{prefilledBarcode} · Lengkapi data produk lalu simpan.</small></div></div>}<div className="image-upload-card"><div className={`image-preview ${image ? 'has-image' : ''}`}>{image ? <img src={image} alt="Pratinjau produk" /> : <span>{product?.name?.slice(0, 1).toUpperCase() ?? 'P'}</span>}</div><div className="image-upload-copy"><strong>Foto produk</strong><small>Opsional. Gambar dikompresi dan disimpan offline di perangkat.</small><div className="inline-actions"><label className="button secondary image-upload-button">{imageBusy ? 'Memproses...' : image ? 'Ganti gambar' : 'Pilih gambar'}<input type="file" accept="image/*" onChange={selectImage} disabled={imageBusy} /></label>{image && <button type="button" className="small-button" onClick={() => setImage('')}>Hapus</button>}</div>{imageError && <small className="image-error">{imageError}</small>}</div></div><label>Nama produk *<input name="name" autoFocus required defaultValue={product?.name ?? ''} placeholder="Contoh: Beras 5kg" /></label><div className="two-col"><label>SKU<input name="sku" defaultValue={product?.sku ?? ''} placeholder="SKU-001" /></label><label>Barcode<input name="barcode" inputMode="numeric" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan atau ketik barcode" /><button type="button" className="small-button scan-inline" onClick={scanAndFill}>▣ Scan</button></label></div><label>Kategori<select name="categoryId" defaultValue={product?.categoryId ?? state.categories[0]?.id}>{state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><div className="form-section"><h4>Harga & stok</h4><div className="two-col"><label>Harga beli<input name="purchasePrice" type="number" min="0" inputMode="numeric" defaultValue={product?.purchasePrice ?? 0} /></label><label>Harga jual *<input name="sellingPrice" type="number" min="1" inputMode="numeric" required defaultValue={product?.sellingPrice ?? ''} /></label></div><div className="three-col"><label>Stok<input name="stock" type="number" min="0" inputMode="numeric" defaultValue={product?.stock ?? 0} /></label><label>Minimum stok<input name="minimumStock" type="number" min="0" inputMode="numeric" defaultValue={product?.minimumStock ?? 5} /></label><label>Satuan<input name="unit" defaultValue={product?.unit ?? 'pcs'} /></label></div>{product && <p className="form-hint">Perubahan stok dari form ini akan dicatat sebagai penyesuaian stok. Gunakan menu <strong>Stok</strong> untuk perubahan cepat.</p>}</div><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Batal</button><button className="button primary" type="submit" disabled={imageBusy}>{product ? 'Simpan perubahan' : 'Simpan produk'}</button></div></form></Modal>
}

export function PaymentModal({ state, cart, onClose, onSubmit }: { state: PosState; cart: CartItem[]; onClose: () => void; onSubmit: (method: PaymentMethod, paid: number, discount: number) => void }) { const [method, setMethod] = useState<PaymentMethod>('Tunai'); const [paid, setPaid] = useState(''); const [discount, setDiscount] = useState('0'); const totals = calculateCart(cart, state.settings.taxRate, Number(discount)); const paidValue = Number(paid) || 0; return <Modal title="Selesaikan pembayaran" onClose={onClose}><div className="payment-summary"><span>Total pembayaran</span><strong>{formatRupiah(totals.total)}</strong><small>{cart.reduce((sum, item) => sum + item.quantity, 0)} item · {method}</small></div><div className="payment-form"><label>Metode pembayaran<select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Diskon transaksi<input value={discount} type="number" min="0" onChange={(e) => setDiscount(e.target.value)} /></label>{method === 'Tunai' && <><label>Dibayar<input autoFocus value={paid} type="number" min={totals.total} inputMode="numeric" placeholder={String(totals.total)} onChange={(e) => setPaid(e.target.value)} /></label><div className="quick-pay"><button type="button" onClick={() => setPaid(String(totals.total))}>Uang pas</button><button type="button" onClick={() => setPaid(String(Math.ceil(totals.total / 50000) * 50000))}>Rp50.000</button><button type="button" onClick={() => setPaid(String(Math.ceil(totals.total / 100000) * 100000))}>Rp100.000</button></div><div className="change-row"><span>Kembalian</span><strong>{formatRupiah(calculateChange(totals.total, paidValue))}</strong></div></>}{method !== 'Tunai' && <div className="info-box">Pembayaran non-tunai dicatat sebagai metode pembayaran. Pastikan pembayaran telah diterima sebelum menyelesaikan transaksi.</div>}</div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Kembali</button><button className="button primary" disabled={method === 'Tunai' && paidValue < totals.total} onClick={() => onSubmit(method, method === 'Tunai' ? paidValue : totals.total, Number(discount))}>Konfirmasi bayar</button></div></Modal> }
export function TransactionModal({ state, transaction, onClose, onVoid, onPrint, onBluetoothPrint, onShare }: { state: PosState; transaction: Transaction; onClose: () => void; onVoid: () => void; onPrint: () => void; onBluetoothPrint: () => void; onShare: () => void }) {
  return <Modal title="Struk transaksi" onClose={onClose}>
    <div className="receipt receipt-sheet">
      <div className="receipt-branding">
        {state.settings.storeLogo ? <img className="receipt-logo-image" src={state.settings.storeLogo} alt="Logo toko" /> : <div className="receipt-logo">{state.settings.storeName.slice(0, 1).toUpperCase()}</div>}
        <strong className="receipt-store-name">{state.settings.storeName}</strong>
        <span>{state.settings.storeAddress}</span>
        {state.settings.storePhone && <span>{state.settings.storePhone}</span>}
      </div>
      <div className="receipt-meta">
        <div><span>Invoice</span><strong>{transaction.invoiceNumber}</strong></div>
        <div><span>Waktu</span><strong>{formatDate(transaction.createdAt)}</strong></div>
      </div>
      <div className="receipt-rule" />
      <div className="receipt-items-header"><span>ITEM</span><span>TOTAL</span></div>
      <div className="receipt-items">
        {transaction.items.map((item) => <div className="receipt-line" key={item.productId}>
          <div className="receipt-item-info"><strong>{item.name}</strong><span>{item.quantity} x {formatRupiah(item.price)}</span></div>
          <strong>{formatRupiah(item.subtotal)}</strong>
        </div>)}
      </div>
      <div className="receipt-total">
        <div><span>Subtotal</span><strong>{formatRupiah(transaction.subtotal)}</strong></div>
        <div><span>Diskon</span><strong>-{formatRupiah(transaction.discount)}</strong></div>
        <div><span>Pajak</span><strong>{formatRupiah(transaction.tax)}</strong></div>
        <div className="total-line"><span>Total</span><strong>{formatRupiah(transaction.total)}</strong></div>
      </div>
      <div className="receipt-payment">
        <div><span>Pembayaran</span><strong>{transaction.paymentMethod}</strong></div>
        <div><span>Dibayar</span><strong>{formatRupiah(transaction.paidAmount)}</strong></div>
        <div><span>Kembalian</span><strong>{formatRupiah(transaction.changeAmount)}</strong></div>
      </div>
      <div className="receipt-footer">{state.settings.receiptFooter}</div>
    </div>
    <div className="receipt-actions"><button className="button primary" onClick={onBluetoothPrint}>Bluetooth</button><button className="button secondary" onClick={onPrint}>Cetak struk</button><button className="button secondary" onClick={onShare}>Bagikan</button></div>
    <div className="modal-actions">{transaction.status === 'completed' && <button className="button danger-button" onClick={onVoid}>Void transaksi</button>}<button className="button ghost" onClick={onClose}>Tutup</button></div>
  </Modal>
}

export function BackupModal({ state, backups, busy, onClose, onSave, onRestore, onImport }: { state: PosState; backups: LocalBackupFile[]; busy: boolean; onClose: () => void; onSave: () => void; onRestore: (fileName: string) => void; onImport: () => void }) {
  const formatBackupTime = (mtime: number) => mtime ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(mtime)) : 'Waktu tidak tersedia'
  const formatBackupSize = (size: number) => size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`
  return <Modal title="Kelola Cadangan Data" onClose={onClose}>
    <div className="backup-card"><div className="backup-icon">▣</div><div><h3>Backup lokal perangkat</h3><p>Cadangan mencakup {state.products.length} produk, {state.transactions.length} transaksi, dan seluruh pengaturan toko.</p></div></div>
    <div className="backup-actions"><button className="button primary" onClick={onSave} disabled={busy}>↓ {busy ? 'Menyimpan...' : 'Simpan ke folder lokal'}</button><button className="button secondary" onClick={onImport} disabled={busy}>↑ Pilih file JSON</button></div>
    <div className="info-box">Folder backup: <strong>Documents/IniPOS_Backups</strong>. File tersimpan langsung di HP dan tidak dikirim ke Google Drive atau server mana pun.</div>
    <div className="settings-form-group"><label>Backup yang tersedia di perangkat</label>{backups.length === 0 ? <p className="settings-form-hint">Belum ada file backup. Tekan “Simpan ke folder lokal” untuk membuat backup pertama.</p> : <div className="cloud-backup-list">{backups.map((backup) => <div className="cloud-backup-row" key={backup.name}><div><strong>{backup.name}</strong><small>{formatBackupTime(backup.mtime)} · {formatBackupSize(backup.size)}</small></div><button className="button secondary" onClick={() => onRestore(backup.name)} disabled={busy}>Pulihkan</button></div>)}</div>}</div>
  </Modal>
}

export function ConfirmModal({ title, description, onClose, onConfirm }: { title: string; description: string; onClose: () => void; onConfirm: () => void }) { return <Modal title={title} onClose={onClose}><p className="confirm-copy">{description}</p><div className="modal-actions"><button className="button secondary" onClick={onClose}>Batal</button><button className="button primary" onClick={onConfirm}>Lanjutkan</button></div></Modal> }

export function StockAdjustModal({ product, onClose, onSubmit }: { product: Product; onClose: () => void; onSubmit: (product: Product, mode: 'add' | 'remove' | 'set', amount: number, note: string) => void }) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const labels = { add: 'Tambah stok', remove: 'Kurangi stok', set: 'Set stok menjadi' }
  return <Modal title={`Atur stok · ${product.name}`} onClose={onClose}>
    <div className="stock-adjust-summary"><span>Stok saat ini</span><strong>{product.stock} {product.unit}</strong></div>
    <div className="stock-adjust-form">
      <label>Jenis perubahan<select value={mode} onChange={(event) => setMode(event.target.value as 'add' | 'remove' | 'set')}><option value="add">Tambah stok / restock</option><option value="remove">Kurangi stok / rusak</option><option value="set">Set jumlah stok</option></select></label>
      <label>{labels[mode]}<input autoFocus type="number" min="0" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={mode === 'set' ? String(product.stock) : '0'} /></label>
      <label>Catatan (opsional)<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={mode === 'add' ? 'Contoh: Restock dari supplier' : mode === 'remove' ? 'Contoh: Produk rusak atau kedaluwarsa' : 'Contoh: Stock opname akhir hari'} /></label>
      <div className="stock-adjust-preview"><span>Stok setelah perubahan</span><strong>{mode === 'add' ? product.stock + (Number(amount) || 0) : mode === 'remove' ? Math.max(0, product.stock - (Number(amount) || 0)) : Number(amount) || 0} {product.unit}</strong></div>
    </div>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Batal</button><button type="button" className="button primary" onClick={() => onSubmit(product, mode, Number(amount), note)}>Simpan perubahan stok</button></div>
  </Modal>
}
