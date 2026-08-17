# Panduan Pengguna POS UMKM Rifaldo

Dokumen ini adalah panduan operasional lengkap untuk pemilik warung, kios, toko kelontong, dan usaha mikro kecil menengah (UMKM) yang menggunakan aplikasi **POS UMKM Rifaldo** (versi `1.7.0`). Aplikasi ini dirancang bekerja secara **100% offline** di perangkat Android menggunakan database lokal SQLite [1].

> **Package Android:** `pos.rifaldo`  
> **Repository GitHub:** [Rifaldo-dev/pos-capacitorjs](https://github.com/Rifaldo-dev/pos-capacitorjs)

---

## 1. Pengenalan & Arsitektur Offline

POS UMKM Rifaldo tidak memerlukan sambungan internet, server awan, atau langganan bulanan. Seluruh data transaksi, produk, stok, dan pengaturan toko disimpan langsung di dalam memori internal perangkat Android Anda menggunakan teknologi SQLite native. Anda tetap dapat melayani pelanggan, mencetak struk, dan memindai barcode meskipun perangkat berada dalam keadaan **Airplane Mode** (mode pesawat) atau tanpa paket data.

---

## 2. Beranda: Ringkasan Usaha

Beranda dirancang sebagai dashboard operasional yang ringkas, bukan halaman promosi. Bagian atas menampilkan nama toko, status aktivitas hari ini, dan tombol **Transaksi baru**. Kartu ringkasan memperlihatkan penjualan hari ini, estimasi laba kotor, produk terlaris, serta jumlah produk yang stoknya menipis.

Gunakan panel **Transaksi terbaru** untuk melihat penjualan terakhir dan membuka seluruh riwayat transaksi. Panel **Perlu perhatian** menampilkan produk yang perlu di-restock. Bagian **Akses cepat** menyediakan jalan singkat menuju transaksi baru, katalog produk, dan penambahan stok.

---

## 3. Pengaturan Awal Toko

Sebelum mulai melayani transaksi, sesuaikan identitas toko agar struk dan laporan sesuai dengan usaha Anda:

1. Buka aplikasi, lalu pilih menu **Pengaturan** di bilah navigasi bawah.
2. Masukkan nama toko, alamat lengkap, dan nomor telepon yang aktif.
3. Atur persentase pajak (jika ada) dan teks catatan penutup pada struk (Footer).
4. Unggah logo toko dalam format gambar standar (PNG/JPG). Logo ini akan tampil di bagian atas struk transaksi dan laporan.

---

## 3. Manajemen Katalog Produk & Barcode-First

Pengelolaan produk dirancang agar pemilik toko dapat mendata barang dengan cepat:

- **Tambah Produk Manual**: Masukkan nama, SKU, kategori, harga beli, harga jual, stok awal, dan satuan (misal: pcs, kg, botol).
- **Scan Barcode Cepat (Barcode-First)**: Pada menu **Produk**, tekan tombol **Scan barcode** di toolbar atas. Arahkan kamera ke barcode produk baru. Jika barcode belum terdaftar di database, aplikasi secara otomatis membuka form **Tambah produk** dengan kolom barcode yang sudah terisi. Anda tinggal melengkapi nama dan harga, lalu menyimpan produk baru tersebut tanpa mengetik ulang kode [2].
- **Validasi Duplikasi**: Sistem secara otomatis menolak duplikasi barcode untuk mencegah kesalahan pencatatan barang.
- **Menu Aksi Tiga Titik**: Pada daftar Produk, tekan tombol **⋮** di kolom Aksi untuk membuka pilihan **Edit produk**, **Atur stok**, **Aktifkan/Nonaktifkan**, dan **Hapus produk**. Menu ini sengaja diringkas agar tabel tetap bersih dan nyaman digunakan di layar HP.

---

## 4. Kasir Pintar dengan Multi-Scan & Senter

Menu **Kasir** adalah pusat operasional penjualan harian. Versi `1.7.0` memperkenalkan fitur **Multi-Scan** dan kontrol **Senter (Flashlight)** yang sangat membantu warung atau toko dengan banyak barang belanjaan pembeli [3].

### Cara Menggunakan Kasir & Multi-Scan:

1. Buka menu **Kasir** di navigasi bawah.
2. Tekan tombol **Scan banyak produk** untuk membuka kamera native Android.
3. Jika kondisi ruangan atau pencahayaan kurang terang, tekan tombol **Senter** di sudut kanan bawah layar kamera untuk menyalakan lampu kilat perangkat secara langsung melalui CameraX API [4].
4. Arahkan kamera ke barcode barang belanjaan pembeli satu per satu secara berurutan. Setiap kode unik yang terbaca akan dihitung secara real-time pada penunjuk status di bagian atas layar. Kode yang sama diabaikan secara otomatis agar tidak terhitung ganda.
5. Setelah seluruh barang pembeli selesai dipindai, tekan tombol **Selesai (X)** di bagian bawah. Seluruh produk yang ditemukan dalam database lokal akan langsung dimasukkan ke keranjang belanja dalam satu proses tunggal.
6. Jika terdapat barang yang belum terdaftar di katalog saat pemindaian massal, aplikasi akan membuka form **Tambah produk** secara berurutan untuk melengkapi data barang baru tersebut.
7. Lanjutkan ke proses pembayaran dengan memilih metode (Tunai, Transfer, QRIS, dll.), masukkan jumlah uang yang diterima, lalu selesaikan transaksi untuk mencetak atau membagikan struk.

---

## 5. Kontrol Persediaan (Stok) & Riwayat Perubahan

Menu **Stok** memberikan transparansi penuh terhadap pergerakan barang di toko:

- **Atur Stok Cepat**: Pilih produk yang ingin disesuaikan, lalu pilih salah satu dari tiga mode perubahan:
  - **Tambah stok**: Untuk barang masuk dari supplier atau restock.
  - **Kurangi stok**: Untuk barang rusak, kedaluwarsa, atau susut.
  - **Set stok**: Untuk melakukan stock opname fisik langsung ke angka riil.
- **Audit Stok**: Setiap perubahan stok dicatat beserta keterangan waktu, jumlah perubahan, stok sebelum, stok sesudah, dan catatan alasan.

---

## 6. Backup, Restore, & Keamanan Data

Karena seluruh data bersifat mandiri di perangkat Anda, disarankan untuk rutin melakukan backup:

1. Buka menu **Pengaturan**, lalu pilih **Kelola Backup**.
2. Tekan **Download backup JSON** untuk menyimpan file salinan data ke memori perangkat. File ini mencakup seluruh produk, kategori, riwayat transaksi, dan pengaturan toko.
3. Jika Anda mengganti atau mereset perangkat, gunakan tombol **Import backup** untuk memulihkan seluruh data toko secara instan.

---

## Referensi

[1] SQLite local storage in Capacitor Android. [Android Developers SQLite Guide](https://developer.android.com/training/data-storage/sqlite)  
[2] Barcode-first product registration workflow. [POS UMKM GitHub Repository](https://github.com/Rifaldo-dev/pos-capacitorjs)  
[3] Native multi-scan and barcode accumulation pattern. [Capacitor Documentation](https://capacitorjs.com/)  
[4] CameraX flash and torch control. [Android CameraX API Documentation](https://developer.android.com/training/camerax)
