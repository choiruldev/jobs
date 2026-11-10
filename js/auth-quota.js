/**
 * Hybrid Login & Freemium Quota Gate Engine (Zero-Backend Cost + Anti-Incognito Ledger)
 * - Visitors can browse all 2,550+ jobs without login.
 * - Using Career/AI tools or Auto-Send Email requires 1-Click Hybrid Login (Google / Email).
 * - Free accounts get a strict trial quota per feature tied to their email ledger.
 * - PRO VIP accounts (or PRO_VIP branch edition) get 100% UNLIMITED access.
 */

export const APP_EDITION = "PRO_VIP"; // Set to "PRO_VIP" on pro-vip branch for automatic full unlock

const AUTH_USER_KEY = "jsa_hybrid_auth_user_v1";
const QUOTA_MASTER_LEDGER_KEY = "jsa_quota_master_ledger_v1";
const PRO_PAYMENT_URL = "https://mayar.id/"; // Link pembayaran QRIS / VIP (dapat disesuaikan)

export const VALID_PRO_CODES = new Set([
  "PRO-19JT-VIP",
  "JSA-PRO-2026",
  "VIP-UNLIMITED",
  "CYBERMINT-PRO"
]);

export const QUOTA_DEFINITIONS = {
  auto_email_apply: {
    key: "auto_email_apply",
    label: "Auto-Send Email Lamaran",
    freeLimit: 2,
    period: "daily",
    icon: "forward_to_inbox",
    description: "Kirim email lamaran kerja otomatis lengkap dengan Cover Letter AI & CV ke HRD."
  },
  resume_pdf: {
    key: "resume_pdf",
    label: "Download & Ekspor CV ATS",
    freeLimit: 2,
    period: "lifetime",
    icon: "picture_as_pdf",
    description: "Cetak PDF CV standar ATS bersih dan ekspor dokumen lamaran."
  },
  ai_writer: {
    key: "ai_writer",
    label: "AI Cover Letter & Sapaan Recruiter",
    freeLimit: 3,
    period: "lifetime",
    icon: "auto_awesome",
    description: "Buat surat lamaran kerja dan pesan DM LinkedIn personal secara instan."
  },
  ats_scan: {
    key: "ats_scan",
    label: "Scanner Kata Kunci ATS",
    freeLimit: 3,
    period: "lifetime",
    icon: "manage_search",
    description: "Analisis kecocokan CV dengan kualifikasi loker dan deteksi kata kunci yang kurang."
  },
  kanban_export: {
    key: "kanban_export",
    label: "Ekspor Tracker & Kuota Kanban",
    freeLimit: 2,
    period: "lifetime",
    icon: "view_kanban",
    description: "Simpan lebih dari 5 lamaran kerja aktif dan ekspor laporan ke Excel/CSV."
  },
  interview_voice: {
    key: "interview_voice",
    label: "Simulator Interview Suara AI",
    freeLimit: 3,
    period: "lifetime",
    icon: "record_voice_over",
    description: "Latihan menjawab wawancara kerja dengan simulasi suara dan evaluasi skor."
  },
  coding_sandbox: {
    key: "coding_sandbox",
    label: "Eksekusi Uji Coding Sandbox",
    freeLimit: 2,
    period: "lifetime",
    icon: "terminal",
    description: "Jalankan automated unit test pada tantangan algoritma live coding."
  },
  invoice_pdf: {
    key: "invoice_pdf",
    label: "Cetak Invoice Freelance PDF",
    freeLimit: 1,
    period: "lifetime",
    icon: "receipt_long",
    description: "Buat dan cetak tagihan proyek freelance multi-mata uang."
  },
  portfolio_card: {
    key: "portfolio_card",
    label: "Generator Kartu Bukti Karya",
    freeLimit: 1,
    period: "lifetime",
    icon: "badge",
    description: "Cetak kartu portofolio terverifikasi dengan QR Code."
  },
  contract_scan: {
    key: "contract_scan",
    label: "Scanner Keamanan Kontrak Kerja",
    freeLimit: 2,
    period: "lifetime",
    icon: "gavel",
    description: "Deteksi pasal jebakan (red flags) dan penalti sepihak pada draf kontrak."
  }
};

