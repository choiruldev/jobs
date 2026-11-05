/**
 * AI Tailored Cover Letter & Follow-up Draft Generator
 * Generates personalized cover letters and follow-up email drafts based on job requirements and candidate profile.
 */

import { extractKeywords } from "./ats-checker.js?v=20261106a";

export function generateCoverLetter({ profile = {}, job = {}, language = "id", tone = "professional" }) {
  const candidateName = profile.name || "Kandidat Profesional";
  const targetRole = job.title || profile.targetRole || "Posisi yang Ditargetkan";
  const companyName = job.company || "Tim Rekruter";
  const skillsList = profile.skills || "keahlian terkait";
  const experienceYears = profile.experience || "beberapa tahun";
  
  const keywords = extractKeywords(`${job.title} ${job.description || ""}`);
  const topSkills = keywords.technical.slice(0, 4).join(", ") || skillsList;

  if (language === "en") {
    if (tone === "concise") {
      return `Hi ${companyName} Team,

I'm applying for the ${targetRole} role. Here's why I'd be a great fit:
- ${experienceYears} of experience focusing on ${topSkills}.
- Proven track record delivering high-quality deliverables in remote/async environments.
- Ready to hit the ground running with minimal supervision.

Looking forward to connecting!

Best regards,
${candidateName}
${profile.email || "[Your Email]"} | ${profile.linkedin || "[Portfolio/LinkedIn]"}`;
    }

    if (tone === "confident") {
      return `Dear Hiring Team at ${companyName},

I am writing to submit my application for the ${targetRole} role. As an experienced practitioner specializing in ${skillsList}, I bring a strong bias for action, deep technical fluency, and a clear track record of scaling impactful solutions.

Reviewing your requirements, my background with ${topSkills} aligns directly with what you need to accelerate your team's velocity. In previous engagements, I've led projects that solved complex bottlenecks, improved uptime, and fostered strong asynchronous team ownership.

What I will deliver for ${companyName}:
1. Rapid execution with high technical standards in ${topSkills}.
2. Autonomous problem-solving aligned with Asian/global distributed schedules.
3. Proactive alignment and measurable results from week one.

I would love to walk you through how I can drive results for your immediate goals.

Sincerely,
${candidateName}
Email: ${profile.email || "[Your Email]"}
Portfolio/LinkedIn: ${profile.linkedin || "[Your Link]"}`;
    }

    // Default professional EN
    return `Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the ${targetRole} position. With my background in ${skillsList} and ${experienceYears} of hands-on experience, I am confident in my ability to make an immediate, positive contribution to your team.

Having reviewed your job requirements, I was particularly drawn to your focus on ${topSkills}. In my previous roles, I have consistently applied these skills to deliver high-quality results, solve complex technical challenges, and collaborate effectively in remote, distributed environments.

Key highlights of what I bring to ${companyName}:
- Proven expertise in ${topSkills} with a track record of reliability and clean execution.
- Strong proactive communication and adaptability across global time zones (Asia/Jakarta baseline).
- Dedication to continuous improvement and user-centered problem solving.

I would welcome the opportunity to discuss how my qualifications align with your current goals. Thank you for your time and consideration.

Sincerely,
${candidateName}
Email: ${profile.email || "[Your Email]"}
Portfolio/LinkedIn: ${profile.linkedin || "[Your Link]"}`;
  }

  // Bahasa Indonesia
  if (tone === "concise") {
    return `Halo Tim Rekrutmen ${companyName},

Saya bermaksud melamar untuk posisi ${targetRole}. Berikut ringkasan kualifikasi utama saya:
- Pengalaman ${experienceYears} fokus pada ${topSkills}.
- Terbiasa kerja mandiri, asinkronus, dan tepat waktu dengan standar kode/hasil kerja tinggi.
- Siap langsung berkontribusi aktif dan cepat beradaptasi dengan alur kerja tim.

Terima kasih atas waktu dan kesempatannya. Saya siap berdiskusi lebih lanjut via interview.

Salam hangat,
${candidateName}
Kontak: ${profile.email || "[Email Anda]"} | ${profile.phone || "[Nomor HP]"}`;
  }

  if (tone === "confident") {
    return `Yth. Tim Rekrutmen ${companyName},

Saya sangat antusias mengajukan lamaran untuk posisi ${targetRole} di ${companyName}. Berbekal pengalaman intensif selama ${experienceYears} di bidang ${skillsList}, saya memiliki rekam jejak nyata dalam memecahkan masalah kompleks dan mempercepat pertumbuhan produk.

Melihat kebutuhan tim Anda pada penguasaan ${topSkills}, saya yakin kapabilitas teknis dan kemandirian eksekusi saya dapat langsung memberikan dampak positif sejak hari pertama. Saya terbiasa memimpin inisiatif dari perencanaan hingga peluncuran dengan hasil yang terukur.

Kontribusi utama yang siap saya hadirkan:
1. Eksekusi cepat dan arsitektur rapi pada ${topSkills}.
2. Komunikasi asinkronus yang transparan, proaktif, dan terstruktur.
3. Dedikasi tinggi untuk memberikan nilai tambah terbaik bagi pengguna dan performa bisnis perusahaan.

Besar harapan saya untuk berdiskusi langsung dalam tahap wawancara mengenai bagaimana saya dapat memperkuat tim ${companyName}.

Hormat saya,
${candidateName}
Kontak: ${profile.email || "[Email Anda]"} | ${profile.phone || "[Nomor HP]"}`;
  }

  // Default professional ID
  return `Yth. Tim Rekrutmen ${companyName},

Saya menulis surat ini untuk menyatakan ketertarikan mendalam saya pada posisi ${targetRole} di ${companyName}. Dengan latar belakang pengalaman ${experienceYears} di bidang ${skillsList}, saya yakin dapat memberikan kontribusi nyata dan relevan bagi tim Anda.

Berdasarkan kualifikasi yang dicari, saya melihat kebutuhan yang kuat pada penguasaan ${topSkills}. Pada pengalaman profesional saya sebelumnya, saya telah terbiasa menerapkan keahlian tersebut untuk menyelesaikan tantangan kerja secara efisien, mandiri, dan berorientasi pada dampak bisnis.

Kualifikasi utama yang saya tawarkan:
- Pengalaman praktis dalam ${topSkills} dengan standar kerja yang rapi dan terukur.
- Kemampuan komunikasi proaktif serta manajemen waktu mandiri yang sangat cocok untuk kultur kerja remote.
- Komitmen tinggi untuk terus belajar dan berkolaborasi secara positif dalam tim.

Besar harapan saya untuk mendapatkan kesempatan wawancara guna mendiskusikan lebih lanjut bagaimana kompetensi saya dapat mendukung pertumbuhan ${companyName}. Terima kasih atas perhatian dan waktu yang diberikan.

Hormat saya,
${candidateName}
Kontak: ${profile.email || "[Email Anda]"} | ${profile.phone || "[Nomor Telepon]"}`;
}

export function generateFollowUpEmail({ profile = {}, job = {}, daysSince = 7 }) {
  const candidateName = profile.name || "Kandidat";
  const companyName = job.company || "Perusahaan";
  const jobTitle = job.title || "Lamaran Kerja";

  return {
    subject: `Follow-up Lamaran: ${jobTitle} - ${candidateName}`,
    body: `Halo Tim Rekrutmen ${companyName},

Semoga pesan ini menemui Anda dalam keadaan baik.

Saya ingin menindaklanjuti proses lamaran saya untuk posisi ${jobTitle} yang telah saya kirimkan sekitar ${daysSince} hari yang lalu. Saya sangat antusias dengan kesempatan untuk bergabung bersama ${companyName} dan siap memberikan dedikasi terbaik saya.

Apabila ada informasi atau dokumen tambahan yang diperlukan dari pihak saya untuk melengkapi proses evaluasi, mohon jangan ragu untuk mengabari saya.

Terima kasih banyak atas waktu dan bantuannya.

Salam hangat,
${candidateName}
${profile.email || "[Email Anda]"}`
  };
}
