# Graph Report - jobseekers  (2026-10-31)

## Corpus Check
- 76 files · ~170,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .xml 2)

## Summary
- 787 nodes · 1465 edges · 60 communities (39 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f786d664`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Application Tracker & Kanban
- Search & Job Filtering Engine
- providers.js
- Search & Job Filtering Engine
- Application Tracker & Kanban
- datetime
- Local-First Storage & DB
- generate_comprehensive_jobs.mjs
- contract-safety.js
- Salary PPP & Tax Calculator
- schema.js
- autofill-bookmarklet.js
- Contractor Invoice Generator
- profile.js
- update-jobs.yml
- package.json
- Local-First Storage & DB
- analytics.js
- Search & Job Filtering Engine
- PWA Lifecycle & Offline Sync
- Local-First Storage & DB
- insights.js
- ai-writer.js
- ATS Resume Builder & Parser
- Application Tracker & Kanban
- Application Tracker & Kanban
- Automated Test & Benchmark Suites
- Interview Simulator & STAR Prep
- PWA Lifecycle & Offline Sync
- Salary PPP & Tax Calculator
- skills-roadmap.js
- Application Tracker & Kanban
- Proof-of-Work Portfolio Generator
- routes.js
- Remote Company Radar
- Local-First Storage & DB
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- PWA Lifecycle & Offline Sync
- test
- 📋 5 Skenario Uji Coba Beta
- user-journey.test.mjs
- build.mjs
- JobSearch Indonesia — Launch Checklist & Production Runbook 🚀
- health-check.test.mjs
- error-logger.js
- onboarding.js
- broken-links.test.mjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Cari Lowongan Remote | JobSearch` - 36 edges
2. `Tracker Lamaran | JobSearch` - 34 edges
3. `Lowongan Tersimpan | JobSearch` - 34 edges
4. `JobSearch | Lowongan Remote untuk Pencari Kerja Indonesia` - 26 edges
5. `ATS Resume Builder | JobSearch` - 26 edges
6. `Direktori Perusahaan Ramah Remote | JobSearch` - 25 edges
7. `Analisis Funnel & Insight Lokal | JobSearch` - 22 edges
8. `Simulasi & Latihan Interview STAR | JobSearch` - 20 edges
9. `Kalkulator Daya Beli Gaji Global (PPP) | JobSearch` - 20 edges
10. `Panduan Kontrak Kerja Remote & Pajak W-8BEN | JobSearch` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Application Tracker Management` --conceptually_related_to--> `Bookmarked Jobs Collection`  [INFERRED]
  pages/apply.html → pages/bookmarks.html
- `Apply Resmi & Integrasi Tracker` --conceptually_related_to--> `Application Tracker Management`  [INFERRED]
  pages/detail.html → pages/apply.html
- `5 Langkah Sukses Cari Kerja Remote` --conceptually_related_to--> `Application Tracker Management`  [INFERRED]
  pages/guides/cara-cari-kerja-remote.html → pages/apply.html
- `Profil Match Form` --conceptually_related_to--> `Application Tracker Management`  [INFERRED]
  pages/search.html → pages/apply.html
- `Metrik Funnel & Event Browser` --conceptually_related_to--> `Cari Lowongan Remote | JobSearch`  [INFERRED]
  pages/insights.html → pages/search.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Remote Indonesia Guidance & Best Practices** — pages_guides_cara_cari_kerja_remote_page [EXTRACTED 1.00]
- **JobSearch Web Application Routes** — 404_page, index_page, pages_alerts_page, pages_apply_page, pages_bookmarks_page, pages_codesandbox_page, pages_companies_page, pages_contractguide_page, pages_dataanalystremote_page, pages_detail_page, pages_freshgraduateremote_page, pages_frontenddeveloperremote_page, pages_insights_page, pages_interviewprep_page, pages_invoicegenerator_page [INFERRED 0.85]

## Communities (60 total, 21 thin omitted)

### Community 0 - "Application Tracker & Kanban"
Cohesion: 0.06
Nodes (70): bindJobDataForm(), bindManualTrackerForm(), applySuggestion(), bindTrackerActions(), bindValidation(), buildManualJob(), CATEGORY_OPTIONS, completedProgressKeys() (+62 more)

### Community 1 - "Search & Job Filtering Engine"
Cohesion: 0.19
Nodes (46): 404: Halaman Tidak Ditemukan | JobSearch, Jalur Cepat Pencarian, JobSearch App Navigation, JobSearch Home, JobSearch | Lowongan Remote untuk Pencari Kerja Indonesia, Pusat Notifikasi & Job Alerts (Telegram / Discord) | JobSearch, Tracker Lamaran | JobSearch, Application Tracker Management (+38 more)

### Community 2 - "providers.js"
Cohesion: 0.13
Nodes (43): ALL_PROVIDERS, cleanDescription(), cleanLocation(), cleanSalaryLabel(), cleanTitle(), cleanType(), escapeRegExp(), fallbackJobsForSource() (+35 more)

### Community 3 - "Search & Job Filtering Engine"
Cohesion: 0.09
Nodes (40): copySearchState(), debounce(), detectDefaultSource(), escapeRegExp(), FILTER_GROUPS_SINGLE, filterAndSortJobs(), getSalaryFilter(), HIDDEN_CATEGORIES (+32 more)

### Community 4 - "Application Tracker & Kanban"
Cohesion: 0.06
Nodes (16): KANBAN_COLUMNS, renderKanbanBoard(), renderKanbanCard(), CloudSyncAdapter, allCompanies, renderCompanyDirectory(), INTERVIEW_QUESTIONS, renderInterviewSimulator() (+8 more)

### Community 5 - "datetime"
Cohesion: 0.08
Nodes (19): main(), send_discord_alert(), send_telegram_alert(), normalize_stem(), clean_html(), deduplicate_jobs(), detect_category(), detect_experience() (+11 more)

### Community 6 - "Local-First Storage & DB"
Cohesion: 0.10
Nodes (31): BOOKMARK_KEY, boundBookmarkRoots, copyText(), cssEscape(), escapeHtml(), escapeRegExp(), getCompanyInitials(), highlightText() (+23 more)

### Community 7 - "generate_comprehensive_jobs.mjs"
Cohesion: 0.20
Nodes (9): combinedJobs, DATA_PATH, existingKeys, formattedNewJobs, makeId(), NEW_INDONESIA_JOBS, nowIso, raw (+1 more)

### Community 8 - "contract-safety.js"
Cohesion: 0.09
Nodes (19): analyzeContractClause(), CONTRACT_RED_FLAGS, W8BEN_GUIDE_STEPS, parseResumeText(), atsScore, COMPANIES, contractCheck, filteredMatches (+11 more)

### Community 9 - "Salary PPP & Tax Calculator"
Cohesion: 0.15
Nodes (16): formatMillion(), formatNormalizedSalary(), formatSalary(), formatSalaryOriginal(), getAllKnownJobs(), getJobById(), getJobQualitySignals(), getSalaryEstimate() (+8 more)

### Community 10 - "schema.js"
Cohesion: 0.12
Nodes (20): APAC_KEYWORDS, detectExperienceLevel(), detectRemoteTier(), ENTRY_KEYWORDS, EXPERIENCE_LABELS, EXPERIENCE_LEVELS, INDONESIA_KEYWORDS, injectJobPostingSchema() (+12 more)

### Community 11 - "autofill-bookmarklet.js"
Cohesion: 0.12
Nodes (12): generateBookmarkletCode(), bookmarklet, companiesData, companiesPath, __dirname, jobsData, jobsPath, letterId (+4 more)

### Community 12 - "Contractor Invoice Generator"
Cohesion: 0.14
Nodes (9): DEFAULT_INVOICE, readCommunitySalaries(), sanitizeInput(), SEED_COMMUNITY_SALARIES, submitSalaryReport(), writeCommunitySalaries(), calculatePPP(), CITY_COL_INDICES (+1 more)

### Community 13 - "profile.js"
Cohesion: 0.24
Nodes (13): DEFAULT_PROFILE, getProfileSummary(), haystackForJob(), normalize(), parseExpectedSalary(), profileHasSignal(), scoreExperience(), scoreJobForProfile() (+5 more)

### Community 14 - "update-jobs.yml"
Cohesion: 0.12
Nodes (16): jobs, scrape-and-update, name, on, schedule, workflow_dispatch, contents, cron (+8 more)

### Community 15 - "package.json"
Cohesion: 0.11
Nodes (18): author, description, keywords, license, name, scripts, build, icons (+10 more)

### Community 16 - "Local-First Storage & DB"
Cohesion: 0.29
Nodes (13): dbCountJobs(), dbDeleteApplication(), dbGetAllApplications(), dbGetAllBookmarks(), dbGetAllJobs(), dbGetJobById(), dbRemoveBookmark(), dbSaveApplication() (+5 more)

### Community 17 - "analytics.js"
Cohesion: 0.29
Nodes (13): clearAnalyticsEvents(), getAnalyticsSummary(), getSessionId(), isTelemetryEnabled(), makeId(), nowIso(), readAnalyticsEvents(), readJson() (+5 more)

### Community 18 - "Search & Job Filtering Engine"
Cohesion: 0.35
Nodes (10): deleteSavedSearch(), makeId(), markSearchSeen(), normalizeFilters(), readSavedSearches(), safeParseSearch(), saveSearch(), searchFingerprint() (+2 more)

### Community 19 - "PWA Lifecycle & Offline Sync"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 20 - "Local-First Storage & DB"
Cohesion: 0.52
Nodes (6): getAllFeedbacks(), initBetaFeedbackWidget(), openFeedbackDB(), openFeedbackModal(), saveFeedbackLocally(), showToastFeedbackSuccess()

### Community 21 - "insights.js"
Cohesion: 0.43
Nodes (3): escapeHtml(), render(), renderRank()

### Community 23 - "ATS Resume Builder & Parser"
Cohesion: 0.53
Nodes (5): analyzeAtsMatch(), extractKeywords(), normalizeText(), SOFT_KEYWORDS, TECH_KEYWORDS

### Community 24 - "Application Tracker & Kanban"
Cohesion: 0.53
Nodes (5): DEFAULT_GOAL, readGoalData(), recordApplicationActivity(), renderGoalBanner(), writeGoalData()

### Community 25 - "Application Tracker & Kanban"
Cohesion: 0.47
Nodes (5): applyTranslations(), DICTIONARY, getLanguage(), setLanguage(), t()

### Community 27 - "Interview Simulator & STAR Prep"
Cohesion: 0.60
Nodes (4): createVoicePracticeWidget(), formatTime(), startRecording(), stopRecording()

### Community 28 - "PWA Lifecycle & Offline Sync"
Cohesion: 0.70
Nodes (4): initPwaAndNetworkMonitor(), renderInstallBanner(), renderUpdateBanner(), showNetworkBanner()

### Community 29 - "Salary PPP & Tax Calculator"
Cohesion: 0.60
Nodes (4): calculateProgressiveTax(), DEFAULT_EXCHANGE_RATES, estimateTakeHomePay(), formatIDR()

### Community 31 - "Application Tracker & Kanban"
Cohesion: 0.90
Nodes (4): applyTheme(), getPreferredTheme(), initThemeEngine(), toggleTheme()

### Community 50 - "test"
Cohesion: 0.09
Nodes (21): jobs, test, node-version, name, on, pull_request, push, branches (+13 more)

### Community 51 - "📋 5 Skenario Uji Coba Beta"
Cohesion: 0.11
Nodes (16): 📋 5 Skenario Uji Coba Beta, 💬 Cara Melaporkan Bug & Masukan, 🎯 Fokus Utama Pengujian Beta, 🔒 Kebijakan Privasi Tester, 🧪 Panduan Program Beta Testing: JobSearch Indonesia (v1.0-beta), Skenario 1: Pencarian & Filter Lowongan, Skenario 2: Menyimpan Loker & Tracker Lamaran (Kanban), Skenario 3: Pembuatan Resume ATS (1 Halaman) (+8 more)

### Community 52 - "user-journey.test.mjs"
Cohesion: 0.11
Nodes (14): coverLetter, csvOutput, __dirname, emailValid, __filename, matchedJobs, mockApplication, mockResume (+6 more)

### Community 53 - "build.mjs"
Cohesion: 0.18
Nodes (12): cssFiles, jsDir, jsFiles, requiredConfigs, ROOT_DIR, totalCssKb, totalJsKb, escapeXml() (+4 more)

### Community 54 - "JobSearch Indonesia — Launch Checklist & Production Runbook 🚀"
Cohesion: 0.15
Nodes (12): 1. Ringkasan Platform & Arsitektur, 2. Checklist Pra-Peluncuran (Pre-Flight Checklist), 3. Prosedur Deploy Produksi, 4. Siklus Pembaruan Feed Lowongan (Automation Runbook), 5. Prosedur Tanggap Insiden (Incident Response SOP), A. Kepatuhan Hukum & Privasi Pengguna (Legal & Compliance), B. Performa & Reliabilitas (Performance & Resilience), C. Keamanan & Header HTTP (Security & Hardening) (+4 more)

### Community 55 - "health-check.test.mjs"
Cohesion: 0.25
Nodes (5): jobsData, manifest, REQUIRED_HTML, REQUIRED_JS_MODULES, ROOT_DIR

### Community 56 - "error-logger.js"
Cohesion: 0.60
Nodes (3): getErrorLogs(), initGlobalErrorLogging(), recordError()

### Community 57 - "onboarding.js"
Cohesion: 0.60
Nodes (4): hasSeenOnboarding(), markOnboardingSeen(), openOnboardingModal(), SLIDES

### Community 58 - "broken-links.test.mjs"
Cohesion: 0.40
Nodes (4): brokenLinks, getHtmlFiles(), htmlFiles, ROOT_DIR

### Community 59 - "vercel.json"
Cohesion: 0.40
Nodes (4): cleanUrls, headers, trailingSlash, version

## Knowledge Gaps
- **18 isolated node(s):** `Jalur Cepat Pencarian`, `JobSearch App Navigation`, `Skill Data Analyst (SQL & BI)`, `Strategi Entry-Level Remote`, `Filter Skill Frontend Remote` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 316 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lowongan Tersimpan | JobSearch` connect `Search & Job Filtering Engine` to `Local-First Storage & DB`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `Jalur Cepat Pencarian`, `JobSearch App Navigation`, `Skill Data Analyst (SQL & BI)` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Application Tracker & Kanban` be split into smaller, more focused modules?**
  _Cohesion score 0.06227106227106227 - nodes in this community are weakly interconnected._
- **Why does `Tracker Lamaran | JobSearch` connect `Search & Job Filtering Engine` to `Application Tracker & Kanban`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `providers.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12684989429175475 - nodes in this community are weakly interconnected._
- **Why does `Cari Lowongan Remote | JobSearch` connect `Search & Job Filtering Engine` to `Search & Job Filtering Engine`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `Search & Job Filtering Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._