function safeGetStorage(key) {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function getTodayDateKey() {
  return new Date().toISOString().split("T")[0];
}

function readMasterLedger() {
  const raw = safeGetStorage(QUOTA_MASTER_LEDGER_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

function writeMasterLedger(ledger) {
  safeSetStorage(QUOTA_MASTER_LEDGER_KEY, JSON.stringify(ledger));
}

export function getCurrentUser() {
  if (APP_EDITION === "PRO_VIP") {
    const raw = safeGetStorage(AUTH_USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { ...parsed, isPro: true };
      } catch (e) {}
    }
    return {
      email: "vip@jobsearch.id",
      name: "Member PRO VIP",
      provider: "vip_edition",
      isPro: true,
      loggedInAt: new Date().toISOString()
    };
  }

  const raw = safeGetStorage(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user || !user.email) return null;
    const ledger = readMasterLedger();
    const acct = ledger[user.email.toLowerCase()];
    if (acct && acct.isPro) {
      user.isPro = true;
      user.licenseKey = acct.licenseKey || user.licenseKey;
    }
    return user;
  } catch (e) {
    return null;
  }
}

export function isProUser() {
  if (APP_EDITION === "PRO_VIP") return true;
  const user = getCurrentUser();
  return Boolean(user && user.isPro);
}

export function loginWithHybridAccount({ email, name = "", provider = "email" } = {}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Masukkan alamat email yang valid (contoh: nama@gmail.com).");
  }

  const displayName = String(name || cleanEmail.split("@")[0])
    .replace(/[<>]/g, "")
    .trim();

  const ledger = readMasterLedger();
  if (!ledger[cleanEmail]) {
    ledger[cleanEmail] = {
      email: cleanEmail,
      name: displayName,
      isPro: false,
      createdAt: new Date().toISOString(),
      usage: {}
    };
    writeMasterLedger(ledger);
  }

  const accountRecord = ledger[cleanEmail];
  const sessionUser = {
    email: cleanEmail,
    name: displayName || accountRecord.name || cleanEmail.split("@")[0],
    provider,
    isPro: Boolean(accountRecord.isPro),
    licenseKey: accountRecord.licenseKey || null,
    loggedInAt: new Date().toISOString()
  };

  safeSetStorage(AUTH_USER_KEY, JSON.stringify(sessionUser));

  // Sync email & name into candidate match profile if empty
  try {
    const rawProfile = safeGetStorage("jsa_match_profile_v1");
    const profile = rawProfile ? JSON.parse(rawProfile) : {};
    if (!profile.email) profile.email = cleanEmail;
    if (!profile.fullName && displayName) profile.fullName = displayName;
    safeSetStorage("jsa_match_profile_v1", JSON.stringify(profile));
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jsa:auth-changed", { detail: sessionUser }));
    refreshAuthQuotaUI();
  }

  return sessionUser;
}

export function logoutHybridAccount() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jsa:auth-changed", { detail: null }));
    refreshAuthQuotaUI();
  }
}

export function verifyAndActivateProCode(rawCode = "") {
  const code = String(rawCode || "").trim().toUpperCase();
  const isValid =
    VALID_PRO_CODES.has(code) ||
    (code.startsWith("JSA-VIP-") && code.length >= 12);

  if (!isValid) {
    return {
      success: false,
      message: "Kode lisensi tidak valid. Pastikan kode sesuai dengan bukti pembayaran Anda."
    };
  }

  let user = getCurrentUser();
  if (!user) {
    user = loginWithHybridAccount({
      email: "member.pro@jobsearch.id",
      name: "Member PRO VIP",
      provider: "license"
    });
  }

  const ledger = readMasterLedger();
  const emailKey = user.email.toLowerCase();
  if (!ledger[emailKey]) {
    ledger[emailKey] = { email: emailKey, name: user.name, usage: {} };
  }
  ledger[emailKey].isPro = true;
  ledger[emailKey].licenseKey = code;
  ledger[emailKey].upgradedAt = new Date().toISOString();
  writeMasterLedger(ledger);

  const updatedUser = { ...user, isPro: true, licenseKey: code };
  safeSetStorage(AUTH_USER_KEY, JSON.stringify(updatedUser));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jsa:auth-changed", { detail: updatedUser }));
    refreshAuthQuotaUI();
  }

  return {
    success: true,
    user: updatedUser,
    message: "🎉 Selamat! Akun Anda telah di-upgrade ke PRO VIP (Akses Unlimited Tanpa Batas)."
  };
}

