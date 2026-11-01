/**
 * Unified Job Schema & Normalization Layer
 * Standardizes job listings across all sources (providers, scrapers, manual input).
 */

export const REMOTE_TIERS = {
  INDONESIA: "indonesia",
  APAC: "apac",
  ANYWHERE: "anywhere",
  INTERNATIONAL: "international"
};

export const REMOTE_TIER_LABELS = {
  [REMOTE_TIERS.INDONESIA]: "Dari Indonesia",
  [REMOTE_TIERS.APAC]: "Asia / APAC",
  [REMOTE_TIERS.ANYWHERE]: "Remote Anywhere",
  [REMOTE_TIERS.INTERNATIONAL]: "Remote Global"
};

export const WORKPLACE_TYPES = {
  REMOTE: "remote",
  HYBRID: "hybrid",
  ONSITE: "onsite"
};

export const EXPERIENCE_LEVELS = {
  ENTRY: "entry",       // 0-2 thn / Fresh graduate / Junior
  MID: "mid",           // 2-5 thn / Mid-level
  SENIOR: "senior",     // 5+ thn / Senior / Staff
  LEAD: "lead",         // Lead / Manager / Head
  UNSPECIFIED: "unspecified"
};

export const EXPERIENCE_LABELS = {
  [EXPERIENCE_LEVELS.ENTRY]: "Fresh Graduate / Junior",
  [EXPERIENCE_LEVELS.MID]: "Mid-Level (2-5 thn)",
  [EXPERIENCE_LEVELS.SENIOR]: "Senior (5+ thn)",
  [EXPERIENCE_LEVELS.LEAD]: "Lead / Manager",
  [EXPERIENCE_LEVELS.UNSPECIFIED]: "Semua Pengalaman"
};

export const JOB_CATEGORIES = [
  "Teknologi",
  "Data",
  "Produk",
  "Desain",
  "Marketing",
  "Sales",
  "Customer Support",
  "Operasional",
  "Keuangan",
  "HR",
  "Lainnya"
];

const INDONESIA_KEYWORDS = [
  "indonesia", "jakarta", "bandung", "surabaya", "yogyakarta",
  "jogja", "bali", "denpasar", "semarang", "medan", "makassar",
  "tangerang", "bekasi", "depok", "bogor", "id"
];

const APAC_KEYWORDS = [
  "apac", "asia", "southeast asia", "asean", "singapore",
  "malaysia", "thailand", "vietnam", "philippines", "tokyo", "japan"
];

const ENTRY_KEYWORDS = [
  "junior", "entry", "fresh graduate", "freshgrad", "intern", "internship",
  "magang", "associate", "trainee", "0-1", "0-2"
];

const SENIOR_KEYWORDS = [
  "senior", "sr.", "sr ", "principal", "staff", "architect", "expert", "5+", "6+", "7+"
];

const LEAD_KEYWORDS = [
  "lead", "head of", "director", "manager", "vp", "chief", "team lead"
];

/**
 * Deteksi tingkat pengalaman berdasarkan judul dan teks deskripsi
 */
export function detectExperienceLevel(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();
  if (LEAD_KEYWORDS.some((kw) => text.includes(kw))) return EXPERIENCE_LEVELS.LEAD;
  if (SENIOR_KEYWORDS.some((kw) => text.includes(kw))) return EXPERIENCE_LEVELS.SENIOR;
  if (ENTRY_KEYWORDS.some((kw) => text.includes(kw))) return EXPERIENCE_LEVELS.ENTRY;
  if (text.includes("mid") || text.includes("2-3") || text.includes("3-5")) return EXPERIENCE_LEVELS.MID;
  return EXPERIENCE_LEVELS.UNSPECIFIED;
}

/**
 * Deteksi tier remote berdasarkan lokasi dan batasan geografis
 */
export function detectRemoteTier(location = "", restrictions = "") {
  const combined = `${location} ${restrictions}`.toLowerCase();
  if (INDONESIA_KEYWORDS.some((kw) => combined.includes(kw))) {
    return REMOTE_TIERS.INDONESIA;
  }
  if (APAC_KEYWORDS.some((kw) => combined.includes(kw))) {
    return REMOTE_TIERS.APAC;
  }
  if (
    combined.includes("anywhere") ||
    combined.includes("worldwide") ||
    combined.includes("global") ||
    combined.includes("remote") && !combined.includes("us only") && !combined.includes("eu only")
  ) {
    return REMOTE_TIERS.ANYWHERE;
  }
  return REMOTE_TIERS.INTERNATIONAL;
}

/**
 * Konversi HTML sederhana ke text polos untuk search indexing & ATS parsing
 */
