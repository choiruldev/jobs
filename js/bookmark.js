import {
  formatDateLong,
  formatPostedDate,
  formatSalaryOriginal,
  formatSalary,
  getJobQualitySignals,
  getJobById,
  getSimilarJobs
} from "./data.js?v=20260616z";
import { fetchJobById } from "./providers.js?v=20261105b";
import { readMatchProfile, scoreJobForProfile } from "./profile.js?v=20260616z";
import { analyzeAtsMatch } from "./ats-checker.js?v=20260616z";
import { generateCoverLetter } from "./ai-writer.js?v=20260616z";
import { generateOutreachMessage } from "./outreach-generator.js?v=20260616z";
import { estimateTakeHomePay, formatIDR } from "./salary-calculator.js?v=20260616z";
import { generateJobPostingJsonLd, injectJsonLd } from "./routes.js?v=20260616z";
import { recordPageView, trackEvent } from "./analytics.js?v=20260616z";
import { toggleJobComparison, renderComparatorTrigger } from "./job-comparator.js?v=20260616z";
import { shareJob } from "./share.js?v=20260616z";
import { initThemeEngine } from "./theme-engine.js?v=20261104g";

export const BOOKMARK_KEY = "jsa_bookmarks";

const APP_VERSION = "20260616z";
const boundBookmarkRoots = new WeakSet();

export function readBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch (error) {
    console.warn("Gagal membaca bookmark", error);
    return [];
  }
}

export function writeBookmarks(ids) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...new Set(ids)]));
    return true;
  } catch (error) {
    console.warn("Gagal menyimpan bookmark", error);
    return false;
  }
}

export function isBookmarked(jobId) {
  return readBookmarks().includes(jobId);
}

export function toggleBookmark(jobId) {
  const ids = readBookmarks();
  const next = ids.includes(jobId) ? ids.filter((id) => id !== jobId) : [...ids, jobId];
  writeBookmarks(next);
  return next.includes(jobId);
}

