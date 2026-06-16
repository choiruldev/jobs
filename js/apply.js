import {
  formatDateLong,
  formatSalary,
  getJobById,
  makeLogo,
  rememberJobs
} from "./data.js?v=20260616x";
import {
  escapeHtml,
  showSnackbar
} from "./bookmark.js?v=20260616x";
import { fetchJobById } from "./providers.js?v=20260616x";
import { recordPageView, trackEvent } from "./analytics.js?v=20260616x";

const APPLICATION_KEY = "jsa_applications";
const MAX_CV_SIZE = 5 * 1024 * 1024;
const STATUS_STEPS = [
  { key: "Saved", label: "Disimpan" },
  { key: "Applied", label: "Dilamar" },
  { key: "Interview", label: "Interview" },
  { key: "Offer", label: "Offering" },
  { key: "Accepted", label: "Diterima" },
  { key: "FollowUp", label: "Follow up" },
  { key: "Rejected", label: "Ditolak" }
];
const STATUS_LABELS = Object.fromEntries(STATUS_STEPS.map((step) => [step.key, step.label]));
const VALID_STATUS_KEYS = new Set(STATUS_STEPS.map((step) => step.key));
const PROGRESS_STATUS_ORDER = ["Saved", "Applied", "Interview", "Offer", "Accepted"];
const PROGRESS_STEPS = PROGRESS_STATUS_ORDER.map((key) => STATUS_STEPS.find((step) => step.key === key));
const FOLLOW_UP_STEP = STATUS_STEPS.find((step) => step.key === "FollowUp");
const REJECTED_STEP = STATUS_STEPS.find((step) => step.key === "Rejected");
const STATUS_SELECT_GROUPS = [
  { label: "Tahap", keys: ["Saved", "Applied", "Interview", "Offer"] },
  { label: "Hasil", keys: ["Accepted", "Rejected"] },
  { label: "Aksi", keys: ["FollowUp"] }
];
const CATEGORY_OPTIONS = [
  "Teknologi",
  "Data",
  "Produk",
  "Marketing",
  "Sales",
  "Desain",
  "Keuangan",
  "Operasional",
  "HR",
  "Customer Support",
  "Lainnya"
];
const URL_WORD_BLOCKLIST = new Set([
  "apply",
  "boards",
  "career",
  "careers",
  "detail",
  "greenhouse",
  "job",
  "jobs",
  "jobdetail",
  "lowongan",
  "opening",
  "openings",
  "position",
  "positions",
  "remote",
  "view",
  "work"
]);

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const phoneRegex = /^08\d{8,11}$/;

function readApplications() {
  try {
    const raw = localStorage.getItem(APPLICATION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([jobId, application]) => [jobId, normalizeApplication(application)])
    );
  } catch (error) {
    console.warn("Gagal membaca lamaran", error);
    return {};
  }
}

function writeApplications(applications) {
  try {
    localStorage.setItem(APPLICATION_KEY, JSON.stringify(applications));
    return true;
  } catch (error) {
    console.warn("Gagal menyimpan lamaran", error);
    return false;
  }
}

function getApplication(jobId) {
  return readApplications()[jobId] || null;
}

function normalizeApplication(application = {}) {
  const rawStatus = application.status === "Review" ? "Applied" : application.status || "Applied";
  const status = VALID_STATUS_KEYS.has(rawStatus) ? rawStatus : "Applied";
  const progressBaseStatus = progressIndex(application.progressBaseStatus) >= 0
    ? application.progressBaseStatus
    : "";
  return {
    ...application,
    status,
    progressBaseStatus,
    history: Array.isArray(application.history) ? application.history : [],
    candidate: application.candidate || {},
    followUpAt: application.followUpAt || "",
    note: application.note || ""
  };
}

function saveApplication(application) {
  const applications = readApplications();
  applications[application.jobId] = normalizeApplication(application);
  writeApplications(applications);
  return applications[application.jobId];
}

function deleteApplication(jobId) {
  const applications = readApplications();
  delete applications[jobId];
  writeApplications(applications);
}

function createTrackedApplication(job, status = "Applied", extra = {}) {
  const now = new Date().toISOString();
  return saveApplication({
    jobId: job.id,
    status,
    submittedAt: extra.submittedAt || now,
    candidate: extra.candidate || {},
    followUpAt: extra.followUpAt || "",
    note: extra.note || "",
    progressBaseStatus: progressIndex(status) >= 0 ? status : "",
    history: [
      { date: now, status, label: extra.label || `Status dibuat: ${STATUS_LABELS[status] || status}` }
    ]
  });
}

function normalizeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_+]+/g, " ")
    .replace(/[-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (["ai", "api", "bi", "ceo", "cto", "css", "hr", "ios", "it", "qa", "sql", "ui", "ux"].includes(lower)) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function readableDomain(hostname) {
  const clean = hostname
    .replace(/^www\./, "")
    .replace(/^jobs\./, "")
    .replace(/^careers\./, "");
  const base = clean.split(".")[0] || clean;
  return titleCase(base);
}

function pathSegments(url) {
  return url.pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean);
}

function readableSegment(segment) {
  return titleCase(
    String(segment || "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/\b\d{4,}\b/g, " ")
      .replace(/[^\w\s+-]/g, " ")
  );
}

function relevantPathSegments(url) {
  return pathSegments(url)
    .map((segment) => segment.replace(/\?.*$/, ""))
    .filter((segment) => {
      const normalized = segment.toLowerCase().replace(/[^a-z0-9]+/g, "");
      return normalized.length >= 3
        && !/^\d+$/.test(normalized)
        && !URL_WORD_BLOCKLIST.has(normalized);
    });
}

function inferCompany(url) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = pathSegments(url);
  const firstSegment = readableSegment(segments[0] || "");

  if (host === "jobs.lever.co" && firstSegment) return firstSegment;
  if (host.endsWith("greenhouse.io") && firstSegment) return firstSegment;
  if (host.includes("ashbyhq.com") && firstSegment) return firstSegment;
  if (host.includes("workable.com") && firstSegment && firstSegment.toLowerCase() !== "jobs") return firstSegment;
  if (host.includes("bamboohr.com")) return readableDomain(host.replace(".bamboohr.com", ""));

  return readableDomain(host);
}

function inferTitle(url) {
  const segments = relevantPathSegments(url);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "jobs.lever.co" && segments[1]) return readableSegment(segments[1]);
  if (host.includes("remoteok.com")) {
    const remoteSegment = segments.find((segment) => /remote/i.test(segment)) || segments[segments.length - 1];
    return readableSegment(remoteSegment?.replace(/^remote[-_\s]*/i, "").replace(/[-_\s]*jobs?$/i, ""));
  }

  return readableSegment(segments[segments.length - 1] || "") || "Judul pekerjaan";
}

function inferCategory(title) {
  const text = String(title || "").toLowerCase();
  if (/(developer|engineer|frontend|backend|fullstack|software|mobile|ios|android|devops|qa|programmer|web)/.test(text)) return "Teknologi";
  if (/(data|analyst|analytics|bi|business intelligence|scientist|sql)/.test(text)) return "Data";
  if (/(product manager|product owner|scrum|project manager|business analyst)/.test(text)) return "Produk";
  if (/(marketing|seo|content|growth|campaign|social media|copywriter)/.test(text)) return "Marketing";
  if (/(sales|account executive|business development|partnership)/.test(text)) return "Sales";
  if (/(designer|design|ui|ux|creative|visual)/.test(text)) return "Desain";
  if (/(finance|accounting|tax|payroll|auditor)/.test(text)) return "Keuangan";
  if (/(operation|operations|admin|coordinator|assistant|virtual assistant)/.test(text)) return "Operasional";
  if (/(hr|recruiter|talent|people|human resource)/.test(text)) return "HR";
  if (/(customer|support|success|service)/.test(text)) return "Customer Support";
  return "Lainnya";
}

function inferWorkTypes(url, title) {
  const text = `${url.href} ${title}`.toLowerCase();
  const types = [];
  if (/remote|work-from-home|wfh|work from home/.test(text)) types.push("Remote");
  if (/part-time|part time|freelance/.test(text)) types.push("Part-time");
  if (/contract|kontrak/.test(text)) types.push("Contract");
  if (!types.length) types.push("Full-time");
  return types;
}

function inferManualJob(urlValue) {
  const url = normalizeExternalUrl(urlValue);
  if (!url) return null;
  const title = inferTitle(url);
  const company = inferCompany(url);
  return {
    url: url.href,
    sourceName: readableDomain(url.hostname),
    title,
    company,
    category: inferCategory(title),
    type: inferWorkTypes(url, title)
  };
}

function buildManualJob({ url, title, company, category }) {
  const parsed = normalizeExternalUrl(url);
  const safeUrl = parsed?.href || url;
  const safeTitle = titleCase(title) || "Judul pekerjaan";
  const safeCompany = titleCase(company) || (parsed ? inferCompany(parsed) : "Perusahaan");
  const safeCategory = CATEGORY_OPTIONS.includes(category) ? category : inferCategory(safeTitle);
  const sourceName = parsed ? readableDomain(parsed.hostname) : "Link eksternal";

  return {
    id: `manual_${hashString(safeUrl)}`,
    title: safeTitle,
    company: safeCompany,
    logo: makeLogo(safeCompany, "0F766E"),
    location: "Link eksternal",
    type: parsed ? inferWorkTypes(parsed, safeTitle) : ["Full-time"],
    category: safeCategory,
    salary: { label: "Gaji belum tersedia" },
    posted: new Date().toISOString().slice(0, 10),
    description: `Tracker manual dari link lowongan resmi ${sourceName}. Buka detail pekerjaan untuk membaca informasi lengkap di sumber asli.`,
    requirements: [
      "Baca detail dan persyaratan lengkap di link lowongan resmi.",
      "Catat status di tracker setelah apply atau follow up."
    ],
    about_company: `Informasi perusahaan mengikuti sumber lowongan ${sourceName}.`,
    tags: [safeCategory, sourceName],
    applyUrl: safeUrl,
    source: {
      key: "manual",
      name: sourceName,
      url: safeUrl
    },
    manual: true
  };
}

