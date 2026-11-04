import { getLiveExchangeRates, fetchLiveExchangeRates } from "./salary-calculator.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const JOB_REGISTRY_KEY = "jsa_job_registry_v7";
const MAX_REGISTRY_JOBS = 500;
const MONTHLY_WORK_HOURS = 160;

// Sinkronisasi kurs live latar belakang (gratis via open.er-api.com & currency-api)
if (typeof window !== "undefined") {
  fetchLiveExchangeRates().catch(() => {});
}

// Bersihkan cache lokal usang agar data gaji selalu akurat
try {
  ["jsa_job_registry_v1", "jsa_job_registry_v2", "jsa_job_registry_v3", "jsa_job_registry_v4", "jsa_job_registry_v5", "jsa_job_registry_v6"].forEach((k) => localStorage.removeItem(k));
} catch (_) {}

function makeDescription({ role, company, domain, focus, product }) {
  return `${company} membuka posisi ${role} untuk memperkuat tim ${domain} yang sedang mengembangkan ${product}. Peran ini terlibat dari discovery, perencanaan, eksekusi, sampai evaluasi dampak bisnis. Kamu akan bekerja dekat dengan produk, desain, data, dan operasi untuk memahami kebutuhan pengguna, memecah masalah menjadi prioritas yang jelas, lalu mengirim solusi yang stabil. Fokus utama pekerjaan meliputi ${focus}, dokumentasi keputusan, eksperimen terukur, serta peningkatan proses harian. Kandidat ideal nyaman berkomunikasi lintas fungsi, mampu menjelaskan alasan teknis atau bisnis secara sederhana, dan teliti terhadap kualitas. Lingkungan kerja kami menghargai inisiatif, ownership, feedback yang jujur, dan keputusan berbasis data, sehingga setiap orang punya ruang untuk mengusulkan perbaikan yang berdampak langsung bagi pelanggan.`;
}

