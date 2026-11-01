/**
 * Side-by-Side Job Comparator Controller
 * Allows candidates to select 2 to 3 jobs and compare them across salary, ATS score, remote tier, and culture.
 */

import { getJobById, formatSalary } from "./data.js?v=20260616z";
import { readMatchProfile, scoreJobForProfile } from "./profile.js?v=20260616z";
import { evaluateCompanyCulture } from "./company-radar.js?v=20260616z";
import { escapeHtml, renderSourceBadge } from "./bookmark.js?v=20260616z";
import { estimateTakeHomePay } from "./salary-calculator.js?v=20260616z";

const COMPARATOR_STORAGE_KEY = "jsa_comparator_ids_v1";

export function readComparatorIds() {
  try {
    const raw = localStorage.getItem(COMPARATOR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function writeComparatorIds(ids) {
  try {
    localStorage.setItem(COMPARATOR_STORAGE_KEY, JSON.stringify(ids.slice(0, 3)));
    return true;
  } catch (err) {
    return false;
  }
}

export function toggleJobComparison(jobId) {
  let ids = readComparatorIds();
  if (ids.includes(jobId)) {
    ids = ids.filter(id => id !== jobId);
  } else {
    if (ids.length >= 3) {
      ids.shift(); // keep max 3
    }
    ids.push(jobId);
  }
  writeComparatorIds(ids);
  renderComparatorTrigger();
  return ids;
}

export function renderComparatorTrigger() {
  const ids = readComparatorIds();
  let trigger = document.getElementById("job-comparator-floating-bar");

  if (!ids.length) {
    if (trigger) trigger.remove();
    return;
  }

  if (!trigger) {
    trigger = document.createElement("div");
    trigger.id = "job-comparator-floating-bar";
    trigger.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      z-index: 100;
      background: var(--md-sys-color-primary, #1565c0);
      color: var(--md-sys-color-on-primary, #ffffff);
      padding: 10px 18px;
      border-radius: 30px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
    `;
    document.body.appendChild(trigger);
    trigger.addEventListener("click", openComparisonModal);
  }

  trigger.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:20px;">compare_arrows</span>
    <span>Bandingkan (${ids.length}/3)</span>
    <button type="button" id="clear-comparator-btn" style="background:transparent;border:none;color:#ffffff;cursor:pointer;padding:0;display:flex;align-items:center;">
      <span class="material-symbols-outlined" style="font-size:16px;">close</span>
    </button>
  `;

  trigger.querySelector("#clear-comparator-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    writeComparatorIds([]);
    trigger.remove();
  });
}

export function openComparisonModal() {
  const ids = readComparatorIds();
  const jobs = ids.map(id => getJobById(id)).filter(Boolean);

  if (!jobs.length) return;

  let modal = document.getElementById("job-comparator-modal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "job-comparator-modal";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="background:var(--md-sys-color-surface, #ffffff);color:var(--md-sys-color-on-surface, #111);width:100%;max-width:960px;max-height:90vh;border-radius:20px;padding:24px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);border:1px solid var(--md-sys-color-outline-variant);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid var(--md-sys-color-outline-variant);padding-bottom:12px;">
        <div>
          <h2 class="title-large" style="margin:0;font-size:20px;">Komparasi Lowongan Kerja</h2>
          <span class="body-medium" style="font-size:12px;color:var(--md-sys-color-outline);">Bandingkan gaji bersih, skor kecocokan profil, dan kultur kerja berdampingan.</span>
        </div>
        <button type="button" class="icon-button" id="close-comparator-modal-btn">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(${jobs.length}, 1fr);gap:16px;overflow-x:auto;">
        ${jobs.map(job => {
          const profile = readMatchProfile();
          const match = scoreJobForProfile(job);
          const culture = evaluateCompanyCulture({ badges: job.tags, description: job.description });

          // Take home pay estimate if numeric
          let netSalaryStr = "Kompetitif";
          if (job.salary && (job.salary.min || job.salary.max)) {
            const raw = job.salary.min || job.salary.max;
            try {
              const est = estimateTakeHomePay({ grossAmount: raw, currency: job.salary.currency || "IDR", period: job.salary.period || "monthly" });
              netSalaryStr = `${est.formatted.netMonthlyIdr}/bln`;
            } catch (e) {}
          }

          return `
            <div style="background:var(--md-sys-color-surface-container-low, #fafafa);border:1px solid var(--md-sys-color-outline-variant);border-radius:14px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div class="cluster" style="gap:6px;margin-bottom:6px;">
                  ${renderSourceBadge(job)}
                  <span class="chip chip--small">${escapeHtml(job.location)}</span>
                </div>
                <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;line-height:1.3;">${escapeHtml(job.title)}</h3>
                <div style="font-weight:600;font-size:13px;color:var(--md-sys-color-outline);margin-bottom:14px;">${escapeHtml(job.company)}</div>

                <div class="stack" style="gap:10px;font-size:13px;">
                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Gaji Kotor & Bersih:</span>
                    <div style="font-weight:700;">${escapeHtml(formatSalary(job.salary))}</div>
                    <div style="font-size:11px;color:#2e7d32;font-weight:700;">Bersih: ~${netSalaryStr}</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Kecocokan Profil (ATS):</span>
                    <div style="font-weight:800;color:var(--md-sys-color-primary);font-size:15px;">${match.score}% Cocok</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Radar Kultur Remote:</span>
                    <div style="font-weight:700;">${culture.score}/100 (${culture.healthLabel})</div>
                  </div>

                  <div style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:8px;">
                    <span class="label-small" style="color:var(--md-sys-color-outline);">Tipe Kerja:</span>
                    <div style="font-weight:600;">${(job.type || []).join(" • ")}</div>
                  </div>
                </div>
              </div>

              <div style="margin-top:16px;">
                <a class="button button--primary button--full button--small" href="detail.html?id=${encodeURIComponent(job.id)}">
                  Lihat Detail & Apply
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
}
