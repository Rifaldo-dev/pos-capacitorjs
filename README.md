# POS UMKM Rifaldo

POS UMKM Rifaldo adalah aplikasi **Point of Sale offline-first** untuk warung, toko kecil, kios, dan usaha rumahan. Aplikasi berjalan sebagai client-only Android app menggunakan React, TypeScript, Vite, CapacitorJS, dan SQLite lokal. Tidak diperlukan server pusat untuk mencatat transaksi, mengelola produk, mengatur stok, atau menyiapkan backup.

> **Package Android:** `pos.rifaldo`  
> **Release publik:** [POS UMKM Rifaldo v1.3.2](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v1.3.2)

## Tampilan aplikasi

### Dashboard desktop

Dashboard menampilkan status offline, identitas toko, penjualan hari ini, laba kotor, produk terlaris, stok menipis, transaksi terbaru, dan aksi cepat. Navigasi utama tetap berada di bagian bawah.

![Dashboard POS UMKM Rifaldo](docs/screenshots/dashboard.png)

### Tampilan mobile

Layout mobile dirancang untuk penggunaan kasir sehari-hari. Bottom navigation menyediakan akses cepat ke **Beranda, Kasir, Produk, Stok, Transaksi, dan Pengaturan**.

![Dashboard mobile POS UMKM Rifaldo](docs/screenshots/dashboard-mobile.png)

## Galeri semua menu

Berikut adalah tampilan seluruh menu utama yang tersedia pada bottom navigation POS UMKM Rifaldo. Galeri ini menunjukkan keadaan awal aplikasi dengan data kosong agar setiap UMKM dapat melihat struktur layar sebelum mengatur toko dan memasukkan katalog mereka.

![Galeri seluruh menu POS UMKM Rifaldo](docs/screenshots/menu-gallery.png)

### Beranda

Ringkasan operasional toko: status offline, identitas toko, penjualan hari ini, laba kotor, produk terlaris, stok menipis, transaksi terbaru, dan aksi cepat.

![Menu Beranda](docs/screenshots/menu-dashboard.png)

### Kasir

Layar transaksi dengan pencarian nama/SKU/barcode, tombol **Scan QR / barcode**, status scanner real-time, daftar produk, keranjang, ringkasan pajak, total, dan tombol pembayaran.

![Menu Kasir](docs/screenshots/menu-kasir.png)

### Produk

Katalog produk dengan pencarian, SKU/barcode, kategori, harga beli/jual, stok, minimum stok, status aktif, dan aksi CRUD. Pengguna dapat menambah produk, mengedit detail produk, menonaktifkan atau mengaktifkan kembali produk, dan menghapus produk yang belum memiliki histori transaksi. Alur **Scan barcode** pada toolbar Produk membuka form tambah produk secara otomatis dengan barcode hasil scan sudah terisi; pengguna tinggal melengkapi nama, harga, stok, dan informasi lain sebelum menyimpan. Barcode juga tetap dapat diisi dari kamera melalui form produk.

![Menu Produk](docs/screenshots/menu-produk.png)

### Stok

Kontrol persediaan yang menampilkan total produk, stok menipis, produk habis, status minimum, dan aksi **Atur stok**. Stok dapat ditambah, dikurangi, atau di-set ke jumlah tertentu dengan catatan perubahan. Semua perubahan menyimpan stok sebelum, stok sesudah, jumlah perubahan, alasan, dan waktu.

![Menu Stok](docs/screenshots/menu-stok.png)

### Transaksi

Riwayat transaksi dengan invoice, waktu, jumlah item, metode pembayaran, total, status, dan akses ke detail struk.

![Menu Transaksi](docs/screenshots/menu-transaksi.png)

### Pengaturan

Pengaturan publik untuk setiap UMKM: logo toko, nama toko, alamat, nomor telepon, pajak, footer struk, cetak otomatis, backup/restore, dan data demo.

![Menu Pengaturan](docs/screenshots/menu-pengaturan.png)

## Fitur utama

