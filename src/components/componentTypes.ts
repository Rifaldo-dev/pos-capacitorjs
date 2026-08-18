export type ScannerNotice = { status: 'idle' | 'opening' | 'success' | 'not-found' | 'duplicate' | 'cancelled' | 'error'; message: string; code?: string; format?: string }
export type LocalBackupFile = { name: string; size: number; mtime: number }
