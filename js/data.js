const MS_PER_DAY = 24 * 60 * 60 * 1000;
const JOB_REGISTRY_KEY = "jsa_job_registry_v4";
const MAX_REGISTRY_JOBS = 360;
const USD_TO_IDR = 16000;
const MONTHLY_WORK_HOURS = 160;

function makeDescription({ role, company, domain, focus, product }) {
  return `${company} membuka posisi ${role} untuk memperkuat tim ${domain} yang sedang mengembangkan ${product}. Peran ini terlibat dari discovery, perencanaan, eksekusi, sampai evaluasi dampak bisnis. Kamu akan bekerja dekat dengan produk, desain, data, dan operasi untuk memahami kebutuhan pengguna, memecah masalah menjadi prioritas yang jelas, lalu mengirim solusi yang stabil. Fokus utama pekerjaan meliputi ${focus}, dokumentasi keputusan, eksperimen terukur, serta peningkatan proses harian. Kandidat ideal nyaman berkomunikasi lintas fungsi, mampu menjelaskan alasan teknis atau bisnis secara sederhana, dan teliti terhadap kualitas. Lingkungan kerja kami menghargai inisiatif, ownership, feedback yang jujur, dan keputusan berbasis data, sehingga setiap orang punya ruang untuk mengusulkan perbaikan yang berdampak langsung bagi pelanggan.`;
}