function logo(name, background = "1565C0") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff&size=72&bold=true`;
}

export const JOBS = [
  {
    id: "job_bca_frontend",
    title: "Senior Frontend Developer (React / Next.js)",
    company: "PT Bank Central Asia Tbk (BCA)",
    logo: logo("BCA", "003399"),
    location: "Jakarta Pusat",
    type: ["Full-time", "Hybrid"],
    category: "Teknologi",
    salary: { min: 18000000, max: 28000000 },
    posted: "2026-10-31",
    description: "BCA mencari Senior Frontend Developer berpengalaman untuk merancang arsitektur aplikasi perbankan digital generasi terbaru menggunakan React, TypeScript, dan micro-frontend. Menjamin SLA 99.99% dan standar keamanan PCI-DSS.",
    requirements: [
      "Min. S1 Ilmu Komputer, Teknik Informatika, atau pengalaman setara.",
      "Pengalaman 4+ tahun membangun aplikasi web enterprise dengan React dan TypeScript.",
      "Paham arsitektur micro-frontend, web performance, dan secure coding perbankan.",
      "Mampu berkolaborasi dalam sprint Scrum dengan backend engineer dan UI/UX team."
    ],
    about_company: "PT Bank Central Asia Tbk (BCA) adalah bank swasta terbesar di Indonesia yang terus memimpin inovasi transaksi perbankan digital nasional.",
    tags: ["React", "TypeScript", "BCA", "Fintech"]
  },
  {
    id: "job_goto_data",
    title: "Data Analyst (Commercial & Growth)",
    company: "PT Tokopedia (GoTo)",
    logo: logo("TP", "00AA5B"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Hybrid"],
    category: "Data",
    salary: { min: 12000000, max: 20000000 },
    posted: "2026-10-30",
    description: "Menganalisis performa merchant, funnel belanja pengguna, dan efektivitas promosi menggunakan BigQuery, SQL, Python, dan Tableau. Terbiasa presentasi insight bisnis langsung ke VP dan Category Managers.",
    requirements: [
      "Min. 2 tahun pengalaman sebagai Data Analyst di e-commerce atau tech company.",
      "Mahir SQL tingkat lanjut (window functions, query optimization) dan Python data stack.",
      "Pengalaman visualisasi data dengan Tableau atau Looker Studio.",
      "Kemampuan storytelling berbasis data yang kuat."
    ],
    about_company: "PT Tokopedia adalah bagian dari ekosistem GoTo, ekosistem digital terintegrasi terbesar di Indonesia.",
    tags: ["SQL", "Tableau", "GoTo", "E-commerce"]
  },
  {
    id: "job_shopee_backend",
    title: "Backend Software Engineer (Golang / Microservices)",
    company: "Shopee Indonesia",
    logo: logo("SP", "EE4D2D"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 20000000, max: 35000000 },
    posted: "2026-10-31",
    description: "Mengembangkan sistem payment gateway dan voucher engine skala jutaan QPS. Membutuhkan pemahaman mendalam tentang Golang, Redis caching, Kafka message queue, dan database optimasi PostgreSQL.",
    requirements: [
      "Min. 3 tahun pengalaman backend development dengan Golang atau Java.",
      "Paham sistem terdistribusi, event-driven architecture, dan Kafka.",
      "Berpengalaman dengan query optimization dan sharding pada PostgreSQL/MySQL.",
      "Fasih berbahasa Inggris untuk kolaborasi regional."
    ],
    about_company: "Shopee adalah platform e-commerce terdepan di Asia Tenggara dan Taiwan yang menghubungkan jutaan pembeli dan penjual.",
    tags: ["Golang", "Microservices", "Shopee", "High-Scale"]
  },
  {
    id: "job_tiket_uiux",
    title: "UI/UX Product Designer",
    company: "Tiket.com (PT Global Tiket Network)",
    logo: logo("TK", "0064D2"),
    location: "Jakarta Barat",
    type: ["Full-time", "Remote"],
    category: "Desain",
    salary: { min: 14000000, max: 22000000 },
    posted: "2026-10-29",
    description: "Bertanggung jawab atas user journey pemesanan akomodasi dan penerbangan. Menjalankan usability testing, wireframing di Figma, serta berkolaborasi aktif dengan Design System team.",
    requirements: [
      "Portofolio desain UI/UX aplikasi mobile & web yang terbukti sukses.",
      "Mahir Figma, design tokens, interactive prototyping, dan usability testing.",
      "Mampu menerjemahkan data analitik kuantitatif ke dalam solusi antarmuka intuitif.",
      "Pengalaman kerja minimal 3 tahun di industri travel atau digital products."
    ],
    about_company: "Tiket.com adalah pioneer online travel agent (OTA) di Indonesia yang menyediakan kemudahan pemesanan tiket pesawat, hotel, dan aktivitas rekreasi.",
    tags: ["Figma", "UI/UX", "Tiket.com", "Travel"]
  },
  {
    id: "job_telkom_devops",
    title: "Lead DevOps & Cloud Infrastructure",
    company: "PT Telkom Indonesia (Persero) Tbk",
    logo: logo("TL", "D32F2F"),
    location: "Bandung",
    type: ["Full-time", "Hybrid"],
    category: "Teknologi",
    salary: { min: 25000000, max: 38000000 },
    posted: "2026-10-28",
    description: "Memimpin transformasi arsitektur cloud nasional Telkom. Mengelola Kubernetes clusters, Terraform infrastructure-as-code, CI/CD pipelines GitLab, dan observability berbasis Prometheus & Grafana.",
    requirements: [
      "Pengalaman 5+ tahun mengelola cloud infrastructure skala besar (AWS, GCP, atau Private Cloud).",
      "Sertifikasi Kubernetes (CKA) atau AWS Solutions Architect bernilai tambah tinggi.",
      "Mahir Terraform, Ansible, GitLab CI, dan arsitektur zero-trust security.",
      "Kepemimpinan teknis membimbing tim DevOps junior."
    ],
    about_company: "PT Telkom Indonesia adalah BUMN telekomunikasi dan digital terkemuka yang memegang infrastruktur serat optik dan jaringan komunikasi nasional.",
    tags: ["Kubernetes", "DevOps", "Telkom", "BUMN"]
  },
  {
    id: "job_blibli_marketing",
    title: "Digital Performance Marketing Specialist",
    company: "PT Blibli.com (Global Digital Niaga)",
    logo: logo("BL", "0095DA"),
    location: "Jakarta Pusat",
    type: ["Full-time"],
    category: "Marketing",
    salary: { min: 10000000, max: 16000000 },
    posted: "2026-10-30",
    description: "Mengelola campaign berbayar skala besar di Google Ads, Meta Ads, dan TikTok Ads. Melakukan analisis ROAS, conversion rate optimization (CRO), dan A/B testing copy iklan.",
    requirements: [
      "Min. 2 tahun pengalaman mengelola budget paid ads minimal Rp 100jt/bulan.",
      "Sertifikasi Google Ads dan Meta Certified Media Buyer.",
      "Keahlian analitik mendalam dengan Google Analytics 4 (GA4) dan MMP (AppsFlyer).",
      "Fokus kuat pada efisiensi acquisition cost (CAC) dan ROAS."
    ],
    about_company: "Blibli adalah e-commerce omnichannel buatan Indonesia pelopor ekosistem belanja terpercaya dengan layanan pelanggan 24/7.",
    tags: ["Google Ads", "Meta Ads", "Blibli", "Marketing"]
  },
  {
    id: "job_astra_fullstack",
    title: "Junior Full Stack Web Developer",
    company: "Astra International Digital Hub",
    logo: logo("AS", "0D47A1"),
    location: "Jakarta Utara",
    type: ["Full-time"],
    category: "Teknologi",
    salary: { min: 8000000, max: 13000000 },
    posted: "2026-10-31",
    description: "Peluang karir untuk lulusan baru bertalenta di ekosistem digital Astra. Mengembangkan aplikasi web internal dengan Node.js, React, dan MySQL. Mentoring langsung dari Principal Engineer.",
    requirements: [
      "Fresh Graduate S1 Ilmu Komputer, Teknik Informatika, Sistem Informasi, atau bootcamp terakreditasi.",
      "Memahami dasar pemrograman JavaScript/TypeScript modern.",
      "Familiar dengan database SQL (MySQL / PostgreSQL).",
      "Memiliki kemauan belajar tinggi dan semangat kolaborasi yang baik."
    ],
    about_company: "PT Astra International Tbk adalah salah satu konglomerasi terbesar di Indonesia dengan portofolio otomotif, jasa keuangan, alat berat, dan inovasi teknologi digital.",
    tags: ["Fresh Graduate", "React", "Node.js", "Astra"]
  },
  {
    id: "job_mandiri_security",
    title: "Cyber Security Analyst & Penetration Tester",
    company: "PT Bank Mandiri (Persero) Tbk",
    logo: logo("BM", "F57C00"),
    location: "Jakarta Selatan",
    type: ["Full-time"],
    category: "Teknologi",
    salary: { min: 17000000, max: 26000000 },
    posted: "2026-10-27",
    description: "Melakukan vulnerability assessment, penetration testing berkala pada web dan mobile app perbankan, serta merancang mitigasi insiden siber sesuai standar OJK dan ISO 27001.",
    requirements: [
      "Min. 3 tahun pengalaman di cyber security, ethical hacking, atau SOC analyst.",
      "Sertifikasi OSCP, CEH, atau CompTIA Security+ diutamakan.",
      "Mahir tool security seperti Burp Suite Professional, Nessus, Wireshark, dan Kali Linux.",
      "Paham regulasi perbankan OJK dan framework MITRE ATT&CK."
    ],
    about_company: "PT Bank Mandiri (Persero) Tbk adalah salah satu bank BUMN terbesar di Indonesia yang menyediakan solusi keuangan menyeluruh bagi nasabah korporat maupun ritel.",
    tags: ["Security", "PenTest", "Bank Mandiri", "Fintech"]
  },
  {
    id: "job_kalbe_bi",
    title: "Business Intelligence & Reporting Specialist",
    company: "PT Kalbe Farma Tbk",
    logo: logo("KF", "388E3C"),
    location: "Jakarta Timur",
    type: ["Full-time", "Hybrid"],
    category: "Data",
    salary: { min: 11000000, max: 17000000 },
    posted: "2026-10-29",
    description: "Membangun dashboard monitoring rantai pasok dan distribusi farmasi menggunakan Power BI, SQL Server, dan data warehouse. Menghasilkan laporan mingguan untuk jajaran direksi.",
    requirements: [
      "Pengalaman 2-4 tahun di bidang Business Intelligence atau Data Warehouse.",
      "Mahir Power BI (DAX, Power Query) dan advanced SQL Server modeling.",
      "Kemampuan komunikasi analitis menyederhanakan data kompleks menjadi actionable insight.",
      "Pengalaman industri farmasi atau FMCG menjadi nilai tambah."
    ],
    about_company: "PT Kalbe Farma Tbk adalah perusahaan farmasi dan produk kesehatan terbesar di Asia Tenggara yang berkomitmen meningkatkan kesehatan masyarakat Indonesia.",
    tags: ["Power BI", "SQL", "Kalbe", "Kesehatan"]
  },
  {
    id: "job_bri_android",
    title: "Mobile Android Engineer (Kotlin / Compose)",
    company: "PT Bank Rakyat Indonesia (Persero) Tbk",
    logo: logo("BR", "0288D1"),
    location: "Jakarta Pusat",
    type: ["Full-time", "Hybrid"],
    category: "Teknologi",
    salary: { min: 16000000, max: 25000000 },
    posted: "2026-10-31",
    description: "Mengembangkan fitur inovatif pada aplikasi perbankan BRImo dengan puluhan juta pengguna harian. Menerapkan Clean Architecture, Jetpack Compose, Unit Testing, dan biometric authentication.",
    requirements: [
      "Min. 3 tahun pengalaman pengembangan aplikasi Android native dengan Kotlin.",
      "Paham arsitektur MVVM, MVI, Jetpack Compose, Coroutines, dan Flow.",
      "Pengalaman implementasi security perbankan (root detection, certificate pinning, biometric).",
      "Terbiasa menulis automated UI testing dan unit testing."
    ],
    about_company: "PT Bank Rakyat Indonesia (Persero) Tbk (BRI) adalah bank BUMN dengan jaringan terluas di Indonesia, pelopor inklusi keuangan hingga ke pelosok nusantara.",
    tags: ["Android", "Kotlin", "BRI", "Fintech"]
  },
  {
    id: "job_telkomsel_data",
    title: "Senior Data Engineer (Spark / Airflow)",
    company: "Telkomsel (PT Telekomunikasi Selular)",
    logo: logo("TS", "C62828"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Data",
    salary: { min: 22000000, max: 34000000 },
    posted: "2026-10-30",
    description: "Merancang data pipeline terdistribusi skala petabyte menggunakan Apache Spark, Airflow, Kafka, dan Google Cloud BigQuery untuk analitik jaringan telekomunikasi nasional.",
    requirements: [
      "Min. 4 tahun pengalaman membangun data pipeline skala besar.",
      "Keahlian mendalam dalam Apache Spark (PySpark/Scala), Apache Airflow, dan Kafka.",
      "Familiar dengan Google Cloud Platform (BigQuery, Dataproc, Pub/Sub) atau AWS.",
      "Paham konsep data governance, data lineage, dan data lakehouse."
    ],
    about_company: "Telkomsel adalah operator seluler terbesar di Indonesia yang melayani lebih dari 160 juta pelanggan di seluruh penjuru Indonesia.",
    tags: ["Data Engineer", "Spark", "Telkomsel", "BigData"]
  },
  {
    id: "job_dana_frontend",
    title: "Frontend Engineer (React / TypeScript)",
    company: "DANA Indonesia (PT Espay Debit Indonesia)",
    logo: logo("DN", "118EEA"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 15000000, max: 24000000 },
    posted: "2026-10-31",
    description: "Membangun ekosistem web portal merchant dan payment checkout DANA. Fokus pada web performance, security standards, dan micro-frontend interoperability.",
    requirements: [
      "Min. 3 tahun pengalaman frontend dengan React, TypeScript, dan CSS-in-JS.",
      "Pengalaman integrasi Web SDK, Payment APIs, dan Progressive Web Apps (PWA).",
      "Paham web vitals optimization (LCP, FID, CLS) dan cross-browser compatibility.",
      "Terbiasa bekerja dalam lingkungan agile sprint cepat."
    ],
    about_company: "DANA adalah dompet digital Indonesia yang didesain untuk menjadikan setiap transaksi non-tunai dan non-kartu berjalan cepat, praktis, dan terjamin keamanannya.",
    tags: ["React", "TypeScript", "DANA", "Fintech"]
  },
  {
    id: "job_halodoc_golang",
    title: "Golang Backend Developer",
    company: "Halodoc (PT Media Dokter Investama)",
    logo: logo("HD", "E91E63"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 18000000, max: 30000000 },
    posted: "2026-10-28",
    description: "Mengembangkan layanan telemedisin konsultasi dokter online dan pengiriman resep obat instan. Memanfaatkan Golang, gRPC, PostgreSQL, AWS ECS, dan Redis.",
    requirements: [
      "Min. 3 tahun pengalaman backend development dengan Golang.",
      "Berpengalaman dengan arsitektur microservices dan komunikasi gRPC / REST.",
      "Familiar dengan deployment container AWS (ECS, EKS, Lambda, SQS).",
      "Passion tinggi dalam memajukan akses kesehatan digital di Indonesia."
    ],
    about_company: "Halodoc adalah platform layanan kesehatan digital terlengkap di Indonesia yang menghubungkan pengguna dengan ribuan dokter berlisensi dan apotek resmi.",
    tags: ["Golang", "AWS", "Halodoc", "HealthTech"]
  },
  {
    id: "job_bukalapak_qa",
    title: "QA Automation Engineer (Playwright / Cypress)",
    company: "PT Bukalapak.com Tbk",
    logo: logo("BL", "E31E52"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 13000000, max: 21000000 },
    posted: "2026-10-29",
    description: "Membuat end-to-end automated test suites menggunakan TypeScript, Playwright, dan Appium untuk menjamin kualitas rilis e-commerce dan mitra Bukalapak.",
    requirements: [
      "Min. 2-3 tahun pengalaman dalam test automation (Web & Mobile).",
      "Mahir TypeScript/JavaScript dengan framework Playwright, Cypress, atau Selenium.",
      "Pengalaman integrasi CI/CD test automation di GitHub Actions atau GitLab CI.",
      "Paham exploratory testing, security testing, dan performance testing dasar."
    ],
    about_company: "PT Bukalapak.com Tbk adalah perusahaan teknologi all-commerce Indonesia yang melayani jutaan UMKM dan konsumen digital.",
    tags: ["QA Automation", "Playwright", "Bukalapak", "E-commerce"]
  },
  {
    id: "job_gojek_apm",
    title: "Associate Product Manager",
    company: "Gojek (GoTo Financial)",
    logo: logo("GJ", "00880C"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Hybrid"],
    category: "Produk",
    salary: { min: 15000000, max: 23000000 },
    posted: "2026-10-31",
    description: "Berkontribusi pada ekosistem GoPay dan GoPay Merchant. Menjalankan user interviews, perumusan requirement MVP, sprint planning, dan tracking metrik retensi.",
    requirements: [
      "Min. 1-2 tahun pengalaman sebagai Product Manager atau Associate PM di produk digital.",
      "Kemampuan analisis data kuantitatif yang kuat (SQL dasar, Google Analytics/Mixpanel).",
      "Keahlian komunikasi yang baik dan empati tinggi terhadap kebutuhan merchant.",
      "Gelar S1 dari universitas terkemuka di bidang Teknik, Bisnis, atau Desain."
    ],
    about_company: "Gojek adalah platform on-demand dan pembayaran terkemuka di Asia Tenggara yang menghubungkan konsumen dengan mitra driver dan merchant makanan.",
    tags: ["Product Manager", "GoTo", "GoPay", "Fintech"]
  },
  {
    id: "job_traveloka_backend",
    title: "Software Backend Engineer (Central Tech)",
    company: "Traveloka",
    logo: logo("TV", "1BA0E2"),
    location: "Tangerang",
    type: ["Full-time", "Hybrid"],
    category: "Teknologi",
    salary: { min: 20000000, max: 32000000 },
    posted: "2026-10-30",
    description: "Mengembangkan core payment and inventory platform Traveloka untuk menangani jutaan transaksi pemesanan tiket penerbangan dan akomodasi di seluruh Asia Tenggara.",
    requirements: [
      "Min. 3 tahun pengalaman backend dengan Java, Kotlin, atau Go.",
      "Paham distributed caching, high concurrency, and database transaction isolation.",
      "Berpengalaman dengan cloud computing AWS / GCP.",
      "Kemampuan komunikasi bahasa Inggris yang lancar."
    ],
    about_company: "Traveloka adalah lifestyle superapp terkemuka di Asia Tenggara yang menyediakan akses untuk menemukan dan membeli berbagai produk perjalanan dan finansial.",
    tags: ["Java", "Golang", "Traveloka", "Fintech"]
  },
  {
    id: "job_grab_senior_swe",
    title: "Senior Software Engineer (Backend / Distributed Systems)",
    company: "Grab Indonesia",
    logo: logo("GB", "00B14F"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Hybrid"],
    category: "Teknologi",
    salary: { min: 24000000, max: 38000000 },
    posted: "2026-10-31",
    description: "Membangun layanan realtime matching algoritma untuk pengantaran makanan dan mobilitas kota dengan latensi rendah di bawah 50 milidetik.",
    requirements: [
      "Pengalaman 4+ tahun dalam perancangan distributed systems skala besar.",
      "Mahir Golang atau C++, Kafka, Redis, dan PostgreSQL.",
      "Pemahaman kuat mengenai distributed consensus, replication, dan fault tolerance.",
      "S1/S2 Ilmu Komputer atau pengalaman industri setara."
    ],
    about_company: "Grab adalah superapp terkemuka di Asia Tenggara yang menyediakan layanan mobilitas harian, pengantaran makanan, dan pembayaran digital.",
    tags: ["Golang", "Distributed Systems", "Grab", "High-Scale"]
  },
  {
    id: "job_kredivo_backend",
    title: "Backend Engineer - Golang (SDE II)",
    company: "Kredivo Group",
    logo: logo("KD", "FF6E00"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 18000000, max: 28000000 },
    posted: "2026-10-29",
    description: "Mengembangkan scoring credit engine AI dan sistem pembayaran buy-now-pay-later (BNPL) dengan tingkat ketersediaan tinggi dan standar keamanan finansial.",
    requirements: [
      "Min. 3 tahun pengalaman backend engineering dengan Golang.",
      "Paham microservices, Redis caching, MySQL optimization, dan Docker containerization.",
      "Pengalaman di fintech atau payment gateway adalah nilai tambah besar.",
      "Komunikasi solid dan kemampuan pemecahan masalah analitis."
    ],
    about_company: "Kredivo Group adalah perusahaan fintech lending digital terkemuka di Asia Tenggara yang memberikan akses kredit instan yang cepat, mudah, dan terjangkau.",
    tags: ["Golang", "Fintech", "Kredivo", "BNPL"]
  },
  {
    id: "job_schneider_automation",
    title: "Service Representative - Automation & Power",
    company: "Schneider Electric",
    logo: logo("SE", "3DCD58"),
    location: "Cikarang",
    type: ["Full-time"],
    category: "Teknologi",
    salary: { min: 10000000, max: 16000000 },
    posted: "2026-10-28",
    description: "Melakukan commissioning sistem otomasi industri, PLC, SCADA, dan pemeliharaan panel distribusi daya pintar di fasilitas manufaktur tier-1 Schneider Electric.",
    requirements: [
      "Min. D3/S1 Teknik Elektro, Otomasi Industri, atau Mekatronika.",
      "Pengalaman 2 tahun di bidang commissioning PLC, inverter, dan SCADA.",
      "Bersedia melakukan perjalanan dinas lapangan ke customer site.",
      "Memiliki pemahaman standar K3 kelistrikan yang baik."
    ],
    about_company: "Schneider Electric adalah pemimpin global dalam transformasi digital manajemen energi dan otomasi di rumah, gedung, data center, dan industri.",
    tags: ["Otomasi", "SCADA", "Schneider", "Industri"]
  },
  {
    id: "job_paragon_seo",
    title: "SEO & Content Marketing Specialist",
    company: "Paragon Technology and Innovation (Wardah)",
    logo: logo("PG", "00838F"),
    location: "Tangerang",
    type: ["Full-time", "Hybrid"],
    category: "Marketing",
    salary: { min: 9000000, max: 15000000 },
    posted: "2026-10-30",
    description: "Meningkatkan visibilitas organik merek kosmetik Paragon (Wardah, Make Over, Emina, Kahf) melalui strategi SEO on-page, off-page, technical audit, dan content marketing.",
    requirements: [
      "Min. 2 tahun pengalaman sebagai SEO Specialist atau Technical Content Strategist.",
      "Mahir tool SEO seperti Ahrefs, SEMrush, Google Search Console, dan Screaming Frog.",
      "Pemahaman kuat mengenai search intent konsumen beauty dan personal care.",
      "Mampu berkoordinasi dengan tim copywriter, digital designer, dan web developer."
    ],
    about_company: "PT Paragon Technology and Innovation adalah perusahaan manufaktur kosmetik nasional terbesar di Indonesia yang menaungi brand ternama Wardah, Make Over, Emina, dan Kahf.",
    tags: ["SEO", "Content Marketing", "Paragon", "FMCG"]
  }
];

export function getJobById(id) {
  return readJobRegistry()[id] || JOBS.find((job) => job.id === id) || null;
}

export function getSimilarJobs(job, limit = 6) {
  if (!job) return [];
  return getAllKnownJobs()
    .filter((candidate) => candidate.id !== job.id)
    .map((candidate) => {
      const categoryScore = candidate.category === job.category ? 3 : 0;
      const locationScore = candidate.location === job.location ? 1 : 0;
      const typeScore = candidate.type.some((type) => job.type.includes(type)) ? 1 : 0;
      return { candidate, score: categoryScore + locationScore + typeScore };
    })
    .sort((a, b) => b.score - a.score || new Date(b.candidate.posted) - new Date(a.candidate.posted))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function getFilterOptions(jobs = []) {
  return {
    locations: [...new Set(jobs.map((job) => job.location).filter(Boolean))],
    types: [...new Set(jobs.flatMap((job) => job.type || []).filter(Boolean))],
    categories: [...new Set(jobs.map((job) => job.category).filter(Boolean))]
  };
}

export function getSalaryDisplayInfo(salary) {
  if (!salary || (!salary.min && !salary.max && !salary.label && !salary.display)) {
    return {
      primary: "Gaji belum tersedia",
      conversion: "",
      isMissing: true
    };
  }

  const rawLabel = String(salary.label || salary.display || "").trim();
  const isNanLabel = !rawLabel || rawLabel.toLowerCase() === "nan" || rawLabel.toLowerCase() === "null";
  const curr = String(salary.currency || "").toUpperCase();

  // 1. Cek konversi kurs jika mata uang asing (USD, EUR, GBP)
  const foreignEstimate = parseForeignSalary(rawLabel, curr);
  let conversionText = "";

  if (foreignEstimate) {
    const minJt = formatMillion(foreignEstimate.min);
    const maxJt = formatMillion(foreignEstimate.max);
    const currSym = foreignEstimate.currSym || "$1 = Rp 16.000";
    const p = foreignEstimate.period === "tugas" ? "tugas" : "bln";
    conversionText = foreignEstimate.min === foreignEstimate.max
      ? `≈ ${minJt} / ${p} (kurs ${currSym})`
      : `≈ ${minJt} - ${maxJt} / ${p} (kurs ${currSym})`;
  }

  // 2. Tentukan primary label (HARGA ASLI SUMBER DATA)
  let primaryText = "";
  if (!isNanLabel && rawLabel !== "Gaji kompetitif") {
    primaryText = rawLabel;
  } else if (salary.min || salary.max) {
    const min = Number(salary.min || 0);
    const max = Number(salary.max || 0);
    if (curr === "IDR" || !curr) {
      if (min > 0 && max > 0 && min !== max) {
        primaryText = `${formatMillion(min)} - ${formatMillion(max)} / bln`;
      } else if (min > 0) {
        primaryText = `${formatMillion(min)} / bln`;
      } else if (max > 0) {
        primaryText = `${formatMillion(max)} / bln`;
      }
    } else {
      const p = salary.period === "yearly" ? "thn" : (salary.period === "monthly" ? "bln" : "thn");
      if (min > 0 && max > 0 && min !== max) {
        primaryText = `${curr} ${min.toLocaleString("en-US")} - ${max.toLocaleString("en-US")} / ${p}`;
      } else if (min > 0) {
        primaryText = `${curr} ${min.toLocaleString("en-US")} / ${p}`;
      } else if (max > 0) {
        primaryText = `${curr} ${max.toLocaleString("en-US")} / ${p}`;
      }
    }
  }

  if (!primaryText) {
    primaryText = (!isNanLabel && rawLabel) ? rawLabel : "Gaji kompetitif";
  }

  return {
    primary: primaryText,
    conversion: conversionText,
    isMissing: primaryText === "Gaji belum tersedia"
  };
}

export function formatSalary(salary) {
  return getSalaryDisplayInfo(salary).primary;
}

export function formatSalaryOriginal(salary) {
  return getSalaryDisplayInfo(salary).conversion;
}

export function formatPostedDate(posted) {
  if (!posted) return "Baru saja";

  let date;
  if (posted instanceof Date) {
    date = posted;
  } else if (typeof posted === "string") {
    const trimmed = posted.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      date = new Date(`${trimmed}T00:00:00`);
    } else {
      date = new Date(trimmed);
    }
  } else {
    date = new Date(posted);
  }

  if (isNaN(date.getTime())) {
    return "Baru saja";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 3600));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Baru saja";
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "1 hari lalu";
  if (diffDays < 30) return `${diffDays} hari lalu`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} bulan lalu`;

  const years = Math.floor(months / 12);
  return `${years} tahun lalu`;
}

