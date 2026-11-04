/**
 * Remote Salary & Net Take-Home Pay Estimator
 * Converts foreign currencies to IDR, calculates Indonesian PPh 21 tax estimates, and computes net take-home pay.
 */

export const DEFAULT_EXCHANGE_RATES = {
  USD: 18140,
  EUR: 20300,
  GBP: 24300,
  SGD: 14100,
  AUD: 12600,
  IDR: 1
};

const FOREX_CACHE_KEY = "jsa_forex_cache_v2";
const FOREX_TTL_MS = 6 * 60 * 60 * 1000; // Cache 6 jam

/**
 * Mendapatkan kurs terkini dari cache lokal atau fallback baseline
 */
export function getLiveExchangeRates() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(FOREX_CACHE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.rates && parsed.rates.USD) {
        return parsed.rates;
      }
    }
  } catch (_) {}
  return DEFAULT_EXCHANGE_RATES;
}

/**
 * Fetch kurs mata uang real-time gratis via open.er-api.com (Fallback: jsdelivr currency-api)
 * Tanpa API Key, mendukung CORS, transparan dan otomatis diperbarui.
 */
export async function fetchLiveExchangeRates(force = false) {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(FOREX_CACHE_KEY);
      if (!force && raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < FOREX_TTL_MS)) {
          return parsed.rates;
        }
      }
    }
  } catch (_) {}

  let rates = null;

  // 1. Sumber Utama: open.er-api.com (Data Bank Sentral global, update tiap hari)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.IDR) {
        const idr = data.rates.IDR;
        rates = {
          USD: Math.round(idr),
          EUR: Math.round(idr / (data.rates.EUR || 1)),
          GBP: Math.round(idr / (data.rates.GBP || 1)),
          SGD: Math.round(idr / (data.rates.SGD || 1)),
          AUD: Math.round(idr / (data.rates.AUD || 1)),
          IDR: 1,
          isLive: true,
          provider: "open.er-api.com",
          updatedAt: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn("Primary forex API error, trying fallback:", err.message);
  }

  // 2. Sumber Cadangan: jsdelivr currency-api
  if (!rates) {
    try {
      const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const idr = data?.usd?.idr;
        if (idr) {
          rates = {
            USD: Math.round(idr),
            EUR: Math.round(idr / (data.usd.eur || 1)),
            GBP: Math.round(idr / (data.usd.gbp || 1)),
            SGD: Math.round(idr / (data.usd.sgd || 1)),
            AUD: Math.round(idr / (data.usd.aud || 1)),
            IDR: 1,
            isLive: true,
            provider: "currency-api",
            updatedAt: new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.warn("Fallback forex API error:", err.message);
    }
  }

  if (rates) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(FOREX_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
      }
    } catch (_) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("forex:updated", { detail: rates }));
    }
    return rates;
  }

  return DEFAULT_EXCHANGE_RATES;
}

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
  const liveRates = getLiveExchangeRates();
  const rate = liveRates[currency.toUpperCase()] || DEFAULT_EXCHANGE_RATES[currency.toUpperCase()] || DEFAULT_EXCHANGE_RATES.USD;
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
