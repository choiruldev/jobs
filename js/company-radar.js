/**
 * Remote Company Culture Radar & Workplace Health Signals
 * Evaluates remote work health, asynchronous maturity, surveillance freedom, and benefit tiers.
 */

export const CULTURE_DIMENSIONS = [
  {
    key: "async",
    name: "Kultur Asinkronus (Async-First)",
    description: "Komunikasi tertulis diutamakan (Slack, Notion, GitLab), tidak ada rapat video berlebihan di luar jam kerja Asia.",
    icon: "schedule_send"
  },
  {
    key: "trust",
    name: "Kepercayaan Tanpa Spyware",
    description: "Bebas dari instalasi software pelacak tombol (keystroke logger) atau screenshot otomatis.",
    icon: "verified_user"
  },
  {
    key: "pay_transparency",
    name: "Transparansi Kompensasi",
    description: "Rentang gaji dicantumkan secara terbuka dengan penyesuaian pasar yang adil dan kenaikan berkala.",
    icon: "payments"
  },
  {
    key: "equipment_stipend",
    name: "Tunjangan Kerja & Alat",
    description: "Tunjangan penyediaan laptop kerja (MacBook/ThinkPad), coworking space, dan internet bulanan.",
    icon: "laptop_mac"
  }
];

export function evaluateCompanyCulture(company = {}) {
  const badges = (company.badges || []).map(b => b.toLowerCase());
  const description = (company.description || "").toLowerCase();
  
  let score = 70; // baseline
  const verifiedSignals = [];
  const warningSignals = [];

  if (badges.some(b => b.includes("async") || b.includes("100% remote"))) {
    score += 10;
    verifiedSignals.push("Terbukti menerapkan async-first & komunikasi tertulis terstruktur.");
  }
  if (badges.some(b => b.includes("transparent") || b.includes("gaji transparan"))) {
    score += 10;
    verifiedSignals.push("Standar kompensasi dan formula gaji dipublikasikan secara terbuka.");
  }
  if (badges.some(b => b.includes("stipend") || b.includes("equipment"))) {
    score += 10;
    verifiedSignals.push("Menyediakan tunjangan perangkat keras kerja & ergonomi.");
  }
  if (badges.some(b => b.includes("4-day") || b.includes("flexible"))) {
    score += 5;
    verifiedSignals.push("Kebijakan jam kerja fleksibel / 4 hari sepekan.");
  }

  // Surveillance check
  if (description.includes("timedoctor") || description.includes("hubstaff") || description.includes("keystroke")) {
    score -= 30;
    warningSignals.push("Waspada: Terindikasi mewajibkan instalasi software perekam aktivitas layar.");
  }

  score = Math.min(100, Math.max(30, score));

  return {
    score,
    healthLabel: score >= 90 ? "Sangat Sehat (Tier 1 Remote)" : (score >= 75 ? "Ramah Remote (Standar Baik)" : "Perlu Verifikasi"),
    verifiedSignals,
    warningSignals
  };
}
