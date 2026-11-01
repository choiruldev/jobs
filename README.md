# JobSearch Indonesia 🇮🇩

Platform pencarian lowongan kerja remote & lokal Indonesia, pelacak lamaran pribadi (Kanban), dan pusat tools karir dengan privasi **Zero-Login Local-First**.

[![Test Suite](https://img.shields.io/badge/tests-100%25%20passed-brightgreen.svg)](#pengujian)
[![PWA](https://img.shields.io/badge/PWA-ready-teal.svg)](#fitur-utama)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 Fitur Utama

1. **Pencarian Loker Terverifikasi:** Mengagregasi lowongan resmi dari LinkedIn, JobStreet, Indeed, dan portal global tanpa spam atau scam loker fiktif.
2. **Papan Kanban Tracker Lamaran:** Kelola tahapan lamaran (Disimpan, Dilamar, Interview, Penawaran) dengan fitur ekspor Excel/CSV dan backup JSON 1-klik.
3. **ATS Resume Builder (1 Halaman):** Buat resume standar industri dengan live preview dan cetak PDF A4 presisi tanpa margin terpotong.
4. **Latihan Wawancara (STAR):** Simulasi tanya jawab interview perilaku (behavioral) dilengkapi perekam audio lokal.
5. **Kalkulator PPP Gaji & Pajak PPh 21:** Hitung konversi daya beli gaji remote (Purchasing Power Parity) dan estimasi potongan pajak penghasilan Indonesia.
6. **Generator Invoice Kontraktor:** Buat invoice resmi berstandar internasional (USD, EUR, SGD, IDR) dengan detail SWIFT/Wise.
7. **PWA & Dukungan Offline Penuh:** Aplikasi dapat di-install di smartphone dan tetap dapat membuka bookmark serta resume tanpa koneksi internet.

---

## 🧪 Panduan Beta Testing

Untuk panduan pengujian tester komunitas, skenario pengujian, dan cara pelaporan bug:
👉 Baca [**Panduan Beta Testing (BETA-TESTING.md)**](BETA-TESTING.md)

---

## 💻 Menjalankan Secara Lokal

```bash
# Clone repositori
git clone https://github.com/jobseekers/jobseekers.git
cd jobseekers

# Jalankan server lokal
npm run serve
# Buka http://localhost:8080 di browser
```

## 🧪 Menjalankan Pengujian Otomatis

```bash
# Menjalankan 4 suite pengujian sekaligus:
# 1. Health check & route integrity
# 2. End-to-end user features
# 3. Benchmark performa skala 10.000 loker
# 4. Broken links & asset verification
npm test
```

---

## 🔒 Privasi & Keamanan (Zero-Login)

JobSearch tidak menggunakan sistem login berbasis server terpusat. Seluruh informasi pribadi (nama, email, riwayat pekerjaan, catatan interview, dan draft invoice) tersimpan sepenuhnya di memori browser pengguna (`IndexedDB` & `localStorage`).