export function formatDateLong(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatMillion(value) {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return "Rp 0";
  if (num < 1000000) {
    return `Rp ${num.toLocaleString("id-ID")}`;
  }
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: num >= 100000000 ? 0 : 1
  }).format(num / 1000000);
  return `Rp ${formatted}jt`;
}

function parseForeignSalary(label = "", currencyHint = "") {
  const text = String(label || "").trim();
  if (!text || text.toLowerCase() === "nan" || text.toLowerCase() === "null") return null;
  if (/gaji\s*(?:kompetitif|belum|tidak)/i.test(text)) return null;

  const isGbp = /£|gbp/i.test(text) || String(currencyHint).toUpperCase() === "GBP";
  const isEur = /€|eur/i.test(text) || String(currencyHint).toUpperCase() === "EUR";
  const isUsd = /\$|usd|cad/i.test(text) || (!isGbp && !isEur && (String(currencyHint).toUpperCase() === "USD" || /[0-9]k\b/i.test(text)));
  if (!isGbp && !isEur && !isUsd) return null;

  const rates = getLiveExchangeRates();
  const rate = isGbp ? (rates.GBP || 24300) : (isEur ? (rates.EUR || 20300) : (rates.USD || 18140));
  const currSym = isGbp
    ? `£1 = Rp ${(rates.GBP || 24300).toLocaleString("id-ID")}`
    : (isEur ? `€1 = Rp ${(rates.EUR || 20300).toLocaleString("id-ID")}` : `$1 = Rp ${(rates.USD || 18140).toLocaleString("id-ID")}`);

  const regex = /(?:[\$£€]|usd\s*|eur\s*|gbp\s*|ote\s*)?\s*([0-9]+(?:[.,][0-9]+)?)\s*(k)?/gi;
  const numbers = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    let numStr = match[1];
    let hasK = Boolean(match[2]);
    if (!numStr) continue;

    if (/^\d{1,3}[.,]\d{3}$/.test(numStr) || /^\d{1,3}[.,]\d{3}[.,]\d{3}$/.test(numStr)) {
      numbers.push(Number(numStr.replace(/[.,]/g, "")));
    } else {
      let val = Number(numStr.replace(",", "."));
      if (Number.isFinite(val) && val > 0) {
        if (hasK) val *= 1000;
        else if (val < 500 && (/thn|tahun|yearly|year/i.test(text) || (!/hour|jam|month|bulan|task|tugas/i.test(text) && val >= 20))) {
          val *= 1000;
        }
        numbers.push(val);
      }
    }
  }

  if (!numbers.length) return null;

  const isHourly = /hour|jam/i.test(text);
  const isMonthly = /month|bulan/i.test(text);
  const isPerTask = /task|tugas/i.test(text);

  const toMonthlyIdr = (val) => {
    if (isHourly) return val * MONTHLY_WORK_HOURS * rate;
    if (isMonthly) return val * rate;
    if (isPerTask) return val * rate;
    return (val * rate) / 12;
  };

  const min = toMonthlyIdr(numbers[0]);
  const max = toMonthlyIdr(numbers[numbers.length > 1 ? 1 : 0]);

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    original: text,
    currency: isGbp ? "GBP" : (isEur ? "EUR" : "USD"),
    currSym,
    rate,
    period: isPerTask ? "tugas" : "bln"
  };
}

