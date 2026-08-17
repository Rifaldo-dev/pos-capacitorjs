# Ini POS

Ini POS adalah aplikasi **Point of Sale offline-first** untuk warung, toko kecil, kios, dan usaha rumahan. Aplikasi berjalan sebagai client-only Android app menggunakan React, TypeScript, Vite, CapacitorJS, dan SQLite lokal. Tidak diperlukan server pusat untuk mencatat transaksi, mengelola produk, mengatur stok, atau menyiapkan backup.

> **Package Android:** `pos.rifaldo`  
> **Release publik:** [Ini POS v2.2.0](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v2.2.0)  
> **Panduan Pengguna:** [Baca Panduan Pengguna Lengkap (Bahasa Indonesia)](docs/PANDUAN_PENGGUNA.md)

## Tampilan aplikasi

### Tampilan Beranda (Desktop & Mobile)

Beranda dirancang sebagai dashboard operasional bisnis yang profesional dan bersih (v2.2.0), menampilkan identitas toko, status operasional offline, ringkasan penjualan harian, laba kotor, produk terlaris, stok menipis, transaksi terbaru, serta akses cepat ke fungsi utama. Navigasi bawah menggunakan ikon SVG yang konsisten dan selalu siap diakses di semua ukuran layar. Tampilan kini semakin menarik dengan dukungan foto produk di bagian ringkasan stok.

![Dashboard Ini POS](docs/screenshots/dashboard.png)

### Tampilan Mobile

Layout mobile dirancang untuk kenyamanan kasir harian dengan bilah navigasi bawah (*bottom navigation*) yang mencakup **Beranda, Kasir, Produk, Stok, Transaksi, dan Pengaturan**.

![Dashboard mobile Ini POS](docs/screenshots/dashboard-mobile.png)

## Galeri semua menu

Berikut adalah tampilan seluruh menu utama yang tersedia pada bottom navigation Ini POS. Galeri ini menunjukkan tampilan aplikasi dengan data simulasi (*dummy data*) agar setiap UMKM dapat melihat gambaran operasional toko yang lengkap dan profesional.

![Galeri seluruh menu Ini POS](docs/screenshots/menu-gallery.png)

### Beranda

Ringkasan operasional toko: status offline, identitas toko, penjualan hari ini, laba kotor, produk terlaris, stok menipis, transaksi terbaru, dan aksi cepat.

![Menu Beranda](docs/screenshots/menu-dashboard.png)

### Kasir

Layar transaksi dengan pencarian nama/SKU/barcode, tombol **Scan banyak produk**, senter native, status scanner real-time, daftar produk bergambar, keranjang, ringkasan pajak, total, dan tombol pembayaran. Dukungan gambar produk memudahkan identifikasi barang secara visual.

![Menu Kasir](docs/screenshots/menu-kasir.png)

### Produk

Katalog produk dengan pencarian, foto produk, SKU/barcode, kategori, harga beli/jual, stok, minimum stok, status aktif, dan aksi CRUD. Pengguna dapat menambah produk beserta fotonya, mengedit detail produk, menonaktifkan atau mengaktifkan kembali produk, dan menghapus produk yang belum memiliki histori transaksi. Alur **Scan barcode** pada toolbar Produk membuka form tambah produk secara otomatis dengan barcode hasil scan sudah terisi. Barcode juga tetap dapat diisi dari kamera melalui form produk.

![Menu Produk](docs/screenshots/menu-produk.png)

### Stok

Kontrol persediaan yang menampilkan total produk, stok menipis, produk habis, status minimum, dan aksi **Atur stok**. Stok dapat ditambah, dikurangi, atau di-set ke jumlah tertentu dengan catatan perubahan. Semua perubahan menyimpan stok sebelum, stok sesudah, jumlah perubahan, alasan, dan waktu.

![Menu Stok](docs/screenshots/menu-stok.png)

### Transaksi

Riwayat transaksi dengan invoice, waktu, jumlah item, metode pembayaran, total, status, dan akses ke detail struk.

![Menu Transaksi](docs/screenshots/menu-transaksi.png)

### Pengaturan

Pengaturan publik untuk setiap UMKM: logo toko, nama toko, alamat, nomor telepon, pajak, footer struk, printer Bluetooth thermal, cetak otomatis, backup/restore, dan data demo. Menu Printer Bluetooth memungkinkan Anda menghubungkan aplikasi langsung ke printer struk thermal Anda.