export function getQuotaStatus(featureKey) {
  const def = QUOTA_DEFINITIONS[featureKey] || {
    key: featureKey,
    label: "Fitur Karir Pro",
    freeLimit: 2,
    period: "lifetime"
  };

  if (isProUser()) {
    return {
      featureKey,
      label: def.label,
      isPro: true,
      loggedIn: true,
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      canUse: true
    };
  }

  const user = getCurrentUser();
  if (!user) {
    return {
      featureKey,
      label: def.label,
      isPro: false,
      loggedIn: false,
      used: 0,
      limit: def.freeLimit,
      remaining: def.freeLimit,
      canUse: false
    };
  }

  const ledger = readMasterLedger();
  const emailKey = user.email.toLowerCase();
  const acct = ledger[emailKey] || { usage: {} };
  const usageMap = acct.usage || {};

  const bucketKey = def.period === "daily" ? `${featureKey}_${getTodayDateKey()}` : featureKey;
  const used = Number(usageMap[bucketKey] || 0);
  const remaining = Math.max(0, def.freeLimit - used);

  return {
    featureKey,
    label: def.label,
    isPro: false,
    loggedIn: true,
    used,
    limit: def.freeLimit,
    remaining,
    period: def.period,
    canUse: remaining > 0
  };
}

export function consumeQuota(featureKey) {
  const status = getQuotaStatus(featureKey);
  if (status.isPro) {
    return { allowed: true, status };
  }
  if (!status.loggedIn) {
    return { allowed: false, reason: "NOT_LOGGED_IN", status };
  }
  if (status.remaining <= 0) {
    return { allowed: false, reason: "QUOTA_EXHAUSTED", status };
  }

  const user = getCurrentUser();
  const def = QUOTA_DEFINITIONS[featureKey] || { freeLimit: 2, period: "lifetime" };
  const bucketKey = def.period === "daily" ? `${featureKey}_${getTodayDateKey()}` : featureKey;

  const ledger = readMasterLedger();
  const emailKey = user.email.toLowerCase();
  if (!ledger[emailKey]) {
    ledger[emailKey] = { email: emailKey, name: user.name, usage: {} };
  }
  if (!ledger[emailKey].usage) {
    ledger[emailKey].usage = {};
  }
  ledger[emailKey].usage[bucketKey] = Number(ledger[emailKey].usage[bucketKey] || 0) + 1;
  writeMasterLedger(ledger);

  const nextStatus = getQuotaStatus(featureKey);
  if (typeof window !== "undefined") {
    refreshAuthQuotaUI();
    showQuotaToast(
      `⚡ Kuota Gratis "${def.label}" dipakai (Sisa ${nextStatus.remaining}/${nextStatus.limit}).`
    );
  }
  return { allowed: true, status: nextStatus };
}

export function requireQuotaOrPrompt(featureKey, onAllowedCallback) {
  const check = consumeQuota(featureKey);
  if (check.allowed) {
    if (typeof onAllowedCallback === "function") {
      onAllowedCallback(check.status);
    }
    return true;
  }

  if (check.reason === "NOT_LOGGED_IN") {
    openHybridAuthModal({
      featureKey,
      onSuccessLogin: () => {
        requireQuotaOrPrompt(featureKey, onAllowedCallback);
      }
    });
    return false;
  }

  openProUpgradeModal({ featureKey });
  return false;
}

