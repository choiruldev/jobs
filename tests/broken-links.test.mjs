/**
 * Automated Broken Links & Asset Integrity Test Suite
 * Scans all HTML files in the project to verify that all internal links,
 * scripts, stylesheets, and image assets exist on disk.
 */

import fs from "fs";
import path from "path";

console.log("🔗 Menjalankan Pengujian Integritas Link & Aset (Broken Links Audit)...\n");

const ROOT_DIR = process.cwd();

// Find all HTML files
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".git" || file === ".gemini") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = getHtmlFiles(ROOT_DIR);
console.log(`Ditemukan ${htmlFiles.length} file HTML untuk diaudit.`);

let totalLinksChecked = 0;
let brokenLinks = [];

const linkRegex = /(?:href|src)=["']([^"']+)["']/g;

for (const htmlPath of htmlFiles) {
  const content = fs.readFileSync(htmlPath, "utf8");
  const relHtml = path.relative(ROOT_DIR, htmlPath);
  const htmlDir = path.dirname(htmlPath);

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let target = match[1].trim();

    // Skip external protocols, anchors, and dynamic JS template expressions
    if (
      !target ||
      target.includes("${") ||
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("tel:") ||
      target.startsWith("javascript:") ||
      target.startsWith("#") ||
      target.startsWith("data:")
    ) {
      continue;
    }

    totalLinksChecked++;

    // Strip query strings and hash anchors (e.g. `main.css?v=2026` -> `main.css`)
    const cleanTarget = target.split("?")[0].split("#")[0];
    if (!cleanTarget) continue;

    // Resolve path relative to current html file
    let resolvedPath;
    if (cleanTarget.startsWith("/")) {
      resolvedPath = path.join(ROOT_DIR, cleanTarget);
    } else {
      resolvedPath = path.resolve(htmlDir, cleanTarget);
    }

    if (!fs.existsSync(resolvedPath)) {
      brokenLinks.push({
        sourceFile: relHtml,
        link: target,
        resolvedPath: path.relative(ROOT_DIR, resolvedPath)
      });
    }
  }
}

console.log(`✓ Total link lokal & aset yang diverifikasi: ${totalLinksChecked}`);

if (brokenLinks.length > 0) {
  console.error(`\n❌ Ditemukan ${brokenLinks.length} Broken Link / Aset Hilang:`);
  for (const item of brokenLinks) {
    console.error(`  - Di: ${item.sourceFile} -> "${item.link}" (Harusnya ada di: ${item.resolvedPath})`);
  }
  process.exit(1);
} else {
  console.log("🎉 SEMUA LINK & ASET INTERNAL 100% VALID (0 BROKEN LINKS)! 🚀\n");
  process.exit(0);
}
