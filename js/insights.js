import {
  clearAnalyticsEvents,
  getAnalyticsSummary,
  recordPageView
} from "./analytics.js?v=20260616x";
import { showSnackbar } from "./bookmark.js?v=20260616x";

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
