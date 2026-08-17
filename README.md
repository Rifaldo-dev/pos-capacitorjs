# Ini POS

Ini POS adalah aplikasi **Point of Sale offline-first** profesional untuk warung, toko kecil, kios, dan usaha rumahan (UMKM). Aplikasi berjalan sebagai client-only Android app menggunakan React, TypeScript, Vite, CapacitorJS, dan SQLite lokal. Tidak diperlukan server pusat untuk mencatat transaksi, mengelola produk, mengatur stok, menyiapkan backup, maupun menyinkronkan data ke cloud.

> **Package Android:** `pos.rifaldo`  
> **Release publik:** [Ini POS v2.5.0](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v2.5.0)
> **Panduan Pengguna:** [Baca Panduan Pengguna Lengkap (Bahasa Indonesia)](docs/PANDUAN_PENGGUNA.md)  


## Tampilan Aplikasi

### Tampilan Beranda (Desktop & Mobile)

Beranda dirancang sebagai dashboard operasional bisnis yang profesional dan bersih (v2.5.0), menampilkan identitas toko, status operasional offline, ringkasan penjualan harian, laba kotor, produk terlaris, stok menipis, transaksi terbaru, serta akses cepat ke fungsi utama. Navigasi bawah menggunakan ikon SVG yang konsisten dan selalu siap diakses di semua ukuran layar. Tampilan kini semakin menarik dengan dukungan foto produk di bagian ringkasan stok.

![Dashboard Ini POS](docs/screenshots/dashboard.png)

### Tampilan Mobile

Layout mobile dirancang untuk kenyamanan kasir harian dengan bilah navigasi bawah (*bottom navigation*) yang mencakup **Beranda, Kasir, Produk, Stok, Transaksi, dan Pengaturan**.

![Dashboard mobile Ini POS](docs/screenshots/dashboard-mobile.png)

## Galeri Semua Menu

Berikut adalah tampilan seluruh menu utama yang tersedia pada bottom navigation Ini POS. Galeri ini menunjukkan tampilan aplikasi dengan data simulasi (*dummy data*) agar setiap UMKM dapat melihat gambaran operasional toko yang lengkap dan profesional.

![Galeri seluruh menu Ini POS](docs/screenshots/menu-gallery.png)

### Beranda

Ringkasan operasional toko: status offline, identitas toko, penjualan hari ini, laba kotor, produk terlaris, stok menipis, transaksi terbaru, dan aksi cepat.

![Menu Beranda](docs/screenshots/menu-dashboard.png)

### Kasir

Layar transaksi dengan pencarian nama/SKU/barcode, tombol **Scan banyak produk**, senter native, status scanner real-time, daftar produk bergambar, keranjang, ringkasan pajak, total, dan tombol pembayaran. Dukungan gambar produk memudahkan identifikasi barang secara visual. Kamera native menampilkan **tracking box** dan label format/kode pada barcode yang sedang terdeteksi secara real-time.

![Menu Kasir](docs/screenshots/menu-kasir.png)

### Produk

Katalog produk dengan pencarian, foto produk, SKU/barcode, kategori, harga beli/jual, stok, minimum stok, status aktif, dan aksi CRUD. Pengguna dapat menambah produk beserta fotonya, mengedit detail produk, menonaktifkan atau mengaktifkan kembali produk, dan menghapus produk yang belum memiliki histori transaksi. Alur **Scan barcode** pada toolbar Produk membuka form tambah produk secara otomatis dengan barcode hasil scan sudah terisi. Barcode juga tetap dapat diisi dari kamera melalui form produk.

![Menu Produk](docs/screenshots/menu-produk.png)

### Stok

Kontrol persediaan yang menampilkan total produk, stok menipis, produk habis, status minimum, dan aksi **Atur stok**. Stok dapat ditambah, dikurangi, atau di-set ke jumlah tertentu dengan catatan perubahan. Semua perubahan menyimpan stok sebelum, stok sesudah, jumlah perubahan, alasan, dan waktu.

