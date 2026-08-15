import { registerPlugin } from '@capacitor/core'

export interface NativeBarcodeScanResult {
  content: string
  format: string
  cancelled?: boolean
}

export interface NativeBarcodeScannerPlugin {
  scan(): Promise<NativeBarcodeScanResult>
}

export const NativeBarcodeScanner = registerPlugin<NativeBarcodeScannerPlugin>('NativeBarcodeScanner')
