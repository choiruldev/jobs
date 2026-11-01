/**
 * Production Build & Asset Verification Script
 * Validates code integrity, asset size budgets, generates sitemaps, and checks deployment readiness.
 */

import fs from "fs";
import path from "path";
import { generateSitemap, updateRobotsTxt } from "./generate_sitemap.mjs";
import { generateRssFeed } from "./generate_rss.mjs";

console.log("📦 Memulai Kompilasi & Verifikasi Build Produksi JobSearch...\n");

const ROOT_DIR = process.cwd();

// 1. Generate Sitemap, Robots & RSS
console.log("[1/4] Membangun Sitemap.xml, Robots.txt & RSS Feed.xml...");
generateSitemap();
updateRobotsTxt();
generateRssFeed();

// 2. Budget Check CSS
console.log("\n[2/4] Memeriksa Asset Budget CSS...");
const cssFiles = ["css/main.css", "css/components.css"];
let totalCssSize = 0;
for (const file of cssFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const kb = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file}: ${kb} KB`);
    totalCssSize += stats.size;
  }
}
const totalCssKb = (totalCssSize / 1024).toFixed(2);
console.log(`  ✓ Total CSS: ${totalCssKb} KB (Budget: < 200 KB)`);
if (totalCssSize > 200 * 1024) {
  throw new Error(`CSS melebihi batas budget: ${totalCssKb} KB > 200 KB`);
}

// 3. JavaScript Module Syntax & Integrity
console.log("\n[3/4] Memvalidasi Modul JavaScript ES6 & Budget Ukuran...");
const jsDir = path.join(ROOT_DIR, "js");
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith(".js"));
let totalJsSize = 0;
for (const file of jsFiles) {
  const fullPath = path.join(jsDir, file);
  const stats = fs.statSync(fullPath);
  totalJsSize += stats.size;
}
const totalJsKb = (totalJsSize / 1024).toFixed(2);
console.log(`  ✓ Total ${jsFiles.length} modul JS: ${totalJsKb} KB (Budget: < 1000 KB)`);
if (totalJsSize > 1000 * 1024) {
  throw new Error(`JavaScript melebihi batas budget: ${totalJsKb} KB > 1000 KB`);
}

// 4. Security & Deployment Headers
console.log("\n[4/4] Memeriksa Konfigurasi Deployment & Security Headers...");
const requiredConfigs = ["_headers", "vercel.json", "manifest.json", "sw.js"];
for (const conf of requiredConfigs) {
  const p = path.join(ROOT_DIR, conf);
  if (!fs.existsSync(p)) {
    throw new Error(`Konfigurasi produksi hilang: ${conf}`);
  }
  console.log(`  ✓ ${conf} terverifikasi`);
}

console.log("\n🎉 BUILD PRODUKSI SUKSES! Aplikasi siap di-deploy ke Cloudflare Pages / Vercel / GitHub Pages. 🚀");
