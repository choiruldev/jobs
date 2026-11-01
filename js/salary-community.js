/**
 * Anonymous Community Salary Submission & Transparency Engine
 * Collects, verifies, and displays anonymous tech salary reports for Indonesian talent.
 */

import { formatIDR } from "./salary-calculator.js?v=20260616z";

const SALARY_COMMUNITY_KEY = "jsa_community_salaries_v1";

export const SEED_COMMUNITY_SALARIES = [
  {
    id: "sal_1",
    role: "Senior Frontend Engineer (React/Next.js)",
    companyType: "US Remote Contractor",
    experienceLevel: "senior",
    yearsExp: 5,
    grossMonthlyIdr: 45000000,
    workStyle: "100% Remote",
    location: "Jakarta (Remote)",
    verified: true,
    submittedAt: "2026-05-10"
  },
  {
    id: "sal_2",
    role: "Backend Engineer (Go/Microservices)",
    companyType: "Fintech Unicorn Jakarta",
    experienceLevel: "mid",
    yearsExp: 3,
    grossMonthlyIdr: 22000000,
    workStyle: "Hybrid (2 days office)",
    location: "Jakarta",
    verified: true,
    submittedAt: "2026-06-01"
  },
  {
    id: "sal_3",
    role: "DevOps / Cloud Engineer",
    companyType: "Singapore Tech Agency",
    experienceLevel: "senior",
    yearsExp: 6,
    grossMonthlyIdr: 52000000,
    workStyle: "100% Remote",
    location: "Bandung (Remote)",
    verified: true,
    submittedAt: "2026-06-12"
  },
  {
    id: "sal_4",
    role: "Junior Web Developer",
    companyType: "Software House Lokal",
    experienceLevel: "junior",
    yearsExp: 1,
    grossMonthlyIdr: 8500000,
    workStyle: "Onsite",
    location: "Yogyakarta",
    verified: true,
    submittedAt: "2026-06-14"
  }
];

export function readCommunitySalaries() {
  try {
    const raw = localStorage.getItem(SALARY_COMMUNITY_KEY);
    if (!raw) {
      writeCommunitySalaries(SEED_COMMUNITY_SALARIES);
      return SEED_COMMUNITY_SALARIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    return SEED_COMMUNITY_SALARIES;
  }
}

export function writeCommunitySalaries(data) {
  try {
    localStorage.setItem(SALARY_COMMUNITY_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
}

export function submitSalaryReport({
  role,
  companyType,
  experienceLevel,
  yearsExp,
  grossMonthlyIdr,
  workStyle,
  location
}) {
  const cleanRole = sanitizeInput(role);
  const amount = Number(grossMonthlyIdr);
  if (!cleanRole || !amount || amount < 3000000 || amount > 300000000) {
    throw new Error("Nominal gaji tidak realistis (Rp 3jt - 300jt) atau posisi kerja belum diisi.");
  }

  const reports = readCommunitySalaries();
  const newReport = {
    id: `sal_${Date.now()}`,
    role: cleanRole,
    companyType: sanitizeInput(companyType) || "Perusahaan Teknologi",
    experienceLevel: experienceLevel || "mid",
    yearsExp: Math.max(0, Math.min(40, Number(yearsExp) || 3)),
    grossMonthlyIdr: amount,
    workStyle: sanitizeInput(workStyle) || "Remote",
    location: sanitizeInput(location) || "Indonesia",
    verified: false,
    submittedAt: new Date().toISOString().split("T")[0]
  };

  reports.unshift(newReport);
  writeCommunitySalaries(reports);
  return newReport;
}