function logo(name, background = "1565C0") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff&size=72&bold=true`;
}

export const JOBS = [
  {
    id: "job_001",
    title: "Frontend Developer",
    company: "PT Teknologi Maju",
    logo: logo("TM"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 8000000, max: 15000000 },
    posted: "2026-06-11",
    description: makeDescription({
      role: "Frontend Developer",
      company: "PT Teknologi Maju",
      domain: "platform web",
      product: "dashboard operasional untuk pelanggan enterprise",
      focus: "membangun komponen UI, menjaga performa halaman, memperbaiki aksesibilitas, dan merapikan integrasi API"
    }),
    requirements: [
      "Min. S1 semua jurusan atau pengalaman setara.",
      "Pengalaman 2 tahun membangun aplikasi web produksi.",
      "Menguasai JavaScript modern, HTML semantik, CSS responsif, dan debugging browser.",
      "Paham aksesibilitas, performa web, dan kolaborasi dengan designer."
    ],
    about_company: "PT Teknologi Maju adalah perusahaan software B2B yang membantu tim operasional mengelola proses kerja harian dengan produk yang stabil, aman, dan mudah dipakai.",
    tags: ["JavaScript", "CSS", "Aksesibilitas"]
  },
  {
    id: "job_002",
    title: "Product Manager",
    company: "Nusantara Digital Hub",
    logo: logo("ND", "0F766E"),
    location: "Bandung",
    type: ["Full-time"],
    category: "Produk",
    salary: { min: 12000000, max: 22000000 },
    posted: "2026-06-10",
    description: makeDescription({
      role: "Product Manager",
      company: "Nusantara Digital Hub",
      domain: "produk konsumen",
      product: "fitur transaksi dan loyalti untuk aplikasi mobile",
      focus: "menyusun roadmap, menulis requirement, memvalidasi asumsi, dan membaca metrik adopsi"
    }),
    requirements: [
      "Pengalaman 3 tahun di product management, business analysis, atau peran sejenis.",
      "Mampu membuat PRD, user story, dan prioritas berbasis impact.",
      "Terbiasa menggunakan data produk untuk mengambil keputusan.",
      "Komunikasi kuat dengan engineering, desain, sales, dan leadership."
    ],
    about_company: "Nusantara Digital Hub membangun produk digital untuk membantu merchant lokal menjual, melayani, dan memahami pelanggan dengan lebih baik.",
    tags: ["Roadmap", "Analytics", "PRD"]
  },
  {
    id: "job_003",
    title: "Digital Marketing Specialist",
    company: "Sagara Commerce",
    logo: logo("SC", "B45309"),
    location: "Surabaya",
    type: ["Full-time", "Contract"],
    category: "Marketing",
    salary: { min: 7000000, max: 12000000 },
    posted: "2026-06-09",
    description: makeDescription({
      role: "Digital Marketing Specialist",
      company: "Sagara Commerce",
      domain: "growth marketing",
      product: "kampanye akuisisi pelanggan untuk marketplace niche",
      focus: "mengelola paid ads, eksperimen landing page, segmentasi audiens, dan laporan performa mingguan"
    }),
    requirements: [
      "Pengalaman menjalankan kampanye Meta Ads, Google Ads, atau TikTok Ads.",
      "Paham funnel marketing, tracking conversion, dan A/B testing.",
      "Mampu menulis copy iklan yang jelas dan terukur.",
      "Nyaman bekerja dengan target, budget, dan eksperimen cepat."
    ],
    about_company: "Sagara Commerce adalah perusahaan e-commerce yang membantu brand lokal mengembangkan kanal penjualan digital dan pengalaman pelanggan yang konsisten.",
    tags: ["Paid Ads", "Growth", "Copywriting"]
  },
  {
    id: "job_004",
    title: "Finance Analyst",
    company: "Artha Finansial",
    logo: logo("AF", "4C1D95"),
    location: "Jakarta Selatan",
    type: ["Full-time"],
    category: "Keuangan",
    salary: { min: 9000000, max: 16000000 },
    posted: "2026-06-13",
    description: makeDescription({
      role: "Finance Analyst",
      company: "Artha Finansial",
      domain: "perencanaan keuangan",
      product: "model anggaran, forecast, dan analisis profitabilitas bisnis",
      focus: "membangun laporan manajemen, memantau biaya, menganalisis variance, dan menyiapkan insight untuk keputusan investasi"
    }),
    requirements: [
      "Min. S1 Akuntansi, Keuangan, Ekonomi, atau jurusan relevan.",
      "Menguasai Excel atau spreadsheet tingkat lanjut.",
      "Paham laporan keuangan, budgeting, forecasting, dan analisis variance.",
      "Teliti, analitis, dan mampu menjelaskan angka dengan sederhana."
    ],
    about_company: "Artha Finansial menyediakan layanan perencanaan dan operasional keuangan untuk perusahaan berkembang yang membutuhkan kontrol biaya lebih disiplin.",
    tags: ["Forecasting", "Excel", "Budgeting"]
  },
  {
    id: "job_005",
    title: "Operations Coordinator",
    company: "Bali Experience Co",
    logo: logo("BE", "15803D"),
    location: "Bali",
    type: ["Full-time", "Part-time"],
    category: "Operasional",
    salary: { min: 5500000, max: 9500000 },
    posted: "2026-06-08",
    description: makeDescription({
      role: "Operations Coordinator",
      company: "Bali Experience Co",
      domain: "operasional layanan",
      product: "pengalaman perjalanan dan aktivitas lokal untuk wisatawan",
      focus: "menjadwalkan vendor, menjaga kualitas layanan, menyelesaikan eskalasi, dan menyusun checklist operasional"
    }),
    requirements: [
      "Pengalaman 1 tahun di operasional, hospitality, travel, atau customer service.",
      "Rapi dalam koordinasi jadwal dan dokumentasi.",
      "Mampu menangani masalah pelanggan dengan tenang.",
      "Bersedia bekerja dengan jadwal fleksibel saat musim ramai."
    ],
    about_company: "Bali Experience Co menghubungkan wisatawan dengan aktivitas lokal yang terkurasi, aman, dan dijalankan bersama mitra komunitas.",
    tags: ["Hospitality", "Vendor", "Customer"]
  },
  {
    id: "job_006",
    title: "Backend Engineer",
    company: "Karya Cloud Systems",
    logo: logo("KC", "1D4ED8"),
    location: "Remote",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 14000000, max: 28000000 },
    posted: "2026-06-12",
    description: makeDescription({
      role: "Backend Engineer",
      company: "Karya Cloud Systems",
      domain: "infrastruktur aplikasi",
      product: "layanan API, pipeline data, dan sistem notifikasi real-time",
      focus: "merancang endpoint, menjaga reliability, menulis pengujian, dan meningkatkan observability layanan"
    }),
    requirements: [
      "Pengalaman 3 tahun membangun backend service produksi.",
      "Menguasai REST API, database relasional, caching, dan background job.",
      "Paham testing, logging, monitoring, dan keamanan aplikasi.",
      "Terbiasa melakukan code review dan dokumentasi teknis."
    ],
    about_company: "Karya Cloud Systems membantu perusahaan SaaS mempercepat pengembangan platform dengan layanan cloud-native yang scalable.",
    tags: ["API", "Database", "Observability"]
  },
  {
    id: "job_007",
    title: "UX Researcher",
    company: "Ruang Produk",
    logo: logo("RP", "BE185D"),
    location: "Yogyakarta",
    type: ["Contract", "Remote"],
    category: "Produk",
    salary: { min: 8000000, max: 14000000 },
    posted: "2026-06-07",
    description: makeDescription({
      role: "UX Researcher",
      company: "Ruang Produk",
      domain: "riset pengguna",
      product: "produk edukasi dan alat belajar mandiri",
      focus: "merancang interview, menjalankan usability test, mensintesis temuan, dan memberi rekomendasi prioritas"
    }),
    requirements: [
      "Pengalaman menjalankan riset kualitatif dan kuantitatif dasar.",
      "Mampu membuat research plan, guide interview, dan laporan insight.",
      "Peka terhadap bias riset dan kualitas sample.",
      "Portofolio riset produk menjadi nilai tambah."
    ],
    about_company: "Ruang Produk adalah studio produk yang membantu startup memvalidasi ide, memperbaiki pengalaman pengguna, dan mengurangi risiko build.",
    tags: ["Research", "Usability", "Synthesis"]
  },
  {
    id: "job_008",
    title: "SEO Content Strategist",
    company: "Growline Media",
    logo: logo("GM", "7C2D12"),
    location: "Bandung",
    type: ["Part-time", "Remote"],
    category: "Marketing",
    salary: { min: 5000000, max: 9000000 },
    posted: "2026-06-06",
    description: makeDescription({
      role: "SEO Content Strategist",
      company: "Growline Media",
      domain: "konten organik",
      product: "program akuisisi traffic dan edukasi pelanggan untuk brand digital",
      focus: "melakukan riset keyword, membuat brief artikel, mengukur ranking, dan memperbaiki struktur konten"
    }),
    requirements: [
      "Pengalaman 2 tahun mengelola strategi SEO atau content marketing.",
      "Paham riset keyword, search intent, internal linking, dan basic technical SEO.",
      "Mampu menulis brief yang mudah dieksekusi writer.",
      "Terbiasa membaca Google Search Console atau alat SEO sejenis."
    ],
    about_company: "Growline Media membantu perusahaan teknologi dan layanan profesional membangun mesin akuisisi organik yang tahan lama.",
    tags: ["SEO", "Content", "Analytics"]
  },
  {
    id: "job_009",
    title: "Accounting Staff",
    company: "Sentra Retailindo",
    logo: logo("SR", "365314"),
    location: "Surabaya",
    type: ["Full-time"],
    category: "Keuangan",
    salary: { min: 5500000, max: 8500000 },
    posted: "2026-06-04",
    description: makeDescription({
      role: "Accounting Staff",
      company: "Sentra Retailindo",
      domain: "akuntansi operasional",
      product: "pencatatan transaksi, rekonsiliasi, dan tutup buku cabang retail",
      focus: "memproses jurnal, mencocokkan transaksi bank, mengarsipkan dokumen, dan mendukung audit internal"
    }),
    requirements: [
      "Min. D3 Akuntansi atau pengalaman setara.",
      "Paham jurnal, rekonsiliasi bank, dan dasar perpajakan.",
      "Teliti dalam pengelolaan dokumen dan deadline bulanan.",
      "Pengalaman software akuntansi menjadi nilai tambah."
    ],
    about_company: "Sentra Retailindo mengelola jaringan toko kebutuhan harian dengan fokus pada efisiensi operasional dan layanan pelanggan yang konsisten.",
    tags: ["Accounting", "Reconciliation", "Tax"]
  },
  {
    id: "job_010",
    title: "Customer Operations Lead",
    company: "SapaCare",
    logo: logo("SC", "0891B2"),
    location: "Remote",
    type: ["Full-time", "Remote"],
    category: "Operasional",
    salary: { min: 10000000, max: 18000000 },
    posted: "2026-06-05",
    description: makeDescription({
      role: "Customer Operations Lead",
      company: "SapaCare",
      domain: "customer operations",
      product: "layanan dukungan pelanggan untuk platform kesehatan digital",
      focus: "mendesain SOP, memonitor SLA, melatih agent, dan memperbaiki proses eskalasi"
    }),
    requirements: [
      "Pengalaman memimpin tim customer support atau operations.",
      "Paham SLA, quality monitoring, knowledge base, dan pelaporan performa.",
      "Mampu coaching anggota tim dengan data dan contoh konkret.",
      "Nyaman menangani isu sensitif dengan empati dan ketelitian."
    ],
    about_company: "SapaCare membangun platform kesehatan digital yang menghubungkan pasien dengan layanan konsultasi, pemesanan, dan tindak lanjut perawatan.",
    tags: ["SLA", "Support", "SOP"]
  },
  {
    id: "job_011",
    title: "Mobile Engineer",
    company: "Lintas Mobilitas",
    logo: logo("LM", "4338CA"),
    location: "Jakarta Selatan",
    type: ["Full-time", "Contract"],
    category: "Teknologi",
    salary: { min: 13000000, max: 24000000 },
    posted: "2026-06-03",
    description: makeDescription({
      role: "Mobile Engineer",
      company: "Lintas Mobilitas",
      domain: "aplikasi mobile",
      product: "fitur perjalanan, pembayaran, dan notifikasi untuk pengguna harian",
      focus: "mengembangkan fitur mobile, mengurangi crash, mempercepat waktu loading, dan menjaga konsistensi UI"
    }),
    requirements: [
      "Pengalaman 2 tahun membangun aplikasi Android, iOS, Flutter, atau React Native.",
      "Paham lifecycle mobile, state management, API integration, dan app store release.",
      "Terbiasa membaca crash report dan analytics.",
      "Mampu bekerja dekat dengan QA dan product designer."
    ],
    about_company: "Lintas Mobilitas membuat produk transportasi dan mobilitas perkotaan yang membantu pengguna merencanakan perjalanan dengan lebih efisien.",
    tags: ["Mobile", "Performance", "Release"]
  },
  {
    id: "job_012",
    title: "Product Designer",
    company: "Studio Akar",
    logo: logo("SA", "0E7490"),
    location: "Yogyakarta",
    type: ["Full-time", "Remote"],
    category: "Produk",
    salary: { min: 9500000, max: 17000000 },
    posted: "2026-06-02",
    description: makeDescription({
      role: "Product Designer",
      company: "Studio Akar",
      domain: "desain produk",
      product: "sistem desain, flow onboarding, dan dashboard analitik untuk klien SaaS",
      focus: "membuat wireframe, prototipe, design system, handoff, dan validasi solusi bersama pengguna"
    }),
    requirements: [
      "Pengalaman 2 tahun mendesain produk digital end-to-end.",
      "Menguasai Figma, prototyping, design system, dan dokumentasi handoff.",
      "Paham prinsip usability, aksesibilitas, dan visual hierarchy.",
      "Portofolio yang menjelaskan proses berpikir menjadi syarat utama."
    ],
    about_company: "Studio Akar adalah studio desain produk yang membantu perusahaan membangun pengalaman digital yang rapi, mudah dipahami, dan siap dikembangkan.",
    tags: ["Figma", "Design System", "Prototype"]
  },
  {
    id: "job_013",
    title: "Brand Marketing Executive",
    company: "Kopi Timur",
    logo: logo("KT", "92400E"),
    location: "Bali",
    type: ["Full-time"],
    category: "Marketing",
    salary: { min: 6500000, max: 11000000 },
    posted: "2026-06-01",
    description: makeDescription({
      role: "Brand Marketing Executive",
      company: "Kopi Timur",
      domain: "brand marketing",
      product: "kampanye brand, event komunitas, dan peluncuran produk minuman",
      focus: "menyusun kalender kampanye, mengelola partner, menjaga tone komunikasi, dan membaca respons pelanggan"
    }),
    requirements: [
      "Pengalaman 1-3 tahun di brand marketing, event, atau community.",
      "Mampu menulis brief kreatif dan mengelola timeline kampanye.",
      "Peka terhadap tren konsumen dan identitas brand.",
      "Bersedia turun ke lokasi event atau outlet jika dibutuhkan."
    ],
    about_company: "Kopi Timur mengembangkan jaringan kedai kopi lokal dengan produk minuman yang mudah diakses dan pengalaman komunitas yang kuat.",
    tags: ["Brand", "Event", "Community"]
  },
  {
    id: "job_014",
    title: "Risk Analyst",
    company: "Dana Amanah",
    logo: logo("DA", "7F1D1D"),
    location: "Bandung",
    type: ["Full-time"],
    category: "Keuangan",
    salary: { min: 10000000, max: 19000000 },
    posted: "2026-05-31",
    description: makeDescription({
      role: "Risk Analyst",
      company: "Dana Amanah",
      domain: "manajemen risiko",
      product: "kebijakan kredit, monitoring portofolio, dan kontrol fraud",
      focus: "menganalisis exposure, membuat dashboard risiko, meninjau aturan approval, dan memberi rekomendasi mitigasi"
    }),
    requirements: [
      "Pengalaman 2 tahun di risk, credit analysis, fraud, atau analytics.",
      "Menguasai spreadsheet, SQL dasar, atau alat analisis data.",
      "Paham konsep probability, loss, exposure, dan kontrol risiko.",
      "Teliti, objektif, dan nyaman berdebat dengan data."
    ],
    about_company: "Dana Amanah menyediakan layanan pembiayaan digital dengan fokus pada keputusan kredit yang bertanggung jawab dan transparan.",
    tags: ["Risk", "SQL", "Credit"]
  },
  {
    id: "job_015",
    title: "Warehouse Planner",
    company: "Gudang Pintar",
    logo: logo("GP", "1F2937"),
    location: "Surabaya",
    type: ["Full-time", "Contract"],
    category: "Operasional",
    salary: { min: 7000000, max: 12000000 },
    posted: "2026-05-30",
    description: makeDescription({
      role: "Warehouse Planner",
      company: "Gudang Pintar",
      domain: "supply chain",
      product: "perencanaan kapasitas gudang, inbound, outbound, dan stok barang",
      focus: "membuat jadwal operasional, memantau inventory, mengurangi bottleneck, dan memperbaiki akurasi picking"
    }),
    requirements: [
      "Pengalaman di warehouse, logistics, supply chain, atau planning.",
      "Mampu membaca data stok, forecast, dan kapasitas tim.",
      "Teliti terhadap SOP, keselamatan kerja, dan kualitas pengiriman.",
      "Bersedia bekerja onsite di area gudang."
    ],
    about_company: "Gudang Pintar menyediakan layanan fulfillment untuk brand dan merchant yang membutuhkan proses gudang cepat, akurat, dan transparan.",
    tags: ["Warehouse", "Inventory", "Planning"]
  },
  {
    id: "job_016",
    title: "Data Analyst",
    company: "Insight Nusantara",
    logo: logo("IN", "0F766E"),
    location: "Remote",
    type: ["Full-time", "Remote"],
    category: "Teknologi",
    salary: { min: 11000000, max: 21000000 },
    posted: "2026-05-29",
    description: makeDescription({
      role: "Data Analyst",
      company: "Insight Nusantara",
      domain: "analytics produk",
      product: "dashboard KPI, segmentasi pengguna, dan laporan eksperimen",
      focus: "menulis query, memvalidasi definisi metrik, membangun visualisasi, dan menjelaskan driver perubahan"
    }),
    requirements: [
      "Pengalaman 2 tahun sebagai data analyst atau business analyst.",
      "Menguasai SQL, spreadsheet, dan visualisasi data.",
      "Paham statistik dasar, funnel, cohort, dan quality check data.",
      "Mampu menyampaikan insight yang mengarah pada keputusan."
    ],
    about_company: "Insight Nusantara membantu perusahaan digital membangun praktik analytics yang akurat, mudah dipahami, dan relevan untuk keputusan bisnis.",
    tags: ["SQL", "Dashboard", "Metrics"]
  },
  {
    id: "job_017",
    title: "Community Manager",
    company: "Belajar Bareng",
    logo: logo("BB", "A21CAF"),
    location: "Yogyakarta",
    type: ["Part-time", "Remote"],
    category: "Marketing",
    salary: { min: 4500000, max: 8000000 },
    posted: "2026-05-28",
    description: makeDescription({
      role: "Community Manager",
      company: "Belajar Bareng",
      domain: "komunitas edukasi",
      product: "program belajar, diskusi online, dan event anggota komunitas",
      focus: "mengelola kalender komunitas, memantik diskusi, menjaga kualitas forum, dan mengukur engagement"
    }),
    requirements: [
      "Pengalaman mengelola komunitas, event, atau social media.",
      "Mampu menulis komunikasi yang hangat, jelas, dan tepat konteks.",
      "Paham metrik engagement dan feedback loop anggota.",
      "Nyaman menjadi moderator diskusi online."
    ],
    about_company: "Belajar Bareng membangun komunitas belajar praktis untuk profesional muda yang ingin meningkatkan skill secara konsisten.",
    tags: ["Community", "Events", "Engagement"]
  },
  {
    id: "job_018",
    title: "Payroll Specialist",
    company: "Talenta Karya",
    logo: logo("TK", "155E75"),
    location: "Jakarta Selatan",
    type: ["Full-time"],
    category: "Keuangan",
    salary: { min: 7500000, max: 13000000 },
    posted: "2026-05-27",
    description: makeDescription({
      role: "Payroll Specialist",
      company: "Talenta Karya",
      domain: "payroll dan benefit",
      product: "perhitungan gaji, pajak, BPJS, dan laporan karyawan bulanan",
      focus: "memproses payroll, memeriksa komponen gaji, menjaga kerahasiaan data, dan menjawab pertanyaan karyawan"
    }),
    requirements: [
      "Pengalaman 2 tahun mengelola payroll atau HR operations.",
      "Paham PPh 21, BPJS, komponen benefit, dan administrasi karyawan.",
      "Sangat teliti dengan angka dan data pribadi.",
      "Mampu bekerja dengan deadline bulanan yang ketat."
    ],
    about_company: "Talenta Karya menyediakan layanan HR operations untuk perusahaan yang ingin proses karyawan berjalan lebih tertib dan transparan.",
    tags: ["Payroll", "PPh21", "HR Ops"]
  },
  {
    id: "job_019",
    title: "QA Engineer",
    company: "Cipta Solusi",
    logo: logo("CS", "1E40AF"),
    location: "Bandung",
    type: ["Contract", "Remote"],
    category: "Teknologi",
    salary: { min: 8500000, max: 15000000 },
    posted: "2026-05-26",
    description: makeDescription({
      role: "QA Engineer",
      company: "Cipta Solusi",
      domain: "quality engineering",
      product: "aplikasi web internal, integrasi API, dan workflow otomatisasi",
      focus: "menulis test case, menjalankan regression test, melaporkan bug, dan membangun automasi prioritas"
    }),
    requirements: [
      "Pengalaman 2 tahun di QA manual atau automation.",
      "Paham test case, exploratory testing, API testing, dan bug reporting.",
      "Pengalaman Playwright, Cypress, Postman, atau alat sejenis menjadi nilai tambah.",
      "Teliti dan mampu berkomunikasi jelas dengan engineer."
    ],
    about_company: "Cipta Solusi membangun aplikasi operasional untuk perusahaan menengah dengan fokus pada kualitas, efisiensi, dan implementasi cepat.",
    tags: ["QA", "Automation", "Regression"]
  },
  {
    id: "job_020",
    title: "People Operations Associate",
    company: "Mitra Talenta",
    logo: logo("MT", "047857"),
    location: "Bali",
    type: ["Full-time"],
    category: "Operasional",
    salary: { min: 6000000, max: 10000000 },
    posted: "2026-05-25",
    description: makeDescription({
      role: "People Operations Associate",
      company: "Mitra Talenta",
      domain: "people operations",
      product: "onboarding, administrasi karyawan, dan program engagement internal",
      focus: "mengelola dokumen, mendukung proses rekrutmen, menjalankan onboarding, dan membantu survei kepuasan karyawan"
    }),
    requirements: [
      "Pengalaman 1 tahun di HR, recruitment, administration, atau operations.",
      "Rapi dalam dokumentasi dan komunikasi dengan banyak stakeholder.",
      "Paham dasar administrasi karyawan dan employee lifecycle.",
      "Mampu menjaga kerahasiaan dan menyelesaikan pekerjaan dengan teliti."
    ],
    about_company: "Mitra Talenta membantu perusahaan hospitality dan layanan membangun sistem people operations yang rapi, manusiawi, dan mudah dipantau.",
    tags: ["HR", "Onboarding", "Administration"]
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

export function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max && !salary.label)) return "Gaji belum tersedia";

  const normalized = formatNormalizedSalary(salary);
  if (normalized) return normalized;
  if (salary?.label) return salary.label;

  const format = (value) => `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1
  }).format(value / 1000000)}jt`;
  return `${format(salary.min)} - ${format(salary.max)} / bulan`;
}

export function formatPostedDate(posted) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = new Date(`${posted}T00:00:00`);
  const diff = Math.max(0, Math.round((todayStart - date) / MS_PER_DAY));

  if (diff === 0) return "Hari ini";
  if (diff === 1) return "1 hari lalu";
  if (diff < 30) return `${diff} hari lalu`;

  const months = Math.floor(diff / 30);
  if (months < 12) return `${months} bulan lalu`;

  const years = Math.floor(months / 12);
  return `${years} tahun lalu`;
}

export function formatDateLong(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatMillion(value) {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: value >= 100000000 ? 0 : 1
  }).format(value / 1000000);
  return `Rp ${formatted}jt`;
}

function parseUsdSalaryLabel(label = "") {
  const text = String(label || "");
  if (!text || !/\$|usd/i.test(text)) return null;

  const numbers = [...text.matchAll(/(?:\$|usd\s*)\s*([0-9]+(?:[.,][0-9]+)?)\s*(k)?/gi)]
    .map((match) => {
      const raw = Number(String(match[1]).replace(",", "."));
      if (!Number.isFinite(raw) || raw <= 0) return 0;
      return match[2] ? raw * 1000 : raw;
    })
    .filter(Boolean);

  if (!numbers.length) return null;

  const period = /hour|jam/i.test(text)
    ? "hourly"
    : /month|bulan/i.test(text)
      ? "monthly"
      : "yearly";
  const toMonthlyIdr = (value) => {
    if (period === "hourly") return value * MONTHLY_WORK_HOURS * USD_TO_IDR;
    if (period === "monthly") return value * USD_TO_IDR;
    return (value * USD_TO_IDR) / 12;
  };
  const min = toMonthlyIdr(numbers[0]);
  const max = toMonthlyIdr(numbers[1] || numbers[0]);

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    original: text
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
        original: salary.label || ""
      };
    }
  }
  return parseUsdSalaryLabel(salary.label);
}

export function salaryAverage(job) {
  const estimate = getSalaryEstimate(job.salary);
  if (!estimate) return 0;
  return ((estimate.min || 0) + (estimate.max || 0)) / 2;
}

export function formatSalaryOriginal(salary) {
  const estimate = getSalaryEstimate(salary);
  if (!estimate?.original) return "";
  if (salary?.label && estimate.original !== salary.label) return salary.label;
  if (salary?.label && /rp\s|\$|usd/i.test(salary.label)) return salary.label;
  return "";
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
