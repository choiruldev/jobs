/**
 * Client-Side ATS Matcher & Keyword Gap Analyzer
 * Evaluates candidate CV/profile against job descriptions, identifying key skill gaps and computing ATS match scores.
 */

const TECH_KEYWORDS = [
  "javascript", "typescript", "react", "vue", "angular", "next.js", "node.js",
  "python", "django", "fastapi", "golang", "java", "spring boot", "php", "laravel",
  "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
  "aws", "gcp", "azure", "git", "ci/cd", "rest api", "graphql", "tailwind",
  "html", "css", "figma", "tableau", "power bi", "excel", "spark", "pandas"
];

const SOFT_KEYWORDS = [
  "communication", "komunikasi", "leadership", "kepemimpinan", "problem solving",
  "agile", "scrum", "teamwork", "kolaborasi", "english", "inggris", "analytical",
  "critical thinking", "mentoring", "time management", "adaptability"
];

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ekstraksi kata kunci yang relevan dari deskripsi pekerjaan
 */
export function extractKeywords(text = "") {
  const normalized = normalizeText(text);
  const foundTech = TECH_KEYWORDS.filter((kw) => normalized.includes(kw));
  const foundSoft = SOFT_KEYWORDS.filter((kw) => normalized.includes(kw));

  return {
    all: [...foundTech, ...foundSoft],
    technical: foundTech,
    soft: foundSoft
  };
}

/**
 * Hitung skor kecocokan ATS antara CV/profil dan deskripsi lowongan
 */
export function analyzeAtsMatch(resumeText = "", jobDescription = "") {
  const jobKeywords = extractKeywords(jobDescription);
  const normalizedResume = normalizeText(resumeText);

  if (!jobKeywords.all.length) {
    return {
      score: 100,
      matched: [],
      missing: [],
      recommendation: "Deskripsi lowongan tidak memuat kata kunci teknis spesifik."
    };
  }

  const matched = [];
  const missing = [];

  jobKeywords.all.forEach((kw) => {
    if (normalizedResume.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const score = Math.round((matched.length / jobKeywords.all.length) * 100);

  let recommendation = "";
  if (score >= 80) {
    recommendation = "Profil Anda sangat cocok dengan kriteria lowongan ini!";
  } else if (score >= 50) {
    recommendation = `Tambahkan kata kunci berikut ke CV Anda untuk meningkatkan peluang lolos ATS: ${missing.slice(0, 5).join(", ")}.`;
  } else {
    recommendation = `Perlu penyesuaian signifikan. Kata kunci penting yang belum ditemukan: ${missing.slice(0, 6).join(", ")}.`;
  }

  return {
    score,
    matched,
    missing,
    totalKeywords: jobKeywords.all.length,
    recommendation
  };
}
