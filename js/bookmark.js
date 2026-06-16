import {
  formatDateLong,
  formatPostedDate,
  formatSalaryOriginal,
  formatSalary,
  getJobQualitySignals,
  getJobById,
  getSimilarJobs
} from "./data.js?v=20260616v";
import { fetchJobById } from "./providers.js?v=20260616v";
import { scoreJobForProfile } from "./profile.js?v=20260616v";
import { recordPageView, trackEvent } from "./analytics.js?v=20260616v";

export const BOOKMARK_KEY = "jsa_bookmarks";

const APP_VERSION = "20260616v";
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
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
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

function renderSourceBadge(job) {
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
                <span class="job-card__meta-text">${escapeHtml(formatPostedDate(job.posted))}</span>
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
          ${salaryOriginal ? `<div class="job-card__salary-note">Asli: ${escapeHtml(salaryOriginal)}</div>` : ""}
        </div>
      </a>
      <button
        class="icon-button job-card__save js-bookmark-toggle"
        type="button"
        data-job-id="${escapeHtml(job.id)}"
        ${removable ? 'data-remove-on-unsave="true"' : ""}
        aria-label="${bookmarked ? "Hapus dari lowongan tersimpan" : "Simpan lowongan"}"
        aria-pressed="${String(bookmarked)}"
      >
        <span class="${iconClass}" aria-hidden="true">${bookmarked ? "bookmark" : "bookmark_border"}</span>
      </button>
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

  root.addEventListener("click", (event) => {
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

export function showSnackbar(message) {
  let snackbar = document.querySelector(".snackbar");
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";
    snackbar.setAttribute("role", "status");
    document.body.append(snackbar);
  }

  snackbar.textContent = message;
  snackbar.classList.add("snackbar--visible");
  window.clearTimeout(showSnackbar.timer);
  showSnackbar.timer = window.setTimeout(() => {
    snackbar.classList.remove("snackbar--visible");
  }, 2600);
}

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
  const externalApply = Boolean(job.applyUrl);
  const applyHref = `apply.html?id=${encodeURIComponent(job.id)}&app=${APP_VERSION}`;
  const applyText = externalApply ? "Lamar & Catat di Tracker" : "Cek Cara Melamar";
  const salaryOriginal = formatSalaryOriginal(job.salary);
  const sourceBlock = job.source?.name ? `
    <section class="content-block" aria-labelledby="source-title">
      <h2 id="source-title">Sumber Lowongan</h2>
      <p>Data lowongan ini berasal dari <a class="text-link" href="${escapeHtml(job.source.url || job.applyUrl || "#")}" target="_blank" rel="noopener">${escapeHtml(job.source.name)}</a>. Ikuti instruksi apply di halaman sumber resmi.</p>
    </section>
  ` : "";

  document.title = `${job.title} - ${job.company} | JobSearch`;
  root.innerHTML = `
    <section class="detail-hero" aria-labelledby="detail-title">
      <div class="detail-hero__top">
        <a class="button button--text" href="search.html">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Back
        </a>
        <button
          class="icon-button js-bookmark-toggle"
          type="button"
          data-job-id="${escapeHtml(job.id)}"
          aria-label="${bookmarked ? "Hapus dari lowongan tersimpan" : "Simpan lowongan"}"
          aria-pressed="${String(bookmarked)}"
        >
          <span class="${bookmarkIconClass}" aria-hidden="true">${bookmarked ? "bookmark" : "bookmark_border"}</span>
        </button>
      </div>

      <div class="detail-hero__identity">
        ${renderCompanyAvatar(job.company, "detail-hero__logo")}
        <div>
          <h1 class="display-small" id="detail-title">${escapeHtml(job.title)}</h1>
          <p class="body-medium">${escapeHtml(job.company)} . ${escapeHtml(job.location)}</p>
          <div class="cluster" aria-label="Tipe lowongan">${renderChips(job.type)}${renderSourceBadge(job)}</div>
        </div>
      </div>

      <div>
        <div class="job-card__salary">${escapeHtml(formatSalary(job.salary))}</div>
        ${salaryOriginal ? `<div class="job-card__salary-note">Asli: ${escapeHtml(salaryOriginal)}</div>` : ""}
      </div>
      <div class="job-card__quality">${renderQualitySignals(job)}</div>
      <div class="detail-actions">
        <a class="button button--primary button--full" href="${escapeHtml(applyHref)}" data-track-apply-intent="${escapeHtml(job.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">send</span>
          ${escapeHtml(applyText)}
        </a>
        <button class="icon-button" type="button" id="share-button" aria-label="Bagikan lowongan">
          <span class="material-symbols-outlined" aria-hidden="true">share</span>
        </button>
      </div>
    </section>

    <section class="content-block" aria-labelledby="about-job-title">
      <h2 id="about-job-title">Tentang Pekerjaan</h2>
      <p>${escapeHtml(job.description)}</p>
    </section>

    <section class="content-block" aria-labelledby="requirements-title">
      <h2 id="requirements-title">Persyaratan</h2>
      <ul class="requirement-list">
        ${job.requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <section class="content-block" aria-labelledby="company-title">
      <h2 id="company-title">Tentang Perusahaan</h2>
      <div class="company-strip">
        ${renderCompanyAvatar(job.company, "company-strip__logo")}
        <div>
          <strong>${escapeHtml(job.company)}</strong>
          <p class="body-medium">${escapeHtml(job.category)} . 51-200 karyawan</p>
        </div>
      </div>
      <p>${escapeHtml(job.about_company)}</p>
    </section>

    ${sourceBlock}

    <section class="content-block" aria-labelledby="similar-title">
      <div class="section__header">
        <h2 id="similar-title">Lowongan Serupa</h2>
      </div>
      <div class="horizontal-scroll">
        ${similarJobs.map((candidate) => renderJobCard(candidate, { compact: true })).join("")}
      </div>
    </section>
  `;

  initBookmarkButtons(page, ({ bookmarked }) => {
    showSnackbar(bookmarked ? "Lowongan disimpan" : "Lowongan dihapus dari tersimpan");
  });

  document.getElementById("share-button")?.addEventListener("click", async () => {
    const shareData = {
      title: `${job.title} di ${job.company}`,
      text: `Lowongan ${job.title} di ${job.company}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(shareData.url);
        showSnackbar("Link lowongan disalin");
      }
      trackEvent("job_share", { jobId: job.id, source: job.source?.key || "local" });
    } catch (error) {
      if (error.name !== "AbortError") showSnackbar("Gagal membagikan link");
    }
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
