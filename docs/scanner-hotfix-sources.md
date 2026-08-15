# Scanner hotfix source notes

## Official Capacitor documentation

Source: https://capacitorjs.com/docs/apis/barcode-scanner

Retrieved 2026-08-15. The official documentation states that Android supports ZXING and MLKIT scanning libraries. ZXING supports all listed formats; MLKIT supports all except MAXICODE, RSS_14, RSS_EXPANDED, and UPC_EAN_EXTENSION. The API returns `{ ScanResult: string; format: CapacitorBarcodeScannerTypeHint }` and requires Android minimum SDK 26. The project’s Android APK uses package `pos.rifaldo`, minSdk 26, and targetSdk 36.

## Installed plugin configuration

Package: `@capacitor/barcode-scanner` version 3.1.0.

The installed Android plugin includes both `com.google.zxing:core:3.5.3` and `com.google.mlkit:barcode-scanning:17.3.0`. The hotfix selects `CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT` for Android scanning while preserving the `ALL` hint and the existing QR/barcode workflow.
