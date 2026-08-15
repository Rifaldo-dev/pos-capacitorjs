# Barcode scanner integration notes

The implementation uses `@capacitor/barcode-scanner` version 3.1.0.

Source: [Capacitor Barcode Scanner documentation](https://capacitorjs.com/docs/apis/barcode-scanner)

Relevant API:

```ts
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
const result = await CapacitorBarcodeScanner.scanBarcode({
  hint: CapacitorBarcodeScannerTypeHint.ALL,
  scanInstructions: 'Arahkan kamera ke QR atau barcode produk',
  scanButton: true,
  scanText: 'Scan',
})
const value = result.ScanResult
```

The plugin uses the device camera and requires Android `minSdkVersion = 26`. It supports QR and common product barcode formats, with `ALL` available as a type hint. The plugin's Android scanning-library options include ZXING and MLKIT.

Source: [@capacitor/barcode-scanner npm package](https://www.npmjs.com/package/@capacitor/barcode-scanner)
