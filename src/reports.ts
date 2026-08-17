import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { formatDate, formatRupiah } from './pos'
import type { PosState, Transaction } from './types'

export function filterTransactions(transactions: Transaction[], startDate?: string, endDate?: string): Transaction[] {
  return transactions.filter((t) => {
    if (t.status !== 'completed') return false
    const dateStr = t.createdAt.slice(0, 10)
    if (startDate && dateStr < startDate) return false
    if (endDate && dateStr > endDate) return false
    return true
  })
}

export function exportTransactionsExcel(state: PosState, startDate?: string, endDate?: string) {
  const transactions = filterTransactions(state.transactions, startDate, endDate)
  
  // Sheet 1: Transactions
  const txData = transactions.map((t, index) => ({
    No: index + 1,
    Invoice: t.invoiceNumber,
    Waktu: formatDate(t.createdAt),
    'Metode Pembayaran': t.paymentMethod,
    'Total Item': t.items.reduce((sum, item) => sum + item.quantity, 0),
    Subtotal: t.subtotal,
    Diskon: t.discount,
    Pajak: t.tax,
    Total: t.total,
    'Laba Kotor': t.items.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0),
  }))

  // Sheet 2: Items Sold
  const itemMap = new Map<string, { name: string; sku: string; qty: number; revenue: number; profit: number }>()
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const existing = itemMap.get(item.productId) || { name: item.name, sku: item.sku, qty: 0, revenue: 0, profit: 0 }
      existing.qty += item.quantity
      existing.revenue += item.subtotal
      existing.profit += (item.price - item.cost) * item.quantity
      itemMap.set(item.productId, existing)
    })
  })

  const itemData = Array.from(itemMap.values()).map((i, index) => ({
    No: index + 1,
    SKU: i.sku,
    'Nama Produk': i.name,
    'Terjual (Qty)': i.qty,
    'Total Penjualan': i.revenue,
    'Estimasi Laba': i.profit,
  }))

  const wb = XLSX.utils.book_new()
  const wsTx = XLSX.utils.json_to_sheet(txData)
  const wsItems = XLSX.utils.json_to_sheet(itemData)

  XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Transaksi')
  XLSX.utils.book_append_sheet(wb, wsItems, 'Produk Terjual')

  const filename = `Laporan_Penjualan_${state.settings.storeName.replace(/\s+/g, '_')}_${startDate || 'semua'}_${endDate || 'semua'}.xlsx`
  XLSX.writeFile(wb, filename)
}

export function exportTransactionsPDF(state: PosState, startDate?: string, endDate?: string) {
  const transactions = filterTransactions(state.transactions, startDate, endDate)
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.text(state.settings.storeName, 14, 18)
  doc.setFontSize(10)
  doc.text(state.settings.storeAddress || '', 14, 24)
  doc.text(`Telepon: ${state.settings.storePhone || '-'}`, 14, 29)

  doc.setFontSize(14)
  doc.text('LAPORAN PENJUALAN', 14, 40)
  doc.setFontSize(9)
  doc.text(`Periode: ${startDate || 'Awal'} s.d. ${endDate || 'Hari ini'}`, 14, 46)
  doc.text(`Dicetak: ${formatDate(new Date().toISOString())}`, 14, 51)

  // Summary
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((i, item) => i + item.quantity, 0), 0)

  doc.setFillColor(245, 247, 250)
  doc.rect(14, 56, 182, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Transaksi: ${transactions.length}`, 18, 67)
  doc.text(`Total Item: ${totalItems}`, 75, 67)
  doc.text(`Pendapatan: ${formatRupiah(totalRevenue)}`, 120, 67)

  // Table
  const tableRows = transactions.map((t, index) => [
    index + 1,
    t.invoiceNumber,
    formatDate(t.createdAt).replace(/^\d{2}\/\d{2}\/\d{4},\s*/, ''),
    t.paymentMethod,
    t.items.length,
    formatRupiah(t.total),
  ])

  ;(doc as any).autoTable({
    startY: 78,
    head: [['No', 'Invoice', 'Waktu', 'Pembayaran', 'Item', 'Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] }, // Orange primary matching POS theme
    styles: { fontSize: 8, cellPadding: 3 },
  })

  const filename = `Laporan_Penjualan_${state.settings.storeName.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