function renderDetailAction(job) {
  const externalUrl = job.applyUrl || job.source?.url;
  if (externalUrl) {
    return `
      <a class="button button--text tracker-open-action" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener">
        <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        Open
      </a>
    `;
  }

  return `
    <a class="button button--text tracker-open-action" href="detail.html?id=${encodeURIComponent(job.id)}">
      <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
      Open
    </a>
  `;
}

function renderTrackerTitleLink(job) {
  const externalUrl = job.applyUrl || job.source?.url;
  const href = externalUrl || `detail.html?id=${encodeURIComponent(job.id)}`;
  const attrs = externalUrl ? ` target="_blank" rel="noopener"` : "";
  return `<a class="tracker-job-title-link" href="${escapeHtml(href)}"${attrs}>${escapeHtml(job.title)}</a>`;
}

function typeLabel(job) {
  return Array.isArray(job.type) ? job.type.join(", ") : String(job.type || "");
}

function salaryLabel(job) {
  if (job.salary?.label) return job.salary.label;
  return formatSalary(job.salary);
}

function parseTypeInput(value) {
  const types = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return types.length ? types : ["Full-time"];
}

function renderCategoryOptions(currentCategory) {
  const categories = CATEGORY_OPTIONS.includes(currentCategory)
    ? CATEGORY_OPTIONS
    : [currentCategory, ...CATEGORY_OPTIONS].filter(Boolean);
  return [...new Set(categories)].map((category) => (
    `<option value="${escapeHtml(category)}"${category === currentCategory ? " selected" : ""}>${escapeHtml(category)}</option>`
  )).join("");
}

function renderJobDataForm(job) {
  const detailUrl = job.applyUrl || job.source?.url || "";
  return `
    <section class="job-data-editor" id="job-data-editor" aria-label="Edit data lowongan" hidden>
      <form class="job-data-form" id="job-data-form">
        <label class="compact-field compact-field--full">
          Link detail pekerjaan
          <input name="jobUrl" type="url" inputmode="url" value="${escapeHtml(detailUrl)}" placeholder="https://...">
        </label>
        <label class="compact-field">
          Judul pekerjaan
          <input name="title" type="text" value="${escapeHtml(job.title || "")}" required>
        </label>
        <label class="compact-field">
          Nama perusahaan
          <input name="company" type="text" value="${escapeHtml(job.company || "")}" required>
        </label>
        <label class="compact-field">
          Jenis pekerjaan
          <select name="category">
            ${renderCategoryOptions(job.category || "Lainnya")}
          </select>
        </label>
        <label class="compact-field">
          Lokasi
          <input name="location" type="text" value="${escapeHtml(job.location || "")}">
        </label>
        <label class="compact-field">
          Tipe kerja
          <input name="type" type="text" value="${escapeHtml(typeLabel(job))}" placeholder="Full-time, Remote">
        </label>
        <label class="compact-field">
          Gaji
          <input name="salary" type="text" value="${escapeHtml(salaryLabel(job))}">
        </label>
        <div class="job-data-form__actions">
          <button class="button button--tonal" type="submit">
            <span class="material-symbols-outlined" aria-hidden="true">save</span>
            Simpan Data
          </button>
        </div>
      </form>
    </section>
  `;
}

function progressIndex(status) {
  return PROGRESS_STATUS_ORDER.indexOf(status);
}

function isProgressStatus(status) {
  return progressIndex(status) >= 0;
}

function progressBaseFor(application) {
  if (isProgressStatus(application.status)) return application.status;
  if (isProgressStatus(application.progressBaseStatus)) return application.progressBaseStatus;
  return "Applied";
}

function nextProgressBaseStatus(currentApplication, nextStatus) {
  if (isProgressStatus(nextStatus)) return nextStatus;
  if (isProgressStatus(currentApplication.status)) return currentApplication.status;
  if (isProgressStatus(currentApplication.progressBaseStatus)) return currentApplication.progressBaseStatus;
  return "Applied";
}

function completedProgressKeys(application) {
  const baseIndex = progressIndex(progressBaseFor(application));
  const activeProgressIndex = progressIndex(application.status);
  return new Set(PROGRESS_STATUS_ORDER.filter((_, index) => {
    if (application.status === "Accepted") return index < activeProgressIndex;
    if (activeProgressIndex >= 0) return index < activeProgressIndex;
    return index <= baseIndex;
  }));
}

function stepperStateClass(step, application, completedKeys) {
  if (step.key === application.status) {
    const toneClass = step.key === "Rejected"
      ? " stepper__item--negative"
      : step.key === "FollowUp"
        ? " stepper__item--warning"
        : step.key === "Accepted"
          ? " stepper__item--positive"
          : "";
    return `stepper__item--active${toneClass}`;
  }
  return completedKeys.has(step.key) ? "stepper__item--done" : "";
}

function stepperSymbol(step, application, completedKeys) {
  if (completedKeys.has(step.key)) return "check";
  if (step.key !== application.status) return "";
  if (step.key === "Rejected") return "close";
  if (step.key === "FollowUp") return "notifications_active";
  if (step.key === "Accepted") return "check";
  return "sync";
}