export function showQuotaToast(message) {
  if (typeof document === "undefined") return;
  let toast = document.getElementById("jsa-quota-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "jsa-quota-toast";
    toast.style.cssText =
      "position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:#0c261e;color:#ecfdf5;border:1px solid #10b981;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;z-index:9998;box-shadow:0 10px 28px rgba(0,0,0,0.28);display:flex;align-items:center;gap:10px;max-width:92vw;transition:opacity 0.25s ease;";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <span>${message}</span>
    <button type="button" id="jsa-toast-upgrade-btn" style="background:#a3e635;color:#052e16;border:none;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">Upgrade PRO</button>
  `;
  toast.style.opacity = "1";
  toast.style.pointerEvents = "auto";
  toast.querySelector("#jsa-toast-upgrade-btn")?.addEventListener("click", () => {
    openProUpgradeModal();
  });

  clearTimeout(window.__jsaQuotaToastTimer);
  window.__jsaQuotaToastTimer = setTimeout(() => {
    if (toast) {
      toast.style.opacity = "0";
      toast.style.pointerEvents = "none";
    }
  }, 4200);
}

function ensureModalHost() {
  let host = document.getElementById("jsa-auth-quota-modal-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "jsa-auth-quota-modal-host";
    document.body.appendChild(host);
  }
  return host;
}

export function openHybridAuthModal({ featureKey = "auto_email_apply", onSuccessLogin = null } = {}) {
  if (typeof document === "undefined") return;
  const def = QUOTA_DEFINITIONS[featureKey] || QUOTA_DEFINITIONS.auto_email_apply;
  const host = ensureModalHost();

  host.innerHTML = `
    <div id="jsa-login-backdrop" style="position:fixed;inset:0;background:rgba(5,20,15,0.72);backdrop-filter:blur(6px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="background:var(--md-sys-color-surface, #ffffff);color:var(--md-sys-color-on-surface, #0f172a);border:1px solid var(--md-sys-color-outline-variant, #cbd5e1);border-radius:20px;max-width:440px;width:100%;padding:24px;box-shadow:0 24px 48px rgba(0,0,0,0.32);position:relative;">
        <button type="button" id="jsa-login-close" aria-label="Tutup" style="position:absolute;top:14px;right:14px;background:transparent;border:none;color:var(--md-sys-color-outline);cursor:pointer;padding:6px;border-radius:50%;">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.14);color:var(--md-sys-color-primary, #059669);padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:12px;">
          <span class="material-symbols-outlined" style="font-size:16px;">verified_user</span>
          Aktivasi Kuota Gratis & Auto-Email
        </div>

        <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;line-height:1.25;">Masuk 1-Klik untuk Memakai ${def.label}</h2>
        <p style="margin:0 0 16px;font-size:13px;color:var(--md-sys-color-outline);line-height:1.5;">
          Pencarian loker 100% bebas tanpa login. Untuk memakai <strong>${def.label}</strong> (Kuota Gratis: <strong>${def.freeLimit}x</strong>) dan fitur <strong>Auto-Send Email Lamaran</strong>, masukkan akun email Anda:
        </p>

        <button type="button" id="jsa-google-quick-btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px 16px;border-radius:12px;border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface-container-low, #f8fafc);color:var(--md-sys-color-on-surface);font-weight:700;font-size:13.5px;cursor:pointer;margin-bottom:14px;">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 .1 11.2.1 13.5s.5 4.5 1.5 6.5l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"/></svg>
          Lanjutkan Cepat dengan Akun Google
        </button>

        <div style="display:flex;align-items:center;gap:10px;margin:10px 0;font-size:11px;color:var(--md-sys-color-outline);text-transform:uppercase;letter-spacing:0.06em;">
          <span style="flex:1;height:1px;background:var(--md-sys-color-outline-variant);"></span>
          <span>atau gunakan email kerja</span>
          <span style="flex:1;height:1px;background:var(--md-sys-color-outline-variant);"></span>
        </div>

        <form id="jsa-hybrid-login-form" style="display:grid;gap:10px;">
          <div>
            <label for="jsa-login-name" style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Nama Lengkap (Untuk CV & Pengirim Email)</label>
            <input id="jsa-login-name" type="text" required placeholder="Contoh: Budi Pratama" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font-size:13.5px;box-sizing:border-box;">
          </div>
          <div>
            <label for="jsa-login-email" style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Alamat Email Aktif</label>
            <input id="jsa-login-email" type="email" required placeholder="nama@gmail.com" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font-size:13.5px;box-sizing:border-box;">
          </div>
          <div id="jsa-login-error" style="display:none;color:#dc2626;font-size:12px;font-weight:600;"></div>
          <button type="submit" class="button button--primary" style="width:100%;justify-content:center;padding:12px;border-radius:12px;font-weight:800;margin-top:4px;">
            <span class="material-symbols-outlined" style="font-size:18px;">bolt</span>
            Aktifkan Kuota Gratis Sekarang
          </button>
        </form>

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--md-sys-color-outline-variant);display:flex;align-items:center;justify-content:space-between;font-size:12px;">
          <span style="color:var(--md-sys-color-outline);">Sudah punya Kode Lisensi PRO?</span>
          <button type="button" id="jsa-switch-to-pro-modal" style="background:none;border:none;color:var(--md-sys-color-primary);font-weight:800;cursor:pointer;padding:0;">Masukkan Kode VIP →</button>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    host.innerHTML = "";
  };

  host.querySelector("#jsa-login-close")?.addEventListener("click", close);
  host.querySelector("#jsa-login-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "jsa-login-backdrop") close();
  });

  host.querySelector("#jsa-google-quick-btn")?.addEventListener("click", () => {
    const emailInput = host.querySelector("#jsa-login-email");
    const nameInput = host.querySelector("#jsa-login-name");
    if (emailInput && !emailInput.value) {
      emailInput.focus();
      emailInput.placeholder = "ketik.email.google@gmail.com lalu klik Aktifkan";
      if (nameInput && !nameInput.value) nameInput.value = "Kandidat Profesional";
      return;
    }
    host.querySelector("#jsa-hybrid-login-form")?.requestSubmit();
  });

  host.querySelector("#jsa-switch-to-pro-modal")?.addEventListener("click", () => {
    close();
    openProUpgradeModal({ featureKey });
  });

  host.querySelector("#jsa-hybrid-login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameVal = host.querySelector("#jsa-login-name")?.value || "";
    const emailVal = host.querySelector("#jsa-login-email")?.value || "";
    const errEl = host.querySelector("#jsa-login-error");
    try {
      loginWithHybridAccount({ email: emailVal, name: nameVal, provider: "hybrid" });
      close();
      if (typeof onSuccessLogin === "function") {
        onSuccessLogin();
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.style.display = "block";
      }
    }
  });
}

