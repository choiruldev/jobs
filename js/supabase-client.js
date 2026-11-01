/**
 * Supabase Multi-Device Cloud Sync Client
 * Enables optional real-time sync for applications, bookmarks, and match profile across devices.
 */

import { dbGetAllApplications, dbGetAllBookmarks, dbSaveApplication, dbSaveBookmark } from "./storage-db.js?v=20260616z";
import { readMatchProfile, writeMatchProfile } from "./profile.js?v=20260616z";

const SUPABASE_CONFIG_KEY = "jsa_supabase_config_v1";

export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: "", anonKey: "", enabled: false };
  } catch (err) {
    return { url: "", anonKey: "", enabled: false };
  }
}

export function saveSupabaseConfig(config = {}) {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    return false;
  }
}

export async function syncToSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    return { synced: false, message: "Cloud sync belum dikonfigurasi." };
  }

  const [apps, bookmarks] = await Promise.all([
    dbGetAllApplications().catch(() => []),
    dbGetAllBookmarks().catch(() => [])
  ]);
  const profile = readMatchProfile();

  const payload = {
    profile,
    applications: apps,
    bookmarks,
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${config.url}/rest/v1/user_sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.anonKey,
        "Authorization": `Bearer ${config.anonKey}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });

    return { synced: res.ok, status: res.status };
  } catch (err) {
    return { synced: false, error: err.message };
  }
}
