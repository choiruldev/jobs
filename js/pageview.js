import { recordPageView } from "./analytics.js?v=20261106a";
import "./error-logger.js?v=20261106a";
import { initThemeEngine } from "./theme-engine.js?v=20261106a";
import "./pwa-prompt.js?v=20261106a";
import "./beta-feedback.js?v=20261106a";
import "./onboarding.js?v=20261106a";

// Register Service Worker for PWA & Offline Support
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const pathname = window.location.pathname || "";
    const swPath = pathname.includes("/pages/guides/")
      ? "../../sw.js"
      : (pathname.includes("/pages/") ? "../sw.js" : "sw.js");
    navigator.serviceWorker.register(swPath).catch((err) => {
      console.warn("ServiceWorker registration error:", err);
    });
  });
}

export function initUniversalTopNav() {
  const topBar = document.querySelector(".top-app-bar");
  if (!topBar) return;
  const leftCol = topBar.querySelector("div:first-child");
  if (!leftCol || leftCol.querySelector(".top-nav-links")) return;

  const pathname = window.location.pathname || "";
  const isPagesDir = pathname.includes("/pages/");
  const base = isPagesDir ? "" : "pages/";

  const nav = document.createElement("nav");
  nav.className = "top-nav-links";
  nav.setAttribute("aria-label", "Navigasi Utama");

  const items = [
    { label: "Cari Lowongan", href: `${base}search.html`, match: "search.html" },
    { label: "Tracker Lamaran", href: `${base}apply.html`, match: "apply.html" },
    { label: "Resume ATS", href: `${base}resume-builder.html`, match: "resume-builder.html" },
    { label: "Kalkulator Gaji", href: `${base}salary-benchmark.html`, match: "salary-benchmark.html" },
  ];

  let linksHtml = items
    .map((item) => {
      const active = pathname.endsWith(item.match);
      return `<a class="top-nav-link ${active ? "is-active" : ""}" href="${item.href}">${item.label}</a>`;
    })
    .join("");

  linksHtml += `
    <div class="top-nav-dropdown">
      <button class="top-nav-link top-nav-dropdown__btn" type="button" aria-expanded="false">
        <span>Semua Fitur</span>
        <span class="material-symbols-outlined" style="font-size:18px;">expand_more</span>
      </button>
      <div class="top-nav-dropdown__menu">
        <div class="dropdown-group-label">FITUR KARIR</div>
        <a href="${base}interview-prep.html" class="dropdown-item"><span class="material-symbols-outlined">record_voice_over</span> Latihan Interview</a>
        <a href="${base}code-sandbox.html" class="dropdown-item"><span class="material-symbols-outlined">terminal</span> Coding Sandbox</a>
        <a href="${base}salary-submit.html" class="dropdown-item"><span class="material-symbols-outlined">volunteer_activism</span> Gaji Komunitas</a>
        <a href="${base}skills-roadmap.html" class="dropdown-item"><span class="material-symbols-outlined">conversion_path</span> Peta Karir & Skill</a>
        <a href="${base}companies.html" class="dropdown-item"><span class="material-symbols-outlined">apartment</span> Perusahaan Remote</a>
        <a href="${base}insights.html" class="dropdown-item"><span class="material-symbols-outlined">insights</span> Analisis Funnel</a>
        <div class="dropdown-group-label" style="margin-top:6px;">FREELANCE & DOKUMEN</div>
        <a href="${base}contract-guide.html" class="dropdown-item"><span class="material-symbols-outlined">gavel</span> Panduan Kontrak & Pajak</a>
        <a href="${base}invoice-generator.html" class="dropdown-item"><span class="material-symbols-outlined">receipt_long</span> Generator Invoice</a>
        <a href="${base}portfolio-card.html" class="dropdown-item"><span class="material-symbols-outlined">badge</span> Kartu Bukti Karya</a>
        <a href="${base}alerts.html" class="dropdown-item"><span class="material-symbols-outlined">notifications_active</span> Pusat Notifikasi</a>
      </div>
    </div>
  `;

  nav.innerHTML = linksHtml;
  leftCol.appendChild(nav);
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  initUniversalTopNav();
  recordPageView(document.body.dataset.page || "content", {
    title: document.title,
    path: window.location.pathname
  });
});
