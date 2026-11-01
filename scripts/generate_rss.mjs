/**
 * RSS 2.0 & Atom Feed Generator
 * Generates feed.xml for syndication and feed readers.
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://jobsearch.id";

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateRssFeed() {
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  if (!fs.existsSync(jobsPath)) {
    console.warn("data/jobs.json tidak ditemukan untuk RSS feed.");
    return;
  }

  const rawData = fs.readFileSync(jobsPath, "utf8");
  const data = JSON.parse(rawData);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  // Sort descending by postedAt and take top 50
  const sortedJobs = [...jobs]
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))
    .slice(0, 50);

  const buildDate = new Date().toUTCString();

  const itemsXml = sortedJobs.map((job) => {
    const jobUrl = `${BASE_URL}/pages/detail.html?id=${encodeURIComponent(job.id)}`;
    const pubDate = job.postedAt ? new Date(job.postedAt).toUTCString() : buildDate;
    const desc = escapeXml(job.descriptionText ? job.descriptionText.slice(0, 300) + "..." : `${job.title} di ${job.company}`);
    const company = escapeXml(job.company);
    const title = escapeXml(`${job.title} - ${company}`);

    return `    <item>
      <title>${title}</title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <author>noreply@jobsearch.id (${company})</author>
      <category>${escapeXml(job.category || "Teknologi")}</category>
    </item>`;
  }).join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>JobSearch Indonesia | Lowongan Remote &amp; Global</title>
    <link>${BASE_URL}/</link>
    <description>Feed lowongan kerja remote dan lokal Indonesia terverifikasi bebas penipuan.</description>
    <language>id</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  const outPath = path.join(process.cwd(), "feed.xml");
  fs.writeFileSync(outPath, rssXml, "utf8");
  console.log(`✓ Berhasil membuat feed.xml dengan ${sortedJobs.length} item lowongan.`);
}

generateRssFeed();