export function stripHtml(html = "") {
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Menghasilkan slug URL yang bersih dan aman
 */
export function makeSlug(title = "", company = "", id = "") {
  const base = `${title}-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base ? `${base}-${id}` : String(id);
}

/**
 * Normalisasi gaji menjadi objek terstruktur
 */
export function normalizeSalary(rawSalary) {
  if (!rawSalary) {
    return { min: null, max: null, currency: null, period: "yearly", display: "Gaji tidak dicantumkan", isEstimate: false };
  }

  if (typeof rawSalary === "object" && rawSalary.min !== undefined) {
    return {
      min: Number(rawSalary.min) || null,
      max: Number(rawSalary.max) || null,
      currency: rawSalary.currency || "USD",
      period: rawSalary.period || "yearly",
      display: rawSalary.display || `${rawSalary.currency || "$"}${rawSalary.min || ""}`,
      isEstimate: Boolean(rawSalary.isEstimate)
    };
  }

  const str = String(rawSalary).trim();
  const isIdr = /idr|rp|juta|jt/i.test(str);
  const currency = isIdr ? "IDR" : (str.includes("€") ? "EUR" : (str.includes("£") ? "GBP" : "USD"));
  
  return {
    min: null,
    max: null,
    currency,
    period: isIdr ? "monthly" : "yearly",
    display: str,
    isEstimate: false
  };
}

/**
 * Fungsi Normalisasi Utama:
 * Mengubah objek raw dari provider apapun ke Unified Job Schema.
 */
export function normalizeJob(raw = {}, sourcePlatform = "manual") {
  const id = String(raw.id || raw.job_id || raw._id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const title = String(raw.title || raw.job_title || "Lowongan Tanpa Judul").trim();
  const company = String(raw.company || raw.company_name || "Perusahaan").trim();
  const location = String(raw.location || raw.candidate_required_location || "Remote").trim();
  const descriptionHtml = String(raw.description || raw.body || raw.descriptionHtml || "");
  const descriptionText = stripHtml(descriptionHtml);
  
  const remoteTier = raw.remoteTier || detectRemoteTier(location, raw.candidate_required_location);
  const experienceLevel = raw.experienceLevel || detectExperienceLevel(title, descriptionText);
  const workplaceType = raw.workplaceType || (location.toLowerCase().includes("hybrid") ? WORKPLACE_TYPES.HYBRID : WORKPLACE_TYPES.REMOTE);

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean)
    : (raw.category ? [String(raw.category)] : []);

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements.map((r) => String(r).trim()).filter(Boolean)
    : [];

  const postedAt = raw.postedAt || raw.publication_date || raw.published_at || raw.date || new Date().toISOString();

  return {
    id,
    slug: makeSlug(title, company, id),
    title,
    company,
    logo: raw.logo || raw.company_logo || raw.company_logo_url || null,
    location,
    workplaceType,
    remoteTier,
    experienceLevel,
    category: raw.category || "Teknologi",
    salary: normalizeSalary(raw.salary || raw.salary_min || raw.salary_max),
    tags,
    requirements,
    applyUrl: raw.applyUrl || raw.url || raw.apply_url || raw.job_url || "#",
    sourcePlatform: raw.sourcePlatform || sourcePlatform,
    postedAt: typeof postedAt === "string" ? postedAt : new Date(postedAt).toISOString(),
    descriptionHtml,
    descriptionText,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validasi apakah objek memenuhi standar Unified Job Schema
 */
export function validateJob(job) {
  const errors = [];
  if (!job.id) errors.push("id wajib diisi");
  if (!job.title) errors.push("title wajib diisi");
  if (!job.company) errors.push("company wajib diisi");
  if (!job.remoteTier) errors.push("remoteTier tidak valid");
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Konversi Job ke Schema.org JobPosting standar Google Jobs
 */
export function toJobPostingSchema(job) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.descriptionHtml || job.descriptionText || `${job.title} di ${job.company}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company,
      "value": String(job.id)
    },
    "datePosted": job.postedAt || new Date().toISOString(),
    "validThrough": new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "logo": job.logo || "https://jobsearch.id/assets/icons/icon-192.png"
    },
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "ID"
    },
    "directApply": true
  };

  if (job.salary && (job.salary.min || job.salary.max)) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": job.salary.currency || "IDR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salary.min || job.salary.max,
        "maxValue": job.salary.max || job.salary.min,
        "unitText": "MONTH"
      }
    };
  }

  return schema;
}

/**
 * Sisipkan JSON-LD JobPosting ke <head> dokumen
 */
export function injectJobPostingSchema(job) {
  if (typeof document === "undefined") return;
  let script = document.getElementById("schema-job-posting");
  if (!script) {
    script = document.createElement("script");
    script.id = "schema-job-posting";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(toJobPostingSchema(job));
}

