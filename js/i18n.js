/**
 * Client-Side Internationalization (i18n) Engine
 * Supports seamless bilingual interface (Bahasa Indonesia & English).
 */

const I18N_STORAGE_KEY = "jsa_selected_language_v1";

export const DICTIONARY = {
  id: {
    nav_search: "Cari Lowongan",
    nav_tracker: "Tracker Lamaran",
    nav_bookmarks: "Lowongan Tersimpan",
    nav_resume: "ATS Resume Builder",
    nav_interview: "Latihan Interview",
    nav_companies: "Perusahaan Remote",
    nav_insights: "Analisis Funnel",
    nav_salary: "Kalkulator PPP Gaji",
    nav_contract: "Panduan Kontrak & Pajak",
    nav_invoice: "Generator Invoice",
    nav_portfolio: "Kartu Bukti Karya",
    nav_alerts: "Pusat Notifikasi",
    btn_apply: "Lamar Sekarang",
    btn_save: "Simpan Lowongan",
    search_placeholder: "Cari role, perusahaan, atau skill",
    location_all: "Dari Indonesia",
    salary_est: "Estimasi Gaji Bersih"
  },
  en: {
    nav_search: "Job Search",
    nav_tracker: "App Tracker",
    nav_bookmarks: "Saved Jobs",
    nav_resume: "ATS Resume Builder",
    nav_interview: "Interview Prep",
    nav_companies: "Remote Companies",
    nav_insights: "Funnel Insights",
    nav_salary: "Salary PPP Index",
    nav_contract: "Contracts & Tax Guide",
    nav_invoice: "Invoice Generator",
    nav_portfolio: "Proof of Work Card",
    nav_alerts: "Notification Center",
    btn_apply: "Apply Now",
    btn_save: "Save Job",
    search_placeholder: "Search role, company, or skills",
    location_all: "From Indonesia",
    salary_est: "Estimated Take-Home Pay"
  }
};

export function getLanguage() {
  try {
    return localStorage.getItem(I18N_STORAGE_KEY) || "id";
  } catch (err) {
    return "id";
  }
}

export function setLanguage(lang = "id") {
  const chosen = lang === "en" ? "en" : "id";
  try {
    localStorage.setItem(I18N_STORAGE_KEY, chosen);
  } catch (err) {}
  document.documentElement.lang = chosen;
  applyTranslations(chosen);
  return chosen;
}

export function t(key) {
  const lang = getLanguage();
  return (DICTIONARY[lang] && DICTIONARY[lang][key]) || (DICTIONARY.id && DICTIONARY.id[key]) || key;
}

export function applyTranslations(lang = getLanguage()) {
  const dict = DICTIONARY[lang] || DICTIONARY.id;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      if (el.tagName === "INPUT" && el.placeholder) {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
}
