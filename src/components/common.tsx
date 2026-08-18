import type { ReactNode } from 'react'
import type { CartItem, Product, Transaction } from '../types'
import { formatDate, formatRupiah } from '../pos'

export type NavIconName = 'home' | 'cart' | 'products' | 'stock' | 'transactions' | 'settings'

export function NavIcon({ name }: { name: NavIconName }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'home') return <svg {...props}><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>
  if (name === 'cart') return <svg {...props}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L20.5 8H6" /><path d="M9 8v4M13 8v4M17 8v4" /></svg>
  if (name === 'products') return <svg {...props}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
  if (name === 'stock') return <svg {...props}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21" /></svg>
  if (name === 'transactions') return <svg {...props}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 12h6M9 16h6M9 8h2" /></svg>
  return <svg {...props}><path d="M12 3.5 13.3 5a7.4 7.4 0 0 1 2 .8l2-.4 1.7 1.7-.4 2a7.4 7.4 0 0 1 .8 2l1.5 1.3v2.2l-1.5 1.3a7.4 7.4 0 0 1-.8 2l.4 2-1.7 1.7-2-.4a7.4 7.4 0 0 1-2 .8L12 20.5l-2.2-1.3a7.4 7.4 0 0 1-2-.8l-2 .4-1.7-1.7.4-2a7.4 7.4 0 0 1-.8-2L2.5 14v-2.2L4 10.5a7.4 7.4 0 0 1 .8-2l-.4-2 1.7-1.7 2 .4a7.4 7.4 0 0 1 2-.8L12 3.5Z" /><circle cx="12" cy="12.9" r="2.7" /></svg>
}


export function ProductVisual({ product, className = '' }: { product: Product | Pick<CartItem, 'name' | 'image'>; className?: string }) {
  return <span className={`product-visual ${className}`}>{product.image ? <img src={product.image} alt={product.name} /> : <span>{product.name.slice(0, 1).toUpperCase()}</span>}</span>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="close-button" onClick={onClose}>×</button></div>{children}</div></div> }

export function Empty({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><div className="empty-icon">□</div><strong>{title}</strong><p>{description}</p>{action && onAction && <button className="button secondary" onClick={onAction}>{action}</button>}</div> }

export function TransactionRow({ transaction }: { transaction: Transaction }) { return <div className="transaction-row"><div className="transaction-symbol">✓</div><div><strong>{transaction.invoiceNumber}</strong><small>{transaction.items.length} produk · {formatDate(transaction.createdAt)}</small></div><div className="transaction-method">{transaction.paymentMethod}</div><strong>{formatRupiah(transaction.total)}</strong></div> }
