import {
  JOBS,
  makeLogo,
  rememberJobs
} from "./data.js?v=20260616z";
import { dbSaveJobs, dbGetAllJobs } from "./storage-db.js?v=20260616z";

const EXTERNAL_CACHE_KEY = "jsa_external_jobs_cache_v13";
try {
  ["jsa_external_jobs_v1", "jsa_external_jobs_v2", "jsa_external_jobs_v3", "jsa_external_jobs_cache_v10", "jsa_external_jobs_cache_v11", "jsa_external_jobs_cache_v12"].forEach((k) => localStorage.removeItem(k));
} catch (_) {}
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4000;
const FIELD_LABEL_PATTERN = "(?:Job\\s+Title|Title|Position|Location|Reports?\\s+To|Department|Employment\\s+Type|Workplace|Compensation|Salary)";
const ALL_PROVIDERS = ["remotive", "arbeitnow", "remoteok", "jobicy"];
export const INDONESIA_LOCATION_TERMS = [
  "indonesia",
  "jakarta",
  "bandung",
  "surabaya",
  "yogyakarta",
  "jogja",
  "bali",
  "denpasar",
  "semarang",
  "medan",
  "makassar",
  "tangerang",
  "bekasi",
  "depok",
  "bogor",
  "batam",
  "malang",
  "solo",
  "surakarta",
  "palembang",
  "balikpapan",
  "samarinda",
  "pekanbaru",
  "lampung",
  "cikarang",
  "karawang",
  "sidoarjo",
  "cimahi"
];

export const JOB_SOURCES = {
  indonesia: "Dari Indonesia",
  anywhere: "Remote-anywhere",
  apac: "Asia/APAC",
  international: "Remote Global"
};

export const PROVIDER_LABELS = {
  local_feed: "Loker Terverifikasi",
  linkedin: "LinkedIn",
  jobstreet: "JobStreet",
  indeed: "Indeed",
  remotive: "Remotive",
  arbeitnow: "Arbeitnow",
  remoteok: "Remote OK",
  jobicy: "Jobicy"
};

function repairMojibake(value = "") {
  const text = String(value || "");
  if (!/[\u00c3\u00c2\u00e2\u00f0][\u0080-\u00ff]?|[\u0080-\u009f]/.test(text)) return text;

  try {
    const decoded = text.replace(/[\u0000-\u00ff]+/g, (segment) => {
      if (!/[\u00c3\u00c2\u00e2\u00f0][\u0080-\u00ff]?|[\u0080-\u009f]/.test(segment)) return segment;
      const bytes = Uint8Array.from([...segment].map((char) => char.charCodeAt(0)));
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    });
    const badScore = (input) => (input.match(/[\ufffd\u00c3\u00c2\u00e2\u00f0]|[\u0080-\u009f]/g) || []).length;
    if (decoded && badScore(decoded) < badScore(text)) return decoded;
  } catch (error) {
    console.warn("Gagal memperbaiki encoding teks lowongan", error);
  }

  return text
    .replace(/\u00e2\u0080\u0099/g, "'")
    .replace(/\u00e2\u0080\u0098/g, "'")
    .replace(/\u00e2\u0080\u009c|\u00e2\u0080\u009d/g, '"')
    .replace(/\u00e2\u0080\u00a6/g, "...")
    .replace(/\u00e2\u0080\u0093|\u00e2\u0080\u0094/g, "-")
    .replace(/\u00c2 /g, " ")
    .replace(/\u00c2/g, "");
}

