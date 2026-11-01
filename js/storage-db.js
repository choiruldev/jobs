/**
 * IndexedDB High-Capacity Storage Engine
 * Mampu menyimpan puluhan ribu lowongan, status lamaran, dan data profil tanpa batas 5MB localStorage.
 * Dilengkapi automatic migration dari localStorage.
 */

const DB_NAME = "JobSearchDB";
const DB_VERSION = 1;

let dbInstancePromise = null;

export function openDatabase() {
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      console.warn("IndexedDB tidak didukung pada environment ini, fallback ke localStorage.");
      return resolve(null);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Store Lowongan Kerja
      if (!db.objectStoreNames.contains("jobs")) {
        const jobStore = db.createObjectStore("jobs", { keyPath: "id" });
        jobStore.createIndex("remoteTier", "remoteTier", { unique: false });
        jobStore.createIndex("category", "category", { unique: false });
        jobStore.createIndex("experienceLevel", "experienceLevel", { unique: false });
        jobStore.createIndex("postedAt", "postedAt", { unique: false });
      }

      // 2. Store Application Tracker
      if (!db.objectStoreNames.contains("applications")) {
        const appStore = db.createObjectStore("applications", { keyPath: "id" });
        appStore.createIndex("status", "status", { unique: false });
        appStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // 3. Store Bookmarks
      if (!db.objectStoreNames.contains("bookmarks")) {
        const bookmarkStore = db.createObjectStore("bookmarks", { keyPath: "id" });
        bookmarkStore.createIndex("savedAt", "savedAt", { unique: false });
      }

      // 4. Store KV (Fallback & Config)
      if (!db.objectStoreNames.contains("kv_store")) {
        db.createObjectStore("kv_store", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("Gagal membuka IndexedDB:", event.target.error);
      resolve(null); // Fallback gracefully
    };
  });

  return dbInstancePromise;
}

/**
 * Operasi umum pada ObjectStore
 */
async function getStore(storeName, mode = "readonly") {
  const db = await openDatabase();
  if (!db) return null;
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

// ==========================================
// STORE: JOBS
// ==========================================

export async function dbSaveJobs(jobs = []) {
  const store = await getStore("jobs", "readwrite");
  if (!store) return false;

  return new Promise((resolve) => {
    const transaction = store.transaction;
    jobs.forEach((job) => {
      if (job && job.id) {
        store.put(job);
      }
    });

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = (e) => {
      console.error("Gagal batch save jobs di IndexedDB:", e);
      resolve(false);
    };
  });
}

export async function dbGetAllJobs() {
  const store = await getStore("jobs", "readonly");
  if (!store) return [];

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function dbGetJobById(id) {
  const store = await getStore("jobs", "readonly");
  if (!store) return null;

  return new Promise((resolve) => {
    const request = store.get(String(id));
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function dbCountJobs() {
  const store = await getStore("jobs", "readonly");
  if (!store) return 0;

  return new Promise((resolve) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => resolve(0);
  });
}

// ==========================================
// STORE: APPLICATIONS (TRACKER)
// ==========================================

export async function dbSaveApplication(app) {
  const store = await getStore("applications", "readwrite");
  if (!store) {
    // Fallback sync to localStorage
    return false;
  }

  return new Promise((resolve) => {
    const request = store.put(app);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

export async function dbGetAllApplications() {
  const store = await getStore("applications", "readonly");
  if (!store) return null;

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function dbDeleteApplication(id) {
  const store = await getStore("applications", "readwrite");
  if (!store) return false;

  return new Promise((resolve) => {
    const request = store.delete(String(id));
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

// ==========================================
// STORE: BOOKMARKS
// ==========================================

export async function dbSaveBookmark(bookmark) {
  const store = await getStore("bookmarks", "readwrite");
  if (!store) return false;

  return new Promise((resolve) => {
    const request = store.put(bookmark);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

export async function dbGetAllBookmarks() {
  const store = await getStore("bookmarks", "readonly");
  if (!store) return null;

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function dbRemoveBookmark(id) {
  const store = await getStore("bookmarks", "readwrite");
  if (!store) return false;

  return new Promise((resolve) => {
    const request = store.delete(String(id));
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

// ==========================================
// SYNC & MIGRATION DARI LOCALSTORAGE
// ==========================================

export async function syncFromLocalStorage() {
  try {
    // 1. Migrasi Bookmarks
    const rawBookmarks = localStorage.getItem("jsa_bookmarks");
    if (rawBookmarks) {
      const parsed = JSON.parse(rawBookmarks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          const id = typeof item === "string" ? item : (item && item.id ? item.id : null);
          if (id) {
            await dbSaveBookmark({
              id: String(id),
              savedAt: item.savedAt || new Date().toISOString(),
              data: typeof item === "object" ? item : null
            });
          }
        }
      }
    }

    // 2. Migrasi Applications
    const rawApps = localStorage.getItem("jsa_applications");
    if (rawApps) {
      const parsed = JSON.parse(rawApps);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const app of parsed) {
          if (app && app.id) {
            await dbSaveApplication(app);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Gagal migrasi otomatis dari localStorage ke IndexedDB:", err);
  }
}

// Jalankan inisialisasi dan migrasi awal di browser
if (typeof window !== "undefined") {
  openDatabase().then(() => syncFromLocalStorage());
}
