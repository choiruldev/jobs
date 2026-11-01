/**
 * In-App Webhook & Telegram Dispatcher Settings Engine
 * Manages user alert preferences, custom triggers, and sends test webhook notifications.
 */

const ALERTS_CONFIG_KEY = "jsa_alert_settings_v1";

export const DEFAULT_ALERT_CONFIG = {
  enabled: true,
  telegramChatId: "",
  telegramBotToken: "",
  discordWebhookUrl: "",
  minSalaryIdr: 15000000,
  keywords: "Software, Frontend, Backend, Data, React, Go, Python",
  platforms: ["LinkedIn", "JobStreet", "Indeed", "Remote Global"],
  frequency: "instant" // 'instant' | 'daily'
};

export function readAlertConfig() {
  try {
    const raw = localStorage.getItem(ALERTS_CONFIG_KEY);
    return raw ? { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_ALERT_CONFIG };
  } catch (err) {
    return { ...DEFAULT_ALERT_CONFIG };
  }
}

export function writeAlertConfig(config) {
  try {
    localStorage.setItem(ALERTS_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    return false;
  }
}

export async function sendTestDiscordNotification(webhookUrl) {
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    throw new Error("URL Discord Webhook tidak valid.");
  }

  const payload = {
    username: "JobSearch Bot",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/3850/3850285.png",
    embeds: [
      {
        title: "🔔 Test Notifikasi Job Alert Berhasil!",
        description: "Selamat! Integrasi Discord Webhook Anda dengan JobSearch sudah aktif. Anda akan menerima notifikasi otomatis saat ada lowongan baru yang sesuai dengan kriteria profil Anda.",
        color: 3066993, // Greenish teal
        fields: [
          { name: "Status", value: "Terkoneksi Aktif ✓", inline: true },
          { name: "Waktu Uji", value: new Date().toLocaleString("id-ID"), inline: true }
        ],
        footer: { text: "JobSearch Notification Dispatcher" }
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Discord merespon dengan status ${res.status}`);
  }
  return true;
}