function visibleStepperSteps(application) {
  if (application.status === "FollowUp") {
    const baseIndex = Math.max(0, progressIndex(progressBaseFor(application)));
    return [
      ...PROGRESS_STEPS.slice(0, baseIndex + 1),
      FOLLOW_UP_STEP,
      ...PROGRESS_STEPS.slice(baseIndex + 1)
    ];
  }

  if (application.status === "Rejected") {
    return [
      ...PROGRESS_STEPS.filter((step) => step.key !== "Accepted"),
      REJECTED_STEP
    ];
  }
  return PROGRESS_STEPS;
}

function renderStepper(application) {
  const completedKeys = completedProgressKeys(application);
  return `
    <div class="stepper" aria-label="Status lamaran">
      ${visibleStepperSteps(application).map((step) => {
        const stateClass = stepperStateClass(step, application, completedKeys);
        const symbol = stepperSymbol(step, application, completedKeys);
        return `
          <div class="stepper__item ${stateClass}">
            <span class="stepper__dot">${symbol ? `<span class="material-symbols-outlined" aria-hidden="true">${symbol}</span>` : ""}</span>
            <span>${step.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderStatusOptions(currentStatus) {
  return STATUS_SELECT_GROUPS.map((group) => `
    <optgroup label="${group.label}">
      ${group.keys.map((key) => {
        const label = STATUS_LABELS[key] || key;
        return `<option value="${key}"${key === currentStatus ? " selected" : ""}>${label}</option>`;
      }).join("")}
    </optgroup>
  `).join("");
}

function renderManualTrackerForm() {
  return `
    <form class="form-panel form-grid form-grid--two manual-tracker-form" id="manual-tracker-form" novalidate>
      <label class="compact-field compact-field--full">
        Link lowongan
        <input name="jobUrl" type="url" inputmode="url" placeholder="https://..." autocomplete="off" required>
      </label>

      <label class="compact-field">
        Judul pekerjaan
        <input name="title" type="text" autocomplete="off" required>
      </label>

      <label class="compact-field">
        Nama perusahaan
        <input name="company" type="text" autocomplete="organization" required>
      </label>

      <label class="compact-field">
        Status awal
        <select name="initialStatus">
          <option value="Saved">Disimpan</option>
          <option value="Applied">Dilamar</option>
          <option value="FollowUp">Follow up</option>
        </select>
      </label>

      <div class="field--full manual-tracker-form__actions">
        <button class="button button--primary" type="submit">
          <span class="material-symbols-outlined" aria-hidden="true">add_link</span>
          Buat Tracker
        </button>
        <button class="button button--text" type="button" id="cancel-manual-tracker">
          Batal
        </button>
      </div>
    </form>
  `;
}

function setAutofillValue(field, value) {
  if (!field || !value) return;
  if (!field.value || field.dataset.autofilled === "true") {
    field.value = value;
    field.dataset.autofilled = "true";
  }
}

function bindManualTrackerForm(root) {
  const form = root.querySelector("#manual-tracker-form");
  if (!form) return;

  const urlField = form.elements.jobUrl;
  const titleField = form.elements.title;
  const companyField = form.elements.company;

  [titleField, companyField].forEach((field) => {
    field?.addEventListener("input", () => {
      field.dataset.autofilled = "false";
    });
  });

  function applySuggestion(force = false) {
    const suggestion = inferManualJob(urlField.value);
    if (!suggestion) return;

    if (force) {
      if (!titleField.value) titleField.dataset.autofilled = "true";
      if (!companyField.value) companyField.dataset.autofilled = "true";
    }

    setAutofillValue(titleField, suggestion.title);
    setAutofillValue(companyField, suggestion.company);
  }

  urlField.addEventListener("input", () => applySuggestion(false));
  urlField.addEventListener("blur", () => applySuggestion(true));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applySuggestion(true);

    const parsed = normalizeExternalUrl(urlField.value);
    if (!parsed) {
      showSnackbar("Masukkan link lowongan yang valid.");
      urlField.focus();
      return;
    }

    const title = titleField.value.trim();
    const company = companyField.value.trim();
    if (!title || !company) {
      showSnackbar("Judul pekerjaan dan perusahaan wajib diisi.");
      (title ? companyField : titleField).focus();
      return;
    }

    const statusValue = String(form.elements.initialStatus.value || "Saved");
    const status = VALID_STATUS_KEYS.has(statusValue) ? statusValue : "Saved";
    const suggestion = inferManualJob(parsed.href);
    const job = buildManualJob({
      url: parsed.href,
      title,
      company,
      category: suggestion?.category || inferCategory(title)
    });

    rememberJobs([job]);
    const application = createTrackedApplication(job, status, {
      label: `Tracker dibuat dari link ${job.source.name}`
    });

    trackEvent("manual_tracker_create", {
      jobId: job.id,
      source: job.source.key,
      status
    });
    showSnackbar("Tracker dari link berhasil dibuat.");
    renderTracker(root, job, application);
  });

  root.querySelector("#cancel-manual-tracker")?.addEventListener("click", () => {
    const firstItem = getTrackedApplicationItems()[0];
    renderTrackerDashboard(root, firstItem?.job || null, firstItem?.application || null);
  });
}

