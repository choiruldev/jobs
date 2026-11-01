/**
 * Global Salary PPP (Purchasing Power Parity) & International Benchmark Engine
 * Evaluates foreign tech salaries against Indonesian living standards and global market averages.
 */

import { formatIDR, DEFAULT_EXCHANGE_RATES, estimateTakeHomePay } from "./salary-calculator.js?v=20260616z";

// Cost of Living Index (Baseline: New York / San Francisco = 100)
export const CITY_COL_INDICES = {
  // Indonesia (Home baseline)
  "jakarta": { name: "Jakarta, Indonesia", country: "ID", index: 33.5, rentIndex: 14.2, currency: "IDR" },
  "bali": { name: "Bali / Denpasar, Indonesia", country: "ID", index: 29.8, rentIndex: 12.5, currency: "IDR" },
  "bandung": { name: "Bandung, Indonesia", country: "ID", index: 26.4, rentIndex: 9.8, currency: "IDR" },
  "yogyakarta": { name: "Yogyakarta, Indonesia", country: "ID", index: 23.1, rentIndex: 7.9, currency: "IDR" },
  "surabaya": { name: "Surabaya, Indonesia", country: "ID", index: 27.2, rentIndex: 10.1, currency: "IDR" },

  // Global Tech Hubs (Comparison)
  "san_francisco": { name: "San Francisco, US", country: "US", index: 96.2, rentIndex: 88.5, currency: "USD" },
  "new_york": { name: "New York City, US", country: "US", index: 100.0, rentIndex: 100.0, currency: "USD" },
  "singapore": { name: "Singapore", country: "SG", index: 85.9, rentIndex: 78.4, currency: "SGD" },
  "london": { name: "London, UK", country: "UK", index: 82.4, rentIndex: 68.2, currency: "GBP" },
  "berlin": { name: "Berlin, Germany", country: "DE", index: 65.8, rentIndex: 44.2, currency: "EUR" },
  "sydney": { name: "Sydney, Australia", country: "AU", index: 78.6, rentIndex: 61.5, currency: "AUD" },
  "tokyo": { name: "Tokyo, Japan", country: "JP", index: 62.1, rentIndex: 39.4, currency: "USD" }
};

// Indonesian Market Baseline Salaries (Monthly Gross IDR by Experience Level)
export const LOCAL_BENCHMARK_RANGES = {
  junior: { min: 6000000, max: 12000000, label: "Junior Engineer (1-2 thn)" },
  mid: { min: 14000000, max: 25000000, label: "Mid-level Engineer (3-5 thn)" },
  senior: { min: 28000000, max: 48000000, label: "Senior Engineer (5-8 thn)" },
  lead: { min: 50000000, max: 85000000, label: "Lead / Staff / Principal (8+ thn)" }
};

/**
 * Hitung Komparasi Daya Beli (Purchasing Power Parity)
 * @param {Object} options
 * @param {number} options.amount - Gaji bulanan
 * @param {string} options.currency - USD, SGD, EUR, IDR, dll
 * @param {string} options.homeCityKey - 'jakarta', 'bali', dsb
 * @param {string} options.benchmarkCityKey - 'san_francisco', 'singapore', dsb
 */
export function calculatePPP({
  amount = 3000,
  currency = "USD",
  homeCityKey = "jakarta",
  benchmarkCityKey = "san_francisco"
}) {
  const homeCity = CITY_COL_INDICES[homeCityKey] || CITY_COL_INDICES.jakarta;
  const targetCity = CITY_COL_INDICES[benchmarkCityKey] || CITY_COL_INDICES.san_francisco;
  const rate = DEFAULT_EXCHANGE_RATES[currency.toUpperCase()] || DEFAULT_EXCHANGE_RATES.USD;

  // Nilai nominal kotor dalam IDR per bulan
  const grossMonthlyIdr = currency.toUpperCase() === "IDR" ? amount : Math.round(amount * rate);
  const grossAnnualIdr = grossMonthlyIdr * 12;

  // Estimasi PPh 21 dan Take-Home Pay
  const taxEst = estimateTakeHomePay({
    grossAmount: grossMonthlyIdr,
    currency: "IDR",
    period: "monthly",
    taxMode: "employee"
  });

  // Rasio Biaya Hidup (Target Hub vs Home City)
  const colRatio = targetCity.index / homeCity.index;

  // Ekuivalen gaya hidup di kota target
  // Misal gaji $3,500 di Jakarta = gaya hidup senilai $3,500 * (96.2 / 33.5) = $10,050 di San Francisco
  const equivalentMonthlyTargetForeign = Math.round(
    (grossMonthlyIdr / (DEFAULT_EXCHANGE_RATES[targetCity.currency] || rate)) * colRatio
  );

  // Purchasing Power Multiplier
  const pppMultiplier = Number(colRatio.toFixed(2));

  // Saving capacity index
  const estLocalLivingCostIdr = Math.round(homeCity.index * 300000); // Estimasi biaya hidup layak bulanan
  const potentialMonthlySavingsIdr = Math.max(0, taxEst.netMonthlyIdr - estLocalLivingCostIdr);
  const savingsRatePercent = grossMonthlyIdr > 0
    ? Math.min(100, Math.round((potentialMonthlySavingsIdr / taxEst.netMonthlyIdr) * 100))
    : 0;

  // Evaluasi Daya Tawar Negosiasi
  let negotiationAdvice = "";
  if (currency.toUpperCase() === "USD" && amount < 2000) {
    negotiationAdvice = "Tawaran ini tergolong rendah untuk standar pasar remote global. Anda berada di posisi yang tepat untuk meminta penyesuaian ke kisaran $2,500 - $3,500/bulan.";
  } else if (currency.toUpperCase() === "USD" && amount >= 2000 && amount <= 5000) {
    negotiationAdvice = "Tawaran kompetitif dan sehat untuk talenta remote Asia. Anda bisa menegosiasikan benefit alat kerja (equipment stipend) atau budget belajar tahunan.";
  } else if (currency.toUpperCase() === "USD" && amount > 5000) {
    negotiationAdvice = "Tawaran tier-1 (tinggi)! Sangat kuat melebihi 95% standar gaji lokal Indonesia dengan potensi tabungan di atas 60%.";
  } else {
    negotiationAdvice = "Gunakan data benchmark ini saat sesi offering interview untuk membuktikan kelayakan kompensasi berbasis value.";
  }

  return {
    input: { amount, currency, homeCity, targetCity },
    grossMonthlyIdr,
    grossAnnualIdr,
    netMonthlyIdr: taxEst.netMonthlyIdr,
    monthlyTax: taxEst.monthlyTax,
    colRatio,
    pppMultiplier,
    equivalentMonthlyTargetForeign,
    equivalentDisplay: `${targetCity.currency} ${new Intl.NumberFormat("en-US").format(equivalentMonthlyTargetForeign)} / bulan`,
    estLocalLivingCostIdr,
    potentialMonthlySavingsIdr,
    savingsRatePercent,
    negotiationAdvice,
    formatted: {
      grossMonthlyIdr: formatIDR(grossMonthlyIdr),
      netMonthlyIdr: formatIDR(taxEst.netMonthlyIdr),
      monthlyTax: formatIDR(taxEst.monthlyTax),
      potentialSavings: formatIDR(potentialMonthlySavingsIdr),
      estLivingCost: formatIDR(estLocalLivingCostIdr)
    }
  };
}
