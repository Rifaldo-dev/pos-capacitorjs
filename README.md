# Ini POS

Ini POS adalah aplikasi **Point of Sale offline-first** profesional untuk warung, toko kecil, kios, dan usaha rumahan (UMKM). Aplikasi berjalan sebagai client-only Android app menggunakan React, TypeScript, Vite, CapacitorJS, dan SQLite lokal. Tidak diperlukan server pusat untuk mencatat transaksi, mengelola produk, mengatur stok, menyiapkan backup, maupun menyinkronkan data ke cloud.

> **Package Android:** `pos.rifaldo`  
> **Release publik:** [Ini POS v2.6.0](https://github.com/Rifaldo-dev/pos-capacitorjs/releases/tag/v2.6.0)
> **Panduan Pengguna:** [Baca Panduan Pengguna Lengkap (Bahasa Indonesia)](docs/PANDUAN_PENGGUNA.md)  

## Tampilan Aplikasi

### Tampilan Beranda (Desktop & Mobile)

Beranda dirancang sebagai dashboard operasional bisnis yang profesional dan bersih (v2.6.0), menampilkan identitas toko, status operasional offline, ringkasan penjualan harian, laba kotor, produk terlaris, stok menipis, transaksi terbaru, serta akses cepat ke fungsi utama. Navigasi bawah menggunakan ikon SVG yang konsisten dan selalu siap diakses di semua ukuran layar. Tampilan kini semakin menarik dengan dukungan foto produk di bagian ringkasan stok.

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

Pengaturan publik untuk setiap UMKM: logo toko, nama toko, alamat, nomor telepon, pajak, footer struk, printer Bluetooth thermal, cetak otomatis, backup/restore folder lokal, dan data demo. Menu Printer Bluetooth memungkinkan Anda menghubungkan aplikasi langsung ke printer struk thermal Anda.

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
| Cadangan & Pemulihan | Pencadangan otomatis ke folder lokal **Documents/IniPOS_Backups** di perangkat secara mandiri dan offline. |
| Printer Bluetooth | Koneksi langsung ke printer thermal (58mm/80mm) via Bluetooth Classic, format ESC/POS presisi, dan fitur cetak otomatis setelah transaksi. |
| Branding UMKM | Kustomisasi logo toko, nama, alamat, nomor telepon, footer struk, dan pengaturan operasional lainnya. |
| Data offline | SQLite lokal Android, localStorage fallback browser, backup/restore JSON, dan pemuatan data demo. |

## Arsitektur & Struktur Proyek

Aplikasi ini menggunakan arsitektur modular untuk memastikan kemudahan pengembangan dan pemeliharaan. Kode sumber diatur sebagai berikut:

```text
src/
├── App.tsx             # Orchestration, state utama, dan event handlers
├── components/         # Komponen UI modular
│   ├── common.tsx      # Komponen visual bersama (Ikon, Modal dasar, Empty state)
│   ├── navigation.tsx  # Bottom Navigation bar
│   ├── pages.tsx       # Seluruh halaman menu (Dashboard, Kasir, Produk, dll.)
│   ├── modals.tsx      # Modal interaktif (Product, Payment, Transaction, Backup)
│   └── componentTypes.ts # Tipe data khusus UI
├── utils/              # Fungsi utilitas mandiri
│   └── images.ts       # Kompresi dan pemrosesan gambar produk
├── constants.ts        # Konstanta global (Metode pembayaran, Folder backup)
├── types.ts            # Definisi tipe data domain dan pengaturan toko
├── storage.ts          # Inisialisasi SQLite, migrasi, dan persistensi data
├── nativeScanner.ts    # Bridge Capacitor ke scanner native Android
├── thermalPrinter.ts   # Driver printer thermal ESC/POS
├── bluetoothPrinter.ts # Manajemen koneksi Bluetooth
├── reports.ts          # Logika ekspor laporan Excel (.xlsx) dan PDF
├── pos.ts              # Kalkulasi bisnis dan validasi domain
├── styles.css          # Mobile-first UI dan print stylesheet
└── main.tsx            # Entry point React
```

## Panduan Kontribusi

Kami sangat terbuka bagi pengembang lain yang ingin berkontribusi dalam menyempurnakan **Ini POS**. Berikut adalah panduan untuk memulai:

### 1. Persiapan Lingkungan
Pastikan perangkat Anda memiliki:
*   **Node.js**: Versi 22 LTS atau lebih baru.
*   **JDK**: Versi 21 (Diperlukan untuk Capacitor 8).
*   **Android SDK**: API level 36.
*   **Android Studio**: Disarankan untuk debugging native.

### 2. Langkah Pengembangan
1.  **Fork & Clone**: Fork repositori ini dan clone ke lokal Anda.
2.  **Instalasi**: Jalankan `npm install` untuk memasang dependensi.
3.  **Branching**: Buat branch baru untuk fitur atau perbaikan bug Anda (`git checkout -b fitur/nama-fitur`).
4.  **Development**: Jalankan `npm run dev` untuk preview web.
5.  **Testing**: Pastikan kode baru tidak merusak fitur lama dengan menjalankan `npm test`.
6.  **Commit**: Gunakan pesan commit yang deskriptif dalam bahasa Indonesia atau Inggris.
7.  **Push & PR**: Push branch Anda dan buat Pull Request ke repositori utama.

### 3. Standar Kode
*   **TypeScript**: Gunakan tipe data yang ketat (strict typing).
*   **Modularitas**: Jangan masukkan semua logika ke `App.tsx`. Gunakan folder `components`, `utils`, atau `hooks`.
*   **Komentar**: Tambahkan komentar pada logika bisnis yang kompleks.
*   **Linting**: Pastikan tidak ada error lint sebelum melakukan commit (`npm run lint`).

## Menjalankan dari Source Code

### Web Preview
```bash
npm install
npm run dev
```
Preview browser memakai localStorage sebagai fallback persistence.

### Build Android
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
APK debug dihasilkan di `android/app/build/outputs/apk/debug/app-debug.apk`. Atau gunakan file APK yang sudah tersedia di folder [releases/](releases/).

## Lisensi

Proyek ini dilisensikan di bawah **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**. 

Artinya, Anda bebas menggunakan, membagikan, dan memodifikasi aplikasi ini untuk kebutuhan pribadi atau operasional UMKM secara gratis, namun **TIDAK DIIZINKAN** untuk memperjualbelikan aplikasi ini atau mengambil keuntungan komersial darinya tanpa izin tertulis dari pembuat.

[1] Ini POS v2.6.0 Release Notes. [GitHub Repository Releases](https://github.com/Rifaldo-dev/pos-capacitorjs/releases)  
[2] Creative Commons Attribution-NonCommercial 4.0 International License. [CC BY-NC 4.0 Legal Code](https://creativecommons.org/licenses/by-nc/4.0/)