function stripHtml(value = "") {
  const template = document.createElement("template");
  template.innerHTML = repairMojibake(value);
  return repairMojibake(template.content.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTitle(value = "") {
  return repairMojibake(value || "Untitled role")
    .replace(/\s+read\s+description\s+before/gi, "")
    .replace(/\s+befristet\s+\d+\s+monate?/gi, "")
    .replace(/\s*\((?:m\/f\/d|m\/w\/d|f\/m\/d|all genders|ref\.?nr\.?:?[^)]*)\)/gi, "")
    .replace(/\s+-\s*(?:m\/f\/d|m\/w\/d|f\/m\/d|all genders)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function narrativeAnchorIndex(text, company = "") {
  const candidates = [];
  const lower = text.toLowerCase();
  const companyLower = company.toLowerCase().trim();

  if (companyLower.length > 2) {
    const companyIndex = lower.indexOf(companyLower);
    if (companyIndex > 0) candidates.push(companyIndex);
  }

  [
    "about the role",
    "about this role",
    "about us",
    "we are",
    "we're",
    "we ",
    "join "
  ].forEach((marker) => {
    const index = lower.indexOf(marker);
    if (index > 0) candidates.push(index);
  });

  return candidates.length ? Math.min(...candidates) : -1;
}

function removeLeadingProviderFields(value, context = {}) {
  let text = value.trim();
  const labelRegex = new RegExp(`^${FIELD_LABEL_PATTERN}:\\s*`, "i");
  const nextLabelRegex = new RegExp(`\\s${FIELD_LABEL_PATTERN}:\\s*`, "i");

  for (let index = 0; index < 8; index += 1) {
    const match = text.match(labelRegex);
    if (!match) break;

    const label = match[0].replace(/:\s*$/, "").trim().toLowerCase();
    const rest = text.slice(match[0].length).trim();
    const nextLabelIndex = rest.search(nextLabelRegex);

    if (nextLabelIndex >= 0) {
      text = rest.slice(nextLabelIndex).trim();
      continue;
    }

    if (/title|position/.test(label) && context.title) {
      const stripped = rest
        .replace(new RegExp(`^${escapeRegExp(context.title)}\\b[\\s,.:;\\-–—]*`, "i"), "")
        .trim();
      if (stripped !== rest) {
        text = stripped;
        continue;
      }
    }

    if (/location|reports? to|department|employment|workplace|compensation|salary/.test(label)) {
      const anchor = narrativeAnchorIndex(rest, context.company);
      if (anchor > 0) {
        text = rest.slice(anchor).trim();
        continue;
      }
    }

    break;
  }

  return text.replace(/^(?:[-–—•]\s*)+/, "").trim();
}

function cleanDescription(value = "", context = {}) {
  const fallback = `${context.company || "Perusahaan ini"} membuka posisi ${context.title || "remote"}. Buka tautan resmi untuk membaca detail lengkap dan instruksi apply.`;
  const raw = stripHtml(value)
    .replace(/^posted\s+[^.]+\.?\s*/i, "")
    .replace(/\bsee this and similar jobs on linkedin\.?/gi, "")
    .replace(new RegExp(`(${FIELD_LABEL_PATTERN}):`, "gi"), " $1:")
    .trim();
  const text = removeLeadingProviderFields(raw, context)
    .replace(/^(?:job\s+description|description|about\s+the\s+role):\s*/i, "")
    .replace(/^job\s+title\s+/i, "")
    .replace(/\bFind more\b.*$/i, "")
    .replace(/\bPlease mention the word\b.*$/i, "")
    .replace(/\bWhen applying for this position\b.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.;:\s-]+/, "")
    .replace(/^([a-z])/, (match) => match.toUpperCase())
    .trim();

  if (!text || new RegExp(`^${FIELD_LABEL_PATTERN}:`, "i").test(text) || /similar jobs on linkedin/i.test(text)) {
    return fallback;
  }

  return text;
}

function cleanSalaryLabel(value = "") {
  const text = String(value || "")
    .replace(/(\$\d+),(\d+k)/gi, "$1.$2")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text || "Gaji belum tersedia";
}

function cleanLocation(value = "", fallback = "Remote") {
  const text = stripHtml(value || fallback)
    .replace(/^anywhere\s+in\s+/i, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text || fallback;
}

function formatUsdSalary(min, max) {
  const minValue = Number(min || 0);
  const maxValue = Number(max || 0);
  const format = (value) => {
    if (value >= 1000) return `$${Math.round(value / 1000)}k`;
    return `$${value.toLocaleString("en-US")}`;
  };

  if (minValue && maxValue) return `${format(minValue)} - ${format(maxValue)} / tahun`;
  if (minValue) return `Mulai ${format(minValue)} / tahun`;
  if (maxValue) return `Hingga ${format(maxValue)} / tahun`;
  return "Gaji belum tersedia";
}

function formatCurrencySalary(min, max, currency = "USD", period = "yearly") {
  const minValue = Number(min || 0);
  const maxValue = Number(max || 0);
  if (!minValue && !maxValue) return "Gaji belum tersedia";

  const symbol = currency === "USD" ? "$" : `${currency} `;
  const periodLabel = period === "monthly" ? "bulan" : period === "hourly" ? "jam" : "tahun";
  const format = (value) => value >= 1000
    ? `${symbol}${Math.round(value / 1000)}k`
    : `${symbol}${value.toLocaleString("en-US")}`;

  if (minValue && maxValue) return `${format(minValue)} - ${format(maxValue)} / ${periodLabel}`;
  if (minValue) return `Mulai ${format(minValue)} / ${periodLabel}`;
  return `Hingga ${format(maxValue)} / ${periodLabel}`;
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === "number") return new Date(value * 1000).toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function titleCase(value = "") {
  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function cleanType(value) {
  const normalized = titleCase(value || "Full-time");
  if (normalized.toLowerCase().includes("full")) return "Full-time";
  if (normalized.toLowerCase().includes("part")) return "Part-time";
  if (normalized.toLowerCase().includes("contract") || normalized.toLowerCase().includes("freelance")) return "Contract";
  if (normalized.toLowerCase().includes("intern")) return "Internship";
  if (normalized.toLowerCase().includes("remote")) return "Remote";
  if (normalized.toLowerCase().includes("onsite") || normalized.toLowerCase().includes("on site")) return "On-site";
  return "";
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function includesAny(value = "", words = []) {
  const text = String(value).toLowerCase();
  return words.some((word) => text.includes(word));
}

function isPureRemote(location = "") {
  const normalized = String(location).toLowerCase().replace(/\s+/g, " ").trim();
  return normalized === "remote" || normalized === "remote,";
}

export function isIndonesiaScope(job) {
  const location = String(job.location || "").toLowerCase();
  const platform = String(job.sourcePlatform || job.source?.name || "").toLowerCase();
  if (platform.includes("linkedin") || platform.includes("jobstreet") || platform.includes("indeed")) {
    return true;
  }
  if (job.remoteTier === "indonesia" || (job.type || []).includes("Dari Indonesia") || (job.tags || []).includes("Indonesia") || (job.tags || []).includes("Lokal Indonesia")) {
    return true;
  }
  return INDONESIA_LOCATION_TERMS.some((term) => location.includes(term)) || isPureRemote(location);
}

function isRemoteAnywhereScope(job) {
  const location = String(job.location || "").toLowerCase();
  const anywhereEligible = [
    "worldwide",
    "anywhere",
    "global"
  ];

  return includesAny(location, anywhereEligible);
}

function isApacScope(job) {
  const location = String(job.location || "").toLowerCase();
  const apacEligible = [
    "apac",
    "asia",
    "asia-pacific",
    "asean",
    "southeast asia",
    "south east asia",
    "indonesia",
    "singapore",
    "malaysia",
    "philippines",
    "thailand",
    "vietnam",
    "japan",
    "korea",
    "india",
    "taiwan",
    "hong kong",
    "australia",
    "new zealand"
  ];

  return includesAny(location, apacEligible);
}

export function matchesScope(job, scope) {
  if (scope === "indonesia") return isIndonesiaScope(job);
  if (scope === "anywhere") return isRemoteAnywhereScope(job);
  if (scope === "apac") return isApacScope(job);
  return true;
}

function readExternalCache(source) {
  try {
    const raw = localStorage.getItem(EXTERNAL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const entry = parsed[source];
    if (!entry || Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return Array.isArray(entry.jobs) ? entry.jobs : null;
  } catch (error) {
    console.warn("Gagal membaca cache API lowongan", error);
    return null;
  }
}

function writeExternalCache(source, jobs) {
  try {
    const raw = localStorage.getItem(EXTERNAL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[source] = {
      timestamp: Date.now(),
      jobs
    };
    localStorage.setItem(EXTERNAL_CACHE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.warn("Gagal menyimpan cache API lowongan", error);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function sourceMeta(source, name, url) {
  return {
    key: source,
    name,
    url
  };
}

function mapRemotiveJob(job) {
  const title = cleanTitle(job.title);
  const company = job.company_name || "Unknown company";
  const location = cleanLocation(job.candidate_required_location, "Worldwide");
  const description = cleanDescription(job.description, { title, company });
  const salaryLabel = cleanSalaryLabel(job.salary);

  return {
    id: `remotive_${job.id}`,
    title,
    company,
    logo: job.company_logo || job.company_logo_url || makeLogo(company),
    location,
    type: uniq([cleanType(job.job_type), "Remote"]),
    category: job.category || "Remote",
    salary: { min: 0, max: 0, label: salaryLabel },
    posted: toIsoDate(job.publication_date),
    description,
    requirements: uniq([
      ...(job.tags || []).slice(0, 6).map((tag) => `Skill atau konteks: ${tag}`),
      location ? `Lokasi kandidat: ${location}` : ""
    ]),
    about_company: `${company} membuka lowongan remote melalui Remotive. Buka tautan sumber untuk detail resmi dan instruksi apply.`,
    tags: job.tags || [],
    applyUrl: job.url,
    source: sourceMeta("remotive", "Remotive", job.url)
  };
}

function mapArbeitnowJob(job) {
  const title = cleanTitle(job.title);
  const company = job.company_name || "Unknown company";
  const remote = Boolean(job.remote);
  const jobTypes = Array.isArray(job.job_types) ? job.job_types.map(cleanType) : [];
  const location = cleanLocation(job.location, remote ? "Remote" : "Germany");
  const description = cleanDescription(job.description, { title, company });

  return {
    id: `arbeitnow_${job.slug}`,
    title,
    company,
    logo: makeLogo(company, "0F766E"),
    location,
    type: uniq([...jobTypes, remote ? "Remote" : "On-site"]),
    category: job.tags?.[0] || "Germany",
    salary: { min: 0, max: 0, label: "Gaji belum tersedia" },
    posted: toIsoDate(job.created_at),
    description,
    requirements: uniq([
      ...(job.tags || []).slice(0, 6).map((tag) => `Kategori: ${tag}`),
      ...(jobTypes || []).slice(0, 4).map((type) => `Tipe: ${type}`)
    ]),
    about_company: `${company} memasang lowongan melalui Arbeitnow. Buka tautan sumber untuk detail resmi dan instruksi apply.`,
    tags: job.tags || [],
    applyUrl: job.url,
    source: sourceMeta("arbeitnow", "Arbeitnow", job.url)
  };
}

function mapRemoteOkJob(job) {
  const title = cleanTitle(job.position);
  const company = job.company || "Unknown company";
  const description = cleanDescription(job.description, { title, company });
  const salaryLabel = formatUsdSalary(job.salary_min, job.salary_max);

  return {
    id: `remoteok_${job.id}`,
    title,
    company,
    logo: job.company_logo || job.logo || makeLogo(company, "4338CA"),
    location: cleanLocation(job.location, "Remote"),
    type: uniq(["Remote", ...(job.tags || []).filter((tag) => /full|part|contract|freelance/i.test(tag)).map(cleanType)]),
    category: job.tags?.find((tag) => !/full|part|contract|freelance|remote/i.test(tag)) || "Remote",
    salary: { min: 0, max: 0, label: salaryLabel },
    posted: toIsoDate(job.date || job.epoch),
    description,
    requirements: uniq((job.tags || []).slice(0, 8).map((tag) => `Tag: ${tag}`)),
    about_company: `${company} membuka lowongan remote melalui Remote OK. Buka tautan sumber untuk detail resmi dan instruksi apply.`,
    tags: job.tags || [],
    applyUrl: job.apply_url || job.url,
    source: sourceMeta("remoteok", "Remote OK", job.url || job.apply_url)
  };
}

function mapJobicyJob(job) {
  const title = cleanTitle(job.jobTitle);
  const company = job.companyName || "Unknown company";
  const location = cleanLocation(job.jobGeo, "Remote");
  const description = cleanDescription(job.jobDescription || job.jobExcerpt, { title, company });
  const jobTypes = Array.isArray(job.jobType) ? job.jobType.map(cleanType) : [];
  const industries = Array.isArray(job.jobIndustry) ? job.jobIndustry.map(stripHtml) : [];
  const salaryLabel = formatCurrencySalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);

  return {
    id: `jobicy_${job.id}`,
    title,
    company,
    logo: job.companyLogo || makeLogo(company, "2563EB"),
    location,
    type: uniq([...jobTypes, "Remote"]),
    category: industries[0] || "Remote",
    salary: { min: 0, max: 0, label: salaryLabel },
    posted: toIsoDate(job.pubDate),
    description,
    requirements: uniq([
      job.jobLevel ? `Level: ${job.jobLevel}` : "",
      location ? `Lokasi kandidat: ${location}` : "",
      ...industries.slice(0, 4).map((industry) => `Kategori: ${industry}`)
    ]),
    about_company: `${company} memasang lowongan remote melalui Jobicy. Buka tautan sumber untuk detail resmi dan instruksi apply.`,
    tags: uniq([...(job.jobLevel ? [job.jobLevel] : []), ...industries]),
    applyUrl: job.url,
    source: sourceMeta("jobicy", "Jobicy", job.url)
  };
}

async function fetchRemotiveJobs() {
  const cached = readExternalCache("remotive");
  if (cached) return { jobs: cached, fromCache: true };

  const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=50");
  const jobs = (data.jobs || []).map(mapRemotiveJob);
  writeExternalCache("remotive", jobs);
  return { jobs, fromCache: false };
}

async function fetchArbeitnowJobs() {
  const cached = readExternalCache("arbeitnow");
  if (cached) return { jobs: cached, fromCache: true };

  const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api?page=1");
  const jobs = (data.data || []).slice(0, 60).map(mapArbeitnowJob);
  writeExternalCache("arbeitnow", jobs);
  return { jobs, fromCache: false };
}

async function fetchRemoteOkJobs() {
  const cached = readExternalCache("remoteok");
  if (cached) return { jobs: cached, fromCache: true };

  const data = await fetchJson("https://remoteok.com/api");
  const jobs = (Array.isArray(data) ? data : [])
    .filter((item) => item?.id && item?.position)
    .slice(0, 60)
    .map(mapRemoteOkJob);
  writeExternalCache("remoteok", jobs);
  return { jobs, fromCache: false };
}

async function fetchJobicyJobs(geo = "") {
  const cacheKey = geo ? `jobicy_${geo}` : "jobicy";
  const cached = readExternalCache(cacheKey);
  if (cached) return { jobs: cached, fromCache: true };

  const query = new URLSearchParams({ count: "50" });
  if (geo) query.set("geo", geo);
  const data = await fetchJson(`https://jobicy.com/api/v2/remote-jobs?${query}`);
  const jobs = (data.jobs || []).map(mapJobicyJob);
  writeExternalCache(cacheKey, jobs);
  return { jobs, fromCache: false };
}

async function fetchLocalFeedJobs() {
  const cached = readExternalCache("local_feed");
  if (cached && cached.length > 0) {
    // Revalidasi di latar belakang tanpa memblokir render
    fetchFreshLocalFeed().catch(() => {});
    return { jobs: cached, fromCache: true };
  }
  return fetchFreshLocalFeed();
}

async function fetchFreshLocalFeed() {
  try {
    const isPages = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
    const primaryUrl = isPages ? "../data/jobs.json" : "data/jobs.json";
    const fallbackUrl = isPages ? "data/jobs.json" : "../data/jobs.json";

    let res = await fetch(primaryUrl).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(fallbackUrl).catch(() => null);
    }
    if (!res || !res.ok) {
      const cached = readExternalCache("local_feed");
      if (cached && cached.length) return { jobs: cached, fromCache: true };
      return { jobs: [], fromCache: false };
    }

    const data = await res.json();
    const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
    const jobs = rawJobs.map((j) => {
      const isRemote = j.workplaceType === "remote" || (j.location && j.location.toLowerCase().includes("remote"));
      const isHybrid = j.workplaceType === "hybrid" || (j.location && j.location.toLowerCase().includes("hybrid"));
      const wpLabel = isRemote ? "Remote" : (isHybrid ? "Hybrid" : "On-site");
      const isId = j.remoteTier === "indonesia" || isIndonesiaScope(j);
      const rawDescText = String(j.descriptionText || "").trim();
      const rawDescHtml = String(j.descriptionHtml || "").trim();
      const fallbackDesc = `Perusahaan ${j.company} membuka lowongan resmi untuk posisi ${j.title} di ${j.location}. Kunjungi tautan resmi ${j.sourcePlatform || 'portal rekrutmen'} untuk membaca kualifikasi lengkap dan melamar langsung.`;

      const safeDescText = (rawDescText && rawDescText.toLowerCase() !== "nan" && rawDescText.toLowerCase() !== "null")
        ? rawDescText
        : fallbackDesc;
      const safeDescHtml = (rawDescHtml && rawDescHtml.toLowerCase() !== "nan" && rawDescHtml.toLowerCase() !== "<p>nan</p>" && rawDescHtml.toLowerCase() !== "null")
        ? rawDescHtml
        : `<p>${safeDescText}</p>`;

      return {
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: {
          min: isNaN(Number(j.salary?.min)) ? 0 : Number(j.salary?.min || 0),
          max: isNaN(Number(j.salary?.max)) ? 0 : Number(j.salary?.max || 0),
          label: (j.salary?.display && String(j.salary.display).toUpperCase() !== "NAN") ? j.salary.display : "Gaji kompetitif",
          currency: (j.salary?.currency && String(j.salary.currency).toUpperCase() !== "NAN") ? j.salary.currency : "IDR",
          period: j.salary?.period || "monthly"
        },
        type: [
          wpLabel,
          isId ? "Dari Indonesia" : (j.remoteTier === "apac" ? "Asia/APAC" : "Remote Global")
        ].filter(Boolean),
        category: j.category || "Teknologi",
        posted: j.postedAt || new Date().toISOString(),
        date: j.postedAt || new Date().toISOString(),
        logo: j.logo || makeLogo(j.company),
        applyUrl: j.applyUrl,
        sourcePlatform: j.sourcePlatform || "JobStreet",
        source: {
          key: (j.sourcePlatform || "feed").toLowerCase(),
          name: j.sourcePlatform || "Portal Resmi",
          url: j.applyUrl
        },
        description: safeDescText,
        descriptionHtml: safeDescHtml,
        requirements: j.requirements && j.requirements.length ? j.requirements : [
          `Pengalaman relevan dalam bidang ${j.category || 'terkait'}.`,
          `Menguasai keahlian teknis dan komunikasi profesional.`,
          `Mampu berkolaborasi dalam tim secara mandiri dan berorientasi hasil.`
        ],
        about_company: `${j.company} adalah perusahaan terkemuka yang membuka lowongan ini secara resmi melalui ${j.sourcePlatform || 'portal rekrutmen'}.`,
        tags: [
          ...(j.tags || []),
          j.sourcePlatform || "Verified",
          j.category || "Teknologi",
          wpLabel,
          isId ? "Indonesia" : "",
          isId ? "Lokal Indonesia" : ""
        ].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx),
        remoteTier: j.remoteTier || "indonesia",
        workplaceType: j.workplaceType || (isRemote ? "remote" : (isHybrid ? "hybrid" : "onsite")),
        experienceLevel: j.experienceLevel || "mid"
      };
    });

    writeExternalCache("local_feed", jobs);
    return { jobs, fromCache: false };
  } catch (e) {
    const cached = readExternalCache("local_feed");
    if (cached && cached.length) return { jobs: cached, fromCache: true };
    return { jobs: [], fromCache: false };
  }
}

async function fetchProvider(provider, source) {
  if (provider === "local_feed") return fetchLocalFeedJobs();
  if (provider === "remotive") return fetchRemotiveJobs();
  if (provider === "arbeitnow") return fetchArbeitnowJobs();
  if (provider === "remoteok") return fetchRemoteOkJobs();
  if (provider === "jobicy") return fetchJobicyJobs(source === "apac" ? "apac" : "");
  throw new Error(`Provider lowongan tidak dikenal: ${provider}`);
}

function uniqueJobs(jobs) {
  const byId = new Map();
  jobs.forEach((job) => {
    if (job?.id) byId.set(job.id, job);
  });
  return [...byId.values()];
}

function fallbackJobsForSource(source) {
  if (source === "indonesia" || source === "apac") return JOBS;
  if (source === "anywhere") return JOBS.filter((job) => (job.type || []).includes("Remote"));
  if (source === "international") return JOBS;
  return JOBS.filter((job) => matchesScope(job, source));
}

export async function loadJobsForSource(source = "international") {
  const providers = source === "indonesia"
    ? ["local_feed"]
    : (source === "apac" ? ["local_feed", "jobicy"] : ["local_feed", ...ALL_PROVIDERS]);

  const settled = await Promise.allSettled(providers.map((provider) => fetchProvider(provider, source)));
  const loadedJobs = uniqueJobs(settled.flatMap((result) => result.status === "fulfilled" ? result.value.jobs : []));
  let jobs = loadedJobs.filter((job) => matchesScope(job, source));
  const usedFallback = jobs.length === 0;
  if (usedFallback) jobs = fallbackJobsForSource(source);
  const failures = settled
    .map((result, index) => result.status === "rejected" ? providers[index] : null)
    .filter(Boolean);

  rememberJobs(jobs);
  dbSaveJobs(jobs).catch(() => {});
  return {
    jobs,
    failures,
    fromCache: settled.every((result) => result.status === "fulfilled" && result.value.fromCache),
    fallback: usedFallback
  };
}

export async function fetchJobById(id) {
  if (!id) return null;

  // 1. Cek dari memori data.js
  const cachedJob = getJobById(id);
  if (cachedJob) return cachedJob;

  // 2. Cek dari local verified feed (LinkedIn, JobStreet, Indeed, dll.)
  try {
    const feed = await fetchLocalFeedJobs();
    if (feed && feed.jobs) {
      const match = feed.jobs.find((j) => j.id === id);
      if (match) {
        rememberJobs([match]);
        return match;
      }
    }
  } catch (err) {
    console.warn("Gagal lookup job dari feed:", err);
  }

  // 3. Fallback ke external API provider
  const source = id.startsWith("remotive_")
    ? "remotive"
    : id.startsWith("arbeitnow_")
      ? "arbeitnow"
      : id.startsWith("remoteok_")
        ? "remoteok"
        : id.startsWith("jobicy_")
          ? "jobicy"
          : null;

  if (!source) return null;

  if (source === "jobicy") {
    const settled = await Promise.allSettled([fetchJobicyJobs(), fetchJobicyJobs("apac")]);
    const jobs = uniqueJobs(settled.flatMap((result) => result.status === "fulfilled" ? result.value.jobs : []));
    rememberJobs(jobs);
    return jobs.find((job) => job.id === id) || null;
  }

  const { jobs } = await fetchProvider(source);
  rememberJobs(jobs);
  return jobs.find((job) => job.id === id) || null;
}
