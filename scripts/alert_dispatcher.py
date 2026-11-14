#!/usr/bin/env python3
"""
Instant Job Alert Dispatcher
Dispatches notifications for fresh remote jobs to Discord Webhooks and Telegram Bots.
"""

import os
import re
import html
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "jobs.json")

def _clean_text(val, default="", max_len=240):
    cleaned = re.sub(r"[\x00-\x1f\x7f]+", " ", str(val or "")).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned or cleaned.lower() in ("nan", "null", "none", "undefined"):
        return default
    return cleaned[:max_len]

def _validate_http_url(raw_url, fallback="https://jobsearch.id"):
    candidate = re.sub(r"[\x00-\x1f\x7f]+", "", str(raw_url or "")).strip()
    if not candidate or any(c in candidate for c in (' ', '<', '>', '"', "'", '`')):
        return fallback
    try:
        parsed = urlparse(candidate)
    except Exception:
        return fallback
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return fallback
    return candidate

def _escape_tg_markdown(val, default="", max_len=240):
    text = _clean_text(val, default, max_len)
    for ch in ("\\", "_", "*", "`", "["):
        text = text.replace(ch, f"\\{ch}")
    return text

def _escape_tg_url(raw_url, fallback="https://jobsearch.id"):
    url = _validate_http_url(raw_url, fallback)
    return (
        url.replace("\\", "%5C")
           .replace("(", "%28")
           .replace(")", "%29")
           .replace("[", "%5B")
           .replace("]", "%5D")
    )

def send_discord_alert(webhook_url, job):
    safe_webhook = _validate_http_url(webhook_url, "")
    parsed_hook = urlparse(safe_webhook) if safe_webhook else None
    if not parsed_hook or parsed_hook.scheme != "https" or parsed_hook.hostname not in ("discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"):
        print("[-] Discord webhook URL tidak valid.")
        return False
    salary = _clean_text((job.get("salary") or {}).get("display"), "Kompetitif", 120)
    payload = {
        "embeds": [{
            "title": f"💼 {_clean_text(job.get('title'), 'Lowongan Kerja')} - {_clean_text(job.get('company'), 'Perusahaan')}",
            "url": _validate_http_url(job.get("applyUrl"), "https://jobsearch.id"),
            "description": f"📍 **Lokasi:** {_clean_text(job.get('location'), 'Remote')}\n💰 **Gaji:** {salary}\n🏷️ **Kategori:** {_clean_text(job.get('category'), 'Teknologi')}",
            "color": 3447003,
            "footer": {"text": "JobSearch Remote Alerts"}
        }]
    }
    req = urllib.request.Request(
        safe_webhook,
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
    salary = _escape_tg_markdown((job.get("salary") or {}).get("display"), "Kompetitif", 120)
    title = _escape_tg_markdown(job.get("title"), "Lowongan Kerja")
    company = _escape_tg_markdown(job.get("company"), "Perusahaan")
    location = _escape_tg_markdown(job.get("location"), "Remote")
    apply_url = _escape_tg_url(job.get("applyUrl"), "https://jobsearch.id")
    text = (
        f"🚨 *Lowongan Remote Baru!*\n\n"
        f"💼 *{title}*\n"
        f"🏢 {company}\n"
        f"📍 {location}\n"
        f"💰 Gaji: {salary}\n\n"
        f"[Lamar Sekarang Disini]({apply_url})"
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
    salary_raw = _clean_text((job.get("salary") or {}).get("display"), "Kompetitif", 120)
    title_raw = _clean_text(job.get("title"), "Lowongan Kerja")
    company_raw = _clean_text(job.get("company"), "Perusahaan")
    location_raw = _clean_text(job.get("location"), "Remote")

    safe_title = html.escape(title_raw, quote=True)
    safe_company = html.escape(company_raw, quote=True)
    safe_location = html.escape(location_raw, quote=True)
    safe_salary = html.escape(salary_raw, quote=True)
    safe_url = html.escape(_validate_http_url(job.get("applyUrl"), "https://jobsearch.id"), quote=True)

    html_body = (
        f"<div style='font-family:Inter,sans-serif;max-width:560px;padding:20px;border:1px solid #10b981;border-radius:14px;'>"
        f"<h2 style='margin:0 0 8px;color:#059669;'>⚡ Lowongan Kerja Baru Cocok untuk Anda!</h2>"
        f"<h3 style='margin:0 0 6px;'>{safe_title} — {safe_company}</h3>"
        f"<p style='margin:4px 0;'>📍 <strong>Lokasi:</strong> {safe_location}</p>"
        f"<p style='margin:4px 0;'>💰 <strong>Estimasi Gaji:</strong> {safe_salary}</p>"
        f"<p style='margin:14px 0 0;'><a href=\"{safe_url}\" target=\"_blank\" rel=\"noopener noreferrer\" style='background:#059669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;'>Lamar &amp; Auto-Send Email Sekarang ↗</a></p>"
        f"</div>"
    )
    payload = {
        "from": "JobSearch Alerts <alerts@jobsearch.id>",
        "to": [to_email],
        "subject": f"💼 Loker Baru: {title_raw} di {company_raw} ({salary_raw})",
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