function bindJobDataForm(root, job, application) {
  const editor = root.querySelector("#job-data-editor");
  const toggle = root.querySelector("#toggle-job-data");
  const form = root.querySelector("#job-data-form");

  toggle?.addEventListener("click", () => {
    if (!editor) return;
    const willOpen = editor.hidden;
    editor.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      form?.elements.jobUrl?.focus();
    }
  });

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const urlValue = String(formData.get("jobUrl") || "").trim();
    const parsedUrl = urlValue ? normalizeExternalUrl(urlValue) : null;

    if (!title || !company) {
      showSnackbar("Judul pekerjaan dan perusahaan wajib diisi.");
      (title ? form.elements.company : form.elements.title).focus();
      return;
    }

    if (urlValue && !parsedUrl) {
      showSnackbar("Link detail pekerjaan tidak valid.");
      form.elements.jobUrl.focus();
      return;
    }

    const safeUrl = parsedUrl?.href || "";
    const sourceName = parsedUrl ? readableDomain(parsedUrl.hostname) : job.source?.name || "Manual";
    const updatedJob = {
      ...job,
      title,
      company,
      logo: makeLogo(company, "0F766E"),
      location: String(formData.get("location") || "").trim() || "Link eksternal",
      type: parseTypeInput(formData.get("type")),
      category: String(formData.get("category") || "").trim() || inferCategory(title),
      salary: { label: String(formData.get("salary") || "").trim() || "Gaji belum tersedia" },
      applyUrl: safeUrl,
      source: safeUrl
        ? {
            key: job.source?.key || "manual",
            name: sourceName,
            url: safeUrl
          }
        : undefined
    };

    rememberJobs([updatedJob]);
    trackEvent("tracker_job_update", {
      jobId: job.id,
      source: updatedJob.source?.key || "local"
    });
    showSnackbar("Data lowongan diperbarui.");
    renderTracker(root, updatedJob, application);
  });
}

function getTrackedApplicationItems() {
  return Object.values(readApplications())
    .map((application) => {
      const job = getJobById(application.jobId);
      return job ? { application, job } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.application.submittedAt) - new Date(a.application.submittedAt));
}

function renderTrackerList(items, selectedJobId) {
  if (!items.length) {
    return `
      <div class="tracker-list-empty">
        <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
        <p>Belum ada tracker.</p>
      </div>
    `;
  }

  return items.map(({ application, job }) => {
    const statusLabel = STATUS_LABELS[application.status] || application.status;
    const selectedClass = job.id === selectedJobId ? " tracker-list-item--selected" : "";
    return `
      <a class="tracker-list-item${selectedClass}" href="apply.html?id=${encodeURIComponent(job.id)}" aria-current="${job.id === selectedJobId ? "page" : "false"}">
        <div class="cluster">
          <span class="badge">${escapeHtml(statusLabel)}</span>
          ${application.followUpAt ? `<span class="tracker-list-item__date">${escapeHtml(formatDateLong(application.followUpAt))}</span>` : ""}
        </div>
        <strong>${escapeHtml(job.title)}</strong>
        <span>${escapeHtml(job.company)}</span>
      </a>
    `;
  }).join("");
}

function renderTrackerEmptyDetail() {
  return `
    <div class="tracker-panel tracker-dashboard-empty" role="status">
      <div class="empty-state">
        <div class="empty-state__art">
          <span class="material-symbols-outlined" aria-hidden="true">assignment_add</span>
        </div>
        <h2 class="headline-medium">Belum ada tracker</h2>
        <p class="body-medium">Tambahkan link lowongan pertama atau cari lowongan lalu catat proses apply.</p>
        <div class="tracker-empty-actions">
          <button class="button button--primary" type="button" id="show-manual-tracker">
            <span class="material-symbols-outlined" aria-hidden="true">add</span>
            Input Tracker
          </button>
          <a class="button button--tonal" href="search.html">Cari Lowongan</a>
        </div>
      </div>
    </div>
  `;
}

