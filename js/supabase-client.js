/**
 * Supabase Multi-Device Cloud Sync Client
 * Enables optional real-time sync for applications, bookmarks, and match profile across devices.
 */

import { dbGetAllApplications, dbGetAllBookmarks, dbSaveApplication, dbSaveBookmark } from "./storage-db.js?v=20261106a";
import { readMatchProfile, writeMatchProfile } from "./profile.js?v=20261106a";

const SUPABASE_CONFIG_KEY = "jsa_supabase_config_v1";

export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: "", anonKey: "", enabled: false };
  } catch (err) {
    return { url: "", anonKey: "", enabled: false };
  }
}

export function validateSupabaseOrigin(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || "").trim());
    if (parsed.protocol !== "https:") return "";
    if (!parsed.hostname.endsWith(".supabase.co") && !parsed.hostname.endsWith(".supabase.in")) {
      return "";
    }
    return parsed.origin;
  } catch {
    return "";
  }
}

export function saveSupabaseConfig(config = {}) {
  try {
    const safeOrigin = config.url ? validateSupabaseOrigin(config.url) : "";
    if (config.enabled && !safeOrigin) {
      return false;
    }
    localStorage.setItem(
      SUPABASE_CONFIG_KEY,
      JSON.stringify({
        url: safeOrigin,
        anonKey: String(config.anonKey || "").trim(),
        enabled: Boolean(config.enabled && safeOrigin)
      })
    );
    return true;
  } catch (err) {
    return false;
  }
}

export async function syncToSupabase() {
  const config = getSupabaseConfig();
  const safeOrigin = validateSupabaseOrigin(config.url);
  if (!config.enabled || !safeOrigin || !config.anonKey) {
    return { synced: false, message: "Cloud sync belum dikonfigurasi atau URL Supabase tidak valid." };
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
    const res = await fetch(`${safeOrigin}/rest/v1/user_sync`, {
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
