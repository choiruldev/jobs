/**
 * Remote Company Directory Controller
 * Fetches, filters, and displays curated remote-friendly tech companies.
 */

import { escapeHtml } from "./bookmark.js?v=20260616z";
import { evaluateCompanyCulture } from "./company-radar.js?v=20260616z";

let allCompanies = [];
let activeBadgeFilter = "all";

export async function loadCompanies() {
  try {
    const res = await fetch("../data/companies.json").catch(() => fetch("data/companies.json"));
    if (!res.ok) return [];
    allCompanies = await res.json();
    return allCompanies;
  } catch (err) {
    console.warn("Gagal memuat daftar perusahaan remote:", err);
    return [];
  }
}

export function renderCompanyDirectory(container, companies = allCompanies) {
  if (!companies.length) {
    container.innerHTML = `<p class="body-medium">Belum ada data perusahaan.</p>`;
    return;
  }

  const badges = [
    { key: "all", label: "Semua" },
    { key: "Async-First", label: "⚡ Async-First" },
    { key: "Transparent Salaries", label: "💰 Gaji Transparan" },
    { key: "4-Day Workweek", label: "🌱 4-Day Week" },
    { key: "Hires in ID", label: "🇮🇩 Rekrut di ID" }
  ];

  const filtered = activeBadgeFilter === "all"
    ? companies
    : companies.filter(c => (c.badges || []).some(b => b.toLowerCase().includes(activeBadgeFilter.toLowerCase())));

  container.innerHTML = `
    <div class="stack" style="gap:var(--space-4);">
      <div class="cluster" style="gap:8px;padding-bottom:8px;overflow-x:auto;" role="tablist" aria-label="Filter Perusahaan">
        ${badges.map(b => `
          <button
            type="button"
            class="chip ${activeBadgeFilter === b.key ? "chip--active" : "chip--outline"}"
            data-company-filter="${b.key}"
            role="tab"
            aria-selected="${activeBadgeFilter === b.key}"
          >${escapeHtml(b.label)}</button>
        `).join("")}
      </div>

      <div class="job-grid">
        ${filtered.map((comp) => {
          const initials = (comp.name || "CO").slice(0, 2).toUpperCase();
          const culture = evaluateCompanyCulture(comp);
          const scoreColor = culture.score >= 90 ? "#2e7d32" : (culture.score >= 75 ? "var(--md-sys-color-primary)" : "#f57c00");

          return `
            <article class="job-card" style="display:flex;flex-direction:column;justify-content:space-between;border-radius:16px;">
              <div>
                <div class="job-card__header" style="align-items:center;gap:12px;margin-bottom:12px;">
                  <div class="company-avatar" style="width:48px;height:48px;border-radius:12px;background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;">
                    ${initials}
                  </div>
                  <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <h2 class="headline-small" style="margin:0;font-size:18px;">${escapeHtml(comp.name)}</h2>
                      <span class="badge" style="font-size:11px;font-weight:800;color:${scoreColor};background:var(--md-sys-color-surface-container-high);border:1px solid var(--md-sys-color-outline-variant);">
                        Radar: ${culture.score}/100
                      </span>
                    </div>
                    <span class="body-medium" style="color:var(--md-sys-color-outline);font-size:13px;">${escapeHtml(comp.industry)}</span>
                  </div>
                </div>

                <div class="job-card__detail-row" style="margin-bottom:10px;">
                  <span class="material-symbols-outlined" style="font-size:18px;color:var(--md-sys-color-primary);">public</span>
                  <span class="body-medium" style="font-size:13px;font-weight:600;">${escapeHtml(comp.workStyle || "100% Remote")}</span>
                </div>

                <p class="body-medium" style="margin:8px 0 12px;line-height:1.5;">${escapeHtml(comp.description)}</p>

                ${culture.verifiedSignals.length ? `
                  <div style="margin-bottom:12px;padding:8px 10px;background:var(--md-sys-color-surface-container-low);border-radius:8px;font-size:12px;">
                    <span style="font-weight:700;color:var(--md-sys-color-primary);display:block;margin-bottom:2px;">Sinyal Budaya:</span>
                    <ul style="margin:0;padding-left:14px;color:var(--md-sys-color-on-surface-variant);">
                      ${culture.verifiedSignals.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                    </ul>
                  </div>
                ` : ""}

                <div class="cluster" style="gap:6px;margin-bottom:16px;">
                  ${(comp.badges || []).map((b) => `<span class="chip chip--small" style="font-size:11px;padding:2px 8px;">${escapeHtml(b)}</span>`).join("")}
                </div>
              </div>

              <div>
                <a class="button button--primary button--full" href="${escapeHtml(comp.website)}" target="_blank" rel="noopener">
                  <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                  Karir Resmi di ${escapeHtml(comp.name)}
                </a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      ${filtered.length === 0 ? `
        <div class="empty-state" style="padding:48px 16px;">
          <p class="body-medium">Tidak ada perusahaan yang cocok dengan kriteria filter ini.</p>
        </div>
      ` : ""}
    </div>
  `;

  container.querySelectorAll("[data-company-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeBadgeFilter = btn.getAttribute("data-company-filter");
      renderCompanyDirectory(container, companies);
    });
  });
}
