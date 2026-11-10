#!/usr/bin/env python3
"""
Instant Job Alert Dispatcher
Dispatches notifications for fresh remote jobs to Discord Webhooks and Telegram Bots.
"""

import os
import json
import urllib.request
import urllib.error

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "jobs.json")

def send_discord_alert(webhook_url, job):
    salary = job.get("salary", {}).get("display", "Kompetitif")
    payload = {
        "embeds": [{
            "title": f"💼 {job.get('title')} - {job.get('company')}",
            "url": job.get("applyUrl", "https://jobsearch.local"),
            "description": f"📍 **Lokasi:** {job.get('location')}\n💰 **Gaji:** {salary}\n🏷️ **Kategori:** {job.get('category')}",
            "color": 3447003,
            "footer": {"text": "JobSearch Remote Alerts"}
        }]
    }
    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "JobSearchNotifier/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status == 204 or res.status == 200
    except Exception as e:
        print(f"[-] Gagal kirim Discord alert: {e}")
        return False

def send_telegram_alert(bot_token, chat_id, job):
    salary = job.get("salary", {}).get("display", "Kompetitif")
    text = (
        f"🚨 *Lowongan Remote Baru!*\n\n"
        f"💼 *{job.get('title')}*\n"
        f"🏢 {job.get('company')}\n"
        f"📍 {job.get('location')}\n"
        f"💰 Gaji: {salary}\n\n"
        f"[Lamar Sekarang Disini]({job.get('applyUrl')})"
    )
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status == 200
    except Exception as e:
        print(f"[-] Gagal kirim Telegram alert: {e}")
        return False

def send_email_alert(resend_api_key, to_email, job):
    salary = job.get("salary", {}).get("display", "Kompetitif")
    html_body = (
        f"<div style='font-family:Inter,sans-serif;max-width:560px;padding:20px;border:1px solid #10b981;border-radius:14px;'>"
        f"<h2 style='margin:0 0 8px;color:#059669;'>⚡ Lowongan Kerja Baru Cocok untuk Anda!</h2>"
        f"<h3 style='margin:0 0 6px;'>{job.get('title')} — {job.get('company')}</h3>"
        f"<p style='margin:4px 0;'>📍 <strong>Lokasi:</strong> {job.get('location')}</p>"
        f"<p style='margin:4px 0;'>💰 <strong>Estimasi Gaji:</strong> {salary}</p>"
        f"<p style='margin:14px 0 0;'><a href='{job.get('applyUrl', 'https://jobsearch.id')}' style='background:#059669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;'>Lamar & Auto-Send Email Sekarang ↗</a></p>"
        f"</div>"
    )
    payload = {
        "from": "JobSearch Alerts <alerts@jobsearch.id>",
        "to": [to_email],
        "subject": f"💼 Loker Baru: {job.get('title')} di {job.get('company')} ({salary})",
        "html": html_body
    }
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {resend_api_key}"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status in (200, 201)
    except Exception as e:
        print(f"[-] Gagal kirim Email alert: {e}")
        return False

def main():
    if not os.path.exists(DATA_FILE):
        print("[-] Data jobs.json tidak ditemukan.")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    jobs = data.get("jobs", [])
    # Prioritaskan lowongan Indonesia atau APAC
    priority_jobs = [j for j in jobs if j.get("remoteTier") in ["indonesia", "apac"]][:3]

    discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    tg_chat = os.environ.get("TELEGRAM_CHAT_ID")
    resend_key = os.environ.get("RESEND_API_KEY")
    alert_email_to = os.environ.get("ALERT_EMAIL_TO")

    print(f"[+] Memproses {len(priority_jobs)} lowongan prioritas...")

    for j in priority_jobs:
        if discord_url:
            send_discord_alert(discord_url, j)
        if tg_token and tg_chat:
            send_telegram_alert(tg_token, tg_chat, j)
        if resend_key and alert_email_to:
            send_email_alert(resend_key, alert_email_to, j)

    print("[✓] Dispatcher selesai dijalankan.")

if __name__ == "__main__":
    main()