export function getSalaryEstimate(salary) {
  if (!salary) return null;
  if (salary.min || salary.max) {
    const min = Number(salary.min || salary.max || 0);
    const max = Number(salary.max || salary.min || 0);
    if (min || max) {
      return {
        min: Math.min(min, max),
        max: Math.max(min, max),
        original: salary.label || salary.display || ""
      };
    }
  }
  return parseForeignSalary(salary.label || salary.display, salary.currency);
}

export function salaryAverage(job) {
  const estimate = getSalaryEstimate(job.salary);
  if (!estimate) return 0;
  return ((estimate.min || 0) + (estimate.max || 0)) / 2;
}

export function formatNormalizedSalary(salary) {
  const estimate = getSalaryEstimate(salary);
  if (!estimate) return "";
  if (estimate.min === estimate.max) return `${formatMillion(estimate.min)} / bulan`;
  return `${formatMillion(estimate.min)} - ${formatMillion(estimate.max)} / bulan`;
}

export function makeLogo(name, background = "1565C0") {
  return logo(name, background);
}

export function readJobRegistry() {
  try {
    const raw = localStorage.getItem(JOB_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch (error) {
    console.warn("Gagal membaca cache lowongan", error);
    return {};
  }
}

export function rememberJobs(jobs) {
  const validJobs = jobs.filter((job) => job?.id);
  if (!validJobs.length) return;

  try {
    const registry = readJobRegistry();
    validJobs.forEach((job) => {
      registry[job.id] = {
        ...job,
        cachedAt: new Date().toISOString()
      };
    });

    const trimmed = Object.fromEntries(
      Object.entries(registry)
        .sort(([, a], [, b]) => new Date(b.cachedAt || b.posted || 0) - new Date(a.cachedAt || a.posted || 0))
        .slice(0, MAX_REGISTRY_JOBS)
    );

    localStorage.setItem(JOB_REGISTRY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn("Gagal menyimpan cache lowongan", error);
  }
}

export function getAllKnownJobs() {
  const registryJobs = Object.values(readJobRegistry());
  const jobsById = new Map();
  JOBS.forEach((job) => {
    if (job?.id) jobsById.set(job.id, job);
  });
  registryJobs.forEach((job) => {
    if (job?.id) jobsById.set(job.id, job);
  });
  return [...jobsById.values()];
}

export function getJobQualitySignals(job) {
  const signals = [];
  const posted = new Date(`${job.posted}T00:00:00`);
  const ageDays = Number.isFinite(posted.getTime())
    ? Math.max(0, Math.round((new Date() - posted) / MS_PER_DAY))
    : 999;
  const salaryEstimate = getSalaryEstimate(job.salary);

  if (ageDays <= 14) signals.push({ key: "fresh", label: "Fresh", tone: "good" });
  if (salaryEstimate) signals.push({ key: "salary", label: "Gaji ada", tone: "good" });
  if (job.applyUrl || job.source?.url) signals.push({ key: "official", label: "Link resmi", tone: "good" });
  if (job.location && job.location.toLowerCase() !== "remote,") signals.push({ key: "location", label: "Lokasi jelas", tone: "neutral" });
  if (job.company && !/unknown/i.test(job.company)) signals.push({ key: "company", label: "Perusahaan jelas", tone: "neutral" });

  if (!signals.length) {
    signals.push({ key: "limited", label: "Data terbatas", tone: "warning" });
  }

  return signals;
}
