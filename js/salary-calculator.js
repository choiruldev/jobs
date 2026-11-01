/**
 * Remote Salary & Net Take-Home Pay Estimator
 * Converts foreign currencies to IDR, calculates Indonesian PPh 21 tax estimates, and computes net take-home pay.
 */

export const DEFAULT_EXCHANGE_RATES = {
  USD: 16200,
  EUR: 17400,
  GBP: 20500,
  SGD: 12100,
  AUD: 10600,
  IDR: 1
};

export function formatIDR(amount = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Hitung Pajak Penghasilan (PPh 21) Wajib Pajak Orang Pribadi (Tarif Progresif UU HPP)
 */
export function calculateProgressiveTax(pkp = 0) {
  if (pkp <= 0) return 0;
  let tax = 0;
  let remaining = pkp;

  // Lapis 1: 0 - 60jt (5%)
  const tier1 = Math.min(remaining, 60000000);
  tax += tier1 * 0.05;
  remaining -= tier1;

  // Lapis 2: 60jt - 250jt (15%)
  if (remaining > 0) {
    const tier2 = Math.min(remaining, 190000000);
    tax += tier2 * 0.15;
    remaining -= tier2;
  }

  // Lapis 3: 250jt - 500jt (25%)
  if (remaining > 0) {
    const tier3 = Math.min(remaining, 250000000);
    tax += tier3 * 0.25;
    remaining -= tier3;
  }

  // Lapis 4: 500jt - 5M (30%)
  if (remaining > 0) {
    const tier4 = Math.min(remaining, 4500000000);
    tax += tier4 * 0.30;
    remaining -= tier4;
  }

  // Lapis 5: > 5M (35%)
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  return Math.round(tax);
}

/**
 * Estimasi Gaji Bersih untuk Pekerja Remote Indonesia
 * @param {number} grossAmount - Gaji kotor
 * @param {string} currency - USD, EUR, IDR, dll
 * @param {string} period - 'yearly' atau 'monthly'
 * @param {string} taxMode - 'freelancer' (Norma NPPN 50%) atau 'employee'
 */
export function estimateTakeHomePay({
  grossAmount = 0,
  currency = "USD",
  period = "yearly",
  taxMode = "freelancer",
  ptkp = 54000000 // PTKP TK/0 default
}) {
  const rate = DEFAULT_EXCHANGE_RATES[currency.toUpperCase()] || DEFAULT_EXCHANGE_RATES.USD;
  const grossAnnualForeign = period === "monthly" ? grossAmount * 12 : grossAmount;
  const grossAnnualIdr = grossAnnualForeign * rate;
  const grossMonthlyIdr = Math.round(grossAnnualIdr / 12);

  // Estimasi Fee Transfer Bank / Wise (~1.2%)
  const transferFeeMonthly = currency === "IDR" ? 0 : Math.round(grossMonthlyIdr * 0.012);

  // Perhitungan Pajak PPh 21
  let annualTax = 0;
  if (taxMode === "freelancer") {
    // Menggunakan Norma Perhitungan Penghasilan Neto (NPPN) tenaga ahli / IT ~50%
    const penghasilanNeto = grossAnnualIdr * 0.50;
    const pkp = Math.max(0, penghasilanNeto - ptkp);
    annualTax = calculateProgressiveTax(pkp);
  } else {
    // Mode karyawan biasa (Biaya jabatan 5% max 6jt)
    const biayaJabatan = Math.min(grossAnnualIdr * 0.05, 6000000);
    const penghasilanNeto = grossAnnualIdr - biayaJabatan;
    const pkp = Math.max(0, penghasilanNeto - ptkp);
    annualTax = calculateProgressiveTax(pkp);
  }

  const monthlyTax = Math.round(annualTax / 12);
  const netMonthlyIdr = Math.max(0, grossMonthlyIdr - monthlyTax - transferFeeMonthly);

  return {
    currency,
    rate,
    grossMonthlyForeign: period === "monthly" ? grossAmount : Math.round(grossAmount / 12),
    grossMonthlyIdr,
    grossAnnualIdr,
    monthlyTax,
    transferFeeMonthly,
    netMonthlyIdr,
    formatted: {
      grossMonthlyIdr: formatIDR(grossMonthlyIdr),
      monthlyTax: formatIDR(monthlyTax),
      transferFeeMonthly: formatIDR(transferFeeMonthly),
      netMonthlyIdr: formatIDR(netMonthlyIdr)
    }
  };
}
