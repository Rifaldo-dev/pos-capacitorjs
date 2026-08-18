import type { Page } from '../types'
import { NavIcon, type NavIconName } from './common'

export function BottomNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const items: { page: Page; label: string; icon: NavIconName }[] = [{ page: 'dashboard', label: 'Beranda', icon: 'home' }, { page: 'kasir', label: 'Kasir', icon: 'cart' }, { page: 'produk', label: 'Produk', icon: 'products' }, { page: 'stok', label: 'Stok', icon: 'stock' }, { page: 'transaksi', label: 'Transaksi', icon: 'transactions' }, { page: 'lainnya', label: 'Pengaturan', icon: 'settings' }]
  return <nav className="bottom-nav" aria-label="Navigasi utama">{items.map((item) => <button key={item.page} className={page === item.page ? 'active' : ''} onClick={() => onNavigate(item.page)}><span className="nav-icon"><NavIcon name={item.icon} /></span><small>{item.label}</small></button>)}</nav>
}
