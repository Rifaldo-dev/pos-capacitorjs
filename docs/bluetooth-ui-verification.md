# Bluetooth Printer UI Verification

The production web build loaded successfully in the sandbox browser. The Settings page shows a new `Printer Bluetooth` entry with `Belum terhubung` status. Its sub-page renders the offline thermal printer explanation, paired-device search button, printer selector, 58 mm / 80 mm paper-width selector, auto-print switch, and save button.

In the browser preview, pressing `Cari perangkat berpasangan` correctly shows `Fitur Bluetooth hanya tersedia pada aplikasi Android.` This is expected because the Cordova Bluetooth Serial bridge is only present in the native Android APK. Android native build validation completed successfully after configuring Gradle with `/usr/lib/android-sdk`.

The Transactions page loads demo data, and opening a transaction displays the redesigned receipt modal with `Bluetooth`, `Cetak struk`, and `Bagikan` actions. The Bluetooth action is present without affecting the regular print fallback.