function renderTrackerDetail(job, application) {
  const statusLabel = STATUS_LABELS[application.status] || application.status;
  return `
    <div class="tracker-detail stack" aria-labelledby="tracker-title">
      <div class="tracker-panel">
        <div class="stack">
          <div class="tracker-panel__header">
            <div class="tracker-title-block">
              <h1 class="headline-medium tracker-job-title" id="tracker-title">${renderTrackerTitleLink(job)}</h1>
              <p class="tracker-job-company">${escapeHtml(job.company)}</p>
            </div>
            <div class="tracker-panel__actions">
              ${renderDetailAction(job)}
              <button class="button button--tonal" type="button" id="toggle-job-data" aria-controls="job-data-editor" aria-expanded="false">
                <span class="material-symbols-outlined" aria-hidden="true">edit_square</span>
                Edit
              </button>
            </div>
          </div>

          ${renderJobDataForm(job)}

          <div>
            <p class="label-large">Status Saat Ini: ${escapeHtml(statusLabel)}</p>
            ${renderStepper(application)}
          </div>

          <form class="status-form" id="status-form">
            <label class="compact-field">
              Status
              <select name="status">
                ${renderStatusOptions(application.status)}
              </select>
            </label>
            <label class="compact-field">
              Follow up
              <input name="followUpAt" type="date" value="${escapeHtml(application.followUpAt || "")}">
            </label>
            <label class="compact-field compact-field--full">
              Catatan
              <textarea name="note" rows="3">${escapeHtml(application.note || "")}</textarea>
            </label>
            <button class="button button--primary" type="submit">
              <span class="material-symbols-outlined" aria-hidden="true">save</span>
              Simpan Status
            </button>
            <button class="button button--text" type="button" id="delete-application">
              <span class="material-symbols-outlined" aria-hidden="true">delete</span>
              Hapus Tracker
            </button>
          </form>

          <div class="content-block">
            <h2>Riwayat</h2>
            <ul class="history-list">
              ${application.history.map((item) => `
                <li>${escapeHtml(formatDateLong(item.date))} - ${escapeHtml(item.label)}</li>
              `).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTrackerDashboard(root, selectedJob = null, selectedApplication = null, options = {}) {
  const items = getTrackedApplicationItems();
  const selectedId = selectedJob?.id || items[0]?.job.id || "";
  const selectedItem = selectedJob && selectedApplication
    ? { job: selectedJob, application: selectedApplication }
    : items.find((item) => item.job.id === selectedId) || items[0] || null;
  const mode = options.mode || "detail";
  const isEmpty = !items.length;
  const shouldShowListPanel = items.length > 0;
  const mainContent = mode === "new"
    ? renderManualTrackerForm()
    : selectedItem
      ? renderTrackerDetail(selectedItem.job, selectedItem.application)
      : renderTrackerEmptyDetail();

  root.innerHTML = `
    <section class="page__content tracker-workspace tracker-workspace--${escapeHtml(mode)}${isEmpty ? " tracker-workspace--empty" : ""}" aria-labelledby="applications-title">
      <h1 class="visually-hidden" id="applications-title">Tracker Lamaran</h1>

      <div class="tracker-workspace__grid">
        <section class="tracker-workspace__main">
          ${mainContent}
        </section>
        ${shouldShowListPanel ? `
          <aside class="tracker-list-panel" aria-labelledby="tracker-list-title">
            <div class="tracker-list-panel__header">
              <div>
                <h2 class="title-medium" id="tracker-list-title">List Tracker</h2>
                <p class="body-medium">${items.length} item</p>
              </div>
              <button class="button button--tonal tracker-list-add" type="button" id="show-manual-tracker" aria-label="Input Tracker">
                <span class="material-symbols-outlined" aria-hidden="true">add</span>
                Input
              </button>
            </div>
            <div class="tracker-list-scroll">
              ${renderTrackerList(items, selectedItem?.job.id || "")}
            </div>
          </aside>
        ` : ""}
      </div>
    </section>
  `;

  root.querySelector("#show-manual-tracker")?.addEventListener("click", () => {
    renderTrackerDashboard(root, selectedItem?.job || null, selectedItem?.application || null, { mode: "new" });
  });

  if (mode === "new") {
    bindManualTrackerForm(root);
  } else if (selectedItem) {
    bindTrackerActions(root, selectedItem.job, selectedItem.application);
    bindJobDataForm(root, selectedItem.job, selectedItem.application);
  }
}

function renderApplicationsList(root) {
  renderTrackerDashboard(root);
}

function renderTracker(root, job, application) {
  renderTrackerDashboard(root, job, application);
}

function bindTrackerActions(root, job, application) {
  const form = root.querySelector("#status-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const statusValue = String(formData.get("status") || "Applied");
    const status = VALID_STATUS_KEYS.has(statusValue) ? statusValue : "Applied";
    const followUpAt = formData.get("followUpAt");
    const note = String(formData.get("note") || "").trim();
    const now = new Date().toISOString();
    const statusChanged = status !== application.status;
    const noteChanged = note !== (application.note || "");
    const followUpChanged = followUpAt !== (application.followUpAt || "");
    const history = [...application.history];

    if (statusChanged || noteChanged || followUpChanged) {
      history.unshift({
        date: now,
        status,
        label: statusChanged
          ? `Status diubah ke ${STATUS_LABELS[status] || status}`
          : "Catatan tracker diperbarui"
      });
    }

    const next = saveApplication({
      ...application,
      status,
      followUpAt,
      note,
      progressBaseStatus: nextProgressBaseStatus(application, status),
      history
    });

    trackEvent("tracker_update", {
      jobId: job.id,
      status,
      statusChanged,
      followUpChanged
    });
    showSnackbar("Tracker lamaran diperbarui.");
    renderTracker(root, job, next);
  });

  root.querySelector("#delete-application")?.addEventListener("click", () => {
    deleteApplication(application.jobId);
    trackEvent("tracker_delete", { jobId: application.jobId });
    showSnackbar("Tracker lamaran dihapus.");
    const firstItem = getTrackedApplicationItems()[0];
    renderTrackerDashboard(root, firstItem?.job || null, firstItem?.application || null);
  });
}

function fieldMessage(field, message = "") {
  const wrapper = field.closest(".field");
  const helperId = field.getAttribute("aria-describedby")?.split(/\s+/)[0];
  const helper = helperId ? document.getElementById(helperId) : wrapper?.querySelector(".field__helper");
  wrapper?.classList.toggle("field--error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  if (helper) helper.textContent = message;
}

function validateField(field) {
  const value = field.value.trim();
  const name = field.name;
  let message = "";

  if (field.required && !value && field.type !== "file") {
    message = "Field ini wajib diisi.";
  } else if (name === "email" && value && !emailRegex.test(value)) {
    message = "Masukkan email yang valid.";
  } else if (name === "phone" && value && !phoneRegex.test(value)) {
    message = "Nomor HP harus format 08xxxxxxxxxx, 10-13 digit.";
  } else if (name === "story" && value.length < 100) {
    message = "Ceritakan dirimu minimal 100 karakter.";
  } else if (name === "cv") {
    const file = field.files?.[0];
    if (!file) {
      message = "CV wajib diunggah.";
    } else {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const allowed = ["pdf", "doc", "docx"];
      if (!allowed.includes(extension)) {
        message = "Format CV harus PDF, DOC, atau DOCX.";
      } else if (file.size > MAX_CV_SIZE) {
        message = "Ukuran CV maksimal 5MB.";
      }
    }
  }

  fieldMessage(field, message);
  return !message;
}

function validateForm(form) {
  const fields = [...form.querySelectorAll("input, textarea")];
  const results = fields.map((field) => validateField(field));
  return results.every(Boolean);
}

function bindValidation(form) {
  const story = form.elements.story;
  const counter = document.getElementById("story-counter");

  function updateCounter() {
    counter.textContent = `${story.value.trim().length}/100`;
  }

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.name === "story") updateCounter();
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
    field.addEventListener("change", () => {
      if (field.type === "file") validateField(field);
    });
  });

  updateCounter();
}

function renderForm(root, job) {
  root.innerHTML = `
    <section class="page__content page__content--narrow stack" aria-labelledby="apply-title">
      ${renderDetailAction(job)}

      <div>
        <h1 class="headline-medium" id="apply-title">${escapeHtml(job.title)} di ${escapeHtml(job.company)}</h1>
        <p class="body-medium">${escapeHtml(job.location)} . ${escapeHtml(formatSalary(job.salary))}</p>
      </div>

      <form class="form-panel form-grid form-grid--two" id="apply-form" novalidate>
        <div class="field">
          <label for="fullName">Nama Lengkap *</label>
          <input id="fullName" name="fullName" type="text" autocomplete="name" required aria-describedby="fullName-help">
          <span class="field__helper" id="fullName-help"></span>
        </div>

        <div class="field">
          <label for="email">Email *</label>
          <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-help">
          <span class="field__helper" id="email-help"></span>
        </div>

        <div class="field">
          <label for="phone">Nomor HP *</label>
          <input id="phone" name="phone" type="tel" inputmode="numeric" placeholder="08xxxxxxxxxx" autocomplete="tel" required aria-describedby="phone-help">
          <span class="field__helper" id="phone-help"></span>
        </div>

        <div class="field">
          <label for="portfolio">LinkedIn / Portfolio</label>
          <input id="portfolio" name="portfolio" type="url" autocomplete="url" aria-describedby="portfolio-help">
          <span class="field__helper" id="portfolio-help"></span>
        </div>

        <div class="field">
          <label for="domicile">Domisili saat ini *</label>
          <input id="domicile" name="domicile" type="text" autocomplete="address-level2" required aria-describedby="domicile-help">
          <span class="field__helper" id="domicile-help"></span>
        </div>

        <div class="field">
          <label for="expectedSalary">Gaji yang diharapkan *</label>
          <input id="expectedSalary" name="expectedSalary" type="text" inputmode="numeric" placeholder="Rp 12.000.000" required aria-describedby="expectedSalary-help">
          <span class="field__helper" id="expectedSalary-help"></span>
        </div>

        <div class="field">
          <label for="cv">Unggah CV (PDF/DOC) *</label>
          <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" required aria-describedby="cv-help">
          <span class="field__helper" id="cv-help"></span>
        </div>

        <div class="field">
          <label for="coverLetter">Surat Lamaran</label>
          <input id="coverLetter" name="coverLetter" type="file" accept=".pdf,.doc,.docx" aria-describedby="coverLetter-help">
          <span class="field__helper" id="coverLetter-help">Opsional.</span>
        </div>

        <div class="field field--full">
          <div class="field__meta">
            <label for="story">Ceritakan dirimu *</label>
            <span class="field__helper" id="story-counter">0/100</span>
          </div>
          <textarea id="story" name="story" required aria-describedby="story-help" placeholder="Tulis pengalaman, motivasi, dan alasan kamu cocok untuk posisi ini."></textarea>
          <span class="field__helper" id="story-help"></span>
        </div>

        <div class="field--full">
          <button class="button button--primary button--full" type="submit">
            <span class="material-symbols-outlined" aria-hidden="true">send</span>
            Kirim Lamaran
          </button>
        </div>
      </form>
    </section>
  `;

  const form = document.getElementById("apply-form");
  bindValidation(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      showSnackbar("Periksa lagi data lamaran.");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const formData = new FormData(form);
    const now = new Date();
    const application = {
      jobId: job.id,
      status: "Applied",
      submittedAt: now.toISOString(),
      candidate: {
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        portfolio: formData.get("portfolio"),
        domicile: formData.get("domicile"),
        expectedSalary: formData.get("expectedSalary"),
        cvName: form.elements.cv.files?.[0]?.name || "",
        coverLetterName: form.elements.coverLetter.files?.[0]?.name || "",
        story: formData.get("story")
      },
      history: [
        { date: now.toISOString(), status: "Applied", label: "Lamaran diterima sistem" }
      ]
    };

    saveApplication(application);
    showSnackbar("Lamaran berhasil dikirim!");
    window.setTimeout(() => renderTracker(root, job, application), 900);
  });
}

function renderNotFound(root) {
  root.innerHTML = `
    <div class="empty-state" role="status">
      <div>
        <div class="empty-state__art">
          <span class="material-symbols-outlined" aria-hidden="true">work_alert</span>
        </div>
        <h1 class="headline-medium">Lowongan tidak ditemukan</h1>
        <p class="body-medium">Buka detail lowongan dari halaman pencarian sebelum mengirim lamaran.</p>
        <p><a class="button button--primary" href="search.html">Cari Lowongan</a></p>
      </div>
    </div>
  `;
}

function renderDirectApplyUnavailable(root, job) {
  const existing = getApplication(job.id);
  if (existing) {
    renderTracker(root, job, existing);
    return;
  }

  root.innerHTML = `
    <section class="page__content page__content--narrow stack" aria-labelledby="apply-unavailable-title">
      ${renderDetailAction(job)}

      <div class="tracker-panel stack">
        <div>
          <span class="badge">Tracker pribadi</span>
          <h1 class="headline-medium" id="apply-unavailable-title">Belum menerima lamaran langsung</h1>
          <p class="body-medium">JobSearch saat ini masih fokus membantu pencari kerja menemukan lowongan dan mencatat proses lamaran. Apply langsung dari sistem akan dibuka saat perusahaan sudah bisa memasang lowongan di platform ini.</p>
        </div>
        <button class="button button--tonal button--full" type="button" id="mark-saved">
          <span class="material-symbols-outlined" aria-hidden="true">assignment_add</span>
          Simpan ke Tracker
        </button>
      </div>
    </section>
  `;

  root.querySelector("#mark-saved")?.addEventListener("click", () => {
    const application = createTrackedApplication(job, "Saved", {
      label: "Disimpan sebagai prospek lamaran"
    });
    trackEvent("tracker_saved", { jobId: job.id, source: job.source?.key || "local" });
    showSnackbar("Lowongan masuk Tracker Lamaran.");
    renderTracker(root, job, application);
  });
}

function renderExternalApply(root, job) {
  const existing = getApplication(job.id);
  if (existing) {
    renderTracker(root, job, existing);
    return;
  }

  root.innerHTML = `
    <section class="page__content page__content--narrow stack" aria-labelledby="external-apply-title">
      ${renderDetailAction(job)}

      <div class="tracker-panel stack">
        <div>
          <span class="badge">${escapeHtml(job.source?.name || "Sumber eksternal")}</span>
          <h1 class="headline-medium" id="external-apply-title">${escapeHtml(job.title)} di ${escapeHtml(job.company)}</h1>
          <p class="body-medium">Lowongan ini berasal dari sumber resmi eksternal. Buka halaman apply resmi, lalu tandai di tracker agar proses follow up tetap rapi.</p>
        </div>
        <a class="button button--primary button--full" href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener" id="official-apply-link">
          <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
          Buka Halaman Apply Resmi
        </a>
        <button class="button button--tonal button--full" type="button" id="mark-applied">
          <span class="material-symbols-outlined" aria-hidden="true">assignment_turned_in</span>
          Tandai Sudah Dilamar
        </button>
      </div>
    </section>
  `;

  root.querySelector("#official-apply-link")?.addEventListener("click", () => {
    trackEvent("official_apply_click", {
      jobId: job.id,
      source: job.source?.key || "external"
    });
  });

  root.querySelector("#mark-applied")?.addEventListener("click", () => {
    const application = createTrackedApplication(job, "Applied", {
      label: "Ditandai sudah apply di situs resmi"
    });
    trackEvent("tracker_mark_applied", { jobId: job.id, source: job.source?.key || "external" });
    showSnackbar("Lowongan masuk Tracker Lamaran.");
    renderTracker(root, job, application);
  });
}

async function initApplyPage() {
  const page = document.querySelector('[data-page="apply"]');
  if (!page) return;

  const root = document.getElementById("application-root");
  const jobId = new URLSearchParams(window.location.search).get("id");

  if (!jobId) {
    recordPageView("tracker");
    renderApplicationsList(root);
    return;
  }

  let job = getJobById(jobId);
  if (!job) {
    job = await fetchJobById(jobId);
  }

  if (!job) {
    renderNotFound(root);
    return;
  }

  document.title = `${job.title} | Tracker Lamaran`;
  recordPageView("apply", { jobId: job.id, source: job.source?.key || "local" });
  if (job.applyUrl) {
    renderExternalApply(root, job);
    return;
  }

  const existing = getApplication(job.id);
  if (existing) {
    renderTracker(root, job, existing);
  } else if (job.acceptsSystemApply) {
    renderForm(root, job);
  } else {
    renderDirectApplyUnavailable(root, job);
  }
}

document.addEventListener("DOMContentLoaded", initApplyPage);
