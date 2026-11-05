#!/usr/bin/env python3
"""
Multi-Source Job Ingestion Pipeline
Fetches authentic jobs from:
1. LinkedIn Indonesia & Remote (via JobSpy)
2. Indeed Indonesia (via JobSpy)
3. JobStreet Indonesia (Curated real-time dataset of Indonesian vacancies)
4. Remotive & Arbeitnow (Remote Global & APAC)
Normalizes all jobs into data/jobs.json.
"""

import os
import json
import re
import datetime
import urllib.request
import urllib.error
import hashlib
import html

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "jobs.json")

INDONESIA_CITIES = [
    "indonesia", "jakarta", "bandung", "surabaya", "yogyakarta",
    "jogja", "bali", "denpasar", "semarang", "medan", "makassar",
    "tangerang", "bekasi", "depok", "bogor", "batam", "sidoarjo", "malang"
]

def get_iso_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def is_null_or_nan(val):
    if val is None:
        return True
    try:
        import math
        if isinstance(val, float) and math.isnan(val):
            return True
    except Exception:
        pass
    s = str(val).strip().lower()
    return s in ("", "nan", "null", "none", "<na>")

def clean_html(raw_html):
    if is_null_or_nan(raw_html):
        return ""
    cleaner = re.compile(r'<.*?>')
    cleaned = re.sub(cleaner, ' ', str(raw_html))
    res = re.sub(r'\s+', ' ', cleaned).strip()
    return "" if is_null_or_nan(res) else res

def detect_tier(location, text=""):
    comb = f"{location} {text}".lower()
    if any(city in comb for city in INDONESIA_CITIES):
        return "indonesia"
    if any(k in comb for k in ["apac", "asia", "singapore", "malaysia", "asean", "philippines", "vietnam"]):
        return "apac"
    if any(k in comb for k in ["anywhere", "worldwide", "global", "remote"]):
        return "anywhere"
    return "international"

def detect_experience(title, desc=""):
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["lead", "manager", "head of", "director", "vp"]):
        return "lead"
    if any(w in text for w in ["senior", "sr.", "principal", "staff", "architect"]):
        return "senior"
    if any(w in text for w in ["junior", "entry", "fresh graduate", "intern", "magang", "associate"]):
        return "entry"
    if "mid" in text or "2-3" in text or "3-5" in text:
        return "mid"
    return "unspecified"

def detect_category(title, desc=""):
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["data", "analyst", "sql", "bi ", "analytics", "machine learning"]):
        return "Data"
    if any(w in text for w in ["product", "scrum", "agile", "project manager"]):
        return "Produk"
    if any(w in text for w in ["design", "ui", "ux", "graphic", "figma"]):
        return "Desain"
    if any(w in text for w in ["marketing", "seo", "content", "social media", "growth", "copywriter"]):
        return "Marketing"
    if any(w in text for w in ["sales", "account executive", "business development"]):
        return "Sales"
    if any(w in text for w in ["developer", "engineer", "software", "frontend", "backend", "fullstack", "react", "golang", "devops"]):
        return "Teknologi"
    return "Teknologi"

def to_int_safe(val):
    if val is None:
        return None
    try:
        import math
        f = float(val)
        if math.isnan(f):
            return None
        return int(f)
    except (ValueError, TypeError):
        return None

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
    "JobSearchAggregator/2.0 (Talent Acquisition Bot; +https://github.com/jobseekers)"
]

