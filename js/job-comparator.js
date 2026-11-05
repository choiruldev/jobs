/**
 * Side-by-Side Job Comparator Controller
 * Allows candidates to select up to 3 jobs and compare them across salary, ATS score, remote tier, and culture.
 */

import { getJobById, formatSalary } from "./data.js?v=20261106a";
import { fetchJobById } from "./providers.js?v=20261106a";
import { scoreJobForProfile } from "./profile.js?v=20261106a";
import { evaluateCompanyCulture } from "./company-radar.js?v=20261106a";
import { estimateTakeHomePay } from "./salary-calculator.js?v=20261106a";

const COMPARATOR_STORAGE_KEY = "jsa_comparator_ids_v1";

function escapeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function readComparatorIds() {
  try {
    const raw = localStorage.getItem(COMPARATOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch (err) {
    return [];
  }
}

export function isJobCompared(jobId) {
  return readComparatorIds().includes(jobId);
}

export function writeComparatorIds(ids) {
  try {
    localStorage.setItem(COMPARATOR_STORAGE_KEY, JSON.stringify([...new Set(ids)].slice(0, 3)));
    return true;
  } catch (err) {
    return false;
  }
}

export function syncCompareButtons(root = document) {
  if (typeof document === "undefined") return;
  const activeSet = new Set(readComparatorIds());
  root.querySelectorAll(".js-compare-toggle").forEach((btn) => {
    const id = btn.dataset.jobId;
    const active = Boolean(id && activeSet.has(id));
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
    btn.setAttribute("aria-label", active ? "Hapus dari perbandingan" : "Bandingkan lowongan");
    btn.setAttribute("title", active ? "Hapus dari perbandingan" : "Bandingkan lowongan");
  });
}

export function toggleJobComparison(jobId) {
  let ids = readComparatorIds();
  let added = false;
  if (ids.includes(jobId)) {
    ids = ids.filter((id) => id !== jobId);
  } else {
    if (ids.length >= 3) {
      ids.shift();
    }
    ids.push(jobId);
    added = true;
  }
  writeComparatorIds(ids);
  syncCompareButtons();
  renderComparatorTrigger();
  return { ids, added };
}

export function renderComparatorTrigger() {
  if (typeof document === "undefined") return;
  const ids = readComparatorIds();
  let trigger = document.getElementById("job-comparator-floating-bar");

  if (!ids.length) {
    if (trigger) trigger.remove();
    return;
  }

  if (!trigger) {
    trigger = document.createElement("div");
    trigger.id = "job-comparator-floating-bar";
    trigger.className = "comparator-floating-bar";
    document.body.appendChild(trigger);
    trigger.addEventListener("click", openComparisonModal);
  }

  trigger.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:20px;" aria-hidden="true">compare_arrows</span>
    <span>Bandingkan (${ids.length}/3)</span>
    <button type="button" class="comparator-floating-bar__clear" id="clear-comparator-btn" aria-label="Bersihkan daftar perbandingan" title="Reset perbandingan">
      <span class="material-symbols-outlined" style="font-size:16px;" aria-hidden="true">close</span>
    </button>
  `;

  trigger.querySelector("#clear-comparator-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    writeComparatorIds([]);
    syncCompareButtons();
    trigger.remove();
  });
}

export async function openComparisonModal() {
  const ids = readComparatorIds();
  if (!ids.length) return;

  const jobs = [];
  for (const id of ids) {
    let job = getJobById(id);
    if (!job) {
      try {
        job = await fetchJobById(id);
      } catch (e) {}
    }
    if (job) jobs.push(job);
  }

  if (!jobs.length) return;

  const detailBase = window.location.pathname.includes("/pages/") ? "detail.html" : "pages/detail.html";

  let modal = document.getElementById("job-comparator-modal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "job-comparator-modal";
  modal.className = "comparator-modal-backdrop";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "comparator-modal-title");

  modal.innerHTML = `
    <div class="comparator-modal-card">
      <div class="comparator-modal-header">
        <div>
          <h2 class="title-large" id="comparator-modal-title" style="margin:0;font-size:20px;">Bandingkan Lowongan (${jobs.length}/3)</h2>
          <p class="body-medium" style="font-size:13px;color:var(--md-sys-color-outline);margin-top:2px;">
            ${jobs.length < 2 ? "Pilih 1–2 lowongan lagi pada kartu lowongan untuk membandingkan berdampingan." : "Perbandingan gaji bersih, skor kecocokan profil, dan kultur kerja berdampingan."}
          </p>
        </div>
        <button type="button" class="icon-button" id="close-comparator-modal-btn" aria-label="Tutup perbandingan">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="comparator-modal-grid" style="--compare-cols:${jobs.length};">
        ${jobs.map((job) => {
          const match = scoreJobForProfile(job);
          const culture = evaluateCompanyCulture({ badges: job.tags, description: job.description });
          const sourceLabel = escapeText(job.sourcePlatform || job.source?.name || "Portal Resmi");

          let netSalaryStr = "Sesuai negosiasi";
          if (job.salary && (job.salary.min || job.salary.max)) {
            const raw = job.salary.min || job.salary.max;
            try {
              const est = estimateTakeHomePay({
                grossAmount: raw,
                currency: job.salary.currency || "IDR",
                period: job.salary.period || "monthly"
              });
              netSalaryStr = `~${est.formatted.netMonthlyIdr}/bln`;
            } catch (e) {}
          }

          return `
            <div class="comparator-job-col">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
                  <div class="cluster" style="gap:6px;">
                    <span class="badge badge--active" style="font-size:11px;">${sourceLabel}</span>
                    <span class="job-card__chip">${escapeText(job.location || "Remote")}</span>
                  </div>
                  <button type="button" class="icon-button js-remove-compare-item" data-job-id="${escapeText(job.id)}" style="width:30px;height:30px;" aria-label="Hapus ${escapeText(job.title)} dari perbandingan" title="Hapus dari perbandingan">
                    <span class="material-symbols-outlined" style="font-size:16px;" aria-hidden="true">close</span>
                  </button>
                </div>
                <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;line-height:1.35;">
                  <a href="${detailBase}?id=${encodeURIComponent(job.id)}" style="color:inherit;text-decoration:none;">${escapeText(job.title)}</a>
                </h3>
                <div style="font-weight:600;font-size:13px;color:var(--md-sys-color-outline);margin-bottom:14px;">${escapeText(job.company)}</div>

                <div class="stack" style="gap:10px;font-size:13px;">
                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Estimasi Gaji:</span>
                    <div style="font-weight:700;margin-top:2px;">${escapeText(formatSalary(job.salary))}</div>
                    <div style="font-size:12px;color:var(--md-sys-color-success);font-weight:700;">Bersih: ${escapeText(netSalaryStr)}</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Kecocokan Profil (ATS):</span>
                    <div style="font-weight:800;color:var(--md-sys-color-primary);font-size:15px;margin-top:2px;">${match.hasProfile ? `${match.score}% Cocok` : "Isi Profil Match untuk skor"}</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Radar Kultur Kerja:</span>
                    <div style="font-weight:700;margin-top:2px;">${culture.score}/100 (${escapeText(culture.healthLabel)})</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Tipe Kerja:</span>
                    <div style="font-weight:600;margin-top:2px;">${escapeText(Array.isArray(job.type) ? job.type.join(" · ") : (job.type || "Full-time"))}</div>
                  </div>
                </div>
              </div>

              <div style="margin-top:16px;">
                <a class="button button--primary button--full button--small" href="${detailBase}?id=${encodeURIComponent(job.id)}">
                  Lihat Detail Lowongan
                </a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    window.removeEventListener("keydown", handleKeydown);
    modal.remove();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape") closeModal();
  };
  window.addEventListener("keydown", handleKeydown);

  modal.querySelector("#close-comparator-modal-btn")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelectorAll(".js-remove-compare-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.jobId;
      if (!targetId) return;
      const { ids: nextIds } = toggleJobComparison(targetId);
      closeModal();
      if (nextIds.length > 0) {
        openComparisonModal();
      }
    });
  });
}