![Menu Pengaturan](docs/screenshots/menu-pengaturan.png)

## Fitur utama

| Area | Kemampuan |
|---|---|
| Dashboard | Ringkasan usaha profesional dengan status operasional, grafik penjualan, laba kotor, produk terlaris bergambar, stok menipis, dan akses cepat. |
| Kasir | Pencarian produk bergambar (nama/SKU/barcode), keranjang belanja, diskon, pajak, pembayaran tunai/non-tunai, kembalian, dan invoice otomatis. |
| Scan kamera | Scanner native Android (CameraX + ML Kit) 100% offline, mendukung senter, multi-scan, berbagai format barcode/QR, dan alur pendaftaran produk otomatis. |
| Produk | CRUD katalog lengkap dengan **Foto Produk**, SKU/barcode, kategori, harga beli/jual, stok, dan menu aksi ringkas (⋮). |
| Stok | Manajemen stok (tambah/kurang/set), catatan alasan, validasi stok negatif, dan riwayat pergerakan stok lengkap. |
| Transaksi | Riwayat invoice, detail transaksi, void, pengembalian stok, cetak struk sistem, bagikan struk, **Cetak Bluetooth Thermal**, dan **Ekspor Laporan**. |
| Laporan | Filter penjualan berdasarkan rentang tanggal dan ekspor data ke format Excel (.xlsx) atau PDF profesional secara offline. |
| Printer Bluetooth | Koneksi langsung ke printer thermal (58mm/80mm) via Bluetooth Classic, format ESC/POS presisi, dan fitur cetak otomatis setelah transaksi. |
| Branding UMKM | Kustomisasi logo toko, nama, alamat, nomor telepon, footer struk, dan pengaturan operasional lainnya. |
| Data offline | SQLite lokal Android, localStorage fallback browser, backup/restore JSON, dan pemuatan data demo. |

## Setup toko untuk setiap UMKM

Setelah aplikasi diinstal, buka menu **Pengaturan**. Masukkan nama toko, alamat, nomor telepon, dan footer yang ingin ditampilkan pada struk. Upload logo toko dalam format PNG, JPG, atau WebP. Logo dan identitas tersebut akan digunakan pada header aplikasi, dialog struk, hasil cetak, dan data backup lokal.

Untuk transaksi, buka **Kasir** lalu tekan tombol **Scan banyak produk**. Izinkan akses kamera Android ketika diminta. Scanner v1.7.0 membuka kamera native Android melalui plugin Capacitor khusus; frame kamera diproses langsung oleh CameraX dan Google ML Kit bundled di perangkat, bukan oleh HTML, JavaScript, WebView, CDN, server, atau API online. Tekan **Senter** bila pencahayaan kurang, lalu pindai beberapa barcode satu per satu. Kode yang sama diabaikan agar tidak terhitung dua kali. Tekan **Selesai** setelah seluruh belanjaan pembeli dipindai; semua produk yang ditemukan langsung masuk ke keranjang dalam satu proses. Jika ada barcode yang belum terdaftar, aplikasi membuka form **Tambah produk** satu per satu dengan barcode otomatis terisi sampai seluruh produk baru selesai dilengkapi.

Untuk mendaftarkan produk dari awal, buka menu **Produk** lalu tekan **Scan barcode**. Setelah kamera membaca kode yang belum terdaftar, form tambah produk terbuka otomatis dan menampilkan notifikasi hijau bahwa barcode telah berhasil dipindai. Sistem menolak barcode yang sudah digunakan produk lain, baik ketika hasil scan ditemukan maupun ketika form disimpan. Jika ingin memasukkan barcode secara manual atau memindai dari form, tekan **＋ Tambah produk** lalu gunakan tombol **▣ Scan** pada kolom barcode.

Untuk mengelola katalog, buka **Produk**. Pada kolom **Aksi**, tekan menu tiga titik **⋮** untuk membuka pilihan **Edit produk**, **Atur stok**, **Aktifkan/Nonaktifkan**, atau **Hapus produk**. Tekan **Edit produk** untuk mengubah informasi produk, harga, kategori, barcode, minimum stok, atau stok. Untuk operasi stok harian yang lebih cepat, buka **Stok**, tekan **Atur stok**, lalu pilih salah satu mode berikut:

