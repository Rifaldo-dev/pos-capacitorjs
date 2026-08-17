# Setup Sinkronisasi Google Drive — Ini POS

Fitur **Sinkronisasi Google Drive** menyimpan file backup data Ini POS ke akun Google milik pemilik toko. Transaksi tetap dapat dilakukan tanpa internet; koneksi hanya diperlukan saat pengguna masuk ke Google, membuat backup, melihat daftar backup, atau memulihkan data.

> **Status saat ini:** kode aplikasi sudah menyiapkan alur login, upload, daftar backup, restore, dan backup otomatis. Fitur belum aktif sampai OAuth Client ID dikonfigurasi.

## 1. Buat project Google Cloud

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project baru, misalnya `Ini POS Backup`.
3. Pada **APIs & Services → Library**, aktifkan **Google Drive API**.
4. Pada **APIs & Services → OAuth consent screen**, pilih tipe **External** jika akun pengguna berasal dari luar organisasi.
5. Isi nama aplikasi, alamat email dukungan, dan email pengembang. Tambahkan scope yang diperlukan oleh aplikasi:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Saat masih dalam tahap pengujian, tambahkan akun Google yang akan digunakan sebagai **Test user**.

## 2. Buat OAuth Client ID

Buat kredensial pada **APIs & Services → Credentials → Create Credentials → OAuth client ID**. Untuk aplikasi Android, buat **Android client** dengan package name:

```text
pos.rifaldo
```

Masukkan SHA-1 dari signing certificate APK yang digunakan. Untuk build debug, SHA-1 dapat diperoleh dengan perintah berikut dari folder proyek Android:

```bash
./gradlew signingReport
```

Buat juga **Web application client**. Salin nilai **Client ID** yang berakhiran:

```text
.apps.googleusercontent.com
```

Jangan memasukkan **Client Secret** ke dalam aplikasi Android.

## 3. Masukkan Client ID di Ini POS

1. Buka **Pengaturan**.
2. Pilih **Sinkronisasi Google Drive**.
3. Masukkan Web OAuth Client ID.
4. Tekan **Simpan**, lalu tekan **Hubungkan akun Google**.
5. Selesaikan login dan persetujuan akses.
6. Tekan **Backup sekarang** untuk membuat cadangan pertama.

Aplikasi menggunakan scope `drive.file`, sehingga akses dibatasi pada file yang dibuat atau dibuka oleh aplikasi. Ini lebih terbatas daripada meminta akses ke seluruh isi Google Drive.

## 4. Backup dan pemulihan

Pada halaman Sinkronisasi Google Drive, tombol **Backup sekarang** membuat atau memperbarui file dengan pola nama `ini-pos-backup-YYYY-MM-DD.json`. Tombol **Lihat backup** menampilkan backup yang tersedia berdasarkan waktu perubahan. Pilih **Pulihkan** untuk mengganti data lokal dengan isi backup yang dipilih.

Pemulihan adalah tindakan yang menggantikan data lokal. Pastikan transaksi terbaru sudah dicadangkan sebelum memulihkan backup lama.

## 5. Backup otomatis

Setelah akun Google terhubung, aktifkan **Backup otomatis**. Ini POS menjadwalkan backup secara tertunda setelah perubahan data disimpan agar beberapa perubahan berurutan tidak mengunggah file berkali-kali. Backup otomatis bersifat **best effort**: jika perangkat sedang offline, transaksi lokal tetap tersimpan dan backup dapat dilakukan kemudian secara manual ketika koneksi tersedia.

Aplikasi tidak mengirim data transaksi ke server milik Ini POS. Data backup dikirim langsung ke Google Drive menggunakan access token sesi Google.

## 6. Catatan keamanan dan troubleshooting

- Jangan membagikan OAuth Client Secret, access token, atau file backup kepada pihak lain.
- Jika login ditolak dengan pesan `Developer Error`, periksa package name `pos.rifaldo`, SHA-1, dan project Google Cloud yang digunakan.
- Jika muncul pesan `Access blocked`, pastikan akun sudah ditambahkan sebagai Test user ketika consent screen masih berstatus Testing.
- Jika backup gagal, periksa koneksi internet, kuota Google Drive, status Google Drive API, dan masa berlaku sesi login.
- Fitur scanner, transaksi, penyimpanan produk, dan stok tetap berjalan offline meskipun Google Drive belum dikonfigurasi.

## 7. Batasan implementasi saat ini

Versi awal ini memakai Google Sign-In dan Drive REST API secara langsung dari perangkat. Karena tidak ada backend, pengguna perlu login kembali setelah sesi Google berakhir atau aplikasi diinstal ulang. File backup berupa JSON dan disimpan di Google Drive pengguna; enkripsi tambahan di tingkat aplikasi belum diterapkan.

Untuk penggunaan produksi berskala besar, disarankan melengkapi konfigurasi OAuth dengan verifikasi consent screen Google, kebijakan privasi, serta strategi enkripsi backup sebelum distribusi publik.

---

Dokumen ini merupakan bagian dari [Panduan Pengguna Ini POS](PANDUAN_PENGGUNA.md).
