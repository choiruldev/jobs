/**
 * Direct Recruiter Outreach & LinkedIn InMail Generator
 * Generates tailored cold-outreach messages for recruiters and hiring managers.
 */

import { extractKeywords } from "./ats-checker.js?v=20261106a";

/**
 * Generate cold outreach messages for LinkedIn or email
 * @param {Object} options
 * @param {Object} options.job - Lowongan
 * @param {Object} options.profile - Profil pengguna
 * @param {string} options.targetPerson - 'recruiter', 'engineering_manager', 'founder'
 * @param {string} options.channel - 'linkedin_note', 'inmail', 'email'
 * @param {string} options.language - 'id', 'en'
 */
export function generateOutreachMessage({
  job = {},
  profile = {},
  targetPerson = "recruiter",
  channel = "linkedin_note",
  language = "id"
}) {
  const candidateName = profile.name || "Kandidat";
  const jobTitle = job.title || "Software Engineer";
  const companyName = job.company || "Perusahaan";
  const skillsList = profile.skills || "bidang terkait";
  const keywords = extractKeywords(`${job.title} ${job.description || ""}`);
  const topSkills = keywords.technical.slice(0, 3).join(", ") || skillsList;

  // 1. LinkedIn Connection Request Note (Maksimal 300 Karakter)
  if (channel === "linkedin_note") {
    if (language === "en") {
      return `Hi! I saw the ${jobTitle} opening at ${companyName}. With strong expertise in ${topSkills}, I believe my background aligns closely with your team's goals. I would love to connect and share how I can contribute! Best, ${candidateName}.`;
    }
    return `Halo! Saya melihat lowongan ${jobTitle} di ${companyName}. Dengan pengalaman di bidang ${topSkills}, saya sangat tertarik berkontribusi pada tim Anda. Salam kenal dan semoga bisa terhubung! - ${candidateName}`;
  }

  // 2. Direct Outreach to Engineering Manager / Tech Lead
  if (targetPerson === "engineering_manager") {
    if (language === "en") {
      return `Subject: Quick question regarding ${jobTitle} at ${companyName}

Hi Engineering Team at ${companyName},

I came across your open ${jobTitle} position and was immediately impressed by your engineering focus. 

Over the past few years, I have specialized in ${topSkills}, building reliable, scalable systems and thriving in remote/distributed team environments. Given what you're building, I'd love to learn more about the team's current technical challenges and share how my background could help accelerate delivery.

Here is a quick snapshot of my work:
- Core stack: ${topSkills}
- Portfolio/GitHub: ${profile.github || profile.linkedin || "[Your Link]"}

Would you have 10 minutes next week for a brief chat?

Best regards,
${candidateName}
${profile.email || "[Your Email]"}`;
    }

    return `Subjek: Ketertarikan posisi ${jobTitle} di ${companyName}

Halo Tim Engineering ${companyName},

Saya melihat pembukaan posisi ${jobTitle} di tim Anda dan sangat tertarik dengan arsitektur produk yang sedang Anda bangun.

Saya memiliki latar belakang intensif di bidang ${topSkills}, dengan fokus pada penulisan kode yang bersih, performa tinggi, dan kolaborasi kerja mandiri/remote. Berdasarkan kualifikasi yang dicari, saya yakin dapat langsung memberikan dampak positif pada sprint tim.

Ringkasan profil saya:
- Keahlian teknis: ${topSkills}
- Portfolio / GitHub: ${profile.github || profile.linkedin || "[Link Portfolio Anda]"}

Jika berkenan, saya sangat terbuka untuk mengobrol singkat 10 menit seputar kebutuhan teknis di tim ${companyName}.

Salam hangat,
${candidateName}
${profile.email || "[Email Anda]"}`;
  }

  // 3. Full Recruiter InMail / Cold Email
  if (language === "en") {
    return `Subject: Application & Inquiry: ${jobTitle} - ${candidateName}

Dear Hiring Team at ${companyName},

I hope this message finds you well.

I recently noticed the ${jobTitle} vacancy on your careers page and felt compelled to reach out directly. With a solid foundation in ${skillsList} and proven experience deploying ${topSkills}, I am confident I can hit the ground running with minimal ramp-up time.

A couple of quick highlights:
- Hands-on experience with ${topSkills} in high-growth environments.
- Strong asynchronous communication skills, perfectly suited for remote collaboration across time zones.

I've already reviewed the role requirements and would love the opportunity to formally interview with your team. Please feel free to check out my LinkedIn: ${profile.linkedin || "[Your Link]"}.

Thank you for your time, and I look forward to hearing from you.

Warm regards,
${candidateName}
${profile.email || "[Your Email]"} | ${profile.phone || ""}`;
  }

  return `Subjek: Lamaran & Sapaan Profesional: ${jobTitle} - ${candidateName}

Halo Tim Rekrutmen ${companyName},

Semoga pesan ini menemui Anda dalam keadaan baik.

Saya menulis pesan ini untuk memperkenalkan diri sehubungan dengan lowongan ${jobTitle} yang sedang dibuka di ${companyName}. Berbekal pengalaman di bidang ${skillsList} dan keahlian mendalam pada ${topSkills}, saya sangat antusias untuk dapat bergabung dan berkontribusi secara nyata.

Poin keunggulan yang saya tawarkan:
- Rekam jejak implementasi ${topSkills} dengan standar kualitas tinggi.
- Kemampuan manajemen waktu mandiri dan komunikasi asinkronus yang teruji untuk kerja remote/hybrid.

Saya sangat menyambut baik kesempatan untuk melangkah ke tahap wawancara perkenalan. Profil lengkap saya dapat dilihat di: ${profile.linkedin || "[Link LinkedIn Anda]"}.

Terima kasih atas waktu dan perhatiannya!

Salam hangat,
${candidateName}
${profile.email || "[Email Anda]"}`;
}
