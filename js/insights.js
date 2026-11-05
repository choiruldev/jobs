import {
  clearAnalyticsEvents,
  getAnalyticsSummary,
  recordPageView
} from "./analytics.js?v=20261106a";
import { showSnackbar } from "./bookmark.js?v=20261106a";
import { calculateApplicationFunnel, buildOfferComparisonMatrix } from "./insights-engine.js?v=20261106a";
import { readApplications, getTrackedApplicationItems } from "./apply.js?v=20261106a";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRank(container, rows, emptyLabel) {
  container.innerHTML = rows.length
    ? rows.map((row) => `
      <article class="saved-search-card">
        <div>
          <strong>${escapeHtml(row.label)}</strong>
          <span>${row.count} event</span>
        </div>
      </article>
    `).join("")
    : `<p class="body-medium">${escapeHtml(emptyLabel)}</p>`;
}

function render() {
  const summary = getAnalyticsSummary();
  document.getElementById("metric-grid").innerHTML = `
    <article class="metric-card"><strong>${summary.totalEvents}</strong><span>Total event</span></article>
    <article class="metric-card"><strong>${summary.byName.official_apply_click || 0}</strong><span>Klik apply resmi</span></article>
    <article class="metric-card"><strong>${summary.byName.bookmark_add || 0}</strong><span>Bookmark dibuat</span></article>
  `;

  // Render Funnel
  const allApps = Object.values(readApplications());
  const funnel = calculateApplicationFunnel(allApps);
  const funnelEl = document.getElementById("funnel-metrics");
  if (funnelEl) {
    funnelEl.innerHTML = `
      <article class="metric-card"><strong>${funnel.counts.applied}</strong><span>Lamaran Terkirim</span></article>
      <article class="metric-card"><strong>${funnel.counts.interview} <small>(${funnel.rates.interviewRate}%)</small></strong><span>Interview</span></article>
      <article class="metric-card"><strong>${funnel.counts.offer} <small>(${funnel.rates.offerRate}%)</small></strong><span>Offering</span></article>
      <article class="metric-card"><strong>${funnel.counts.accepted}</strong><span>Diterima</span></article>
    `;
  }

  // Render Offer Comparison Matrix
  const trackedItems = getTrackedApplicationItems();
  const offers = buildOfferComparisonMatrix(trackedItems);
  const offerEl = document.getElementById("offer-comparison");
  if (offerEl) {
    if (!offers.length) {
      offerEl.innerHTML = `<p class="body-medium">Belum ada penawaran kerja (Status "Offering" atau "Diterima") di tracker.</p>`;
    } else {
      offerEl.innerHTML = `
        <div class="saved-search-list">
          ${offers.map((off) => `
            <article class="saved-search-card">
              <div>
                <strong>${escapeHtml(off.title)} - ${escapeHtml(off.company)}</strong>
                <span>Gaji: <b>${escapeHtml(off.salaryDisplay)}</b> | Lokasi: ${escapeHtml(off.location)}</span>
                ${off.notes && off.notes !== "-" ? `<p class="body-medium" style="margin-top:4px;">Catatan: ${escapeHtml(off.notes)}</p>` : ""}
              </div>
            </article>
          `).join("")}
        </div>
      `;
    }
  }

  renderRank(document.getElementById("top-searches"), summary.topSearches, "Belum ada pencarian tercatat.");
  renderRank(
    document.getElementById("event-list"),
    Object.entries(summary.byName)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count })),
    "Belum ada event tercatat."
  );
}

document.addEventListener("DOMContentLoaded", () => {
  recordPageView("insights");
  render();
  document.getElementById("clear-insights")?.addEventListener("click", () => {
    clearAnalyticsEvents();
    showSnackbar("Insight lokal direset.");
    render();
  });
});
