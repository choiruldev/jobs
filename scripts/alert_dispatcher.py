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

    print(f"[+] Memproses {len(priority_jobs)} lowongan prioritas...")

    for j in priority_jobs:
        if discord_url:
            send_discord_alert(discord_url, j)
        if tg_token and tg_chat:
            send_telegram_alert(tg_token, tg_chat, j)

    print("[✓] Dispatcher selesai dijalankan.")

if __name__ == "__main__":
    main()
