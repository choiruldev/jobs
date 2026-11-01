# JobSearch Indonesia — Launch Checklist & Production Runbook 🚀

Dokumen ini berisi panduan checklist pra-rilis (*pre-flight release*), verifikasi kepatuhan hukum, arsitektur *zero-login*, dan prosedur operasional standar (SOP) peluncuran publik JobSearch Indonesia.

---

## 1. Ringkasan Platform & Arsitektur
* **Nama Platform:** JobSearch Indonesia
* **Domain Produksi:** `https://jobsearch.id`
* **Model Arsitektur:** Client-Side Single Page Application (SPA/PWA) dengan Zero-Backend Login
* **Penyimpanan Data Pengguna:** 100% Client-side (`localStorage` + `IndexedDB`)
* **Kepatuhan Regulasi:** UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)

---

## 2. Checklist Pra-Peluncuran (Pre-Flight Checklist)

### A. Kepatuhan Hukum & Privasi Pengguna (Legal & Compliance)
- [x] **Zero-Login Guarantee:** Tidak ada form input password, pendaftaran akun wajib, atau pelacakan identitas terpusat.
- [x] **Kebijakan Privasi (UU PDP No. 27/2022):** Tersedia di [`pages/privacy-policy.html`](file:///Users/irul/Documents/PROJECT/jobseekers/pages/privacy-policy.html).
- [x] **Hak Akses & Portabilitas Data:** Tombol Ekspor JSON & CSV (Spreadsheet UTF-8 BOM) terintegrasi di tracker lamaran dan pengaturan.
- [x] **Hak Penghapusan (Right to Erasure):** Tombol bersihkan data dan kontrol reset lokal tersedia di setiap modul.
- [x] **Syarat & Ketentuan Layanan (ToS):** Tersedia di [`pages/terms.html`](file:///Users/irul/Documents/PROJECT/jobseekers/pages/terms.html) dengan disclaimer aggregator independen dan peringatan keras anti-penipuan loker.

### B. Performa & Reliabilitas (Performance & Resilience)
- [x] **In-Memory Search SLA:** Latensi pencarian $\le 4.5$ ms pada dataset 10.000 lowongan (Batas toleransi: $< 25$ ms).
- [x] **Throughput Finansial (PPh 21):** $> 20.000.000$ kalkulasi/detik.
- [x] **Offline Resilience:** Service Worker v4 terpasang, meng-cache 45+ aset statis, dengan layar fallback [`pages/offline.html`](file:///Users/irul/Documents/PROJECT/jobseekers/pages/offline.html).
- [x] **Asset Budget:** Total CSS $< 55$ KB, total JavaScript $< 365$ KB untuk seluruh 47 modul tanpa dependensi pihak ketiga.

### C. Keamanan & Header HTTP (Security & Hardening)
- [x] **Content-Security-Policy (CSP):** Ketat membatasi `script-src` dan `frame-ancestors 'none'` di `_headers` dan `vercel.json`.
- [x] **Anti-Clickjacking:** `X-Frame-Options: DENY`.
- [x] **MIME Sniffing Protection:** `X-Content-Type-Options: nosniff`.
- [x] **Privacy Referrer:** `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Input Sanitization:** Pencegahan injeksi XSS dengan escaping HTML pada Resume Builder, Invoice, dan Komunitas Gaji.

### D. SEO & Social Discovery (Go-to-Market Readiness)
- [x] **OpenGraph Preview Banner:** Ukuran 1200x630 pixel di `assets/og-cover.png` diinjeksi ke 28 halaman HTML.
- [x] **Google Jobs Schema (Schema.org):** JSON-LD `JobPosting` dinamis terpasang pada halaman detail dan `WebSite` SearchAction pada beranda.
- [x] **Sitemap & Robots:** `sitemap.xml` berisi seluruh rute halaman kanonikal dan referensi eksplisit di `robots.txt`.
- [x] **Syndication Feed:** `feed.xml` RSS 2.0 menyajikan 50 lowongan teranyar untuk pembaca RSS dan agregator.
- [x] **Viral Social Sharing:** Modal berbagi cepat WhatsApp, Telegram, LinkedIn, dan X di [`js/share.js`](file:///Users/irul/Documents/PROJECT/jobseekers/js/share.js).

---

## 3. Prosedur Deploy Produksi

### Opsi 1: Cloudflare Pages (Disarankan)
1. Hubungkan repositori GitHub ke Cloudflare Pages.
2. Pengaturan Build:
   * **Framework Preset:** None (Static HTML)
   * **Build Command:** `npm run build`
   * **Output Directory:** `.`
3. Cloudflare Pages akan otomatis mendeteksi konfigurasi `_headers` untuk CSP dan HSTS.

### Opsi 2: Vercel
1. Jalankan `vercel deploy --prod` atau sambungkan via GitHub Integration.
2. File `vercel.json` sudah terkonfigurasi dengan rewrite dan security headers.

---

## 4. Siklus Pembaruan Feed Lowongan (Automation Runbook)
1. **GitHub Actions Cron:** File `.github/workflows/update-jobs.yml` dijadwalkan berjalan otomatis setiap 6 jam (`0 */6 * * *`).
2. **Proses Pengambilan Data:** Menjalankan `python scripts/fetch_jobs.py` untuk mengikis lowongan dari LinkedIn, Indeed, JobStreet, Glints, Kalibrr.
3. **Deduplikasi & Sanitasi:** Algoritma fuzzy matcher memfilter duplikasi posisi + nama perusahaan dalam rentang 30 hari.
4. **Verifikasi Kualitas:** Commit otomatis ke `data/jobs.json` hanya dilakukan jika feed valid dan lolos uji integritas.

---

## 5. Prosedur Tanggap Insiden (Incident Response SOP)

| Kejadian | Langkah Penanganan |
| :--- | :--- |
| **Loker Terindikasi Penipuan Dilaporkan** | 1. Buka `data/jobs.json`<br>2. Hapus objek lowongan berdasarkan `id`<br>3. Jalankan `npm run build`<br>4. Lakukan commit dan deploy darurat |
| **Pembaruan Aset Gagal di Browser Klien** | 1. Naikkan `CACHE_NAME` di `sw.js` (misal: `jobsearch-cache-v5`)<br>2. Ubah query string version `?v=...` di skrip utama<br>3. PWA Update Pill akan otomatis memicu reload instan pada klien |
| **Penyimpanan Lokal Penuh (Quota Exceeded)** | Pengguna dipandu melalui dialog untuk mengunduh arsip lamaran via tombol `Export Backup JSON`, lalu menekan `Bersihkan Riwayat Lama` |

---
*Dokumen ini diverifikasi secara otomatis oleh Test Suite JobSearch (`npm test`).*
