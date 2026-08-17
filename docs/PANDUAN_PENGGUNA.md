# Panduan Pengguna Ini POS (v2.5.0)

Dokumen ini adalah panduan operasional lengkap untuk pemilik warung, kios, toko kelontong, dan usaha mikro kecil menengah (UMKM) yang menggunakan aplikasi **Ini POS** (versi `2.5.0`). Aplikasi ini dirancang bekerja secara **100% offline** di perangkat Android menggunakan database lokal SQLite [1].

> **Package Android:** `pos.rifaldo`  
> **Repository GitHub:** [Rifaldo-dev/pos-capacitorjs](https://github.com/Rifaldo-dev/pos-capacitorjs)

---

## 1. Pengenalan & Arsitektur Offline

Ini POS tidak memerlukan sambungan internet, server awan, atau langganan bulanan. Seluruh data transaksi, produk, stok, dan pengaturan toko disimpan langsung di dalam memori internal perangkat Android Anda menggunakan teknologi SQLite native. Anda tetap dapat melayani pelanggan, mencetak struk, dan memindai barcode meskipun perangkat berada dalam keadaan **Airplane Mode** (mode pesawat) atau tanpa paket data.

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
5. **Printer Bluetooth**: Pilih menu **Printer Bluetooth** untuk menghubungkan aplikasi dengan printer thermal Bluetooth Anda. Tekan **Cari perangkat berpasangan**, pilih printer dari daftar, tentukan lebar kertas (58mm atau 80mm), dan aktifkan **Cetak Bluetooth otomatis** jika ingin struk tercetak langsung setiap transaksi selesai. Pastikan printer sudah dipasangkan (*paired*) melalui pengaturan Bluetooth Android terlebih dahulu.

---

## 4. Manajemen Katalog Produk & Barcode-First

Pengelolaan produk dirancang agar pemilik toko dapat mendata barang dengan cepat:

- **Tambah Produk Manual**: Masukkan nama, SKU, kategori, harga beli, harga jual, stok awal, dan satuan (misal: pcs, kg, botol). Anda juga dapat mengunggah **Foto Produk** agar katalog terlihat lebih profesional dan memudahkan kasir mengenali barang secara visual. Foto akan dikompresi otomatis untuk menghemat ruang penyimpanan perangkat.
- **Scan Barcode Cepat (Barcode-First)**: Pada menu **Produk**, tekan tombol **Scan barcode** di toolbar atas. Arahkan kamera ke barcode produk baru. Jika barcode belum terdaftar di database, aplikasi secara otomatis membuka form **Tambah produk** dengan kolom barcode yang sudah terisi. Anda tinggal melengkapi nama dan harga, lalu menyimpan produk baru tersebut tanpa mengetik ulang kode [2].
- **Validasi Duplikasi**: Sistem secara otomatis menolak duplikasi barcode untuk mencegah kesalahan pencatatan barang.
- **Menu Aksi Tiga Titik**: Pada daftar Produk, tekan tombol **⋮** di kolom Aksi untuk membuka pilihan **Edit produk**, **Atur stok**, **Aktifkan/Nonaktifkan**, dan **Hapus produk**. Menu ini sengaja diringkas agar tabel tetap bersih dan nyaman digunakan di layar HP.

---

## 5. Kasir Pintar dengan Multi-Scan & Senter

Menu **Kasir** adalah pusat operasional penjualan harian. Fitur **Multi-Scan** dan kontrol **Senter (Flashlight)** sangat membantu warung atau toko dengan banyak barang belanjaan pembeli [3].

### Cara Menggunakan Kasir & Multi-Scan:

1. Buka menu **Kasir** di navigasi bawah.
2. Tekan tombol **Scan banyak produk** untuk membuka kamera native Android.
3. Saat barcode terdeteksi, kamera menampilkan **tracking box** berwarna hijau dan label berisi format serta kode barcode. Kotak ini mengikuti posisi barcode secara real-time sehingga Anda dapat memastikan kode yang sedang dibaca.
4. Jika kondisi ruangan atau pencahayaan kurang terang, tekan tombol **Senter** di sudut kanan bawah layar kamera untuk menyalakan lampu kilat perangkat secara langsung melalui CameraX API [4].
5. Arahkan kamera ke barcode barang belanjaan pembeli satu per satu secara berurutan. Setiap kode unik yang terbaca akan dihitung secara real-time pada penunjuk status di bagian atas layar. Kode yang sama diabaikan secara otomatis agar tidak terhitung ganda.
6. Setelah seluruh barang pembeli selesai dipindai, tekan tombol **Selesai (X)** di bagian bawah. Seluruh produk yang ditemukan dalam database lokal akan langsung dimasukkan ke keranjang belanja dalam satu proses tunggal.
7. Jika terdapat barang yang belum terdaftar di katalog saat pemindaian massal, aplikasi akan membuka form **Tambah produk** secara berurutan untuk melengkapi data barang baru tersebut.
8. Lanjutkan ke proses pembayaran dengan memilih metode (Tunai, Transfer, QRIS, dll.), masukkan jumlah uang yang diterima, lalu selesaikan transaksi. Jika **Cetak Bluetooth otomatis** aktif, struk akan langsung keluar dari printer thermal Anda. Anda juga bisa menekan tombol **Bluetooth** pada detail transaksi untuk mencetak ulang struk secara instan.

---

## 6. Ekspor Laporan Penjualan (Excel & PDF)

Aplikasi kini mendukung ekspor data transaksi untuk mempermudah pembukuan dan analisis bisnis:

1. Buka menu **Transaksi** di navigasi bawah.
2. Gunakan pemilih tanggal (**Dari** dan **Sampai**) untuk memfilter transaksi yang ingin Anda masukkan ke dalam laporan.
3. Tekan tombol **📊 Export Excel** untuk mengunduh file `.xlsx` yang berisi riwayat transaksi dan ringkasan produk terjual.
4. Tekan tombol **📄 Export PDF** untuk menghasilkan dokumen laporan penjualan profesional yang siap dicetak atau disimpan sebagai arsip.
5. Fitur ini bekerja secara **100% offline** dan tidak memerlukan koneksi internet.

---

## 7. Kontrol Persediaan (Stok) & Riwayat Perubahan

Menu **Stok** memberikan transparansi penuh terhadap pergerakan barang di toko:

- **Atur Stok Cepat**: Pilih produk yang ingin disesuaikan, lalu pilih salah satu dari tiga mode perubahan:
  - **Tambah stok**: Untuk barang masuk dari supplier atau restock.
  - **Kurangi stok**: Untuk barang rusak, kedaluwarsa, atau susut.
  - **Set stok**: Untuk melakukan stock opname fisik langsung ke angka riil.
- **Audit Stok**: Setiap perubahan stok dicatat beserta keterangan waktu, jumlah perubahan, stok sebelum, stok sesudah, dan catatan alasan.

---

## 8. Backup, Restore, & Keamanan Data Lokal

Karena seluruh data bersifat mandiri di perangkat Anda, disarankan untuk rutin melakukan backup:

1. Buka menu **Pengaturan**, lalu pilih **Kelola Backup**.
2. Tekan **Download backup JSON** untuk menyimpan file salinan data ke memori perangkat. File ini mencakup seluruh produk, kategori, riwayat transaksi, dan pengaturan toko.
3. Jika Anda mengganti atau mereset perangkat, gunakan tombol **Import backup** untuk memulihkan seluruh data toko secara instan.

---

## 9. Cadangan & Pemulihan (Folder Lokal Perangkat)

Fitur pencadangan data mandiri tersedia pada menu **Pengaturan → Cadangan & Pemulihan**. Aplikasi ini dirancang 100% mandiri tanpa memerlukan konfigurasi *Client ID*, akun pengembang, atau server pihak ketiga. Seluruh file cadangan disimpan secara otomatis di dalam folder lokal **Documents/IniPOS_Backups** pada memori HP Anda.

### Cara Menyimpan Cadangan:
1. Buka menu **Pengaturan**, lalu pilih **Cadangan & Pemulihan**.
2. Tekan tombol **Buka Kelola Backup**.
3. Tekan tombol **Simpan ke folder lokal**. Aplikasi secara otomatis membuat folder **Documents/IniPOS_Backups** dan menulis file JSON cadangan beserta waktu penyimpanannya.
4. Anda dapat melihat daftar file backup yang tersedia beserta ukuran dan waktu pembuatannya langsung di dalam aplikasi, atau melalui File Manager bawaan HP.

### Cara Memulihkan Data (*Restore*):
1. Buka menu **Pengaturan**, lalu pilih **Cadangan & Pemulihan**.
2. Tekan **Buka Kelola Backup**.
3. Pada daftar file cadangan yang tersedia di perangkat, tekan tombol **Pulihkan** di samping file yang ingin digunakan.
4. Konfirmasikan pemulihan untuk menggantikan data aktif dengan data dari cadangan tersebut. Anda juga dapat menggunakan tombol **Pilih file JSON** untuk mengimpor file dari direktori lain.

---

## Referensi

[1] SQLite local storage in Capacitor Android. [Android Developers SQLite Guide](https://developer.android.com/training/data-storage/sqlite)  
[2] Barcode-first product registration workflow. [POS UMKM GitHub Repository](https://github.com/Rifaldo-dev/pos-capacitorjs)  
[3] Native multi-scan and barcode accumulation pattern. [Capacitor Documentation](https://capacitorjs.com/)  
[4] CameraX flash and torch control. [Android CameraX API Documentation](https://developer.android.com/training/camerax)