| Area | Kemampuan |
|---|---|
| Dashboard | Ringkasan penjualan, laba kotor, produk terlaris, stok menipis, transaksi terbaru, dan aksi cepat. |
| Kasir | Pencarian produk berdasarkan nama, SKU, atau barcode; keranjang; diskon; pajak; pembayaran tunai/non-tunai; kembalian; dan invoice. |
| Scan kamera | Scan QR/barcode dari kamera Android dengan kamera belakang, orientasi adaptif, decoder Google ML Kit untuk format QR dan barcode retail umum, torch, suara/getar setelah berhasil, pencegahan scan ganda, status kode, retry, pencarian produk otomatis, serta alur barcode-first untuk membuka form tambah produk dengan barcode terisi. |
| Produk | CRUD katalog: tambah, lihat, edit nama/SKU/barcode/kategori/harga/stok/minimum stok, aktifkan/nonaktifkan, dan hapus aman dengan perlindungan histori transaksi. |
| Stok | Tambah, kurangi, atau set stok; catatan alasan; validasi agar stok tidak negatif; serta riwayat stock movement dengan stok sebelum dan sesudah. |
| Transaksi | Riwayat invoice, detail transaksi, void, pengembalian stok, cetak struk, dan bagikan struk. |
| Branding UMKM | Ubah nama toko, upload logo, alamat, nomor telepon, footer struk, pajak, serta pilihan cetak otomatis. |
| Data offline | SQLite lokal pada Android, localStorage fallback pada browser preview, backup/restore JSON berversi, dan seed data demo. |

## Setup toko untuk setiap UMKM

Setelah aplikasi diinstal, buka menu **Pengaturan**. Masukkan nama toko, alamat, nomor telepon, dan footer yang ingin ditampilkan pada struk. Upload logo toko dalam format PNG, JPG, atau WebP. Logo dan identitas tersebut akan digunakan pada header aplikasi, dialog struk, hasil cetak, dan data backup lokal.

Untuk transaksi, buka **Kasir** lalu tekan tombol **Scan QR / barcode**. Izinkan akses kamera Android ketika diminta. Scanner memakai kamera belakang dengan orientasi adaptif dan decoder Google ML Kit yang dibundel di APK, sehingga pembacaan QR serta barcode retail umum seperti EAN, UPC, dan Code 128 tidak memerlukan internet. Pada Android, konfigurasi all-format dikirim menggunakan fallback native yang valid agar format barcode tidak berubah menjadi hint UNKNOWN. Setelah berhasil, aplikasi memberi suara/getar, menampilkan jenis dan nilai kode, mencegah kode yang sama masuk dua kali dalam waktu singkat, lalu mencari SKU/barcode dan memasukkan produk ke keranjang. Jika kode belum terdaftar, aplikasi langsung membuka form **Tambah produk** dengan barcode tersebut sudah terisi sehingga pengguna dapat melengkapi data dan menyimpan produk baru tanpa mengetik ulang kode.

Untuk mendaftarkan produk dari awal, buka menu **Produk** lalu tekan **Scan barcode**. Setelah kamera membaca kode yang belum terdaftar, form tambah produk terbuka otomatis dan menampilkan notifikasi hijau bahwa barcode telah berhasil dipindai. Sistem menolak barcode yang sudah digunakan produk lain, baik ketika hasil scan ditemukan maupun ketika form disimpan. Jika ingin memasukkan barcode secara manual atau memindai dari form, tekan **＋ Tambah produk** lalu gunakan tombol **▣ Scan** pada kolom barcode.

Untuk mengelola katalog, buka **Produk**. Tekan **Edit** untuk mengubah informasi produk, harga, kategori, barcode, minimum stok, atau stok. Untuk operasi stok harian yang lebih cepat, buka **Stok**, tekan **Atur stok**, lalu pilih salah satu mode berikut:

| Mode | Kegunaan |
|---|---|
| Tambah stok | Restock dari supplier atau stok masuk lainnya. |
| Kurangi stok | Produk rusak, kedaluwarsa, hilang, atau penyesuaian keluar. |
| Set stok | Stock opname atau koreksi ke jumlah fisik terbaru. |

