/**
 * Remote Contract Safety, Compliance & W-8BEN Tax Guidance for Indonesian Tech Workers
 * Provides checklists, clause analyzer heuristics, and treaty explanation.
 */

export const W8BEN_GUIDE_STEPS = [
  {
    step: "Part I - Line 1: Name of Individual",
    instruction: "Tuliskan nama lengkap Anda persis sesuai KTP atau Paspor Indonesia."
  },
  {
    step: "Part I - Line 2: Country of Citizenship",
    instruction: "Isi dengan 'Indonesia'. Jangan isi dengan negara tempat klien berada."
  },
  {
    step: "Part I - Line 3: Permanent Residence Address",
    instruction: "Alamat domisili tetap Anda di Indonesia (Jalan, Kota, Kode Pos). Jangan gunakan P.O. Box."
  },
  {
    step: "Part I - Line 6a: Foreign Tax Identifying Number (FTIN)",
    instruction: "Masukkan 16 digit Nomor Induk Kependudukan (NIK) / NPWP Anda. Ini membuktikan Anda adalah wajib pajak resmi Indonesia."
  },
  {
    step: "Part II - Line 9 & 10: Treaty Benefits (P3B Indonesia - US)",
    instruction: "Centang bahwa Anda adalah residen Indonesia. Klaim fasilitas Tax Treaty (Persetujuan Penghindaran Pajak Berganda) Article 15 (Dependent Personal Services) atau Article 16 (Independent Personal Services) dengan tarif withholding 0% karena seluruh pekerjaan dilakukan dari wilayah Indonesia."
  }
];

export const CONTRACT_RED_FLAGS = [
  {
    id: "surveillance",
    title: "Software Pemantau Invasif (Keystroke & Webcam Tracking)",
    risk: "Tinggi",
    description: "Klausul yang mewajibkan instalasi software perekam ketikan tombol (keystroke logger), screenshot berkala setiap 5 menit, atau kamera laptop wajib menyala.",
    recommendation: "Negosiasikan sistem pelaporan berbasis hasil kerja (deliverables / sprint milestones) daripada micromanagement waktu."
  },
  {
    id: "non_compete",
    title: "Klausul Non-Compete Terlalu Luas (Global & Multi-Tahun)",
    risk: "Tinggi",
    description: "Larangan bekerja di seluruh industri teknologi selama 1-2 tahun setelah kontrak berakhir di seluruh dunia tanpa kompensasi non-compete berbayar.",
    recommendation: "Minta pembatasan non-compete hanya berlaku untuk kompetitor langsung spesifik dan batasi maksimal 6 bulan di wilayah target klien."
  },
  {
    id: "ip_assignment",
    title: "Pengalihan Hak Cipta Proyek Pribadi (Overly Broad IP Assignment)",
    risk: "Sedang",
    description: "Klausul yang mengklaim segala karya atau open-source yang Anda buat di luar jam kerja dan tanpa alat kantor menjadi milik perusahaan.",
    recommendation: "Pastikan IP assignment hanya mencakup kode dan aset yang dibuat khusus untuk tugas proyek klien selama durasi kontrak."
  },
  {
    id: "payment_terms",
    title: "Termin Pembayaran > Net 30 Hari",
    risk: "Sedang",
    description: "Klien baru membayar invoice 45 atau 60 hari setelah tanggal penagihan, membebani arus kas pribadi.",
    recommendation: "Standar remote tech internasional adalah Net 7 atau Net 14 hari via Wise, Payoneer, atau direct wire transfer."
  }
];

export function analyzeContractClause(text = "") {
  const flagsFound = [];
  const lower = text.toLowerCase();

  if (/hubstaff|timedoctor|time doctor|keystroke|screenshot|webcam always/i.test(lower)) {
    flagsFound.push(CONTRACT_RED_FLAGS[0]);
  }
  if (/non-compete|compete.*years|restrict.*industry|solicitation/i.test(lower)) {
    flagsFound.push(CONTRACT_RED_FLAGS[1]);
  }
  if (/all inventions|intellectual property.*prior|outside working hours/i.test(lower)) {
    flagsFound.push(CONTRACT_RED_FLAGS[2]);
  }
  if (/net 60|net 45|delayed payment|sole discretion.*pay/i.test(lower)) {
    flagsFound.push(CONTRACT_RED_FLAGS[3]);
  }

  return {
    score: Math.max(0, 100 - (flagsFound.length * 25)),
    flagsFound
  };
}