| Mode | Kegunaan |
|---|---|
| Tambah stok | Restock dari supplier atau stok masuk lainnya. |
| Kurangi stok | Produk rusak, kedaluwarsa, hilang, atau penyesuaian keluar. |
| Set stok | Stock opname atau koreksi ke jumlah fisik terbaru. |

Produk yang sudah pernah muncul dalam transaksi tidak dihapus permanen agar histori invoice tetap aman. Gunakan **Nonaktifkan** supaya produk tidak muncul lagi di Kasir; produk tersebut dapat diaktifkan kembali kapan saja.

Struk dapat dicetak langsung ke **Printer Bluetooth Thermal** (58mm/80mm) menggunakan perintah ESC/POS native, atau melalui dialog print Android/browser dan Android Share. Jika sistem Share tidak tersedia, aplikasi menyediakan fallback berupa penyalinan teks struk.

## Menjalankan dari source code

### Prasyarat

Gunakan Node.js 22 LTS, JDK 21 untuk Capacitor 8, serta Android SDK API 36. Android Studio tidak wajib untuk build command-line karena repository menyediakan Gradle Wrapper. Untuk menjalankan preview web saja, Node.js sudah cukup.

### Web preview

```bash
git clone https://github.com/Rifaldo-dev/pos-capacitorjs.git
cd pos-capacitorjs
nvm use
npm install
npm run dev
```

Preview browser memakai localStorage sebagai fallback persistence. Kamera QR/barcode native digunakan pada APK Android; browser preview dapat digunakan untuk meninjau layout dan alur POS. Dukungan suara/getar bergantung pada izin dan kemampuan perangkat, sehingga scanner tetap berfungsi ketika feedback hardware tidak tersedia.

### Build Android

```bash
npm run build
npx cap sync android
cd android
export JAVA_HOME=/path/to/jdk-21
./gradlew -Dorg.gradle.java.installations.paths="$JAVA_HOME" assembleDebug
```

APK debug dihasilkan pada lokasi berikut:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Atau unduh APK siap instal dari [GitHub Releases](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v1.7.0).

## Arsitektur offline

Lapisan UI memakai state domain yang sama dengan adapter persistence. Pada Android, inisialisasi native menyiapkan SQLite melalui `@capacitor-community/sqlite`, termasuk tabel POS, foreign key, index, dan `schema_migrations`. Snapshot state disimpan agar UI dapat dipulihkan ketika aplikasi dibuka kembali. Browser preview menggunakan localStorage sebagai fallback supaya alur dapat diuji tanpa perangkat Android.

Struktur utama project adalah sebagai berikut:

```text
src/
├── App.tsx             # UI UMKM, bottom navigation, kasir, scanner bridge, branding, struk
├── nativeScanner.ts    # typed Capacitor bridge ke scanner Android native
├── types.ts            # domain types dan store settings
├── pos.ts              # kalkulasi dan validasi domain
├── storage.ts          # SQLite initialization, migration, persistence, backup
├── pos.test.ts         # unit tests
└── styles.css          # mobile-first UI dan print stylesheet
android/                # project Capacitor Android dengan Gradle Wrapper
android/app/src/main/java/pos/rifaldo/NativeBarcodeScannerPlugin.java # CameraX + ML Kit native scanner
capacitor.config.ts     # appId: pos.rifaldo
docs/                   # catatan scanner dan screenshot UI
releases/               # APK dan checksum yang ikut dipush ke repository
```

## Database dan integritas transaksi

Native SQLite menyiapkan tabel `categories`, `products`, `customers`, `suppliers`, `transactions`, `transaction_items`, `stock_movements`, `expenses`, `settings`, `app_state`, dan `schema_migrations`. Foreign key, unique invoice/SKU constraints, serta index pencarian produk dan waktu transaksi disiapkan ketika database dibuka. Migration baru harus menaikkan `DB_VERSION` dan bersifat idempotent.

Nilai uang disimpan sebagai integer Rupiah. Item transaksi mempertahankan snapshot nama, harga, quantity, dan subtotal sehingga histori tidak berubah ketika katalog diedit. Penyelesaian transaksi memperbarui transaksi, item, produk, dan stock movement melalui state yang divalidasi sebelum disimpan.