Produk yang sudah pernah muncul dalam transaksi tidak dihapus permanen agar histori invoice tetap aman. Gunakan **Nonaktifkan** supaya produk tidak muncul lagi di Kasir; produk tersebut dapat diaktifkan kembali kapan saja.

Struk dapat dicetak melalui dialog print Android/browser atau dibagikan melalui Android Share. Jika sistem Share tidak tersedia, aplikasi menyediakan fallback berupa penyalinan teks struk.

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

Atau unduh APK siap instal dari [GitHub Releases](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v1.3.2).

## Arsitektur offline

Lapisan UI memakai state domain yang sama dengan adapter persistence. Pada Android, inisialisasi native menyiapkan SQLite melalui `@capacitor-community/sqlite`, termasuk tabel POS, foreign key, index, dan `schema_migrations`. Snapshot state disimpan agar UI dapat dipulihkan ketika aplikasi dibuka kembali. Browser preview menggunakan localStorage sebagai fallback supaya alur dapat diuji tanpa perangkat Android.

Struktur utama project adalah sebagai berikut:

```text
src/
├── App.tsx             # UI UMKM, bottom navigation, kasir, scanner, branding, struk
├── types.ts            # domain types dan store settings
├── pos.ts              # kalkulasi dan validasi domain
├── storage.ts          # SQLite initialization, migration, persistence, backup
├── pos.test.ts         # unit tests
└── styles.css          # mobile-first UI dan print stylesheet
android/                # project Capacitor Android dengan Gradle Wrapper
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

Suite saat ini mencakup perhitungan subtotal, diskon, pajak, total, kembalian yang aman, dan pencegahan penjualan ketika stok tidak mencukupi. Verifikasi terakhir menghasilkan **3 test lulus, lint 0 warning/0 error, web build berhasil, Android debug build berhasil, serta browser smoke test CRUD berhasil**. Scanner native perlu divalidasi lagi pada perangkat Android fisik dengan contoh QR dan barcode yang digunakan oleh UMKM.

## GitHub Release

Rilis publik terbaru tersedia pada [v1.3.2](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v1.3.2). Versi ini mempertahankan decoder Google ML Kit yang dibundel di APK dan memperbaiki pemetaan hint **ALL** pada Android yang sebelumnya dapat diterjemahkan menjadi `UNKNOWN`, sehingga scanner gagal membaca barcode. Perbaikan ini tetap berjalan offline dan tidak memerlukan server atau koneksi internet untuk decoding.

| Asset | Keterangan |
|---|---|
| `pos-rifaldo-scanner-offline-debug.apk` | APK debug v1.3.2 dengan decoder ML Kit lokal dan perbaikan format all-format Android. |
| `pos-rifaldo-scanner-offline-debug.apk.sha256` | Checksum SHA-256 untuk verifikasi APK scanner offline. |

### Catatan rilis v1.3.2

Versi ini menambahkan hardware acceleration eksplisit pada aplikasi Android dan menggunakan nilai fallback native yang valid untuk meminta seluruh format barcode. Data transaksi, katalog, dan model decoding tetap diproses di perangkat; koneksi internet tidak digunakan untuk mengenali kode. Jika scanner belum membaca setelah memasang APK ini, gunakan pencahayaan cukup, posisikan seluruh barcode di dalam area kamera, dan jaga jarak perangkat sekitar 15–30 cm dari barcode.

## Keterbatasan saat ini

Versi ini belum menyediakan integrasi langsung dengan printer Bluetooth thermal tertentu, modul supplier/customer/purchasing/expenses yang lengkap, laporan custom range, CSV import/export, PIN app lock, atau dark mode native. Fitur cetak menggunakan dialog print Android/browser dan Android Share. Integrasi printer thermal langsung memerlukan plugin printer yang sesuai serta pengujian pada model perangkat fisik yang digunakan oleh UMKM.