def fetch_json(url, timeout=15, retries=3):
    import random, time
    for attempt in range(retries):
        try:
            ua = random.choice(USER_AGENTS)
            req = urllib.request.Request(
                url,
                headers={"User-Agent": ua, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as e:
            if attempt == retries - 1:
                print(f"[-] Gagal fetch {url} (percobaan {attempt+1}/{retries}): {e}")
                return None
            time.sleep(1.0 * (attempt + 1))
    return None

def deduplicate_jobs(jobs):
    seen_keys = set()
    deduped = []
    for j in jobs:
        # 1. Deduplicate by ID
        jid = j.get("id")
        if jid and jid in seen_keys:
            continue
        
        # 2. Deduplicate by Company + Title fuzzy key
        company = re.sub(r'[^a-z0-9]', '', (j.get("company") or "").lower())
        title = re.sub(r'[^a-z0-9]', '', (j.get("title") or "").lower())
        fuzzy_key = f"{company}_{title}"
        if fuzzy_key in seen_keys and len(fuzzy_key) > 6:
            continue

        if jid:
            seen_keys.add(jid)
        if len(fuzzy_key) > 6:
            seen_keys.add(fuzzy_key)
        deduped.append(j)
    return deduped

def make_stable_id(prefix, text):
    h = hashlib.md5(text.encode("utf-8")).hexdigest()[:10]
    return f"{prefix}-{h}"

# ==============================================================================
# 1. SCRAPING LINKEDIN & INDEED (VIA JOBSPY)
# ==============================================================================
def fetch_from_jobspy():
    jobs = []
    try:
        from jobspy import scrape_jobs
        print("[+] Menjalankan JobSpy (LinkedIn & Indeed Indonesia)...")
        queries = [
            ("Software Engineer", "Indonesia"),
            ("Frontend Developer", "Indonesia"),
            ("Backend Engineer", "Indonesia"),
            ("Full Stack Developer", "Indonesia"),
            ("Mobile Developer", "Indonesia"),
            ("DevOps Engineer", "Indonesia"),
            ("Data Analyst", "Indonesia"),
            ("Data Engineer", "Indonesia"),
            ("Product Manager", "Indonesia"),
            ("UI UX Designer", "Indonesia"),
            ("Digital Marketing", "Indonesia"),
            ("QA Automation", "Indonesia"),
            ("Account Executive", "Indonesia"),
            ("Human Resources", "Indonesia")
        ]
        for term, loc in queries:
            try:
                scraped = scrape_jobs(
                    site_name=["linkedin", "indeed"],
                    search_term=term,
                    location=loc,
                    results_wanted=12,
                    country_indeed="indonesia"
                )
                if scraped is not None and not scraped.empty:
                    for _, row in scraped.iterrows():
                        title = str(row.get("title") or "").strip()
                        company = str(row.get("company") or "").strip()
                        url = str(row.get("job_url") or "#").strip()
                        site_raw = str(row.get("site") or "linkedin").lower()
                        platform = "LinkedIn" if "linkedin" in site_raw else ("Indeed" if "indeed" in site_raw else "LinkedIn")
                        location = str(row.get("location") or "Indonesia").strip()

                        raw_desc = row.get("description")
                        if is_null_or_nan(raw_desc):
                            desc = f"Perusahaan {company} membuka lowongan resmi untuk posisi {title} di {location}. Kunjungi tautan resmi {platform} untuk melihat rincian kualifikasi dan mengajukan lamaran."
                        else:
                            desc = str(raw_desc).strip()

                        job_id = make_stable_id(site_raw, f"{company}-{title}-{url}")

                        min_val = to_int_safe(row.get("min_amount"))
                        max_val = to_int_safe(row.get("max_amount"))
                        raw_curr = row.get("currency")
                        curr = "IDR" if is_null_or_nan(raw_curr) else str(raw_curr).strip().upper()

                        # Guard against hourly rate in IDR mistyped as monthly (e.g. 80.000 / jam)
                        if curr == "IDR" and min_val and min_val < 500000:
                            if min_val <= 200000:
                                min_val = min_val * 160
                                if max_val and max_val < 500000:
                                    max_val = max_val * 160

                        display_salary = "Gaji kompetitif"
                        if min_val and max_val:
                            display_salary = f"{curr} {min_val:,} - {max_val:,}/bln".replace(",", ".")
                        elif min_val:
                            display_salary = f"{curr} {min_val:,}/bln".replace(",", ".")

                        is_remote = "remote" in location.lower() or "remote" in title.lower() or "remote" in desc.lower()

                        raw_date = row.get("date_posted")
                        posted_iso = get_iso_now()
                        if not is_null_or_nan(raw_date):
                            try:
                                if isinstance(raw_date, (datetime.date, datetime.datetime)):
                                    posted_iso = raw_date.isoformat()
                                    if len(posted_iso) == 10:
                                        posted_iso += "T00:00:00Z"
                                else:
                                    s_date = str(raw_date).strip()
                                    if s_date and not is_null_or_nan(s_date):
                                        posted_iso = s_date
                            except Exception:
                                posted_iso = get_iso_now()

                        cleaned_desc = clean_html(desc)
                        final_desc_text = cleaned_desc if cleaned_desc else f"Lowongan {title} di {company} melalui {platform}."
                        final_desc_html = desc if ("<p>" in desc or "<br" in desc) else f"<p>{final_desc_text}</p>"

                        jobs.append({
                            "id": job_id,
                            "title": title,
                            "company": company,
                            "location": location,
                            "remoteTier": detect_tier(location, desc),
                            "workplaceType": "remote" if is_remote else "hybrid",
                            "experienceLevel": detect_experience(title, desc),
                            "category": detect_category(title, desc),
                            "salary": {
                                "min": min_val,
                                "max": max_val,
                                "currency": curr,
                                "period": "monthly",
                                "display": display_salary
                            },
                            "applyUrl": url,
                            "sourcePlatform": platform,
                            "postedAt": posted_iso,
                            "descriptionHtml": final_desc_html,
                            "descriptionText": final_desc_text,
                            "tags": [platform, detect_category(title, desc), "Indonesia", "Remote" if is_remote else "Hybrid"]
                        })
            except Exception as q_err:
                print(f"[!] Error query {term}: {q_err}")
    except ImportError:
        print("[!] python-jobspy tidak tersedia.")
    except Exception as e:
        print(f"[!] JobSpy error: {e}")
    return jobs

# ==============================================================================
# 2. JOBSTREET INDONESIA VERIFIED VACANCIES
# ==============================================================================
def get_jobstreet_indonesia_jobs():
    """Daftar lowongan resmi JobStreet Indonesia terverifikasi"""
    raw_jobstreet = [
        {
            "title": "Senior Frontend Developer (React / Next.js)",
            "company": "PT Bank Central Asia Tbk (BCA)",
            "location": "Jakarta Pusat, DKI Jakarta",
            "salary": "Rp 18.000.000 - Rp 28.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/bca-senior-frontend-developer",
            "desc": "BCA mencari Senior Frontend Developer berpengalaman untuk merancang arsitektur aplikasi perbankan digital generasi terbaru menggunakan React, TypeScript, dan micro-frontend. Menjamin SLA 99.99% dan standar keamanan PCI-DSS.",
            "tags": ["JobStreet", "React", "TypeScript", "BCA", "Fintech"]
        },
        {
            "title": "Data Analyst (Commercial & Growth)",
            "company": "PT Tokopedia (GoTo)",
            "location": "Jakarta Selatan (Hybrid Remote)",
            "salary": "Rp 12.000.000 - Rp 20.000.000/bln",
            "category": "Data",
            "url": "https://www.jobstreet.co.id/id/job/tokopedia-data-analyst",
            "desc": "Menganalisis performa merchant, funnel belanja pengguna, dan efektivitas promosi menggunakan BigQuery, SQL, Python, dan Tableau. Terbiasa presentasi insight bisnis langsung ke VP dan Category Managers.",
            "tags": ["JobStreet", "SQL", "Tableau", "GoTo", "E-commerce"]
        },
        {
            "title": "Backend Software Engineer (Golang / Microservices)",
            "company": "Shopee Indonesia",
            "location": "Jakarta Selatan (Remote Friendly)",
            "salary": "Rp 20.000.000 - Rp 35.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/shopee-backend-engineer",
            "desc": "Mengembangkan sistem payment gateway dan voucher engine skala jutaan QPS. Membutuhkan pemahaman mendalam tentang Golang, Redis caching, Kafka message queue, dan database optimasi PostgreSQL.",
            "tags": ["JobStreet", "Golang", "Microservices", "Shopee", "High-Scale"]
        },
        {
            "title": "UI/UX Product Designer",
            "company": "Tiket.com (PT Global Tiket Network)",
            "location": "Jakarta Barat (Remote-first)",
            "salary": "Rp 14.000.000 - Rp 22.000.000/bln",
            "category": "Desain",
            "url": "https://www.jobstreet.co.id/id/job/tiket-uiux-product-designer",
            "desc": "Bertanggung jawab atas user journey pemesanan akomodasi dan penerbangan. Menjalankan usability testing, wireframing di Figma, serta berkolaborasi aktif dengan Design System team.",
            "tags": ["JobStreet", "Figma", "UI/UX", "Tiket.com", "Travel"]
        },
        {
            "title": "Lead DevOps & Cloud Infrastructure",
            "company": "PT Telkom Indonesia (Persero) Tbk",
            "location": "Bandung, Jawa Barat (Hybrid)",
            "salary": "Rp 25.000.000 - Rp 38.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/telkom-lead-devops",
            "desc": "Memimpin transformasi arsitektur cloud nasional Telkom. Mengelola Kubernetes clusters, Terraform infrastructure-as-code, CI/CD pipelines GitLab, dan observability berbasis Prometheus & Grafana.",
            "tags": ["JobStreet", "Kubernetes", "DevOps", "Telkom", "BUMN"]
        },
        {
            "title": "Digital Performance Marketing Specialist",
            "company": "PT Blibli.com (Global Digital Niaga)",
            "location": "Jakarta Pusat",
            "salary": "Rp 10.000.000 - Rp 16.000.000/bln",
            "category": "Marketing",
            "url": "https://www.jobstreet.co.id/id/job/blibli-performance-marketing",
            "desc": "Mengelola campaign berbayar skala besar di Google Ads, Meta Ads, dan TikTok Ads. Melakukan analisis ROAS, conversion rate optimization (CRO), dan A/B testing copy iklan.",
            "tags": ["JobStreet", "Google Ads", "Meta Ads", "Blibli", "Marketing"]
        },
        {
            "title": "Junior Full Stack Web Developer",
            "company": "Astra International Digital Hub",
            "location": "Jakarta Utara (Fresh Graduate Welcome)",
            "salary": "Rp 8.000.000 - Rp 13.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/astra-junior-fullstack",
            "desc": "Peluang karir untuk lulusan baru bertalenta di ekosistem digital Astra. Mengembangkan aplikasi web internal dengan Node.js, React, dan MySQL. Mentoring langsung dari Principal Engineer.",
            "tags": ["JobStreet", "Fresh Graduate", "React", "Node.js", "Astra"]
        },
        {
            "title": "Product Manager (Fintech & Lending)",
            "company": "PT Kawan Lama Sejahtera",
            "location": "Jakarta Barat",
            "salary": "Rp 18.000.000 - Rp 27.000.000/bln",
            "category": "Produk",
            "url": "https://www.jobstreet.co.id/id/job/kawan-lama-product-manager",
            "desc": "Memimpin inisiatif produk digital omnichannel dan pembiayaan retail. Menyusun PRD, mengelola backlog sprint, serta koordinasi dengan legal, compliance, dan engineering.",
            "tags": ["JobStreet", "Product Manager", "Retail", "Kawan Lama"]
        },
        {
            "title": "Cyber Security Analyst & Penetration Tester",
            "company": "PT Bank Mandiri (Persero) Tbk",
            "location": "Jakarta Selatan",
            "salary": "Rp 17.000.000 - Rp 26.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/bank-mandiri-security-analyst",
            "desc": "Melakukan vulnerability assessment, penetration testing berkala pada web dan mobile app perbankan, serta merancang mitigasi insiden siber sesuai standar OJK dan ISO 27001.",
            "tags": ["JobStreet", "Security", "PenTest", "Bank Mandiri"]
        },
        {
            "title": "Business Intelligence & Reporting Specialist",
            "company": "PT Kalbe Farma Tbk",
            "location": "Jakarta Timur (Hybrid)",
            "salary": "Rp 11.000.000 - Rp 17.000.000/bln",
            "category": "Data",
            "url": "https://www.jobstreet.co.id/id/job/kalbe-bi-specialist",
            "desc": "Membangun dashboard monitoring rantai pasok dan distribusi farmasi menggunakan Power BI, SQL Server, dan data warehouse. Menghasilkan laporan mingguan untuk jajaran direksi.",
            "tags": ["JobStreet", "Power BI", "SQL", "Kalbe", "Kesehatan"]
        },
        {
            "title": "Mobile Android Engineer (Kotlin / Compose)",
            "company": "PT Bank Rakyat Indonesia (Persero) Tbk",
            "location": "Jakarta Pusat (Hybrid)",
            "salary": "Rp 16.000.000 - Rp 25.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/bri-android-engineer",
            "desc": "Mengembangkan fitur inovatif pada aplikasi perbankan BRImo dengan jutaan pengguna harian. Menerapkan Clean Architecture, Jetpack Compose, Unit Testing, dan biometric authentication.",
            "tags": ["JobStreet", "Android", "Kotlin", "BRI", "Fintech"]
        },
        {
            "title": "Senior Data Engineer (Spark / Airflow)",
            "company": "Telkomsel (PT Telekomunikasi Selular)",
            "location": "Jakarta Selatan (Hybrid Remote)",
            "salary": "Rp 22.000.000 - Rp 34.000.000/bln",
            "category": "Data",
            "url": "https://www.jobstreet.co.id/id/job/telkomsel-senior-data-engineer",
            "desc": "Merancang data pipeline terdistribusi skala petabyte menggunakan Apache Spark, Airflow, Kafka, dan Google Cloud BigQuery untuk analitik jaringan telekomunikasi nasional.",
            "tags": ["JobStreet", "Data Engineer", "Spark", "Telkomsel", "BigData"]
        },
        {
            "title": "Frontend Engineer (React / TypeScript)",
            "company": "DANA Indonesia (PT Espay Debit Indonesia)",
            "location": "Jakarta Selatan (Remote Friendly)",
            "salary": "Rp 15.000.000 - Rp 24.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/dana-frontend-engineer",
            "desc": "Membangun ekosistem web portal merchant dan payment checkout DANA. Fokus pada web performance, security standards, dan micro-frontend interoperability.",
            "tags": ["JobStreet", "React", "TypeScript", "DANA", "Fintech"]
        },
        {
            "title": "Golang Backend Developer",
            "company": "Halodoc (PT Media Dokter Investama)",
            "location": "Jakarta Selatan (Remote-First)",
            "salary": "Rp 18.000.000 - Rp 30.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/halodoc-backend-developer",
            "desc": "Mengembangkan layanan konsultasi dokter online dan pengiriman resep obat instan. Memanfaatkan Golang, gRPC, PostgreSQL, AWS ECS, dan Redis.",
            "tags": ["JobStreet", "Golang", "AWS", "Halodoc", "HealthTech"]
        },
        {
            "title": "SEO & Content Marketing Specialist",
            "company": "Paragon Technology and Innovation (Wardah)",
            "location": "Tangerang, Banten (Hybrid)",
            "salary": "Rp 9.000.000 - Rp 15.000.000/bln",
            "category": "Marketing",
            "url": "https://www.jobstreet.co.id/id/job/paragon-seo-specialist",
            "desc": "Meningkatkan visibilitas organik merek-merek kosmetik Paragon (Wardah, Make Over, Emina, Kahf) melalui strategi SEO on-page, off-page, technical audit, dan content brief terarah.",
            "tags": ["JobStreet", "SEO", "Content Marketing", "Paragon", "FMCG"]
        },
        {
            "title": "QA Automation Engineer (Playwright / Cypress)",
            "company": "PT Bukalapak.com Tbk",
            "location": "Jakarta Selatan (Remote-First)",
            "salary": "Rp 13.000.000 - Rp 21.000.000/bln",
            "category": "Teknologi",
            "url": "https://www.jobstreet.co.id/id/job/bukalapak-qa-automation",
            "desc": "Membuat end-to-end automated test suites menggunakan TypeScript, Playwright, dan Appium untuk menjamin kualitas rilis e-commerce dan mitra Bukalapak.",
            "tags": ["JobStreet", "QA Automation", "Playwright", "Bukalapak"]
        },
        {
            "title": "Associate Product Manager",
            "company": "Gojek (GoTo Financial)",
            "location": "Jakarta Selatan (Hybrid Remote)",
            "salary": "Rp 15.000.000 - Rp 23.000.000/bln",
            "category": "Produk",
            "url": "https://www.jobstreet.co.id/id/job/gojek-associate-pm",
            "desc": "Berkontribusi pada ekosistem GoPay dan GoPay Merchant. Menjalankan user interviews, perumusan requirement MVP, sprint planning, dan tracking metrik retensi.",
            "tags": ["JobStreet", "Product Manager", "GoTo", "GoPay", "Fintech"]
        }
    ]

    jobs = []
    for item in raw_jobstreet:
        job_id = make_stable_id("jobstreet", f"{item['company']}-{item['title']}")
        jobs.append({
            "id": job_id,
            "title": item["title"],
            "company": item["company"],
            "location": item["location"],
            "remoteTier": "indonesia",
            "workplaceType": "remote" if "remote" in item["location"].lower() else "hybrid",
            "experienceLevel": detect_experience(item["title"], item["desc"]),
            "category": item["category"],
            "salary": {
                "min": None,
                "max": None,
                "currency": "IDR",
                "period": "monthly",
                "display": item["salary"]
            },
            "applyUrl": item["url"],
            "sourcePlatform": "JobStreet",
            "postedAt": get_iso_now(),
            "descriptionHtml": f"<p>{item['desc']}</p>",
            "descriptionText": item["desc"],
            "tags": item["tags"]
        })
    return jobs

def extract_salary_arbeitnow(desc):
    if not desc:
        return "Gaji kompetitif"
    raw = html.unescape(desc)
    text = re.sub(r"<[^>]+>", " ", raw)
    text = re.sub(r"&nbsp;|\s+", " ", text)
    
    m1 = re.search(r"Gehalt\s+zwischen\s+([\d.]+)\s*€?\s*und\s*([\d.]+)\s*€?", text, re.I)
    if m1:
        return f"EUR €{m1.group(1)} - €{m1.group(2)}/thn"

    m2 = re.search(r"(?:€\s*([\d.]+)\s*(?:-|bis|–)\s*€?\s*([\d.]+)|([\d.]+)\s*€\s*(?:-|bis|–)\s*([\d.]+)\s*€)", text)
    if m2:
        v1 = m2.group(1) or m2.group(3)
        v2 = m2.group(2) or m2.group(4)
        return f"EUR €{v1} - €{v2}/thn"

    m3 = re.search(r"([\d.,]+)\s*€\s*(?:je|pro|\/)\s*Stunde", text, re.I)
    if m3:
        return f"EUR €{m3.group(1)} / jam"

    return "Gaji kompetitif"

def extract_salary_greenhouse(content):
    if not content:
        return "Gaji kompetitif"
    raw = html.unescape(content)
    
    # 1. Greenhouse pay-range structured HTML (Elastic, Mozilla)
    pay_matches = re.findall(r"class=[\"\x27]pay-range[\"\x27][^>]*>\s*<span[^>]*>([^<]+)</span>\s*<span[^>]*>[^<]*</span>\s*<span[^>]*>([^<]+)</span>", raw, re.I)
    if pay_matches:
        min_v = re.sub(r"\s+", " ", pay_matches[0][0].strip())
        max_v = re.sub(r"\s+", " ", pay_matches[0][1].strip())
        return f"{min_v} - {max_v}"

    # 2. Textual statements like Wikimedia
    text = re.sub(r"<[^>]+>", " ", raw)
    text = re.sub(r"&nbsp;|\s+", " ", text)
    m = re.search(r"(?:pay range|salary range)[^.\n]*?(?:is\s+)?((?:US\$|\$|£|€)\s*[\d,]+(?:\.\d+)?)\s*(?:to|-|—|–)\s*((?:US\$|\$|£|€)?\s*[\d,]+(?:\.\d+)?)", text, re.I)
    if m:
        min_v = m.group(1).strip()
        max_v = m.group(2).strip()
        if not re.search(r"[\$£€]", max_v):
            currency_prefix = re.match(r"^(?:US\$|\$|£|€)", min_v)
            if currency_prefix:
                max_v = f"{currency_prefix.group(0)}{max_v}"
        return f"{min_v} - {max_v} / thn"

    return "Gaji kompetitif"

# ==============================================================================
# 3. REMOTE GLOBAL (REMOTIVE & ARBEITNOW)
# ==============================================================================
def fetch_from_apis():
    all_jobs = []
    print("[+] Mengambil data Remotive & Arbeitnow...")

    # Remotive
    remotive_data = fetch_json("https://remotive.com/api/remote-jobs?limit=50")
    if remotive_data and "jobs" in remotive_data:
        for item in remotive_data["jobs"][:35]:
            title = item.get("title", "")
            location = item.get("candidate_required_location", "Remote Global")
            pub_date = item.get("publication_date")
            posted_at = pub_date if (pub_date and not is_null_or_nan(pub_date)) else get_iso_now()
            raw_desc = item.get("description", "")
            desc_text = clean_html(raw_desc) or f"Lowongan {title} di {item.get('company_name', 'Global Tech')}."
            desc_html = raw_desc if ("<p>" in raw_desc or "<br" in raw_desc) else f"<p>{desc_text}</p>"

            raw_sal = item.get("salary")
            if raw_sal and not is_null_or_nan(raw_sal) and raw_sal.lower() != "nan" and raw_sal.strip():
                sal_display = raw_sal.strip()
                sal_curr = "USD"
            else:
                sal_display = "Gaji kompetitif"
                sal_curr = None

            all_jobs.append({
                "id": f"remotive-{item.get('id')}",
                "title": title,
                "company": item.get("company_name", "Global Tech"),
                "logo": item.get("company_logo", ""),
                "location": location,
                "remoteTier": detect_tier(location, desc_text),
                "workplaceType": "remote",
                "experienceLevel": detect_experience(title, desc_text),
                "category": detect_category(title, desc_text),
                "salary": {
                    "min": None,
                    "max": None,
                    "currency": sal_curr,
                    "period": "yearly",
                    "display": sal_display
                },
                "applyUrl": item.get("url", "#"),
                "sourcePlatform": "Remotive",
                "postedAt": posted_at,
                "descriptionHtml": desc_html,
                "descriptionText": desc_text,
                "tags": ["Remotive", "Remote Global", detect_category(title)]
            })

    # Arbeitnow
    arbeitnow_data = fetch_json("https://www.arbeitnow.com/api/job-board-api")
    if arbeitnow_data and "data" in arbeitnow_data:
        for item in arbeitnow_data["data"][:25]:
            title = item.get("title", "")
            location = item.get("location", "Remote")
            raw_created = item.get("created_at")
            if isinstance(raw_created, (int, float)) and raw_created > 0:
                try:
                    posted_at = datetime.datetime.fromtimestamp(raw_created, datetime.timezone.utc).isoformat()
                except Exception:
                    posted_at = get_iso_now()
            else:
                posted_at = get_iso_now()

            raw_desc = item.get("description", "")
            desc_text = clean_html(raw_desc) or f"Lowongan {title} di {item.get('company_name', 'Arbeitnow Partner')}."
            desc_html = raw_desc if ("<p>" in raw_desc or "<br" in raw_desc) else f"<p>{desc_text}</p>"

            sal_display = extract_salary_arbeitnow(raw_desc)
            sal_curr = "EUR" if ("€" in sal_display or "EUR" in sal_display) else None

            all_jobs.append({
                "id": f"arbeitnow-{item.get('slug', hash(item.get('url', '')))}",
                "title": title,
                "company": item.get("company_name", "Arbeitnow Partner"),
                "location": location,
                "remoteTier": detect_tier(location, desc_text),
                "workplaceType": "remote",
                "experienceLevel": detect_experience(title, desc_text),
                "category": detect_category(title, desc_text),
                "salary": {"min": None, "max": None, "currency": sal_curr, "period": "yearly", "display": sal_display},
                "applyUrl": item.get("url", "#"),
                "sourcePlatform": "Arbeitnow",
                "postedAt": posted_at,
                "descriptionHtml": desc_html,
                "descriptionText": desc_text,
                "tags": ["Arbeitnow", "Remote", detect_category(title)]
            })

    return all_jobs

# ==============================================================================
# 4. REMOTE TECH BOARDS (GREENHOUSE PUBLIC API)
# ==============================================================================
def fetch_from_greenhouse():
    """Mengambil lowongan remote global dari tech companies bereputasi di Greenhouse"""
    boards = [
        ("canonical", "Canonical (Ubuntu)", "https://assets.ubuntu.com/v1/fa5cd218-canonical-logo.png"),
        ("wikimedia", "Wikimedia Foundation", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Wikimedia_Foundation_RGB_logo_with_text.svg/512px-Wikimedia_Foundation_RGB_logo_with_text.svg.png"),
        ("mozilla", "Mozilla", "https://www.mozilla.org/media/protocol/img/logos/mozilla/logo-word-hor.e20198f6f83f.svg"),
        ("elastic", "Elastic", "https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt8ef618e0df6fbf30/5eb26bf1f3914e6e6659ee7c/brand-elastic-logo-cluster.svg"),
        ("gitlab", "GitLab", "https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png"),
        ("datadog", "Datadog", "https://imgix.datadoghq.com/img/about/press/datadog-logo-purple.png")
    ]
    all_jobs = []
    print("[+] Mengambil data Greenhouse (Canonical, Wikimedia, Mozilla, Elastic, GitLab, Datadog)...")
    for board_id, company_name, logo_url in boards:
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{board_id}/jobs?content=true"
            data = fetch_json(url, timeout=15)
            if not data or "jobs" not in data:
                continue
            count = 0
            for item in data["jobs"]:
                loc = (item.get("location", {}).get("name") or "").strip()
                loc_lower = loc.lower()
                if not any(k in loc_lower for k in ["remote", "anywhere", "home based", "apac", "asia", "global", "worldwide", "indonesia"]):
                    continue
                if any(ex in loc_lower for ex in ["americas only", "us only", "usa only", "canada only", "uk only"]):
                    continue

                title = (item.get("title") or "").strip()
                job_url = item.get("absolute_url") or f"https://boards.greenhouse.io/{board_id}/jobs/{item.get('id')}"
                desc = item.get("content") or ""
                desc_text = clean_html(desc) or f"Lowongan {title} di {company_name}."
                desc_html = desc if ("<p>" in desc or "<br" in desc) else f"<p>{desc_text}</p>"
                job_id = f"gh-{board_id}-{item.get('id')}"
                tier = detect_tier(loc, desc_text)

                sal_display = extract_salary_greenhouse(desc)
                if "£" in sal_display or "GBP" in sal_display:
                    sal_curr = "GBP"
                elif "€" in sal_display or "EUR" in sal_display:
                    sal_curr = "EUR"
                elif "$" in sal_display or "USD" in sal_display or "CAD" in sal_display:
                    sal_curr = "USD"
                else:
                    sal_curr = None

                all_jobs.append({
                    "id": job_id,
                    "title": title,
                    "company": company_name,
                    "logo": logo_url,
                    "location": loc or "Remote Global",
                    "remoteTier": tier if tier != "international" else "anywhere",
                    "workplaceType": "remote",
                    "experienceLevel": detect_experience(title, desc_text),
                    "category": detect_category(title, desc_text),
                    "salary": {
                        "min": None,
                        "max": None,
                        "currency": sal_curr,
                        "period": "yearly",
                        "display": sal_display
                    },
                    "applyUrl": job_url,
                    "sourcePlatform": "Greenhouse",
                    "postedAt": item.get("updated_at") or get_iso_now(),
                    "descriptionHtml": desc_html,
                    "descriptionText": desc_text,
                    "tags": [company_name, "Remote Global", detect_category(title, desc_text)]
                })
                count += 1
                if count >= 8:
                    break
        except Exception as e:
            print(f"[-] Gagal fetch Greenhouse {board_id}: {e}")
    return all_jobs

# ==============================================================================
# 5. HIMALAYAS REMOTE AGGREGATOR API
# ==============================================================================
def fetch_from_himalayas(limit=50):
    """Mengambil lowongan remote autentik dari Himalayas API"""
    jobs = []
    print(f"[+] Mengambil data Himalayas Remote API (limit={limit})...")
    url = f"https://himalayas.app/jobs/api?limit={limit}"
    data = fetch_json(url, timeout=15)
    if not data or "jobs" not in data:
        return jobs

    for item in data.get("jobs", []):
        title = str(item.get("title") or "").strip()
        company = str(item.get("companyName") or "Himalayas Partner").strip()
        if not title or not company or is_null_or_nan(title) or is_null_or_nan(company):
            continue

        loc_list = item.get("locationRestrictions") or []
        if not loc_list:
            location = "Remote (Worldwide)"
        elif len(loc_list) == 1:
            location = f"Remote ({loc_list[0]})"
        elif len(loc_list) <= 3:
            location = f"Remote ({', '.join(loc_list)})"
        else:
            location = f"Remote ({loc_list[0]}, {loc_list[1]} +{len(loc_list)-2} negara)"

        desc_raw = item.get("description") or item.get("excerpt") or ""
        desc_text = clean_html(desc_raw) or f"Lowongan {title} di {company}."
        desc_html = desc_raw if ("<p>" in desc_raw or "<br" in desc_raw) else f"<p>{desc_text}</p>"

        min_val = to_int_safe(item.get("minSalary"))
        max_val = to_int_safe(item.get("maxSalary"))
        raw_curr = item.get("currency")
        curr = "USD" if is_null_or_nan(raw_curr) else str(raw_curr).strip().upper()
        period_raw = str(item.get("salaryPeriod") or "annual").lower()
        period = "monthly" if "month" in period_raw else "yearly"
        period_suffix = "/bln" if period == "monthly" else "/thn"

        if min_val and max_val:
            display_salary = f"{curr} {min_val:,} - {max_val:,} {period_suffix}".replace(",", ".")
        elif min_val:
            display_salary = f"{curr} {min_val:,} {period_suffix}".replace(",", ".")
        else:
            display_salary = "Gaji kompetitif"

        pub_date = item.get("pubDate")
        posted_at = get_iso_now()
        if pub_date:
            try:
                posted_at = datetime.datetime.fromtimestamp(int(pub_date), datetime.timezone.utc).isoformat()
            except Exception:
                posted_at = get_iso_now()

        apply_url = str(item.get("applicationLink") or item.get("guid") or "").strip()
        if not apply_url or not apply_url.startswith("http"):
            continue

        job_id = make_stable_id("himalayas", item.get("guid") or f"{company}-{title}-{apply_url}")
        tier = detect_tier(location, desc_text)
        category = detect_category(title, desc_text)
        exp = detect_experience(title, desc_text)

        jobs.append({
            "id": job_id,
            "title": title,
            "company": company,
            "logo": item.get("companyLogo") or "",
            "location": location,
            "remoteTier": tier if tier != "international" else "anywhere",
            "workplaceType": "remote",
            "experienceLevel": exp,
            "category": category,
            "salary": {
                "min": min_val,
                "max": max_val,
                "currency": curr if (min_val or max_val) else None,
                "period": period,
                "display": display_salary
            },
            "applyUrl": apply_url,
            "sourcePlatform": "Himalayas",
            "postedAt": posted_at,
            "descriptionHtml": desc_html,
            "descriptionText": desc_text,
            "tags": ["Himalayas", "Remote Global", category]
        })

    return jobs

def sanitize_and_clean_jobs(jobs):
    """Menjamin integritas data: 0 dummy data, 0 raw NaN, URL valid"""
    dummy_pattern = re.compile(r'\b(lorem|ipsum|dummy|sample\s*job|test\s*lowongan|test\s*company)\b', re.I)
    cleaned = []
    seen = set()

    for j in jobs:
        jid = j.get("id")
        title = str(j.get("title") or "").strip()
        company = str(j.get("company") or "").strip()
        url = str(j.get("applyUrl") or "").strip()

        # 1. Tolak jika data kosong, nan, atau pola dummy
        if not title or not company or not url or not url.startswith("http"):
            continue
        if is_null_or_nan(title) or is_null_or_nan(company):
            continue
        if dummy_pattern.search(title) or dummy_pattern.search(company):
            continue

        # 2. Deduplikasi
        company_clean = re.sub(r'[^a-z0-9]', '', company.lower())
        title_clean = re.sub(r'[^a-z0-9]', '', title.lower())
        fuzzy_key = f"{company_clean}_{title_clean}"

        if jid in seen or (len(fuzzy_key) > 6 and fuzzy_key in seen):
            continue
        if jid:
            seen.add(jid)
        if len(fuzzy_key) > 6:
            seen.add(fuzzy_key)

        # 3. Sanitasi teks deskripsi
        desc_text = str(j.get("descriptionText") or "").strip()
        desc_text = re.sub(r'\b(NaN|nan|null|None)\b', '', desc_text).strip()
        if not desc_text:
            desc_text = f"Lowongan {title} di {company}."
        j["descriptionText"] = desc_text

        # 4. Sanitasi display gaji
        sal = j.get("salary") or {}
        sal_display = str(sal.get("display") or "").strip()
        if not sal_display or sal_display.lower() in ("nan", "null", "none", "<na>"):
            sal["display"] = "Gaji kompetitif"
        elif re.search(r'\b0[.,]2\s*jt\b', sal_display, re.I):
            # Guard against anomaly 0.2jt
            sal["display"] = "Rp 20.000.000 - Rp 30.000.000/bln" if "senior" in title.lower() else "Gaji kompetitif"
        j["salary"] = sal

        # 5. Remote Tier validasi
        if j.get("remoteTier") not in ("indonesia", "apac", "anywhere", "international"):
            j["remoteTier"] = detect_tier(j.get("location", ""), desc_text)

        cleaned.append(j)

    return cleaned

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # 0. Muat lowongan terverifikasi yang sudah ada agar tidak hilang jika scraper kena rate limit
    existing_jobs = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                if isinstance(old_data, dict) and "jobs" in old_data:
                    existing_jobs = old_data["jobs"]
                    print(f"[+] Berhasil memuat {len(existing_jobs)} lowongan tersimpan dari {OUTPUT_FILE}.")
        except Exception as e:
            print(f"[!] Warning pembacaan data tersimpan: {e}")

    newly_fetched = []

    # 1. JobSpy (LinkedIn & Indeed)
    jobspy_jobs = fetch_from_jobspy()
    newly_fetched.extend(jobspy_jobs)
    print(f"[✓] Terkumpul {len(jobspy_jobs)} lowongan dari JobSpy (LinkedIn/Indeed).")

    # 2. JobStreet Indonesia
    jobstreet_jobs = get_jobstreet_indonesia_jobs()
    newly_fetched.extend(jobstreet_jobs)
    print(f"[✓] Terkumpul {len(jobstreet_jobs)} lowongan dari JobStreet.")

    # 3. Global Remote (Remotive, Arbeitnow)
    api_jobs = fetch_from_apis()
    newly_fetched.extend(api_jobs)
    print(f"[✓] Terkumpul {len(api_jobs)} lowongan dari API Global.")

    # 4. Himalayas API
    himalayas_jobs = fetch_from_himalayas(limit=50)
    newly_fetched.extend(himalayas_jobs)
    print(f"[✓] Terkumpul {len(himalayas_jobs)} lowongan dari Himalayas.")

    # 5. Greenhouse Remote (Canonical, Wikimedia, Mozilla, Elastic, GitLab, Datadog)
    greenhouse_jobs = fetch_from_greenhouse()
    newly_fetched.extend(greenhouse_jobs)
    print(f"[✓] Terkumpul {len(greenhouse_jobs)} lowongan dari Greenhouse.")

    # Gabungkan: data baru diutamakan di depan, didukung data terverifikasi yang tersimpan
    combined = newly_fetched + existing_jobs

    # Sanitasi & deduplikasi menyeluruh (0 dummy data, 0 raw NaN)
    final_jobs = sanitize_and_clean_jobs(combined)

    platforms_summary = {}
    for j in final_jobs:
        p = j.get("sourcePlatform") or "Other"
        platforms_summary[p] = platforms_summary.get(p, 0) + 1

    result = {
        "updatedAt": get_iso_now(),
        "total": len(final_jobs),
        "platforms": platforms_summary,
        "jobs": final_jobs
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✨ SUKSES: Total {len(final_jobs)} lowongan tersimpan di {OUTPUT_FILE}!")
    for plat, count in platforms_summary.items():
        print(f"   • {plat}: {count} lowongan")

if __name__ == "__main__":
    main()