## Format backup

Backup menggunakan JSON berversi agar data toko dapat dipindahkan atau disimpan secara manual.

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

Restore memvalidasi format dan versi, lalu meminta konfirmasi sebelum mengganti data aktif. Logo toko disimpan sebagai data URL di snapshot lokal dan ikut terbawa dalam backup JSON.

## Testing dan hasil verifikasi

```bash
npm test
npm run lint
npm run build
```

Suite saat ini mencakup perhitungan subtotal, diskon, pajak, total, kembalian yang aman, dan pencegahan penjualan ketika stok tidak mencukupi. Verifikasi terakhir menghasilkan **3 test lulus, lint 0 warning/0 error, web build berhasil, dan Android debug build berhasil**. Untuk pengujian perangkat, lakukan scan dengan internet aktif, Wi-Fi mati, data seluler mati, dan Airplane Mode aktif; seluruh alur scanner dirancang berjalan lokal.

## GitHub Release

Rilis publik terbaru tersedia pada [v2.2.0](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v2.2.0). Versi ini membawa peningkatan visual besar dengan ikon modern, dashboard profesional, dukungan foto produk, serta fitur pencetakan langsung ke printer Bluetooth thermal.

| Asset | Keterangan |
|---|---|
| `pos-rifaldo-v2.2.0-debug.apk` | APK debug v2.2.0 dengan scanner native, foto produk, dan printer Bluetooth. |
| `pos-rifaldo-v2.2.0-debug.apk.sha256` | Checksum SHA-256 untuk verifikasi APK v2.2.0. |

### Catatan rilis v2.2.0

Versi ini merupakan pencapaian besar dalam hal fungsionalitas dan estetika:
- **Printer Bluetooth Thermal**: Dukungan penuh untuk printer thermal 58mm/80mm via Bluetooth Classic dengan format ESC/POS yang presisi.
- **Foto Produk**: Pengguna dapat menambahkan foto pada setiap produk untuk katalog yang lebih profesional.
- **UI Modern (v2.0.0+)**: Ikon SVG profesional menggantikan emoji, dashboard bisnis yang didesain ulang, dan menu aksi ringkas.
- **Native Scanner**: Tetap menggunakan CameraX + ML Kit 100% offline dengan fitur senter dan multi-scan yang stabil.
- **Data Demo**: Pemuatan data contoh yang kaya untuk mempermudah pengguna baru memahami alur aplikasi.

### Catatan rilis v1.7.0

Scanner kini mengikuti alur **Klik Scan banyak produk → Native Camera Scanner → Senter opsional → Deteksi lokal berulang → Selesai → hasil melalui Capacitor Bridge → pencarian database lokal → keranjang atau antrean form Add Product**. Satu sesi scanner dapat menangani banyak barang untuk satu pembeli tanpa membuka kamera berulang kali. Tidak ada `html5-qrcode`, scanner WebView, CDN, API, atau server yang digunakan. Permission kamera dideklarasikan pada Android dan diminta saat runtime melalui permission callback plugin.

## Keterbatasan saat ini

Versi ini belum menyediakan modul supplier/customer/purchasing/expenses yang lengkap, laporan custom range yang mendalam, ekspor data ke Excel/CSV, PIN app lock, atau dark mode native. Integrasi printer Bluetooth saat ini mendukung protokol Bluetooth Classic SPP yang umum digunakan oleh printer thermal thermal 58mm/80mm; printer berbasis BLE murni mungkin memerlukan pembaruan plugin di masa mendatang.

## Sinkronisasi Google Drive

Ini POS menyediakan backup cloud opsional ke akun Google pengguna. Dari **Pengaturan → Sinkronisasi Google Drive**, pengguna dapat menghubungkan akun Google, membuat backup JSON, melihat daftar backup, memulihkan data, dan mengaktifkan backup otomatis. Operasional kasir, scanner, dan penyimpanan lokal tetap berjalan tanpa internet; koneksi hanya diperlukan saat proses sinkronisasi.

Sebelum digunakan, buat OAuth Client ID di Google Cloud Console dan masukkan Client ID tersebut di aplikasi. Panduan lengkap tersedia di [docs/GOOGLE_DRIVE_SETUP.md](docs/GOOGLE_DRIVE_SETUP.md).
