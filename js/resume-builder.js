/**
 * In-Browser ATS Resume Builder Controller
 * Manages form state, live preview rendering, dynamic experiences/education, and PDF generation via window.print().
 */

import { readMatchProfile } from "./profile.js?v=20260616z";
import { escapeHtml } from "./bookmark.js?v=20260616z";

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str.trim();
}

export function validateEmail(email) {
  if (!email) return true; // Optional if empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone) {
  if (!phone) return true; // Optional if empty
  return /^[\d\s+\-()]{6,25}$/.test(phone.trim());
}

const RESUME_KEY = "jsa_resume_builder_data_v1";

export const DEFAULT_RESUME = {
  fullName: "Budi Santoso",
  email: "budi.santoso@email.com",
  phone: "+62 812-3456-7890",
  location: "Jakarta, Indonesia (Remote)",
  linkedin: "linkedin.com/in/budisantoso",
  portfolio: "github.com/budisantoso",
  summary: "Frontend Software Engineer dengan 3+ tahun pengalaman membangun aplikasi web modern berskala tinggi menggunakan React, TypeScript, dan Next.js. Terbiasa bekerja secara mandiri dalam tim terdistribusi global.",
  experiences: [
    {
      role: "Frontend Engineer (Remote)",
      company: "Tech Global Solutions",
      period: "2023 - Sekarang",
      bullets: "Mengembangkan fitur core dashboard menggunakan React & TypeScript.\nMengoptimasi performa web hingga mencapai 95+ skor Core Web Vitals.\nBerkolaborasi dalam tim lintas negara dengan metodologi Agile/Scrum."
    },
    {
      role: "Junior Web Developer",
      company: "Inovasi Digital Nusantara",
      period: "2021 - 2023",
      bullets: "Membangun antarmuka pengguna berbasis komponen responsif.\nMembuat integrasi REST API dan mengelola state aplikasi secara efisien."
    }
  ],
  education: [
    {
      degree: "S1 Ilmu Komputer / Teknik Informatika",
      school: "Universitas Indonesia",
      period: "2017 - 2021"
    }
  ],
  skills: "JavaScript, TypeScript, React, Next.js, HTML5/CSS3, Tailwind CSS, Git, REST API, Jest"
};

export function readResumeData() {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) {
      const prof = readMatchProfile();
      if (prof.skills || prof.targetRole) {
        return {
          ...DEFAULT_RESUME,
          skills: prof.skills || DEFAULT_RESUME.skills,
          summary: `${prof.targetRole || "Software Engineer"} dengan latar belakang keahlian dalam ${prof.skills || "teknologi modern"}.`
        };
      }
      return { ...DEFAULT_RESUME };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_RESUME,
      ...parsed,
      experiences: Array.isArray(parsed.experiences) && parsed.experiences.length ? parsed.experiences : DEFAULT_RESUME.experiences,
      education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : DEFAULT_RESUME.education
    };
  } catch (err) {
    return { ...DEFAULT_RESUME };
  }
}

export function writeResumeData(data) {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Gagal menyimpan data resume:", err);
  }
}

export function renderLivePreview(container, data) {
  const experiencesHtml = (data.experiences || []).map((exp) => `
    <div class="ats-resume-section__item">
      <div class="ats-resume-item__header">
        <strong>${escapeHtml(exp.role || "")}</strong>
        <span>${escapeHtml(exp.period || "")}</span>
      </div>
      <div class="ats-resume-item__sub">${escapeHtml(exp.company || "")}</div>
      <ul class="ats-resume-item__list">
        ${(exp.bullets || "").split("\n").filter(Boolean).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const educationHtml = (data.education || []).map((edu) => `
    <div class="ats-resume-section__item">
      <div class="ats-resume-item__header">
        <strong>${escapeHtml(edu.degree || "")}</strong>
        <span>${escapeHtml(edu.period || "")}</span>
      </div>
      <div class="ats-resume-item__sub">${escapeHtml(edu.school || "")}</div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="ats-paper" id="ats-paper">
      <header class="ats-header">
        <h1 class="ats-name">${escapeHtml(data.fullName || "")}</h1>
        <div class="ats-contact">
          <span>${escapeHtml(data.location || "")}</span> •
          <span>${escapeHtml(data.email || "")}</span> •
          <span>${escapeHtml(data.phone || "")}</span> •
          <span>${escapeHtml(data.linkedin || "")}</span>
        </div>
      </header>

      ${data.summary ? `
        <section class="ats-section">
          <h2 class="ats-section__title">RINGKASAN PROFESIONAL</h2>
          <p class="ats-text">${escapeHtml(data.summary)}</p>
        </section>
      ` : ""}

      <section class="ats-section">
        <h2 class="ats-section__title">KEAHLIAN UTAMA</h2>
        <p class="ats-text">${escapeHtml(data.skills || "")}</p>
      </section>

      <section class="ats-section">
        <h2 class="ats-section__title">PENGALAMAN KERJA</h2>
        ${experiencesHtml || `<p class="ats-text" style="color:#777;">(Belum ada pengalaman kerja)</p>`}
      </section>

      <section class="ats-section">
        <h2 class="ats-section__title">PENDIDIKAN</h2>
        ${educationHtml || `<p class="ats-text" style="color:#777;">(Belum ada riwayat pendidikan)</p>`}
      </section>
    </div>
  `;
}
