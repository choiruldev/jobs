/**
 * Automated E2E & Unit Test Suite for JobSearch Platform
 * Validates schema, ATS matching, tax estimation, and data pipelines.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeJob, validateJob, detectExperienceLevel, detectRemoteTier } from "../js/schema.js";
import { extractKeywords, analyzeAtsMatch } from "../js/ats-checker.js";
import { estimateTakeHomePay, calculateProgressiveTax } from "../js/salary-calculator.js";
import { generateCoverLetter } from "../js/ai-writer.js";
import { generateBookmarkletCode } from "../js/autofill-bookmarklet.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🚀 Menjalankan Test Suite JobSearch Platform...\n");

// 1. Test Schema & Normalization
console.log("[1/6] Menguji Unified Job Schema...");
const rawJob = {
  id: "test-123",
  title: "Senior React Developer",
  company: "Remote Co",
  location: "Jakarta, Indonesia",
  description: "Dibutuhkan Senior Frontend dengan keahlian React, TypeScript, dan Docker.",
  salary: "USD 5000 / month"
};
const normalized = normalizeJob(rawJob);
assert.strictEqual(normalized.id, "test-123");
assert.strictEqual(normalized.remoteTier, "indonesia");
assert.strictEqual(normalized.experienceLevel, "senior");
assert.strictEqual(validateJob(normalized).valid, true);
console.log("  ✓ Unified Job Schema valid dan normalisasi tier/pengalaman akurat.");

// 2. Test ATS Matcher
console.log("[2/6] Menguji ATS Keyword Matcher...");
const resume = "Pengalaman React, TypeScript, Git, dan komunikasi tim.";
const jd = "Kualifikasi: Mahir React, TypeScript, Docker, Kubernetes, dan komunikasi.";
const matchResult = analyzeAtsMatch(resume, jd);
assert.ok(matchResult.score > 0 && matchResult.score <= 100);
assert.ok(matchResult.matched.includes("react"));
assert.ok(matchResult.missing.includes("docker"));
console.log(`  ✓ ATS scoring berfungsi (Score: ${matchResult.score}%, Matched: ${matchResult.matched.length}, Missing: ${matchResult.missing.length}).`);

// 3. Test Salary & Tax Calculator (PPh 21)
console.log("[3/6] Menguji Salary Calculator & Pajak PPh 21...");
assert.strictEqual(calculateProgressiveTax(50000000), 2500000); // 5% dari 50jt = 2.5jt
const takeHome = estimateTakeHomePay({
  grossAmount: 4000,
  currency: "USD",
  period: "monthly",
  taxMode: "freelancer"
});
assert.ok(takeHome.grossMonthlyIdr > 60000000);
assert.ok(takeHome.netMonthlyIdr > 0);
assert.ok(takeHome.monthlyTax > 0);
console.log(`  ✓ Estimasi gaji bersih: Kotor ${takeHome.formatted.grossMonthlyIdr} -> Bersih ${takeHome.formatted.netMonthlyIdr}.`);

// 4. Test AI Cover Letter Generator
console.log("[4/6] Menguji AI Cover Letter Writer...");
const letterId = generateCoverLetter({
  profile: { name: "Ahmad", skills: "React, Node.js", experience: "4 tahun" },
  job: { title: "Frontend Engineer", company: "SuperCorp" },
  language: "id"
});
assert.ok(letterId.includes("Yth. Tim Rekrutmen SuperCorp"));
assert.ok(letterId.includes("Frontend Engineer"));
console.log("  ✓ Cover letter generator sukses membuat template personal.");

// 5. Test Autofill Bookmarklet
console.log("[5/6] Menguji Autofill Bookmarklet Generator...");
const bookmarklet = generateBookmarkletCode({ name: "Ahmad", email: "ahmad@test.com" });
assert.ok(bookmarklet.startsWith("javascript:"));
assert.ok(bookmarklet.includes("ahmad@test.com"));
console.log("  ✓ Bookmarklet code valid dan aman dieksekusi di browser.");

// 6. Test Data Feeds
console.log("[6/6] Memvalidasi Integritas File Data Feeds...");
const jobsPath = path.join(__dirname, "..", "data", "jobs.json");
const companiesPath = path.join(__dirname, "..", "data", "companies.json");
assert.ok(fs.existsSync(jobsPath), "data/jobs.json harus ada");
assert.ok(fs.existsSync(companiesPath), "data/companies.json harus ada");

const jobsData = JSON.parse(fs.readFileSync(jobsPath, "utf-8"));
const companiesData = JSON.parse(fs.readFileSync(companiesPath, "utf-8"));
assert.ok(Array.isArray(jobsData.jobs) && jobsData.jobs.length > 0);
assert.ok(Array.isArray(companiesData) && companiesData.length > 0);
console.log(`  ✓ Data feeds valid (${jobsData.jobs.length} jobs, ${companiesData.length} perusahaan remote).`);

console.log("\n🎉 SEMUA PENGUJIAN LULUS DENGAN SUKSES (100% Passed)!");