![Menu Stok](docs/screenshots/menu-stok.png)

### Transaksi

Riwayat transaksi dengan invoice, waktu, jumlah item, metode pembayaran, total, status, dan akses ke detail struk. Fitur ekspor laporan mencakup unduhan Excel (`.xlsx`) dan PDF profesional dengan filter tanggal fleksibel.

![Menu Transaksi](docs/screenshots/menu-transaksi.png)

### Pengaturan

Pengaturan publik untuk setiap UMKM: logo toko, nama toko, alamat, nomor telepon, pajak, footer struk, printer Bluetooth thermal, cetak otomatis, backup/restore melalui Android Share Sheet, dan data demo. Menu Printer Bluetooth memungkinkan Anda menghubungkan aplikasi langsung ke printer struk thermal Anda.

![Menu Pengaturan](docs/screenshots/menu-pengaturan.png)

## Fitur Utama

| Area | Kemampuan |
|---|---|
| Dashboard | Ringkasan usaha profesional dengan status operasional, grafik penjualan, laba kotor, produk terlaris bergambar, stok menipis, dan akses cepat. |
| Kasir | Pencarian produk bergambar (nama/SKU/barcode), keranjang belanja, diskon, pajak, pembayaran tunai/non-tunai, kembalian, dan invoice otomatis. |
| Scan kamera | Scanner native Android (CameraX + ML Kit) 100% offline, mendukung senter, multi-scan, berbagai format barcode/QR, serta tracking box dan label kode secara real-time. |
| Produk | CRUD katalog lengkap dengan **Foto Produk**, SKU/barcode, kategori, harga beli/jual, stok, dan menu aksi ringkas (⋮). |
| Stok | Manajemen stok (tambah/kurang/set), catatan alasan, validasi stok negatif, dan riwayat pergerakan stok lengkap. |
| Transaksi | Riwayat invoice, detail transaksi, void, pengembalian stok, cetak struk sistem, bagikan struk, **Cetak Bluetooth Thermal**, dan **Ekspor Laporan**. |
| Laporan | Filter penjualan berdasarkan rentang tanggal dan ekspor data ke format Excel (`.xlsx`) atau PDF profesional secara offline. |
| Cadangan & Pemulihan | Pencadangan otomatis ke folder lokal **Documents/IniPOS_Backups** di perangkat tanpa memerlukan Google Drive atau Client ID. |},{all:false,find:},{all:false,find:
| Printer Bluetooth | Koneksi langsung ke printer thermal (58mm/80mm) via Bluetooth Classic, format ESC/POS presisi, dan fitur cetak otomatis setelah transaksi. |
| Branding UMKM | Kustomisasi logo toko, nama, alamat, nomor telepon, footer struk, dan pengaturan operasional lainnya. |
| Data offline | SQLite lokal Android, localStorage fallback browser, backup/restore JSON, dan pemuatan data demo. |

## Setup Toko untuk Setiap UMKM

Setelah aplikasi diinstal, buka menu **Pengaturan**. Masukkan nama toko, alamat, nomor telepon, dan footer yang ingin ditampilkan pada struk. Upload logo toko dalam format PNG, JPG, atau WebP. Logo dan identitas tersebut akan digunakan pada header aplikasi, dialog struk, hasil cetak, dan data backup lokal.

Untuk transaksi, buka **Kasir** lalu tekan tombol **Scan banyak produk**. Izinkan akses kamera Android ketika diminta. Scanner membuka kamera native Android melalui plugin Capacitor khusus; frame kamera diproses langsung oleh CameraX dan Google ML Kit bundled di perangkat, bukan oleh HTML, JavaScript, WebView, CDN, server, atau API online. Tekan **Senter** bila pencahayaan kurang, lalu pindai beberapa barcode satu per satu. Kode yang sama diabaikan agar tidak terhitung dua kali. Tekan **Selesai** setelah seluruh belanjaan pembeli dipindai; semua produk yang ditemukan langsung masuk ke keranjang dalam satu proses. Jika ada barcode yang belum terdaftar, aplikasi membuka form **Tambah produk** satu per satu dengan barcode otomatis terisi sampai seluruh produk baru selesai dilengkapi.

Untuk mendaftarkan produk dari awal, buka menu **Produk** lalu tekan **Scan barcode**. Setelah kamera membaca kode yang belum terdaftar, form tambah produk terbuka otomatis dan menampilkan notifikasi hijau bahwa barcode telah berhasil dipindai. Sistem menolak barcode yang sudah digunakan produk lain, baik ketika hasil scan ditemukan maupun ketika form disimpan. Jika ingin memasukkan barcode secara manual atau memindai dari form, tekan **＋ Tambah produk** lalu gunakan tombol **▣ Scan** pada kolom barcode.

Untuk mengelola katalog, buka **Produk**. Pada kolom **Aksi**, tekan menu tiga titik **⋮** untuk membuka pilihan **Edit produk**, **Atur stok**, **Aktifkan/Nonaktifkan**, atau **Hapus produk**. Tekan **Edit produk** untuk mengubah informasi produk, harga, kategori, barcode, minimum stok, atau stok. Untuk operasi stok harian yang lebih cepat, buka **Stok**, tekan **Atur stok**, lalu pilih salah satu mode berikut:

| Mode | Kegunaan |
|---|---|
| Tambah stok | Restock dari supplier atau stok masuk lainnya. |
| Kurangi stok | Produk rusak, kedaluwarsa, hilang, atau penyesuaian keluar. |
| Set stok | Stock opname atau koreksi ke jumlah fisik terbaru. |

Produk yang sudah pernah muncul dalam transaksi tidak dihapus permanen agar histori invoice tetap aman. Gunakan **Nonaktifkan** supaya produk tidak muncul lagi di Kasir; produk tersebut dapat diaktifkan kembali kapan saja.

Struk dapat dicetak langsung ke **Printer Bluetooth Thermal** (58mm/80mm) menggunakan perintah ESC/POS native, atau melalui dialog print Android/browser dan Android Share. Jika sistem Share tidak tersedia, aplikasi menyediakan fallback berupa penyalinan teks struk.

### Cadangan & Pemulihan (Folder Lokal Perangkat)
	
	Fitur pencadangan data mandiri tersedia pada menu **Pengaturan → Cadangan & Pemulihan**. Aplikasi ini dirancang 100% mandiri tanpa memerlukan konfigurasi *Client ID*, akun pengembang, atau server pihak ketiga. 
	
	Setiap kali Anda menekan tombol **Simpan ke folder lokal**, aplikasi secara otomatis membuat folder **Documents/IniPOS_Backups** di memori internal HP Anda dan menyimpan file JSON cadangan di sana. Anda dapat melihat daftar file backup yang tersedia beserta ukurannya, lalu memulihkannya kapan saja dengan satu sentuhan. Folder ini dapat diakses langsung menggunakan aplikasi File Manager bawaan Android.

## Menjalankan dari Source Code

### Prasyarat

Gunakan Node.js 22 LTS, JDK 21 untuk Capacitor 8, serta Android SDK API 36. Android Studio tidak wajib untuk build command-line karena repository menyediakan Gradle Wrapper. Untuk menjalankan preview web saja, Node.js sudah cukup.

### Web Preview

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

Atau unduh APK siap instal dari folder [releases/](releases/) di repository ini.

## Arsitektur Offline

Lapisan UI memakai state domain yang sama dengan adapter persistence. Pada Android, inisialisasi native menyiapkan SQLite melalui `@capacitor-community/sqlite`, termasuk tabel POS, foreign key, index, dan `schema_migrations`. Snapshot state disimpan agar UI dapat dipulihkan ketika aplikasi dibuka kembali. Browser preview menggunakan localStorage sebagai fallback supaya alur dapat diuji tanpa perangkat Android.

Struktur utama project adalah sebagai berikut:

```text
src/
├── App.tsx             # UI UMKM, bottom navigation, kasir, scanner bridge, branding, struk
├── nativeScanner.ts    # typed Capacitor bridge ke scanner Android native
├── googleDrive.ts      # Google Drive OAuth dan backup/restore REST service
├── types.ts            # domain types dan store settings
├── pos.ts              # kalkulasi dan validasi domain
├── reports.ts          # generator laporan Excel (.xlsx) dan PDF
├── storage.ts          # SQLite initialization, migration, persistence, backup
├── pos.test.ts         # unit tests
└── styles.css          # mobile-first UI dan print stylesheet
android/                # project Capacitor Android dengan Gradle Wrapper
android/app/src/main/java/pos/rifaldo/NativeBarcodeScannerPlugin.java # CameraX + ML Kit native scanner
capacitor.config.ts     # appId: pos.rifaldo, appName: Ini POS
docs/                   # panduan pengguna, Google Drive setup, dan screenshot UI
releases/               # folder rilis APK debug dan checksum SHA-256
```

## Database dan Integritas Transaksi

Native SQLite menyiapkan tabel `categories`, `products`, `customers`, `suppliers`, `transactions`, `transaction_items`, `stock_movements`, `expenses`, `settings`, `app_state`, dan `schema_migrations`. Foreign key, unique invoice/SKU constraints, serta index pencarian produk dan waktu transaksi disiapkan ketika database dibuka. Migration baru harus menaikkan `DB_VERSION` dan bersifat idempotent.

Nilai uang disimpan sebagai integer Rupiah. Item transaksi mempertahankan snapshot nama, harga, quantity, dan subtotal sehingga histori tidak berubah ketika katalog diedit. Penyelesaian transaksi memperbarui transaksi, item, produk, dan stock movement melalui state yang divalidasi sebelum disimpan.

## Format Backup

Backup menggunakan JSON berversi agar data toko dapat dipindahkan atau disimpan secara manual maupun melalui Google Drive.

```json
{
  "format": "POS Backup",
  "version": 1,
  "createdAt": "2026-08-17T00:00:00.000Z",
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

Restore memvalidasi format dan versi, lalu meminta konfirmasi sebelum mengganti data aktif. Logo toko disimpan sebagai data URL di snapshot lokal dan ikut terbawa dalam backup JSON maupun cloud sync.

## Testing dan Hasil Verifikasi

```bash
npm test
npm run lint
npm run build
```

Suite saat ini mencakup perhitungan subtotal, diskon, pajak, total, kembalian yang aman, ekspor laporan, dan pencegahan penjualan ketika stok tidak mencukupi. Verifikasi terakhir menghasilkan **test lulus, lint 0 warning/0 error, web build berhasil, dan Android debug build berhasil**. Untuk pengujian perangkat, lakukan scan dengan internet aktif, Wi-Fi mati, data seluler mati, dan Airplane Mode aktif; seluruh alur scanner dirancang berjalan lokal.

## GitHub Release & Releases Directory

Seluruh APK rilis yang telah diverifikasi disimpan secara rapi di dalam direktori `releases/` di root repository untuk memudahkan pengunduhan langsung tanpa mengotori direktori utama. Rilis terbaru **v2.5.0** membawa tracking visual barcode real-time pada scanner native, backup zero-config melalui Android Share Sheet, ekspor laporan Excel/PDF, cetak Bluetooth thermal, serta branding resmi **Ini POS** [1].

## Referensi

[1] Ini POS v2.5.0 Release Notes and Architecture. [GitHub Repository Releases](https://github.com/Rifaldo-dev/pos-capacitorjs/releases) [2] SQLite local storage in Capacitor Android. [Android Developers SQLite Guide](https://developer.android.com/training/data-storage/sqlite)