export function removeBookmark(jobId) {
  const next = readBookmarks().filter((id) => id !== jobId);
  writeBookmarks(next);
  return next;
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const lower = str.trim().toLowerCase();
  if (lower === "nan" || lower === "null" || lower === "undefined") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (/^(?:https?:\/\/|\/|#|mailto:|tel:)/i.test(trimmed)) {
    if (/javascript\s*:/i.test(trimmed) || /data\s*:/i.test(trimmed) || /vbscript\s*:/i.test(trimmed)) {
      return "#";
    }
    return trimmed;
  }
  return "#";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(value, query = "") {
  const safe = escapeHtml(value);
  const trimmed = query.trim();
  if (!trimmed) return safe;
  const safeQuery = escapeHtml(trimmed);
  return safe.replace(new RegExp(escapeRegExp(safeQuery), "gi"), (match) => `<mark>${match}</mark>`);
}

function truncate(value, maxLength = 150) {
  if (!value) return "";
  const str = String(value);
  if (str.trim().toLowerCase() === "nan") return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength).trim()}...`;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}

function renderChips(types) {
  return types
    .slice(0, 2)
    .map((type) => `<span class="job-card__chip">${escapeHtml(type)}</span>`)
    .join("");
}

export function renderSourceBadge(job) {
  const platform = String(job.sourcePlatform || job.source?.name || "").toLowerCase();
  if (platform.includes("linkedin")) {
    return `<span class="source-badge source-badge--linkedin"><span class="badge-icon">in</span> LinkedIn</span>`;
  }
  if (platform.includes("jobstreet")) {
    return `<span class="source-badge source-badge--jobstreet"><span class="badge-icon">JS</span> JobStreet</span>`;
  }
  if (platform.includes("indeed")) {
    return `<span class="source-badge source-badge--indeed"><span class="badge-icon">ID</span> Indeed</span>`;
  }
  if (platform.includes("greenhouse")) {
    return `<span class="source-badge source-badge--greenhouse"><span class="badge-icon">🌿</span> Greenhouse</span>`;
  }
  if (platform.includes("ashby")) {
    return `<span class="source-badge source-badge--ashby"><span class="badge-icon">⚡</span> Ashby</span>`;
  }
  if (platform.includes("lever")) {
    return `<span class="source-badge source-badge--lever"><span class="badge-icon">🎯</span> Lever</span>`;
  }
  if (platform.includes("himalayas")) {
    return `<span class="source-badge source-badge--himalayas"><span class="badge-icon">🏔️</span> Himalayas</span>`;
  }
  if (platform.includes("remotive") || platform.includes("arbeitnow") || platform.includes("remote")) {
    const label = job.sourcePlatform || "Remote Global";
    return `<span class="source-badge source-badge--remote"><span class="badge-icon">🌐</span> ${escapeHtml(label)}</span>`;
  }
  return "";
}

function renderMatchScore(job) {
  const match = scoreJobForProfile(job);
  if (!match.hasProfile) return "";

  const reason = match.reasons.length ? ` . ${match.reasons.join(", ")}` : "";
  return `
    <div class="job-card__score" title="${escapeHtml(`${match.score}% cocok${reason}`)}">
      <span class="material-symbols-outlined" aria-hidden="true">award_star</span>
      <span>${escapeHtml(`${match.score}% cocok`)}</span>
      ${match.reasons[0] ? `<small>${escapeHtml(match.reasons[0])}</small>` : ""}
    </div>
  `;
}

function renderQualitySignals(job) {
  return getJobQualitySignals(job)
    .slice(0, 3)
    .map((signal) => `
      <span class="job-card__quality-chip" data-tone="${escapeHtml(signal.tone)}">${escapeHtml(signal.label)}</span>
    `)
    .join("");
}

function getCompanyInitials(name = "") {
  const words = String(name)
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9\s.]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/\./g, "").trim())
    .filter(Boolean);

  if (!words.length) return "JS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function renderCompanyAvatar(company, className = "job-card__logo") {
  return `<span class="${className}" aria-hidden="true">${escapeHtml(getCompanyInitials(company))}</span>`;
}

export function renderJobCard(job, options = {}) {
  const {
    query = "",
    removable = false,
    compact = false,
    detailPrefix = ""
  } = options;
  const bookmarked = isBookmarked(job.id);
  const classes = [
    "job-card",
    bookmarked ? "job-card--bookmarked" : "",
    compact ? "job-card--compact" : ""
  ].filter(Boolean).join(" ");
  const detailHref = `${detailPrefix}detail.html?id=${encodeURIComponent(job.id)}&app=${APP_VERSION}`;
  const iconClass = bookmarked ? "material-symbols-outlined icon--filled" : "material-symbols-outlined";
  const salaryText = formatSalary(job.salary);
  const salaryIsMissing = salaryText === "Gaji belum tersedia";
  const salaryClass = salaryIsMissing ? "job-card__salary job-card__salary--muted" : "job-card__salary";
  const salaryOriginal = formatSalaryOriginal(job.salary);

  const dateVal = job.postedAt || job.posted;
  const ageDays = dateVal ? Math.max(0, Math.floor((Date.now() - new Date(dateVal).getTime()) / 86400000)) : 99;
  const freshnessBadge = ageDays <= 3
    ? `<span class="badge-fresh" style="margin-left:4px;">Baru</span>`
    : (ageDays > 30 ? `<span class="badge-stale" style="margin-left:4px;">Loker Lama</span>` : "");

  return `
    <article class="${classes}" data-job-id="${escapeHtml(job.id)}">
      <a class="job-card__body" href="${detailHref}" aria-label="Lihat detail ${escapeHtml(job.title)} di ${escapeHtml(job.company)}">
        <div class="job-card__header">
          ${renderCompanyAvatar(job.company)}
          <div class="job-card__identity">
            <div class="job-card__company">${escapeHtml(job.company)}</div>
            <div class="job-card__meta">
              <span class="job-card__meta-item" title="${escapeHtml(job.location)}">
                <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                <span class="job-card__meta-text">${escapeHtml(job.location)}</span>
              </span>
              <span class="job-card__meta-item">
                <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                <span class="job-card__meta-text">${escapeHtml(formatPostedDate(dateVal))}${freshnessBadge}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="job-card__main">
          <h2 class="job-card__title">${highlightText(job.title, query)}</h2>
          <p class="job-card__description">${highlightText(truncate(job.description), query)}</p>
        </div>
        ${renderMatchScore(job)}
        <div class="job-card__chips">${renderChips(job.type)}${renderSourceBadge(job)}</div>
        <div class="job-card__quality">${renderQualitySignals(job)}</div>
        <div>
          <div class="${salaryClass}">${escapeHtml(salaryText)}</div>
          ${salaryOriginal ? `<div class="job-card__salary-note" style="color:var(--md-sys-color-primary);font-weight:600;font-size:12px;margin-top:2px;">${escapeHtml(salaryOriginal)}</div>` : ""}
        </div>
      </a>
      <div class="job-card__actions">
        <button
          class="icon-button job-card__action-btn job-card__compare js-compare-toggle"
          type="button"
          data-job-id="${escapeHtml(job.id)}"
          aria-label="Bandingkan lowongan"
          title="Bandingkan lowongan"
        >
          <span class="material-symbols-outlined" aria-hidden="true" style="font-size:18px;">compare_arrows</span>
        </button>
        <button
          class="icon-button job-card__action-btn job-card__save js-bookmark-toggle"
          type="button"
          data-job-id="${escapeHtml(job.id)}"
          ${removable ? 'data-remove-on-unsave="true"' : ""}
          aria-label="${bookmarked ? "Hapus dari lowongan tersimpan" : "Simpan lowongan"}"
          aria-pressed="${String(bookmarked)}"
          title="${bookmarked ? "Hapus dari tersimpan" : "Simpan lowongan"}"
        >
          <span class="${iconClass}" aria-hidden="true">${bookmarked ? "bookmark" : "bookmark_border"}</span>
        </button>
      </div>
    </article>
  `;
}

function setBookmarkButtonState(button, bookmarked) {
  const icon = button.querySelector(".material-symbols-outlined");
  button.setAttribute("aria-pressed", String(bookmarked));
  button.setAttribute("aria-label", bookmarked ? "Hapus dari lowongan tersimpan" : "Simpan lowongan");
  if (icon) {
    icon.textContent = bookmarked ? "bookmark" : "bookmark_border";
    icon.classList.toggle("icon--filled", bookmarked);
  }
  const card = button.closest(".job-card");
  if (card) card.classList.toggle("job-card--bookmarked", bookmarked);
}

function updateBookmarkButtons(jobId, bookmarked) {
  document
    .querySelectorAll(`.js-bookmark-toggle[data-job-id="${cssEscape(jobId)}"]`)
    .forEach((button) => setBookmarkButtonState(button, bookmarked));
}

export function initBookmarkButtons(root = document, onChange = () => {}) {
  if (boundBookmarkRoots.has(root)) return;
  boundBookmarkRoots.add(root);

  renderComparatorTrigger();

  root.addEventListener("click", (event) => {
    const compareBtn = event.target.closest(".js-compare-toggle");
    if (compareBtn) {
      event.preventDefault();
      event.stopPropagation();
      const jobId = compareBtn.dataset.jobId;
      if (jobId) {
        toggleJobComparison(jobId);
        showSnackbar("Daftar komparasi diperbarui");
      }
      return;
    }

    const button = event.target.closest(".js-bookmark-toggle");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const jobId = button.dataset.jobId;
    if (!jobId) return;

    const bookmarked = toggleBookmark(jobId);
    updateBookmarkButtons(jobId, bookmarked);
    trackEvent(bookmarked ? "bookmark_add" : "bookmark_remove", { jobId });
    onChange({ jobId, bookmarked, button });
  });
}

export function showSnackbar(message, type = "info") {
  let snackbar = document.querySelector(".snackbar");
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";
    snackbar.setAttribute("role", "status");
    snackbar.setAttribute("aria-live", "polite");
    document.body.append(snackbar);
  }

  snackbar.classList.remove("snackbar--success", "snackbar--error", "snackbar--warning", "snackbar--info");
  
  let iconName = "info";
  const msgLower = (message || "").toLowerCase();
  if (type === "success" || msgLower.includes("berhasil") || msgLower.includes("disimpan") || msgLower.includes("tersimpan") || message.includes("✓")) {
    iconName = "check_circle";
    snackbar.classList.add("snackbar--success");
  } else if (type === "error" || msgLower.includes("gagal") || msgLower.includes("salah") || msgLower.includes("error")) {
    iconName = "error";
    snackbar.classList.add("snackbar--error");
  } else if (type === "warning" || msgLower.includes("peringatan") || msgLower.includes("perhatian")) {
    iconName = "warning";
    snackbar.classList.add("snackbar--warning");
  } else {
    snackbar.classList.add("snackbar--info");
  }

  snackbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      <span class="material-symbols-outlined snackbar__icon" style="font-size:20px;flex-shrink:0;" aria-hidden="true">${iconName}</span>
      <span class="snackbar__text" style="font-size:13px;line-height:1.4;">${escapeHtml(message)}</span>
    </div>
    <button class="snackbar__close" type="button" aria-label="Tutup notifikasi" style="background:transparent;border:none;color:inherit;cursor:pointer;padding:4px;display:flex;opacity:0.8;">
      <span class="material-symbols-outlined" style="font-size:18px;">close</span>
    </button>
  `;

  snackbar.querySelector(".snackbar__close")?.addEventListener("click", () => {
    snackbar.classList.remove("snackbar--visible");
  });

  snackbar.classList.add("snackbar--visible");
  window.clearTimeout(showSnackbar.timer);
  showSnackbar.timer = window.setTimeout(() => {
    snackbar.classList.remove("snackbar--visible");
  }, 3200);
}

