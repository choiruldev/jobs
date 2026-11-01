/**
 * Recruiter Response & Email Status Parser
 * Analyzes recruiter emails to classify application outcome (Interview, Offer, Rejection, Applied).
 */

export function parseRecruiterEmail(emailText = "") {
  if (!emailText || typeof emailText !== "string") {
    return { status: "unknown", confidence: 0, reason: "Teks email kosong" };
  }

  const text = emailText.toLowerCase();

  // 1. Job Offer Detection
  if (
    /pleased to offer|thrilled to offer|extend an offer|official offer|formal offer|surat penawaran kerja|selamat.*kami menawarkan/i.test(text)
  ) {
    return {
      status: "offer",
      label: "Tawaran Kerja (Offer)",
      confidence: 95,
      targetColumn: "offered",
      sentiment: "positive",
      summary: "Email ini terdeteksi sebagai surat penawaran kerja resmi (job offer). Selamat!"
    };
  }

  // 2. Interview Invitation Detection
  if (
    /invite.*interview|schedule a call|calendly\.com|meet\.google\.com|zoom\.us|wawancara|technical test|coding test|interview with/i.test(text)
  ) {
    return {
      status: "interview",
      label: "Undangan Wawancara / Tes",
      confidence: 90,
      targetColumn: "interviewing",
      sentiment: "positive",
      summary: "Email ini mengundang Anda ke sesi wawancara atau pengujian teknis."
    };
  }

  // 3. Rejection Detection
  if (
    /unfortunately|careful consideration|move forward with other|not selected|decided to pursue other|tidak dapat melanjutkan|belum dapat menerima|mohon maaf/i.test(text)
  ) {
    return {
      status: "rejected",
      label: "Lamaran Belum Berhasil (Rejection)",
      confidence: 92,
      targetColumn: "rejected",
      sentiment: "negative",
      summary: "Email ini menyatakan perusahaan belum melanjutkan proses lamaran Anda kali ini."
    };
  }

  // 4. Application Acknowledgment
  if (
    /application received|thank you for applying|terima kasih telah melamar|we received your application/i.test(text)
  ) {
    return {
      status: "applied",
      label: "Lamaran Diterima (Confirmation)",
      confidence: 85,
      targetColumn: "applied",
      sentiment: "neutral",
      summary: "Email ini merupakan konfirmasi bahwa berkas lamaran Anda telah masuk ke sistem rekruter."
    };
  }

  return {
    status: "inconclusive",
    label: "Perlu Tinjauan Manual",
    confidence: 40,
    targetColumn: "applied",
    sentiment: "neutral",
    summary: "Sistem belum dapat memastikan status pasti dari teks email ini."
  };
}
