# Scanner hotfix source notes

## Official Capacitor documentation

Source: https://capacitorjs.com/docs/apis/barcode-scanner

Retrieved 2026-08-15. The official documentation states that Android supports ZXING and MLKIT scanning libraries. ZXING supports all listed formats; MLKIT supports all except MAXICODE, RSS_14, RSS_EXPANDED, and UPC_EAN_EXTENSION. The API returns `{ ScanResult: string; format: CapacitorBarcodeScannerTypeHint }` and requires Android minimum SDK 26. The project’s Android APK uses package `pos.rifaldo`, minSdk 26, and targetSdk 36.

## Installed plugin configuration

Package: `@capacitor/barcode-scanner` version 3.1.0.

The installed Android plugin includes both `com.google.zxing:core:3.5.3` and `com.google.mlkit:barcode-scanning:17.3.0`. The hotfix selects `CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT` for Android scanning while preserving the `ALL` hint and the existing QR/barcode workflow.

## Additional offline research

Source: https://developers.google.com/ml-kit/vision/barcode-scanning/android

Google documents two ML Kit model modes: bundled models are statically linked and available immediately, while unbundled models may download dynamically. The project’s dependency is `com.google.mlkit:barcode-scanning:17.3.0`, the bundled dependency, and the rebuilt APK contains ML Kit barcode model assets. Google also recommends sufficient image resolution, focus, and barcode pixel width; EAN-13 should ideally occupy at least about 190 pixels across the input image.

Source: https://github.com/capacitor-community/barcode-scanner

The community plugin uses ZXing Android Embedded on Android and ZXing/browser on Web. Its documentation describes the Android path as local ZXing decoding and requires hardware acceleration for the camera preview. The current app manifest does not explicitly set `android:hardwareAccelerated="true"`, so this is a configuration item to verify if the native preview is used.

Source: https://github.com/journeyapps/zxing-android-embedded

ZXing Android Embedded is an on-device scanner library. Its documentation states that camera scanning requires hardware acceleration because it uses TextureView, and that camera permission must be granted at runtime.

## Working diagnosis

The v1.3.1 APK includes an offline ML Kit model, so lack of internet alone should not prevent decoding. However, the current native activity does not expose a configurable zoom/ROI and the user reports no detection even with a clear barcode. A more reliable next implementation should use a bundled, explicitly offline camera pipeline with a visible preview, targeted common retail formats, hardware acceleration, and explicit camera-permission handling. The scanner must not require a server or network request to decode.
