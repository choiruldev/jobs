import {
  getSalaryEstimate,
  salaryAverage
} from "./data.js?v=20260616z";

const PROFILE_KEY = "jsa_match_profile_v1";

export const DEFAULT_PROFILE = {
  targetRole: "",
  skills: "",
  experience: "",
  expectedSalary: "",
  timezone: "Asia/Jakarta"
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitList(value = "") {
  return String(value)
    .split(/[,;/|]+|\n/)
    .map((item) => normalize(item))
    .filter(Boolean);
}

function parseExpectedSalary(value = "") {
  const text = String(value).toLowerCase().trim();
  if (!text) return 0;
  const numeric = Number(text.replace(/[^0-9]/g, ""));
  if (!numeric) return 0;
  if (/jt|juta/i.test(text) && numeric < 1000) return numeric * 1000000;
  return numeric;
}

function haystackForJob(job) {
  return normalize([
    job.title,
    job.company,
    job.location,
    job.category,
    job.description,
    ...(job.tags || []),
    ...(job.requirements || [])
  ].join(" "));
}

export function readMatchProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_PROFILE,
      ...(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {})
    };
  } catch (error) {
    console.warn("Gagal membaca profil match", error);
    return { ...DEFAULT_PROFILE };
  }
}

export function writeMatchProfile(profile) {
  const next = {
    ...DEFAULT_PROFILE,
    targetRole: String(profile.targetRole || "").trim(),
    skills: String(profile.skills || "").trim(),
    experience: String(profile.experience || "").trim(),
    expectedSalary: String(profile.expectedSalary || "").trim(),
    timezone: String(profile.timezone || DEFAULT_PROFILE.timezone).trim()
  };

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn("Gagal menyimpan profil match", error);
    return next;
  }
}

export function clearMatchProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.warn("Gagal menghapus profil match", error);
  }
  return { ...DEFAULT_PROFILE };
}

export function profileHasSignal(profile = readMatchProfile()) {
  return Boolean(
    profile.targetRole.trim()
    || profile.skills.trim()
    || profile.experience.trim()
    || profile.expectedSalary.trim()
  );
}

function scoreRole(job, profile, haystack, reasons) {
  const roleTerms = splitList(profile.targetRole || "").flatMap((role) => role.split(/\s+/).filter(Boolean));
  if (!roleTerms.length) return 0;

  const title = normalize(job.title);
  const matched = roleTerms.filter((term) => title.includes(term) || haystack.includes(term));
  if (!matched.length) return 0;

  const titleHits = matched.filter((term) => title.includes(term)).length;
  const score = Math.min(30, matched.length * 8 + titleHits * 6);
  reasons.push("Role cocok");
  return score;
}

function scoreSkills(profile, haystack, reasons) {
  const skills = splitList(profile.skills);
  if (!skills.length) return 0;

  const matched = skills.filter((skill) => haystack.includes(skill));
  if (!matched.length) return 0;

  reasons.push(`${matched.length} skill cocok`);
  return Math.min(35, Math.round((matched.length / skills.length) * 35));
}

function scoreExperience(job, profile, haystack, reasons) {
  const value = normalize(profile.experience);
  if (!value) return 0;

  const title = normalize(job.title);
  const yearMatch = value.match(/\d+/);
  const years = yearMatch ? Number(yearMatch[0]) : 0;
  const wantsSenior = /senior|lead|principal|head|manager/.test(title);
  const wantsJunior = /junior|entry|assistant|associate/.test(title);

  if (/junior|entry|fresh/.test(value) && wantsSenior) return 2;
  if (/senior|lead|manager/.test(value) && wantsJunior) return 6;
  if (years >= 5 && wantsSenior) {
    reasons.push("Level sesuai");
    return 10;
  }
  if (years && !wantsSenior) {
    reasons.push("Level aman");
    return 8;
  }
  if (haystack.includes(value)) {
    reasons.push("Level cocok");
    return 8;
  }
  return 5;
}

function scoreSalary(job, profile, reasons) {
  const expected = parseExpectedSalary(profile.expectedSalary);
  if (!expected) return 0;

  const estimate = getSalaryEstimate(job.salary);
  if (!estimate) return 4;
  if (estimate.max >= expected) {
    reasons.push("Gaji masuk");
    return 15;
  }
  if (salaryAverage(job) >= expected * 0.8) return 8;
  return 0;
}

function scoreTimezone(job, profile, reasons) {
  const timezone = normalize(profile.timezone);
  if (!timezone) return 0;
  const location = normalize(job.location);
  if (/jakarta|makassar|jayapura|indonesia|asia/.test(timezone)
    && /indonesia|asia|apac|asean|worldwide|anywhere|global|remote/.test(location)) {
    reasons.push("Timezone aman");
    return 10;
  }
  if (/worldwide|anywhere|global|remote/.test(location)) return 8;
  return 3;
}

export function scoreJobForProfile(job, profile = readMatchProfile()) {
  if (!profileHasSignal(profile)) {
    return { hasProfile: false, score: 0, reasons: [] };
  }

  const haystack = haystackForJob(job);
  const reasons = [];
  const score = Math.min(100, Math.round(
    scoreRole(job, profile, haystack, reasons)
    + scoreSkills(profile, haystack, reasons)
    + scoreExperience(job, profile, haystack, reasons)
    + scoreSalary(job, profile, reasons)
    + scoreTimezone(job, profile, reasons)
  ));

  return {
    hasProfile: true,
    score: Math.max(12, score),
    reasons: [...new Set(reasons)].slice(0, 3)
  };
}

export function getProfileSummary(profile = readMatchProfile()) {
  const parts = [
    profile.targetRole && `Role: ${profile.targetRole}`,
    profile.skills && `Skill: ${splitList(profile.skills).slice(0, 3).join(", ")}`,
    profile.experience && `Level: ${profile.experience}`,
    profile.expectedSalary && `Gaji: ${profile.expectedSalary}`
  ].filter(Boolean);

  return parts.join(" . ");
}
