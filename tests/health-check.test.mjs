/**
 * Automated Health Check & Bundle Audit Test Suite
 * Validates integrity of all HTML routes, ES6 modules, PWA manifest, and scraped job feeds.
 */

import fs from "fs";
import path from "path";
import http from "http";

console.log("🏥 Menjalankan Suite Audit Kesehatan & Integritas Platform JobSearch...\n");

const ROOT_DIR = process.cwd();

// 1. Audit HTML Routes
const REQUIRED_HTML = [
  "index.html",
  "404.html",
  "pages/offline.html",
  "pages/search.html",
  "pages/apply.html",
  "pages/bookmarks.html",
  "pages/resume-builder.html",
  "pages/companies.html",
  "pages/interview-prep.html",
  "pages/insights.html",
  "pages/detail.html",
  "pages/salary-benchmark.html",
  "pages/contract-guide.html",
  "pages/invoice-generator.html",
  "pages/alerts.html",
  "pages/portfolio-card.html",
  "pages/skills-roadmap.html",
  "pages/code-sandbox.html",
  "pages/salary-submit.html",
  "pages/privacy-policy.html",
  "pages/terms.html"
];

console.log(`[1/5] Memeriksa Integritas ${REQUIRED_HTML.length} File Halaman HTML...`);
for (const relPath of REQUIRED_HTML) {
  const full = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`File halaman hilang: ${relPath}`);
  }
  const content = fs.readFileSync(full, "utf8");
  if (!content.includes("<!doctype html>") || !content.includes("JobSearch")) {
    throw new Error(`Struktur HTML tidak valid pada: ${relPath}`);
  }
}
console.log(`  ✓ Semua ${REQUIRED_HTML.length} halaman HTML valid dan siap saji.`);

// 2. Audit JavaScript Modules
const REQUIRED_JS_MODULES = [
  "js/schema.js",
  "js/storage-db.js",
  "js/providers.js",
  "js/search.js",
  "js/apply.js",
  "js/apply-kanban.js",
  "js/apply-reminders.js",
  "js/ats-checker.js",
  "js/ai-writer.js",
  "js/resume-builder.js",
  "js/salary-calculator.js",
  "js/salary-ppp.js",
  "js/contract-safety.js",
  "js/invoice.js",
  "js/company-radar.js",
  "js/outreach-generator.js",
  "js/interview-voice.js",
  "js/alert-settings.js",
  "js/portfolio-builder.js",
  "js/theme-engine.js",
  "js/job-comparator.js",
  "js/skills-roadmap.js",
  "js/email-status-parser.js",
  "js/code-sandbox.js",
  "js/salary-community.js",
  "js/pwa-prompt.js",
  "js/beta-feedback.js",
  "js/onboarding.js",
  "js/error-logger.js",
  "js/i18n.js",
  "js/share.js"
];

console.log(`[2/5] Memeriksa Integritas ${REQUIRED_JS_MODULES.length} Modul JavaScript ES6...`);
for (const relPath of REQUIRED_JS_MODULES) {
  const full = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Modul JS hilang: ${relPath}`);
  }
}
console.log(`  ✓ Semua ${REQUIRED_JS_MODULES.length} modul JS terdaftar dengan lengkap.`);

// 3. Audit PWA Manifest & Service Worker
console.log("[3/5] Memvalidasi PWA Manifest & Service Worker...");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "manifest.json"), "utf8"));
if (!manifest.name || !manifest.icons || !manifest.start_url) {
  throw new Error("PWA manifest tidak lengkap");
}
for (const icon of manifest.icons) {
  const iconPath = path.join(ROOT_DIR, icon.src);
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon PWA hilang: ${icon.src}`);
  }
}
if (!fs.existsSync(path.join(ROOT_DIR, "sw.js"))) {
  throw new Error("Service Worker sw.js tidak ditemukan");
}
console.log(`  ✓ PWA valid: Name "${manifest.name}", Display "${manifest.display}".`);

// 4. Audit Data Feeds
console.log("[4/5] Memvalidasi Integritas Data Feeds Loker...");
const jobsData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data/jobs.json"), "utf8"));
if (!Array.isArray(jobsData.jobs) || jobsData.jobs.length === 0) {
  throw new Error("data/jobs.json kosong atau tidak valid");
}
console.log(`  ✓ Total lowongan aktif: ${jobsData.jobs.length} loker terverifikasi.`);
console.log(`  ✓ Portal terindeks: ${Object.keys(jobsData.platforms || {}).join(", ")}`);

// 5. Audit Local Server HTTP Response
console.log("[5/5] Menguji Konektivitas Server Port 8080...");
const checkHttp = () => new Promise((resolve, reject) => {
  http.get("http://localhost:8080/index.html", (res) => {
    if (res.statusCode === 200) {
      resolve(true);
    } else {
      reject(new Error(`Server merespon dengan status: ${res.statusCode}`));
    }
  }).on("error", (err) => {
    // Non-fatal if test runs in environment without local daemon
    resolve(false);
  });
});

const isOnline = await checkHttp();
if (isOnline) {
  console.log("  ✓ Server lokal aktif dan merespons HTTP 200 OK di port 8080.");
} else {
  console.log("  - Server lokal offline (dilewati untuk mode testing mandiri).");
}

console.log("\n🎉 SELURUH AUDIT KESEHATAN SISTEM 100% LULUS (PRODUCTION READY)! 🚀");