export function openProUpgradeModal({ featureKey = "auto_email_apply" } = {}) {
  if (typeof document === "undefined") return;
  const def = QUOTA_DEFINITIONS[featureKey] || QUOTA_DEFINITIONS.auto_email_apply;
  const user = getCurrentUser();
  const status = getQuotaStatus(featureKey);
  const host = ensureModalHost();

  host.innerHTML = `
    <div id="jsa-pro-backdrop" style="position:fixed;inset:0;background:rgba(5,20,15,0.78);backdrop-filter:blur(6px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;">
      <div style="background:var(--md-sys-color-surface, #ffffff);color:var(--md-sys-color-on-surface, #0f172a);border:2px solid #10b981;border-radius:22px;max-width:480px;width:100%;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,0.4);position:relative;max-height:92vh;overflow-y:auto;">
        <button type="button" id="jsa-pro-close" aria-label="Tutup" style="position:absolute;top:14px;right:14px;background:transparent;border:none;color:var(--md-sys-color-outline);cursor:pointer;padding:6px;border-radius:50%;">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div style="display:inline-flex;align-items:center;gap:6px;background:#052e16;color:#a3e635;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:12px;">
          <span class="material-symbols-outlined" style="font-size:16px;">workspace_premium</span>
          JOBSEARCH PRO VIP — UNLIMITED EDITION
        </div>

        <h2 style="margin:0 0 6px;font-size:21px;font-weight:900;line-height:1.25;">
          ${status.remaining <= 0 && status.loggedIn ? `Kuota Gratis "${def.label}" Anda Telah Habis (${status.used}/${status.limit})` : "Buka Akses Tanpa Batas ke Seluruh Alat Karir AI & Auto-Email"}
        </h2>
        <p style="margin:0 0 16px;font-size:13px;color:var(--md-sys-color-outline);line-height:1.5;">
          Tingkatkan peluang diterima kerja 5x lebih cepat dengan otomatisasi penuh tanpa batasan kuota harian.
        </p>

        <div style="background:var(--md-sys-color-surface-container-low, #f1f5f9);border-radius:14px;padding:14px;margin-bottom:16px;display:grid;gap:8px;font-size:13px;">
          <div style="display:flex;align-items:center;gap:8px;"><span class="material-symbols-outlined" style="color:#10b981;font-size:18px;">check_circle</span> <span><strong>Unlimited Auto-Send Email Lamaran</strong> & Batch Apply ke HRD</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="material-symbols-outlined" style="color:#10b981;font-size:18px;">check_circle</span> <span><strong>Unlimited Download PDF CV ATS</strong> & AI Cover Letter Generator</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="material-symbols-outlined" style="color:#10b981;font-size:18px;">check_circle</span> <span><strong>Unlimited Simulator Interview Suara AI</strong> & Coding Sandbox</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="material-symbols-outlined" style="color:#10b981;font-size:18px;">check_circle</span> <span><strong>Unlimited Kanban Tracker</strong>, Invoice PDF & Sinkron Semua Perangkat</span></div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:14px;padding:12px 16px;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--md-sys-color-outline);text-transform:uppercase;">Akses Seumur Hidup (Lifetime)</div>
            <div style="font-size:22px;font-weight:900;color:var(--md-sys-color-primary);">Rp 49.000 <span style="font-size:12px;font-weight:500;text-decoration:line-through;color:var(--md-sys-color-outline);">Rp 199.000</span></div>
          </div>
          <a href="${PRO_PAYMENT_URL}" target="_blank" rel="noopener noreferrer" class="button button--primary" style="padding:10px 16px;border-radius:10px;font-weight:800;text-decoration:none;">
            Beli via QRIS ↗
          </a>
        </div>

        <form id="jsa-activate-pro-form" style="border-top:1px solid var(--md-sys-color-outline-variant);padding-top:14px;">
          <label for="jsa-pro-code-input" style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;">
            Sudah Bayar? Masukkan Kode Lisensi VIP Anda:
          </label>
          <div style="display:flex;gap:8px;">
            <input id="jsa-pro-code-input" type="text" required placeholder="Contoh: PRO-19JT-VIP" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font-size:13px;font-weight:700;text-transform:uppercase;">
            <button type="submit" class="button button--tonal" style="padding:10px 16px;border-radius:10px;font-weight:800;white-space:nowrap;">
              Aktifkan PRO
            </button>
          </div>
          <div id="jsa-pro-code-feedback" style="margin-top:8px;font-size:12px;font-weight:600;display:none;"></div>
        </form>

        ${user ? `
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--md-sys-color-outline);">
            <span>Login sebagai: <strong>${user.email}</strong></span>
            <button type="button" id="jsa-modal-logout-btn" style="background:none;border:none;color:#dc2626;cursor:pointer;font-weight:700;">Ganti Akun</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  const close = () => {
    host.innerHTML = "";
  };

  host.querySelector("#jsa-pro-close")?.addEventListener("click", close);
  host.querySelector("#jsa-pro-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "jsa-pro-backdrop") close();
  });

  host.querySelector("#jsa-modal-logout-btn")?.addEventListener("click", () => {
    logoutHybridAccount();
    close();
    openHybridAuthModal({ featureKey });
  });

  host.querySelector("#jsa-activate-pro-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = host.querySelector("#jsa-pro-code-input");
    const feedback = host.querySelector("#jsa-pro-code-feedback");
    const res = verifyAndActivateProCode(input?.value || "");
    if (feedback) {
      feedback.style.display = "block";
      feedback.style.color = res.success ? "#10b981" : "#dc2626";
      feedback.textContent = res.message;
    }
    if (res.success) {
      setTimeout(() => {
        close();
        showQuotaToast(res.message);
      }, 900);
    }
  });
}

