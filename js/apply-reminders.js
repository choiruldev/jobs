/**
 * Interview Timeline & Follow-up Notification Engine
 * Handles follow-up tracking alerts and generates .ics Calendar event downloads.
 */

/**
 * Filter lamaran yang memerlukan tindak lanjut (follow-up)
 */
export function getPendingFollowUps(items = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.filter((item) => {
    const app = item.application;
    if (!app) return false;

    // Follow up jika ada tanggal yang sudah jatuh tempo
    if (app.followUpAt) {
      const fDate = new Date(app.followUpAt);
      return fDate <= today;
    }

    // Follow up default jika status 'Applied' sudah lebih dari 7 hari tanpa update
    if (app.status === "Applied" && app.updatedAt) {
      const lastUpdate = new Date(app.updatedAt);
      const diffDays = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    }

    return false;
  });
}

/**
 * Generate dan unduh file iCalendar (.ics) untuk jadwal interview
 */
export function downloadInterviewIcs(interviewData = {}) {
  const {
    jobTitle = "Interview Kerja",
    companyName = "Perusahaan",
    interviewDate, // "YYYY-MM-DDTHH:mm"
    locationUrl = "",
    notes = ""
  } = interviewData;

  const start = interviewDate ? new Date(interviewDate) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000); // Durasi default 1 jam

  const formatIcsDate = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JobSearch Platform//Interview Scheduler//ID",
    "BEGIN:VEVENT",
    `UID:interview-${Date.now()}@jobsearch.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Wawancara Kerja: ${jobTitle} - ${companyName}`,
    `DESCRIPTION:${notes || "Wawancara proses rekrutmen"}`,
    `LOCATION:${locationUrl || "Online Meeting"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Pengingat Wawancara Kerja dalam 15 menit",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Interview_${companyName.replace(/[^a-z0-9]/gi, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
