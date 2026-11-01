# 🧪 Panduan Program Beta Testing: JobSearch Indonesia (v1.0-beta)

Selamat datang di program pengujian beta **JobSearch**! Platform ini dirancang khusus untuk pencari kerja Indonesia yang menginginkan platform karir bersih, tanpa spam, privasi terlindungi (*Zero-Login Local-First*), dan dilengkapi alat persiapan kerja terintegrasi.

Dokumen ini berisi panduan skenario pengujian untuk **Cohort Beta Tester (50 – 200 Pengguna)**.

---

## 🎯 Fokus Utama Pengujian Beta
1. **Kecepatan & Akurasi Pencarian:** Memastikan loker dari portal resmi (LinkedIn, Jobstreet, Glints, Kalibrr) dapat dicari tanpa lag.
2. **Keandalan PWA & Mode Offline:** Memastikan aplikasi dapat dipasang di smartphone (Android/iOS) dan tetap bisa dibuka tanpa koneksi internet.
3. **Ketepatan Tools Karir:** ATS Resume Builder (export PDF 1 halaman), Latihan Interview STAR, dan Kalkulator Gaji PPP & Pajak PPh 21.
4. **Privasi Data:** Memastikan data lamaran tidak bocor dan tersimpan aman di browser Anda.

---

## 📋 5 Skenario Uji Coba Beta

Silakan coba alur berikut di browser HP (Chrome/Safari) atau Laptop Anda:

### Skenario 1: Pencarian & Filter Lowongan
1. Buka halaman **Cari Lowongan** (`/pages/search.html`).
2. Ketik kata kunci: `"Frontend"`, `"Remote"`, `"Data"`, atau nama instansi seperti `"BRI"`.
3. Coba kombinasi filter:
   - Sumber: *Semua Portal*, *LinkedIn*, *JobStreet*.
   - Tipe: *Remote Indonesia*, *Global*.
4. **Yang Diperiksa:** Apakah hasil muncul instan (<50ms)? Apakah ada loker duplikat?

### Skenario 2: Menyimpan Loker & Tracker Lamaran (Kanban)
1. Pada kartu loker yang menarik, klik tombol **Bookmark (Ikon Bookmark)**.
2. Buka **Lowongan Tersimpan** (`/pages/bookmarks.html`). Pastikan loker tersimpan muncul.
3. Klik tombol **Lamar / Catat Lamaran** untuk memasukkan ke **Tracker Lamaran** (`/pages/apply.html`).
4. Di Tracker Lamaran, coba:
   - Geser kartu antar kolom Kanban (*Disimpan -> Dilamar -> Interview -> Offer*).
   - Klik **Export CSV** untuk mendownload riwayat lamaran ke Excel.
   - Klik **Backup JSON** untuk mengamankan data lokal Anda.
5. **Yang Diperiksa:** Apakah perpindahan status lancar? Apakah file CSV terbuka rapi di Excel?

### Skenario 3: Pembuatan Resume ATS (1 Halaman)
1. Buka **ATS Resume Builder** (`/pages/resume-builder.html`).
2. Isi data diri, pengalaman kerja, pendidikan, dan keahlian utama.
3. Atau coba fitur **Import Teks CV** dengan mem-paste teks dari resume lama Anda.
4. Klik **Cetak / Unduh PDF**.
5. **Yang Diperiksa:** Pada jendela Print Preview, apakah resume pas 1 halaman A4 tanpa elemen navigasi website yang bocor?

### Skenario 4: Simulasi Wawancara (STAR Method)
1. Buka **Latihan Interview** (`/pages/interview-prep.html`).
2. Pilih pertanyaan umum (misal: *"Ceritakan tentang diri Anda"* atau *"Bagaimana Anda menangani konflik tim?"*).
3. Klik tombol **Rekam Jawaban (Mic)**, bicara selama 30–60 detik, lalu hentikan rekam.
4. Dengarkan kembali rekaman Anda dan bandingkan dengan panduan STAR yang disediakan.
5. **Yang Diperiksa:** Apakah audio playback jernih dan timer berjalan akurat?

### Skenario 5: Mode Offline & PWA Homescreen
1. Pada browser HP (Chrome/Safari), klik tombol **Install Aplikasi** atau *"Add to Home Screen"*.
2. Matikan koneksi WiFi dan Data Seluler (Mode Pesawat).
3. Buka aplikasi JobSearch dari layar utama HP Anda.
4. Buka **Lowongan Tersimpan** dan **Tracker Lamaran**.
5. **Yang Diperiksa:** Apakah aplikasi tetap terbuka mulus dengan banner status *"Mode Offline"*?

---

## 💬 Cara Melaporkan Bug & Masukan
Kami menyediakan tombol melayang di pojok kanan bawah seluruh halaman:
- Klik tombol **"Masukan Beta"** (ikon kumbang/bug).
- Pilih kategori: *Laporkan Bug*, *Usul Fitur Baru*, *Loker Kadaluwarsa*, atau *UI/UX*.
- Beri rating kepuasan (1–5) dan tuliskan kendala Anda.
- Klik **Kirim Masukan** atau gunakan tombol **Salin Teks** untuk membagikannya ke grup Discord / Telegram komunitas kami.

---

## 🔒 Kebijakan Privasi Tester
JobSearch beroperasi di bawah prinsip **Zero-Login Local-First**. Seluruh resume, catatan gaji, dan status lamaran yang Anda masukkan **tidak pernah dikirim ke server pusat**. Data hanya tersimpan di IndexedDB & localStorage browser perangkat Anda.
