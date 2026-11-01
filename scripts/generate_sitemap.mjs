/**
 * Dynamic Sitemap & Robots Generator
 * Generates SEO-compliant sitemap.xml with proper prioritization and lastmod stamps.
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://jobsearch.id";
const TODAY = new Date().toISOString().split("T")[0];

const ROUTES = [
  { path: "", priority: "1.0", changefreq: "daily" },
  { path: "pages/search.html", priority: "0.9", changefreq: "daily" },
  { path: "pages/remote-indonesia.html", priority: "0.9", changefreq: "weekly" },
  { path: "pages/frontend-developer-remote.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/data-analyst-remote.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/marketing-remote.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/fresh-graduate-remote.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/guides/cara-cari-kerja-remote.html", priority: "0.8", changefreq: "monthly" },
  { path: "pages/companies.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/resume-builder.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/salary-benchmark.html", priority: "0.8", changefreq: "weekly" },
  { path: "pages/interview-prep.html", priority: "0.8", changefreq: "monthly" },
  { path: "pages/contract-guide.html", priority: "0.7", changefreq: "monthly" },
  { path: "pages/invoice-generator.html", priority: "0.7", changefreq: "monthly" },
  { path: "pages/portfolio-card.html", priority: "0.7", changefreq: "monthly" },
  { path: "pages/skills-roadmap.html", priority: "0.7", changefreq: "monthly" },
  { path: "pages/code-sandbox.html", priority: "0.6", changefreq: "monthly" },
  { path: "pages/alerts.html", priority: "0.7", changefreq: "weekly" },
  { path: "pages/apply.html", priority: "0.6", changefreq: "weekly" },
  { path: "pages/bookmarks.html", priority: "0.6", changefreq: "weekly" },
  { path: "pages/insights.html", priority: "0.6", changefreq: "weekly" },
  { path: "pages/salary-submit.html", priority: "0.6", changefreq: "monthly" },
  { path: "pages/privacy-policy.html", priority: "0.5", changefreq: "monthly" },
  { path: "pages/terms.html", priority: "0.5", changefreq: "monthly" }
];

export function generateSitemap() {
  const urlNodes = ROUTES.map(r => `  <url>
    <loc>${BASE_URL}/${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

  const sitemapPath = path.join(process.cwd(), "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml, "utf8");
  console.log(`✓ Berhasil membuat sitemap.xml dengan ${ROUTES.length} rute URL.`);
}

// Update robots.txt
export function updateRobotsTxt() {
  const robots = `User-agent: *
Allow: /

# Sitemap Index
Sitemap: ${BASE_URL}/sitemap.xml
`;
  const robotsPath = path.join(process.cwd(), "robots.txt");
  fs.writeFileSync(robotsPath, robots, "utf8");
  console.log("✓ Berhasil memperbarui robots.txt dengan referensi sitemap.");
}

generateSitemap();
updateRobotsTxt();
