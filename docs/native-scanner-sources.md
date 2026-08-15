# Native offline scanner implementation sources

## Official references

1. Google ML Kit barcode scanning for Android: https://developers.google.com/ml-kit/vision/barcode-scanning/android
   - The bundled dependency `com.google.mlkit:barcode-scanning:17.3.0` statically links the model into the app and makes it immediately available without a first-use download.
   - Supported formats include Code 128, Code 39, Code 93, Codabar, EAN-13, EAN-8, ITF, UPC-A, UPC-E, QR Code, PDF417, Aztec, and Data Matrix.
   - Camera input should provide adequate resolution, focus, rotation, and barcode pixel size.

2. Capacitor Android plugin guide: https://capacitorjs.com/docs/plugins/android
   - A native plugin extends `com.getcapacitor.Plugin`, uses `@CapacitorPlugin`, and exposes methods with `@PluginMethod`.
   - Camera permission is declared using the plugin permission alias and requested at runtime through Capacitor permission callbacks.
   - A native plugin call resolves a `JSObject` result back through the Capacitor bridge.

## Project decision

The previous implementation used a WebView/JavaScript scanner and is being removed. The replacement will use a local Android Capacitor plugin written in Java, CameraX for the camera preview and frame analysis, and the bundled ML Kit barcode model. React will call only the plugin bridge and will not access camera frames or run a decoder in JavaScript.
