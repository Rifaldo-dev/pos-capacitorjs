# POS UMKM Rifaldo

POS UMKM Rifaldo adalah aplikasi Point of Sale client-only untuk warung, toko kecil, dan usaha rumahan. Aplikasi dibangun dengan React, TypeScript, Vite, dan CapacitorJS; transaksi dan stok dapat digunakan tanpa server maupun koneksi internet.

> **Identitas Android:** application ID dan namespace adalah `pos.rifaldo`.

## Fitur utama

Aplikasi menyediakan dashboard UMKM, katalog produk, pencarian nama/SKU/barcode, kamera scan QR/barcode, kategori, keranjang kasir, validasi stok, diskon, pajak, pembayaran tunai dan non-tunai, kembalian, invoice, riwayat transaksi, void dengan pengembalian stok, stock movement, restock manual, backup/restore JSON berversi, data demo, serta layout mobile-first.

Seluruh menu utama berada di **bottom navigation**: Beranda, Kasir, Produk, Stok, Transaksi, dan Pengaturan. Pengaturan toko mencakup perubahan nama toko, logo toko melalui upload gambar lokal, alamat, nomor telepon, pajak, footer struk, izin stok negatif, dan pilihan cetak struk otomatis. Logo dan identitas toko digunakan pada header aplikasi serta struk.

Struk menampilkan logo, nama toko, alamat, nomor telepon, invoice, waktu transaksi, item, subtotal, diskon, pajak, total, pembayaran, kembalian, serta footer kustom. Struk dapat dicetak memakai dialog print perangkat dan dibagikan melalui Android Share; jika Share tidak tersedia, teks struk disalin sebagai fallback.

## Arsitektur offline

Lapisan UI memakai state domain yang sama dengan adapter persistence. Pada Android, inisialisasi native menyiapkan SQLite melalui `@capacitor-community/sqlite`, termasuk tabel POS, foreign key, index, dan `schema_migrations`. Snapshot state disimpan di SQLite agar UI dapat dipulihkan. Pada browser preview, localStorage digunakan sebagai fallback agar alur dapat diuji tanpa perangkat Android.

## Struktur utama

```text
src/
├── App.tsx             # UI UMKM, bottom navigation, kamera scan, branding, struk
├── types.ts            # domain types dan store settings
├── pos.ts              # kalkulasi dan validasi domain
├── storage.ts          # SQLite initialization, migration, persistence, backup
├── pos.test.ts         # unit tests
└── styles.css          # mobile-first UI dan print stylesheet
android/                # project Capacitor Android dengan Gradle Wrapper
capacitor.config.ts     # appId: pos.rifaldo
.nvmrc
```

## Menjalankan setelah clone

Gunakan Node.js 22 LTS, JDK 21 untuk Capacitor 8, dan Android SDK API 36. Android Studio tidak diperlukan untuk build command-line; project menyediakan Gradle Wrapper.

```bash
git clone <repository>
cd pos-offline
nvm use
npm install
npm run dev
```

Untuk Android:

```bash
npm run build
npx cap sync android
cd android
export JAVA_HOME=/path/to/jdk-21
./gradlew -Dorg.gradle.java.installations.paths="$JAVA_HOME" assembleDebug
```

APK debug dihasilkan di:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Database dan migration

Native SQLite membuat tabel `categories`, `products`, `customers`, `suppliers`, `transactions`, `transaction_items`, `stock_movements`, `expenses`, `settings`, `app_state`, dan `schema_migrations`. Foreign key, unique invoice/SKU constraints, serta index pencarian produk dan waktu transaksi disiapkan ketika database dibuka. Migration baru harus menaikkan `DB_VERSION` dan bersifat idempotent.

Nilai uang disimpan sebagai integer Rupiah. Item transaksi mempertahankan snapshot nama, harga, quantity, dan subtotal agar histori tidak berubah ketika katalog diedit. Penyelesaian transaksi memperbarui transaksi, item, produk, dan stock movement pada satu state yang divalidasi sebelum disimpan.

## Format backup

```json
{
  "format": "POS Backup",
  "version": 1,
  "createdAt": "2026-08-15T00:00:00.000Z",
  "data": {
    "version": 1,
    "categories": [],
    "products": [],
    "customers": [],
    "transactions": [],
    "expenses": [],
    "stockMovements": [],
    "settings": {}
  }
}
```

Restore memvalidasi format dan versi, lalu meminta konfirmasi sebelum mengganti data aktif.

## Testing dan hasil verifikasi

```bash
npm test
npm run lint
npm run build
```

Test unit mencakup subtotal, diskon, pajak, total, kembalian yang aman, dan pencegahan stok negatif. Verifikasi revisi terakhir: **3 test lulus, lint 0 warning/0 error, web build berhasil, dan Android debug APK berhasil dibuat dengan application ID `pos.rifaldo`**.

## Scanner kamera dan branding publik

Kasir memiliki tombol **Scan QR / barcode** yang membuka kamera perangkat menggunakan `@capacitor/barcode-scanner`. Hasil scan dicocokkan dengan barcode atau SKU produk; jika cocok, produk langsung masuk ke keranjang. Form tambah produk juga memiliki tombol scan untuk mengisi barcode secara otomatis. Android meminta izin kamera melalui manifest, dan scanner dikonfigurasi memakai ZXING dengan dukungan QR serta barcode produk umum.

Setiap UMKM dapat membuka **Pengaturan**, memilih logo PNG/JPG/WebP dari perangkat, mengubah nama toko, alamat, nomor telepon, dan footer struk. Data logo disimpan sebagai data URL di snapshot lokal dan ikut terbawa dalam backup JSON, sehingga aplikasi dapat dibagikan sebagai produk publik tanpa server pusat.

## Keterbatasan saat ini

Printer Bluetooth thermal khusus, modul supplier/customer/purchasing/expenses yang lebih lengkap, laporan custom range, CSV import/export, PIN app lock, dan dark mode native belum memiliki UI penuh. Fitur cetak saat ini menggunakan dialog print Android/browser dan Android Share; integrasi printer thermal langsung memerlukan plugin printer serta pengujian perangkat fisik.