function getPageFeatureKey() {
  if (typeof document === "undefined") return null;
  const page = document.body?.dataset?.page || "";
  const path = window.location.pathname || "";
  if (page === "resume" || path.includes("resume-builder")) return "resume_pdf";
  if (page === "detail" || path.includes("detail.html")) return "auto_email_apply";
  if (page === "apply" || path.includes("apply.html")) return "auto_email_apply";
  if (page === "interview" || path.includes("interview-prep")) return "interview_voice";
  if (page === "code-sandbox" || path.includes("code-sandbox")) return "coding_sandbox";
  if (page === "invoice" || path.includes("invoice-generator")) return "invoice_pdf";
  if (page === "portfolio" || path.includes("portfolio-card")) return "portfolio_card";
  if (page === "contract" || path.includes("contract-guide")) return "contract_scan";
  return null;
}

export function refreshAuthQuotaUI() {
  if (typeof document === "undefined") return;
  const user = getCurrentUser();
  const pro = isProUser();

  // 1. Top App Bar Status Button
  const topBarRight = document.querySelector(".top-app-bar > div:last-child");
  if (topBarRight) {
    let pill = document.getElementById("jsa-topbar-auth-pill");
    if (!pill) {
      pill = document.createElement("button");
      pill.id = "jsa-topbar-auth-pill";
      pill.type = "button";
      pill.style.cssText =
        "display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer;border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface-container-low);color:var(--md-sys-color-on-surface);white-space:nowrap;max-width:190px;overflow:hidden;text-overflow:ellipsis;";
      topBarRight.prepend(pill);
      pill.addEventListener("click", () => {
        if (!getCurrentUser()) {
          openHybridAuthModal();
        } else {
          openProUpgradeModal();
        }
      });
    }

    if (pro) {
      pill.style.background = "#052e16";
      pill.style.color = "#a3e635";
      pill.style.borderColor = "#10b981";
      pill.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;">workspace_premium</span><span>PRO VIP</span>`;
    } else if (user) {
      const shortName = user.email.split("@")[0].slice(0, 10);
      pill.style.background = "rgba(16,185,129,0.12)";
      pill.style.color = "var(--md-sys-color-primary)";
      pill.style.borderColor = "rgba(16,185,129,0.35)";
      pill.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;">account_circle</span><span>${shortName} · Upgrade</span>`;
    } else {
      pill.style.background = "var(--md-sys-color-surface-container-low)";
      pill.style.color = "var(--md-sys-color-on-surface)";
      pill.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;">login</span><span>Masuk / Kuota</span>`;
    }
  }

  // 2. Contextual Feature Quota Banner on Career Tool Pages
  const featureKey = getPageFeatureKey();
  if (!featureKey) return;

  const status = getQuotaStatus(featureKey);
  const mainContainer =
    document.querySelector(".page__content") ||
    document.querySelector(".detail-page-container") ||
    document.getElementById("application-root");

  if (!mainContainer) return;

  let banner = document.getElementById("jsa-feature-quota-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "jsa-feature-quota-banner";
    banner.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px;border-radius:14px;margin-bottom:16px;font-size:12.5px;border:1px solid rgba(16,185,129,0.35);background:rgba(16,185,129,0.08);";
    mainContainer.prepend(banner);
  }

  if (pro) {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700;color:var(--md-sys-color-primary);">
        <span class="material-symbols-outlined" style="font-size:18px;">verified</span>
        <span>Status Akun: <strong>PRO VIP (${user?.email || "Unlimited"})</strong> — Seluruh Fitur & Auto-Send Email Tanpa Batas!</span>
      </div>
    `;
  } else if (user) {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span class="material-symbols-outlined" style="font-size:18px;color:var(--md-sys-color-primary);">bolt</span>
        <span>Akun Gratis (<strong>${user.email}</strong>) · Sisa Kuota <strong>${status.label}</strong>: <strong style="color:${status.remaining > 0 ? "var(--md-sys-color-primary)" : "#dc2626"};">${status.remaining} dari ${status.limit}</strong></span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button type="button" class="js-open-pro-modal" style="background:#052e16;color:#a3e635;border:1px solid #10b981;padding:5px 12px;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;">
          💎 Upgrade PRO (Unlimited)
        </button>
      </div>
    `;
    banner.querySelector(".js-open-pro-modal")?.addEventListener("click", () => {
      openProUpgradeModal({ featureKey });
    });
  } else {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span class="material-symbols-outlined" style="font-size:18px;color:var(--md-sys-color-primary);">lock_open</span>
        <span>Mode Tamu: Anda mendapat <strong>${status.limit}x Kuota Gratis ${status.label}</strong> setelah Login 1-Klik.</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button type="button" class="js-open-login-modal" style="background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary, #fff);border:none;padding:5px 12px;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;">
          👤 Masuk & Klaim Kuota Gratis
        </button>
      </div>
    `;
    banner.querySelector(".js-open-login-modal")?.addEventListener("click", () => {
      openHybridAuthModal({ featureKey });
    });
  }
}

function bindGlobalPaidButtonInterceptors() {
  if (typeof document === "undefined" || window.__jsaQuotaInterceptorsBound) return;
  window.__jsaQuotaInterceptorsBound = true;

  const selectorToFeatureMap = [
    { selector: "#print-pdf-btn, #export-html-btn, #export-json-btn", feature: "resume_pdf" },
    { selector: "#generate-cover-letter-btn, #generate-outreach-btn", feature: "ai_writer" },
    { selector: "#export-csv-btn, #btn-export-csv, #btn-export-json", feature: "kanban_export" },
    { selector: "#eval-answer-btn, #voice-record-btn, #btn-start-voice", feature: "interview_voice" },
    { selector: "#run-code-btn, #btn-run-tests", feature: "coding_sandbox" },
    { selector: "#print-invoice-btn", feature: "invoice_pdf" },
    { selector: "#print-card-btn, #copy-card-link-btn", feature: "portfolio_card" },
    { selector: "#scan-contract-btn", feature: "contract_scan" }
  ];

  document.addEventListener(
    "click",
    (e) => {
      if (isProUser()) return;
      if (e.target?.dataset?.jsaQuotaBypassed === "1") {
        delete e.target.dataset.jsaQuotaBypassed;
        return;
      }

      for (const mapping of selectorToFeatureMap) {
        const matchedBtn = e.target?.closest?.(mapping.selector);
        if (matchedBtn) {
          e.preventDefault();
          e.stopImmediatePropagation();
          requireQuotaOrPrompt(mapping.feature, () => {
            matchedBtn.dataset.jsaQuotaBypassed = "1";
            matchedBtn.click();
          });
          return;
        }
      }
    },
    true
  );
}

export function initAuthQuotaEngine() {
  if (typeof window === "undefined") return;

  // Check URL for instant Pro activation parameter (?activate_pro=PRO-19JT-VIP)
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("activate_pro");
    if (code) {
      const res = verifyAndActivateProCode(code);
      if (res.success) {
        setTimeout(() => showQuotaToast(res.message), 500);
      }
    }
  } catch (e) {}

  bindGlobalPaidButtonInterceptors();
  refreshAuthQuotaUI();
  setTimeout(refreshAuthQuotaUI, 350);
}