export const showToast = showSnackbar;

function initShellNavigation() {
  const page = document.body.dataset.page || document.querySelector("[data-page]")?.dataset.page || "";
  const navKey = page === "apply" ? "applications" : page;
  document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
    if (link.dataset.nav === navKey) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initBookmarksPage() {
  const page = document.querySelector('[data-page="bookmarks"]');
  if (!page) return;
  recordPageView("bookmarks");

  const grid = document.getElementById("bookmark-grid");
  const empty = document.getElementById("bookmark-empty");
  const counter = document.getElementById("bookmark-count");

  function render() {
    const ids = readBookmarks();
    const jobs = ids.map((id) => getJobById(id)).filter(Boolean);
    counter.textContent = `${jobs.length} tersimpan`;
    grid.hidden = jobs.length === 0;
    empty.hidden = jobs.length > 0;
    grid.innerHTML = jobs.map((job) => renderJobCard(job, { removable: true })).join("");
  }

  initBookmarkButtons(page, ({ bookmarked, button }) => {
    if (bookmarked || button.dataset.removeOnUnsave !== "true") {
      render();
      return;
    }

    const card = button.closest(".job-card");
    if (!card) {
      render();
      return;
    }

    card.classList.add("job-card--leaving");
    window.setTimeout(render, 180);
  });

  render();
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function renderNotFound(root) {
  root.innerHTML = `
    <div class="empty-state" role="status">
      <div>
        <div class="empty-state__art">
          <span class="material-symbols-outlined" aria-hidden="true">work_alert</span>
        </div>
        <h1 class="headline-medium">Lowongan tidak ditemukan</h1>
        <p class="body-medium">Cek kembali tautan atau cari lowongan lain yang masih tersedia.</p>
        <p><a class="button button--primary" href="search.html">Cari Lowongan</a></p>
      </div>
    </div>
  `;
}

async function initDetailPage() {
  const page = document.querySelector('[data-page="detail"]');
  if (!page) return;

  const root = document.getElementById("detail-root");
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  let job = getJobById(jobId);

  if (!job) {
    root.innerHTML = `
      <div class="empty-state" role="status">
        <div>
          <div class="empty-state__art">
            <span class="material-symbols-outlined" aria-hidden="true">sync</span>
          </div>
          <h1 class="headline-medium">Mengambil detail lowongan...</h1>
          <p class="body-medium">Mengecek cache dan sumber lowongan internasional.</p>
        </div>
      </div>
    `;
    job = await fetchJobById(jobId);
  }

  if (!job) {
    renderNotFound(root);
    return;
  }

  recordPageView("detail", { jobId: job.id, source: job.source?.key || "local" });
  trackEvent("job_detail_view", {
    jobId: job.id,
    company: job.company,
    source: job.source?.key || "local"
  });

  const similarJobs = getSimilarJobs(job, 6);
  const bookmarked = isBookmarked(job.id);
  const bookmarkIconClass = bookmarked ? "material-symbols-outlined icon--filled" : "material-symbols-outlined";
  const salaryOriginal = formatSalaryOriginal(job.salary);

  function isJobTracked(jobId) {
    try {
      const raw = localStorage.getItem("jsa_applications");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed[jobId]);
    } catch (e) {
      return false;
    }
  }

  function autoTrackJob(targetJob, status = "Applied") {
    try {
      const raw = localStorage.getItem("jsa_applications");
      const applications = raw ? JSON.parse(raw) : {};
      if (!applications[targetJob.id]) {
        const now = new Date().toISOString();
        applications[targetJob.id] = {
          jobId: targetJob.id,
          status: status,
          submittedAt: now,
          updatedAt: now,
          notes: `Melamar via portal resmi ${targetJob.source?.name || "ATS"}`,
          history: [
            { date: now, status: status, label: `Status: ${status} via portal resmi` }
          ]
        };
        localStorage.setItem("jsa_applications", JSON.stringify(applications));
      }
      return true;
    } catch (e) {
      console.warn("Auto-track error:", e);
      return false;
    }
  }

  const isTracked = isJobTracked(job.id);
  const directApplyUrl = sanitizeUrl(job.applyUrl || job.source?.url || "#");
  const trackerHref = `apply.html?id=${encodeURIComponent(job.id)}&app=${APP_VERSION}`;

  const dateVal = job.postedAt || job.posted;
  const ageDays = dateVal ? Math.max(0, Math.floor((Date.now() - new Date(dateVal).getTime()) / 86400000)) : 99;
  const freshnessBadge = ageDays <= 3
    ? `<span class="badge badge-fresh">Baru</span>`
    : (ageDays > 30 ? `<span class="badge badge-stale">Loker Lama</span>` : "");

  const sourceBlock = job.source?.name ? `
    <section class="detail-card" aria-labelledby="source-title">
      <h2 class="detail-card__section-title" id="source-title">
        <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
        Sumber Resmi Terverifikasi
      </h2>
      <div class="detail-card__prose">
        <p>Data lowongan ini diverifikasi langsung dari feed resmi <a class="text-link" href="${escapeHtml(directApplyUrl)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(job.source.name)}</strong></a>. Seluruh tahapan seleksi diproses langsung pada sistem ATS pemberi kerja tanpa perantara.</p>
      </div>
    </section>
  ` : "";

  document.title = `${job.title} - ${job.company} | JobSearch`;
  injectJsonLd(generateJobPostingJsonLd(job));

  const userProfile = readMatchProfile();
  const userResumeText = `${userProfile.targetRole || ""} ${userProfile.skills || ""} ${userProfile.experience || ""}`;
  const jobDescText = `${job.title} ${job.description} ${(job.requirements || []).join(" ")}`;
  const atsResult = analyzeAtsMatch(userResumeText, jobDescText);
  const atsScoreClass = atsResult.score >= 70 ? "" : (atsResult.score >= 40 ? "ats-scorecard__circle--warning" : "ats-scorecard__circle--danger");

  const atsBlock = `
    <div class="detail-sidebar-card" aria-labelledby="ats-score-title">
      <div class="ats-scorecard__header">
        <div>
          <h2 class="title-medium" id="ats-score-title" style="margin:0;font-size:15px;">Analisis ATS & Kualifikasi</h2>
          <p class="body-medium" style="margin:3px 0 0;font-size:12px;">Kecocokan profil Anda dengan kualifikasi lowongan</p>
        </div>
        <span class="ats-scorecard__circle ${atsScoreClass}">${atsResult.score}%</span>
      </div>
      <p class="body-medium" style="font-size:13px;line-height:1.5;">${escapeHtml(atsResult.recommendation)}</p>
      ${atsResult.matched.length ? `
        <div style="margin-top:12px;">
          <span class="label-small" style="font-weight:700;font-size:11px;color:var(--md-sys-color-on-surface);">Kata Kunci Cocok (${atsResult.matched.length}):</span>
          <div class="ats-keyword-chips">
            ${atsResult.matched.map((kw) => `<span class="ats-chip">${escapeHtml(kw)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      ${atsResult.missing.length ? `
        <div style="margin-top:12px;">
          <span class="label-small" style="font-weight:700;font-size:11px;color:#c62828;">Kata Kunci Perlu Ditambahkan (${atsResult.missing.length}):</span>
          <div class="ats-keyword-chips">
            ${atsResult.missing.map((kw) => `<span class="ats-chip ats-chip--missing">${escapeHtml(kw)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;

  let salaryTakeHomeHtml = "";
  if (job.salary && (job.salary.min || job.salary.max)) {
    const rawAmt = job.salary.min && job.salary.max
      ? Math.round((job.salary.min + job.salary.max) / 2)
      : (job.salary.min || job.salary.max || 0);
    const curr = (job.salary.currency || "IDR").toUpperCase();
    const period = job.salary.period || "monthly";
    if (rawAmt > 0 && curr !== "NAN") {
      try {
        const est = estimateTakeHomePay({
          grossAmount: rawAmt,
          currency: curr,
          period: period,
          taxMode: "employee"
        });
        salaryTakeHomeHtml = `
          <div class="detail-sidebar-card">
            <div class="ats-scorecard__header" style="align-items:flex-start;">
              <div>
                <strong class="title-medium" style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--md-sys-color-on-surface);">
                  <span class="material-symbols-outlined" style="color:var(--md-sys-color-primary);font-size:18px;">account_balance_wallet</span>
                  Estimasi Gaji Bersih (PPh 21)
                </strong>
                <p class="body-medium" style="margin:2px 0 0;font-size:11px;color:var(--md-sys-color-outline);">
                  Perkiraan gaji bersih bulanan setelah PPh 21 (Tarif Progresif UU HPP).
                </p>
              </div>
              <span class="badge badge-fresh" style="font-weight:700;font-size:12px;padding:3px 7px;border-radius:6px;">${est.formatted.netMonthlyIdr}/bln</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;font-size:12px;">
              <div>
                <span class="label-small" style="color:var(--md-sys-color-outline);">Gaji Kotor Bulanan</span>
                <div style="font-weight:700;font-size:13px;color:var(--md-sys-color-on-surface);">${est.formatted.grossMonthlyIdr}</div>
              </div>
              <div>
                <span class="label-small" style="color:var(--md-sys-color-outline);">Estimasi Potongan Pajak</span>
                <div style="font-weight:700;font-size:13px;color:#c62828;">- ${est.formatted.monthlyTax}</div>
              </div>
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--md-sys-color-outline-variant);display:flex;align-items:center;justify-content:space-between;">
              <span class="label-small" style="color:var(--md-sys-color-outline);font-weight:700;">Take-Home Masuk Rekening</span>
              <strong style="font-size:14px;color:#2e7d32;">${est.formatted.netMonthlyIdr}</strong>
            </div>
          </div>
        `;
      } catch (e) {
        console.warn("Salary estimation error:", e);
      }
    }
  }

  const rawDesc = String(job.description || "").trim();
  const detailDescription = (rawDesc && rawDesc.toLowerCase() !== "nan" && rawDesc.toLowerCase() !== "null")
    ? rawDesc
    : `Perusahaan ${job.company || "Terkait"} membuka lowongan resmi untuk posisi ${job.title || "ini"} di ${job.location || "Indonesia"}. Silakan klik tombol 'Lamar di Situs Resmi' untuk melihat rincian kualifikasi dan mengajukan lamaran langsung di portal resmi penyedia.`;

  const rawAboutCo = String(job.about_company || "").trim();
  const detailAboutCompany = (rawAboutCo && rawAboutCo.toLowerCase() !== "nan" && rawAboutCo.toLowerCase() !== "null")
    ? rawAboutCo
    : `${job.company || "Perusahaan ini"} membuka kesempatan berkarir resmi untuk talenta profesional di bidang ${job.category || "terkait"}.`;

  const detailRequirements = (Array.isArray(job.requirements) && job.requirements.length > 0)
    ? job.requirements.filter((r) => r && String(r).trim().toLowerCase() !== "nan")
    : [
        `Pengalaman profesional yang relevan di bidang ${job.category || "terkait"}.`,
        `Keahlian teknis dan komunikasi kerja yang handal.`,
        `Informasi kualifikasi selengkapnya dapat diakses langsung pada portal resmi penyedia lowongan.`
      ];

  root.innerHTML = `
    <!-- Top Breadcrumb Bar -->
    <nav class="detail-breadcrumb-bar" aria-label="Navigasi halaman">
      <div class="detail-breadcrumb-bar__left">
        <a class="detail-back-link" href="search.html">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span>Kembali ke Pencarian</span>
        </a>
        <span class="detail-breadcrumb-separator" aria-hidden="true">/</span>
        <span class="detail-breadcrumb-item">${escapeHtml(job.category || "Lowongan")}</span>
        <span class="detail-breadcrumb-separator" aria-hidden="true">/</span>
        <span class="detail-breadcrumb-item detail-breadcrumb-item--current">${escapeHtml(job.company)}</span>
      </div>
      <div class="detail-breadcrumb-bar__right">
        <button
          class="icon-button js-bookmark-toggle"
          type="button"
          data-job-id="${escapeHtml(job.id)}"
          aria-label="${bookmarked ? "Hapus dari tersimpan" : "Simpan lowongan"}"
          title="${bookmarked ? "Hapus dari tersimpan" : "Simpan lowongan"}"
          aria-pressed="${String(bookmarked)}"
        >
          <span class="${bookmarkIconClass}" aria-hidden="true">${bookmarked ? "bookmark" : "bookmark_border"}</span>
        </button>
        <button class="icon-button" type="button" id="share-button" aria-label="Bagikan lowongan" title="Bagikan lowongan">
          <span class="material-symbols-outlined" aria-hidden="true">share</span>
        </button>
      </div>
    </nav>

    <!-- 2-Column Responsive Symmetrical Architecture -->
    <div class="detail-grid">
      <!-- Main Column -->
      <div class="detail-grid__main stack">
        <!-- Hero Header Card -->
        <section class="detail-card detail-card--hero" aria-labelledby="detail-title">
          <div class="detail-card__header-row">
            ${renderCompanyAvatar(job.company, "detail-card__logo")}
            <div class="detail-card__header-info">
              <div class="detail-card__meta-top">
                <span class="detail-card__company">${escapeHtml(job.company)}</span>
                <span class="detail-card__dot">·</span>
                <span class="detail-card__location">
                  <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                  ${escapeHtml(job.location)}
                </span>
                ${freshnessBadge}
              </div>
              <h1 class="detail-card__title" id="detail-title">${escapeHtml(job.title)}</h1>
              <div class="detail-card__pills">
                ${renderChips(job.type)}
                ${renderSourceBadge(job)}
              </div>
            </div>
          </div>

          <!-- Symmetrical Key Metrics Grid -->
          <div class="detail-metrics-grid">
            <div class="detail-metric-card">
              <span class="detail-metric-label">Estimasi Kompensasi</span>
              <span class="detail-metric-value detail-metric-value--salary">${escapeHtml(formatSalary(job.salary))}</span>
              ${salaryOriginal ? `<span class="detail-metric-sub">${escapeHtml(salaryOriginal)}</span>` : ""}
            </div>
            <div class="detail-metric-card">
              <span class="detail-metric-label">Tipe Pekerjaan</span>
              <span class="detail-metric-value">${escapeHtml(job.type || "Full-time")}</span>
              <span class="detail-metric-sub">${escapeHtml(job.category || "Profesional")}</span>
            </div>
            <div class="detail-metric-card">
              <span class="detail-metric-label">Verifikasi Portal</span>
              <span class="detail-metric-value" style="color:var(--md-sys-color-primary);">Terverifikasi</span>
              <span class="detail-metric-sub">${escapeHtml(job.source?.name || "Official ATS")}</span>
            </div>
          </div>

          <!-- Trust Signals Row -->
          <div class="detail-trust-signals">
            <span class="detail-trust-pill"><span class="material-symbols-outlined" aria-hidden="true">payments</span> Gaji Transparan</span>
            <span class="detail-trust-pill"><span class="material-symbols-outlined" aria-hidden="true">verified</span> Link Resmi Terverifikasi</span>
            <span class="detail-trust-pill"><span class="material-symbols-outlined" aria-hidden="true">public</span> Lokasi Kerja Jelas</span>
          </div>

          <!-- Balanced Actions Grid -->
          <div class="detail-card-actions">
            <a class="button button--primary" href="${escapeHtml(directApplyUrl)}" target="_blank" rel="noopener noreferrer" id="hero-direct-apply-btn" data-track-apply-intent="${escapeHtml(job.id)}">
              <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              Lamar di Situs Resmi ↗
            </a>
            <a class="button button--tonal" href="${escapeHtml(trackerHref)}" id="hero-tracker-btn">
              <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
              ${isTracked ? "Buka di Tracker" : "Catat ke Tracker"}
            </a>
            <button class="button button--outlined" type="button" id="generate-cover-letter-btn">
              <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              Draf Cover Letter AI
            </button>
            <button class="button button--outlined" type="button" id="generate-outreach-btn">
              <span class="material-symbols-outlined" aria-hidden="true">alternate_email</span>
              Sapa Recruiter (DM)
            </button>
          </div>

          <div id="cover-letter-container" style="display:none;margin-top:20px;"></div>
          <div id="outreach-container" style="display:none;margin-top:20px;"></div>
        </section>

        <!-- Description Card -->
        <section class="detail-card" aria-labelledby="about-job-title">
          <h2 class="detail-card__section-title" id="about-job-title">
            <span class="material-symbols-outlined" aria-hidden="true">description</span>
            Tentang Pekerjaan
          </h2>
          <div class="detail-card__prose">
            <p>${escapeHtml(detailDescription)}</p>
          </div>
        </section>

        <!-- Requirements Card -->
        <section class="detail-card" aria-labelledby="requirements-title">
          <h2 class="detail-card__section-title" id="requirements-title">
            <span class="material-symbols-outlined" aria-hidden="true">checklist</span>
            Persyaratan & Kualifikasi
          </h2>
          <ul class="detail-requirements-list">
            ${detailRequirements.map((item) => `
              <li class="detail-requirement-item">
                <span class="material-symbols-outlined detail-requirement-icon" aria-hidden="true">check_circle</span>
                <span>${escapeHtml(item)}</span>
              </li>
            `).join("")}
          </ul>
        </section>

        <!-- Company Card -->
        <section class="detail-card" aria-labelledby="company-title">
          <h2 class="detail-card__section-title" id="company-title">
            <span class="material-symbols-outlined" aria-hidden="true">apartment</span>
            Tentang Perusahaan
          </h2>
          <div class="company-strip" style="margin-bottom:14px;">
            ${renderCompanyAvatar(job.company, "company-strip__logo")}
            <div>
              <strong style="font-size:16px;">${escapeHtml(job.company)}</strong>
              <p class="body-medium">${escapeHtml(job.category || "Teknologi")} · ${escapeHtml(job.location || "Indonesia")}</p>
            </div>
          </div>
          <div class="detail-card__prose">
            <p>${escapeHtml(detailAboutCompany)}</p>
          </div>
        </section>

        ${sourceBlock}
      </div>

      <!-- Sticky Sidebar Column -->
      <aside class="detail-grid__sidebar">
        <div class="detail-sidebar-sticky">
          <!-- Quick Apply Card -->
          <div class="detail-sidebar-card detail-sidebar-card--cta">
            <div class="detail-sidebar-card__header">
              <span class="label-large" style="color:var(--md-sys-color-on-surface);font-weight:700;">Aksi Lamaran Cepat</span>
              <span class="badge badge--active">${escapeHtml(job.source?.name || "Official")}</span>
            </div>
            <div class="detail-sidebar-salary-box">
              <span class="label-small" style="color:var(--md-sys-color-outline);font-weight:700;">Kompensasi Ditawarkan</span>
              <div class="detail-sidebar-salary-amount">${escapeHtml(formatSalary(job.salary))}</div>
              ${salaryOriginal ? `<div class="detail-sidebar-salary-converted">${escapeHtml(salaryOriginal)}</div>` : ""}
            </div>
            <a class="button button--primary button--large button--full" href="${escapeHtml(directApplyUrl)}" target="_blank" rel="noopener noreferrer" id="sidebar-direct-apply-btn" data-track-apply-intent="${escapeHtml(job.id)}">
              <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              Lamar di Situs Resmi ↗
            </a>
            <a class="button button--tonal button--full" href="${escapeHtml(trackerHref)}" id="sidebar-tracker-btn">
              <span class="material-symbols-outlined" aria-hidden="true">assignment</span>
              ${isTracked ? "Buka di Tracker" : "Catat ke Tracker Lamaran"}
            </a>
            <div class="detail-sidebar-notice">
              <span class="material-symbols-outlined" aria-hidden="true">shield</span>
              <span>Tautan langsung ke form pendaftaran resmi. Bebas biaya dan bebas penipuan.</span>
            </div>
          </div>

          <!-- ATS Scorecard -->
          ${atsBlock}

          <!-- Tax / Take Home Pay Engine -->
          ${salaryTakeHomeHtml}
        </div>
      </aside>
    </div>

    <!-- Similar Jobs Section (Full Width Responsive Grid) -->
    <section class="detail-similar-section" aria-labelledby="similar-title">
      <div class="section__header">
        <h2 class="headline-small" id="similar-title">Lowongan Serupa</h2>
        <a class="button button--text" href="search.html">Lihat Semua</a>
      </div>
      <div class="job-grid">
        ${similarJobs.slice(0, 3).map((candidate) => renderJobCard(candidate, { compact: false })).join("")}
      </div>
    </section>
  `;

  initBookmarkButtons(page, ({ bookmarked }) => {
    showSnackbar(bookmarked ? "Lowongan disimpan" : "Lowongan dihapus dari tersimpan");
  });

  // Direct Apply handlers with auto-tracking
  const handleDirectApply = (e) => {
    trackEvent("apply_intent", { jobId: job.id, source: job.source?.key || "local" });
    autoTrackJob(job, "Applied");
    showSnackbar("Membuka portal resmi... Lowongan otomatis dicatat ke Tracker Lamaran.");
  };

  document.getElementById("hero-direct-apply-btn")?.addEventListener("click", handleDirectApply);
  document.getElementById("sidebar-direct-apply-btn")?.addEventListener("click", handleDirectApply);

  const handleTrackerClick = () => {
    autoTrackJob(job, "Saved");
  };

  document.getElementById("hero-tracker-btn")?.addEventListener("click", handleTrackerClick);
  document.getElementById("sidebar-tracker-btn")?.addEventListener("click", handleTrackerClick);

  let clLanguage = "id";
  let clTone = "professional";

  function refreshCoverLetterText() {
    const textEl = document.getElementById("cover-letter-text");
    if (textEl) {
      textEl.value = generateCoverLetter({
        profile: userProfile,
        job,
        language: clLanguage,
        tone: clTone
      });
    }
  }

  document.getElementById("generate-cover-letter-btn")?.addEventListener("click", () => {
    const clContainer = document.getElementById("cover-letter-container");
    if (!clContainer) return;

    if (clContainer.style.display === "block") {
      clContainer.style.display = "none";
      return;
    }

    const draft = generateCoverLetter({ profile: userProfile, job, language: clLanguage, tone: clTone });
    clContainer.innerHTML = `
      <div class="ats-scorecard" style="background:var(--md-sys-color-surface-container-low);margin:0;border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:16px;">
        <div class="ats-scorecard__header">
          <strong class="title-medium" style="font-size:15px;">Draf Cover Letter AI</strong>
          <button class="button button--small button--tonal" id="copy-cover-letter-btn" type="button">
            <span class="material-symbols-outlined" style="font-size:16px;">content_copy</span>
            Salin Teks
          </button>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 8px;align-items:center;">
          <span class="label-small" style="font-weight:700;">Bahasa:</span>
          <button type="button" class="chip chip--small ${clLanguage === 'id' ? 'chip--active' : 'chip--outline'}" data-cl-lang="id">🇮🇩 ID</button>
          <button type="button" class="chip chip--small ${clLanguage === 'en' ? 'chip--active' : 'chip--outline'}" data-cl-lang="en">🇬🇧 EN</button>

          <span class="label-small" style="font-weight:700;margin-left:8px;">Gaya:</span>
          <button type="button" class="chip chip--small ${clTone === 'professional' ? 'chip--active' : 'chip--outline'}" data-cl-tone="professional">Formal</button>
          <button type="button" class="chip chip--small ${clTone === 'confident' ? 'chip--active' : 'chip--outline'}" data-cl-tone="confident">Berdampak</button>
          <button type="button" class="chip chip--small ${clTone === 'concise' ? 'chip--active' : 'chip--outline'}" data-cl-tone="concise">Ringkas</button>
        </div>

        <textarea class="field__input" id="cover-letter-text" rows="10" style="font-size:13px;width:100%;margin-top:8px;resize:vertical;line-height:1.5;">${escapeHtml(draft)}</textarea>
      </div>
    `;
    clContainer.style.display = "block";

    clContainer.querySelectorAll("[data-cl-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        clLanguage = btn.getAttribute("data-cl-lang");
        clContainer.querySelectorAll("[data-cl-lang]").forEach(b => {
          const active = b.getAttribute("data-cl-lang") === clLanguage;
          b.className = `chip chip--small ${active ? "chip--active" : "chip--outline"}`;
        });
        refreshCoverLetterText();
      });
    });

    clContainer.querySelectorAll("[data-cl-tone]").forEach(btn => {
      btn.addEventListener("click", () => {
        clTone = btn.getAttribute("data-cl-tone");
        clContainer.querySelectorAll("[data-cl-tone]").forEach(b => {
          const active = b.getAttribute("data-cl-tone") === clTone;
          b.className = `chip chip--small ${active ? "chip--active" : "chip--outline"}`;
        });
        refreshCoverLetterText();
      });
    });

    document.getElementById("copy-cover-letter-btn")?.addEventListener("click", async () => {
      const text = document.getElementById("cover-letter-text")?.value;
      if (text) {
        await copyText(text);
        showSnackbar("Draf Cover Letter disalin ke clipboard!");
      }
    });
  });

  let outreachChannel = "linkedin_note";
  let outreachLang = "id";

  function refreshOutreachText() {
    const textEl = document.getElementById("outreach-text");
    const countEl = document.getElementById("outreach-char-count");
    if (textEl) {
      const targetPerson = outreachChannel === "engineering_manager" ? "engineering_manager" : "recruiter";
      const channel = outreachChannel === "engineering_manager" ? "email" : outreachChannel;
      const msg = generateOutreachMessage({
        job,
        profile: userProfile,
        targetPerson,
        channel,
        language: outreachLang
      });
      textEl.value = msg;
      if (countEl) countEl.textContent = `${msg.length} karakter`;
    }
  }

  document.getElementById("generate-outreach-btn")?.addEventListener("click", () => {
    const outContainer = document.getElementById("outreach-container");
    if (!outContainer) return;

    if (outContainer.style.display === "block") {
      outContainer.style.display = "none";
      return;
    }

    outContainer.innerHTML = `
      <div class="ats-scorecard" style="background:var(--md-sys-color-surface-container-low);margin:0;border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:16px;">
        <div class="ats-scorecard__header">
          <div>
            <strong class="title-medium" style="font-size:15px;">Draf Pesan Sapaan (Outreach) Recruiter</strong>
            <p class="body-medium" style="font-size:12px;color:var(--md-sys-color-outline);margin:2px 0 0;">Kirim via DM LinkedIn atau cold-email untuk tingkatkan respon 3x lipat.</p>
          </div>
          <button class="button button--small button--tonal" id="copy-outreach-btn" type="button">
            <span class="material-symbols-outlined" style="font-size:16px;">content_copy</span>
            Salin Pesan
          </button>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 8px;align-items:center;">
          <span class="label-small" style="font-weight:700;">Tujuan:</span>
          <button type="button" class="chip chip--small ${outreachChannel === 'linkedin_note' ? 'chip--active' : 'chip--outline'}" data-outreach-ch="linkedin_note">LinkedIn Note (&lt;300 Karakter)</button>
          <button type="button" class="chip chip--small ${outreachChannel === 'email' ? 'chip--active' : 'chip--outline'}" data-outreach-ch="email">Email Recruiter</button>
          <button type="button" class="chip chip--small ${outreachChannel === 'engineering_manager' ? 'chip--active' : 'chip--outline'}" data-outreach-ch="engineering_manager">Lead / Eng Manager</button>

          <span class="label-small" style="font-weight:700;margin-left:8px;">Bahasa:</span>
          <button type="button" class="chip chip--small ${outreachLang === 'id' ? 'chip--active' : 'chip--outline'}" data-outreach-lang="id">🇮🇩 ID</button>
          <button type="button" class="chip chip--small ${outreachLang === 'en' ? 'chip--active' : 'chip--outline'}" data-outreach-lang="en">🇬🇧 EN</button>
        </div>

        <textarea class="field__input" id="outreach-text" rows="7" style="font-size:13px;width:100%;margin-top:8px;resize:vertical;line-height:1.5;"></textarea>
        <div style="text-align:right;margin-top:4px;">
          <span class="label-small" id="outreach-char-count" style="color:var(--md-sys-color-outline);font-size:11px;"></span>
        </div>
      </div>
    `;
    outContainer.style.display = "block";
    refreshOutreachText();

    outContainer.querySelectorAll("[data-outreach-ch]").forEach(btn => {
      btn.addEventListener("click", () => {
        outreachChannel = btn.getAttribute("data-outreach-ch");
        outContainer.querySelectorAll("[data-outreach-ch]").forEach(b => {
          b.className = `chip chip--small ${b.getAttribute("data-outreach-ch") === outreachChannel ? "chip--active" : "chip--outline"}`;
        });
        refreshOutreachText();
      });
    });

    outContainer.querySelectorAll("[data-outreach-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        outreachLang = btn.getAttribute("data-outreach-lang");
        outContainer.querySelectorAll("[data-outreach-lang]").forEach(b => {
          b.className = `chip chip--small ${b.getAttribute("data-outreach-lang") === outreachLang ? "chip--active" : "chip--outline"}`;
        });
        refreshOutreachText();
      });
    });

    document.getElementById("copy-outreach-btn")?.addEventListener("click", async () => {
      const text = document.getElementById("outreach-text")?.value;
      if (text) {
        await copyText(text);
        showSnackbar("Pesan Outreach disalin ke clipboard!");
      }
    });
  });

  document.getElementById("share-button")?.addEventListener("click", async () => {
    trackEvent("job_share", { jobId: job.id, source: job.source?.key || "local" });
    await shareJob(job);
  });

  root.querySelector("[data-track-apply-intent]")?.addEventListener("click", () => {
    trackEvent("apply_intent", { jobId: job.id, source: job.source?.key || "local" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initShellNavigation();
  initBookmarksPage();
  initDetailPage();
});
