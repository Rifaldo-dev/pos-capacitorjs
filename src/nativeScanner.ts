import { registerPlugin } from '@capacitor/core'

export interface NativeBarcodeScanResult {
  content: string
  contents?: string[]
  count?: number
  format: string
  cancelled?: boolean
}

export interface NativeBarcodeScanOptions {
  multiScan?: boolean
}

export interface NativeBarcodeScannerPlugin {
  scan(options?: NativeBarcodeScanOptions): Promise<NativeBarcodeScanResult>
}

export const NativeBarcodeScanner = registerPlugin<NativeBarcodeScannerPlugin>('NativeBarcodeScanner')
