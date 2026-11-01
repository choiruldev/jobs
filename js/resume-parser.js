/**
 * Client-Side Resume & CV Text Parser
 * Parses raw text from CV/Resume into structured profile and resume builder entities.
 */

import { extractKeywords } from "./ats-checker.js?v=20260616z";

export function parseResumeText(rawText = "") {
  if (!rawText || typeof rawText !== "string") {
    return { name: "", email: "", phone: "", linkedin: "", skills: [], experiences: [], education: [] };
  }

  const clean = rawText.replace(/\r\n/g, "\n");
  const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Email extraction
  const emailMatch = clean.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // 2. Phone extraction (Indonesian & international formats)
  const phoneMatch = clean.match(/(?:\+62|62|08)[0-9\s-]{8,14}/) || clean.match(/\+?[0-9\s-]{10,16}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : "";

  // 3. LinkedIn / GitHub extraction
  const linkedinMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0] : "";

  const githubMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const github = githubMatch ? githubMatch[0] : "";

  // 4. Candidate Name: usually the first non-header line that isn't an email or URL
  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !/curriculum|resume|cv|biodata/i.test(line)
    ) {
      name = line;
      break;
    }
  }

  // 5. Skills extraction using ATS keywords
  const keywordResult = extractKeywords(clean);
  const technicalSkills = keywordResult.technical || [];
  const softSkills = keywordResult.soft || [];

  // 6. Role / Title heuristic: look for lines mentioning Engineer, Developer, Designer, Manager
  let targetRole = "";
  const roleRegex = /(frontend|backend|fullstack|software|mobile|data|devops|product|ui\/ux|qa)\s+(engineer|developer|designer|manager|specialist|analyst)/i;
  for (const line of lines.slice(0, 10)) {
    const match = line.match(roleRegex);
    if (match) {
      targetRole = line;
      break;
    }
  }

  // 7. Summary / About Me heuristic
  let summary = "";
  const summaryIdx = lines.findIndex(l => /^(about|tentang|summary|ringkasan|profil|profile)/i.test(l));
  if (summaryIdx !== -1 && lines[summaryIdx + 1]) {
    summary = lines.slice(summaryIdx + 1, summaryIdx + 4).join(" ");
  }

  // 8. Experience extraction (heuristic parsing)
  const experiences = [];
  const expIdx = lines.findIndex(l => /^(experience|pengalaman kerja|work history)/i.test(l));
  if (expIdx !== -1) {
    const expLines = lines.slice(expIdx + 1, expIdx + 25);
    let currentExp = null;

    for (const el of expLines) {
      if (/^(education|pendidikan|skills|keahlian|projects|proyek)/i.test(el)) break;
      
      // If line has dates like 2020 - 2023 or Present
      if (/(20\d\d|\bJan|\bFeb|\bMar|\bApr|\bMay|\bJun|\bJul|\bAug|\bSep|\bOct|\bNov|\bDec|Present|Saat ini)/i.test(el)) {
        if (currentExp) experiences.push(currentExp);
        currentExp = { role: "", company: "", period: el, bullets: [] };
      } else if (currentExp && !currentExp.role) {
        currentExp.role = el;
      } else if (currentExp && !currentExp.company) {
        currentExp.company = el;
      } else if (currentExp) {
        currentExp.bullets.push(el.replace(/^[-•*]\s*/, ""));
      }
    }
    if (currentExp) experiences.push(currentExp);
  }

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    targetRole,
    summary,
    skills: technicalSkills.concat(softSkills),
    experiences: experiences.slice(0, 4),
    rawLinesCount: lines.length
  };
}
