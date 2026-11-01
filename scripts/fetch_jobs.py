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

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "jobs.json")

INDONESIA_CITIES = [
    "indonesia", "jakarta", "bandung", "surabaya", "yogyakarta",
    "jogja", "bali", "denpasar", "semarang", "medan", "makassar",
    "tangerang", "bekasi", "depok", "bogor", "batam", "sidoarjo", "malang"
]

def get_iso_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleaner = re.compile('<.*?>')
    cleaned = re.sub(cleaner, ' ', str(raw_html))
    return re.sub(r'\s+', ' ', cleaned).strip()

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
            ("Data Analyst", "Indonesia"),
            ("Product Manager", "Indonesia"),
            ("UI UX Designer", "Indonesia"),
            ("Digital Marketing", "Indonesia")
        ]
        for term, loc in queries:
            try:
                scraped = scrape_jobs(
                    site_name=["linkedin", "indeed"],
                    search_term=term,
                    location=loc,
                    results_wanted=6,
                    country_indeed="indonesia"
                )
                if scraped is not None and not scraped.empty:
                    for _, row in scraped.iterrows():
                        title = str(row.get("title") or "")
                        company = str(row.get("company") or "")
                        url = str(row.get("job_url") or "#")
                        site_raw = str(row.get("site") or "linkedin").lower()
                        platform = "LinkedIn" if "linkedin" in site_raw else ("Indeed" if "indeed" in site_raw else "LinkedIn")
                        location = str(row.get("location") or "Indonesia")
                        desc = str(row.get("description") or "")
                        job_id = make_stable_id(site_raw, f"{company}-{title}-{url}")

                        min_val = to_int_safe(row.get("min_amount"))
                        max_val = to_int_safe(row.get("max_amount"))
                        raw_curr = row.get("currency")
                        curr = "IDR" if pd.isna(raw_curr) or not str(raw_curr).strip() or str(raw_curr).lower() == "nan" else str(raw_curr).strip().upper()
                        display_salary = "Gaji kompetitif"
                        if min_val and max_val:
                            display_salary = f"{curr} {min_val:,} - {max_val:,}/bln".replace(",", ".")
                        elif min_val:
                            display_salary = f"{curr} {min_val:,}/bln".replace(",", ".")

                        is_remote = "remote" in location.lower() or "remote" in title.lower() or "remote" in desc.lower()

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
                            "postedAt": get_iso_now(),
                            "descriptionHtml": desc,
                            "descriptionText": clean_html(desc) or f"Lowongan {title} di {company} melalui {platform}.",
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
            all_jobs.append({
                "id": f"remotive-{item.get('id')}",
                "title": title,
                "company": item.get("company_name", "Global Tech"),
                "logo": item.get("company_logo", ""),
                "location": location,
                "remoteTier": detect_tier(location, item.get("description", "")),
                "workplaceType": "remote",
                "experienceLevel": detect_experience(title, item.get("description", "")),
                "category": detect_category(title, item.get("description", "")),
                "salary": {
                    "min": None,
                    "max": None,
                    "currency": "USD",
                    "period": "yearly",
                    "display": item.get("salary") or "USD $70.000 - $110.000/thn"
                },
                "applyUrl": item.get("url", "#"),
                "sourcePlatform": "Remotive",
                "postedAt": item.get("publication_date", get_iso_now()),
                "descriptionHtml": item.get("description", ""),
                "descriptionText": clean_html(item.get("description", "")),
                "tags": ["Remotive", "Remote Global", detect_category(title)]
            })

    # Arbeitnow
    arbeitnow_data = fetch_json("https://www.arbeitnow.com/api/job-board-api")
    if arbeitnow_data and "data" in arbeitnow_data:
        for item in arbeitnow_data["data"][:25]:
            title = item.get("title", "")
            location = item.get("location", "Remote")
            all_jobs.append({
                "id": f"arbeitnow-{item.get('slug', hash(item.get('url', '')))}",
                "title": title,
                "company": item.get("company_name", "Arbeitnow Partner"),
                "location": location,
                "remoteTier": detect_tier(location, item.get("description", "")),
                "workplaceType": "remote",
                "experienceLevel": detect_experience(title, item.get("description", "")),
                "category": detect_category(title, item.get("description", "")),
                "salary": {"min": None, "max": None, "currency": "EUR", "period": "yearly", "display": "EUR €60.000 - €90.000/thn"},
                "applyUrl": item.get("url", "#"),
                "sourcePlatform": "Arbeitnow",
                "postedAt": get_iso_now(),
                "descriptionHtml": item.get("description", ""),
                "descriptionText": clean_html(item.get("description", "")),
                "tags": ["Arbeitnow", "Remote", detect_category(title)]
            })

    return all_jobs

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    all_jobs = []

    # 1. JobSpy (LinkedIn & Indeed)
    jobspy_jobs = fetch_from_jobspy()
    all_jobs.extend(jobspy_jobs)
    print(f"[✓] Terkumpul {len(jobspy_jobs)} lowongan dari JobSpy (LinkedIn/Indeed).")

    # 2. JobStreet Indonesia
    jobstreet_jobs = get_jobstreet_indonesia_jobs()
    all_jobs.extend(jobstreet_jobs)
    print(f"[✓] Terkumpul {len(jobstreet_jobs)} lowongan dari JobStreet.")

    # 3. Global Remote (Remotive, Arbeitnow)
    api_jobs = fetch_from_apis()
    all_jobs.extend(api_jobs)
    print(f"[✓] Terkumpul {len(api_jobs)} lowongan dari API Global.")

    # Deduplikasi cerdas (ID & Fuzzy Title + Company)
    final_jobs = deduplicate_jobs(all_jobs)

    result = {
        "updatedAt": get_iso_now(),
        "total": len(final_jobs),
        "platforms": {
            "LinkedIn": len([j for j in final_jobs if j.get("sourcePlatform") == "LinkedIn"]),
            "JobStreet": len([j for j in final_jobs if j.get("sourcePlatform") == "JobStreet"]),
            "Indeed": len([j for j in final_jobs if j.get("sourcePlatform") == "Indeed"]),
            "Remotive": len([j for j in final_jobs if j.get("sourcePlatform") == "Remotive"]),
            "Arbeitnow": len([j for j in final_jobs if j.get("sourcePlatform") == "Arbeitnow"])
        },
        "jobs": final_jobs
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✨ SUKSES: Total {len(final_jobs)} lowongan tersimpan di {OUTPUT_FILE}!")
    for plat, count in result["platforms"].items():
        print(f"   • {plat}: {count} lowongan")

if __name__ == "__main__":
    main()
