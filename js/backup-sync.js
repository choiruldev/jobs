/**
 * Data Portability & Cloud Sync Engine
 * Handles 1-click JSON backup export/import and cloud sync adapter preparation.
 */

import { dbGetAllApplications, dbGetAllBookmarks, dbSaveApplication, dbSaveBookmark } from "./storage-db.js?v=20261106a";
import { readMatchProfile, writeMatchProfile } from "./profile.js?v=20261106a";

export async function exportAllData() {
  const [applications, bookmarks] = await Promise.all([
    dbGetAllApplications().catch(() => []),
    dbGetAllBookmarks().catch(() => [])
  ]);

  const profile = readMatchProfile();
  const rawSearches = localStorage.getItem("jsa_saved_searches_v1");
  const searches = rawSearches ? JSON.parse(rawSearches) : [];

  const backupData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    profile,
    applications: applications || [],
    bookmarks: bookmarks || [],
    searches: searches || []
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.setAttribute("download", `jobsearch_backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export function exportApplicationsCSV(items) {
  if (!items || !items.length) {
    throw new Error("Belum ada data lamaran untuk diekspor ke CSV.");
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "ID",
    "Perusahaan",
    "Posisi / Judul",
    "Status Lamaran",
    "Tanggal Submit",
    "Estimasi Gaji",
    "Lokasi",
    "Tipe Kerja",
    "Catatan",
    "URL Lowongan"
  ];

  const rows = items.map((item) => {
    const job = item.job || {};
    const app = item.application || {};
    return [
      escapeCSV(job.id || app.jobId || ""),
      escapeCSV(job.company || ""),
      escapeCSV(job.title || ""),
      escapeCSV(app.status || "submitted"),
      escapeCSV(app.submittedAt || ""),
      escapeCSV(job.salary || ""),
      escapeCSV(job.location || ""),
      escapeCSV(job.workStyle || ""),
      escapeCSV(app.notes || ""),
      escapeCSV(job.externalUrl || job.applyUrl || "")
    ].join(",");
  });

  // Include UTF-8 BOM so Excel opens ID/characters correctly
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.setAttribute("download", `jobsearch_tracker_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export async function importBackupData(jsonFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== "object") {
          throw new Error("Format file JSON tidak valid.");
        }

        // 1. Restore Profile
        if (data.profile) {
          writeMatchProfile(data.profile);
        }

        // 2. Restore Applications
        if (Array.isArray(data.applications)) {
          for (const app of data.applications) {
            if (app && app.id) {
              await dbSaveApplication(app);
            }
          }
          // Sync back to localStorage for compatibility
          localStorage.setItem("jsa_applications", JSON.stringify(data.applications));
        }

        // 3. Restore Bookmarks
        if (Array.isArray(data.bookmarks)) {
          for (const bm of data.bookmarks) {
            if (bm && bm.id) {
              await dbSaveBookmark(bm);
            }
          }
        }

        // 4. Restore Searches
        if (Array.isArray(data.searches)) {
          localStorage.setItem("jsa_saved_searches_v1", JSON.stringify(data.searches));
        }

        resolve({
          success: true,
          totalApplications: data.applications?.length || 0,
          totalBookmarks: data.bookmarks?.length || 0
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file backup."));
    reader.readAsText(jsonFile);
  });
}

/**
 * Cloud Sync Adapter Interface (Ready for Supabase/Firebase backend)
 */
export class CloudSyncAdapter {
  constructor(config = {}) {
    this.endpoint = config.endpoint || "";
    this.apiKey = config.apiKey || "";
  }

  async syncUp(data) {
    if (!this.endpoint) return { synced: false, reason: "No remote endpoint configured." };
    // Implementation for remote POST
    return { synced: true };
  }

  async syncDown() {
    if (!this.endpoint) return null;
    // Implementation for remote GET
    return null;
  }
}
