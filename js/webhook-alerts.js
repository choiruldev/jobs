/**
 * Webhook Alerts Client
 * Allows testing and dispatching custom job alert webhooks from the browser.
 */

export async function sendTestWebhook(webhookUrl = "", message = "Test Notifikasi Lowongan Baru dari JobSearch") {
  if (!webhookUrl) return { success: false, error: "URL webhook kosong." };

  try {
    const isDiscord = webhookUrl.includes("discord.com");
    const payload = isDiscord
      ? { content: `🔔 **JobSearch Alert**: ${message}` }
      : { text: message };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return { success: res.ok, status: res.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
