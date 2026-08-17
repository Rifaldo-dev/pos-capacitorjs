import { formatDate, formatRupiah } from './pos'
import { connectBluetoothPrinter, isBluetoothPrinterConnected, writeBluetoothPrinter } from './bluetoothPrinter'
import type { PosState, Transaction } from './types'

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const bytes = (...values: number[]) => new Uint8Array(values)
const encoder = new TextEncoder()
const text = (value: string) => encoder.encode(value.replaceAll('\u0000', ''))
const concat = (...chunks: Uint8Array[]) => {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let offset = 0
  chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.length })
  return result
}
const line = (value = '') => concat(text(value), bytes(LF))
const center = (...content: Uint8Array[]) => concat(bytes(ESC, 0x61, 0x01), ...content, bytes(ESC, 0x61, 0x00))
const bold = (enabled: boolean) => bytes(ESC, 0x45, enabled ? 0x01 : 0x00)
const alignLeft = () => bytes(ESC, 0x61, 0x00)
const alignCenter = () => bytes(ESC, 0x61, 0x01)
const doubleHeight = (enabled: boolean) => bytes(ESC, 0x21, enabled ? 0x10 : 0x00)

const safeWidth = (paperWidth: 58 | 80 | undefined) => paperWidth === 80 ? 48 : 32
const fit = (value: string, width: number) => [...value].slice(0, width).join('')
const twoColumns = (left: string, right: string, width: number) => {
  const rightText = fit(right, Math.floor(width * .42))
  const leftWidth = Math.max(1, width - rightText.length - 1)
  return `${fit(left, leftWidth)}${' '.repeat(Math.max(1, width - Math.min(left.length, leftWidth) - rightText.length))}${rightText}`
}
const separator = (width: number) => '-'.repeat(width)

export function buildEscPosReceipt(state: PosState, transaction: Transaction): Uint8Array {
  const width = safeWidth(state.settings.bluetoothPaperWidth)
  const chunks: Uint8Array[] = [bytes(ESC, 0x40), alignCenter(), bold(true), doubleHeight(true), line(state.settings.storeName), doubleHeight(false), bold(false)]
  if (state.settings.storeAddress) chunks.push(line(fit(state.settings.storeAddress.replaceAll('\n', ' '), width)))
  if (state.settings.storePhone) chunks.push(line(state.settings.storePhone))
  chunks.push(line(separator(width)), alignLeft(), line(twoColumns('INVOICE', transaction.invoiceNumber, width)), line(twoColumns('WAKTU', formatDate(transaction.createdAt), width)), line(separator(width)), bold(true), line('ITEM'), bold(false))
  transaction.items.forEach((item) => {
    chunks.push(line(fit(item.name, width)), line(twoColumns(`  ${item.quantity} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal), width)))
  })
  chunks.push(line(separator(width)), line(twoColumns('Subtotal', formatRupiah(transaction.subtotal), width)), line(twoColumns('Diskon', `-${formatRupiah(transaction.discount)}`, width)), line(twoColumns('Pajak', formatRupiah(transaction.tax), width)), bold(true), line(twoColumns('TOTAL', formatRupiah(transaction.total), width)), bold(false), line(separator(width)), line(twoColumns(transaction.paymentMethod, formatRupiah(transaction.paidAmount), width)), line(twoColumns('Kembalian', formatRupiah(transaction.changeAmount), width)), line(), center(line(state.settings.receiptFooter || 'Terima kasih atas kunjungan Anda!')), line(), line(), bytes(GS, 0x56, 0x00))
  return concat(...chunks)
}

export async function printTransactionBluetooth(state: PosState, transaction: Transaction): Promise<void> {
  const address = state.settings.bluetoothPrinterAddress?.trim()
  if (!address) throw new Error('Pilih printer Bluetooth dari Pengaturan terlebih dahulu.')
  if (!(await isBluetoothPrinterConnected())) await connectBluetoothPrinter(address)
  await writeBluetoothPrinter(buildEscPosReceipt(state, transaction))
}
