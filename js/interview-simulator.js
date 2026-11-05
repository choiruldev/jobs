/**
 * Role-Specific Interview Q&A Simulator (STAR Method)
 * Provides targeted behavioral and technical interview questions with STAR methodology structuring.
 */

import { escapeHtml } from "./bookmark.js?v=20261106a";
import { createVoicePracticeWidget } from "./interview-voice.js?v=20261106a";

export const INTERVIEW_QUESTIONS = [
  {
    id: "star-1",
    role: "Umum & Remote",
    question: "Ceritakan situasi saat Anda harus menyelesaikan pekerjaan mendesak tanpa pengawasan langsung dalam tim remote.",
    starGuide: {
      situation: "Jelaskan proyek, perbedaan zona waktu, dan deadline ketat yang sedang berjalan.",
      task: "Tanggung jawab spesifik apa yang harus Anda selesaikan secara mandiri?",
      action: "Bagaimana Anda memprioritaskan tugas, berkomunikasi asinkronus via Slack/Notion/Loom, dan mengambil keputusan cepat?",
      result: "Proyek selesai tepat waktu, minim miskomunikasi, dan deliverables berfungsi sesuai ekspektasi stakeholder."
    }
  },
  {
    id: "star-2",
    role: "Teknikal & Engineering",
    question: "Ceritakan insiden bug kritis atau performa lambat di production yang pernah Anda tangani.",
    starGuide: {
      situation: "Sebutkan sistem yang terkena dampak dan gejalanya (misal: API latency naik 400%, database connection pool habis).",
      task: "Peran Anda dalam tim on-call atau penanganan incident response tanggap darurat.",
      action: "Langkah isolasi masalah: analisis log/APM, mitigasi rollback, penulisan hotfix terisolasi, dan smoke testing.",
      result: "Sistem pulih dalam X menit, serta pembuatan post-mortem dan automated testing baru untuk mencegah insiden berulang."
    }
  },
  {
    id: "star-3",
    role: "Komunikasi & Kolaborasi",
    question: "Bagaimana Anda menangani perbedaan pendapat teknis dengan rekan kerja atau lead engineer?",
    starGuide: {
      situation: "Konflik pilihan arsitektur database, trade-off arsitektur microservices vs monolith, atau prioritas fitur.",
      task: "Menjembatani perbedaan demi kepentingan terbaik reliabilitas produk dan kecepatan delivery tim.",
      action: "Mendengarkan sudut pandang rekan secara objektif, menyusun POC benchmark, dan mendiskusikan trade-off berbasis data.",
      result: "Kesepakatan tercapai tanpa gesekan personal, tim satu visi, dan milestone berhasil dirilis sesuai jadwal."
    }
  },
  {
    id: "star-4",
    role: "Umum & Remote",
    question: "Bagaimana Anda mengatur batasan kerja (work-life boundary) dan mencegah burnout saat bekerja dari rumah (WFH)?",
    starGuide: {
      situation: "Tuntutan fleksibilitas kerja remote global yang melintasi zona waktu berbeda.",
      task: "Menjaga produktivitas tinggi harian tanpa mengorbankan kesehatan fisik dan mental.",
      action: "Menetapkan jam kerja fokus (deep work), mematikan notifikasi Slack setelah jam kerja, dan transparan pada status kalender tim.",
      result: "Konsistensi performa kerja stabil di kuartal berikutnya, SLA tugas tercapai 100%, dan tingkat kepuasan kerja meningkat."
    }
  },
  {
    id: "star-5",
    role: "Teknikal & Engineering",
    question: "Ceritakan keputusan teknis atau refactoring besar yang pernah Anda inisiasi untuk mengurangi technical debt.",
    starGuide: {
      situation: "Kode legacy yang lambat, sulit di-maintain, atau test coverage rendah yang memperlambat sprint rilis.",
      task: "Mengusulkan rencana refactoring bertahap kepada Product Manager tanpa menghentikan pengembangan fitur bisnis baru.",
      action: "Menerapkan pendekatan strangler pattern, menulis end-to-end regression test, dan memecah modul secara modular per sprint.",
      result: "Kecepatan deployment tim meningkat 30%, bug regresi menurun drastis, dan onboarding developer baru jadi jauh lebih cepat."
    }
  },
  {
    id: "star-6",
    role: "Negosiasi & Karir",
    question: "Bagaimana Anda menyampaikan ekspektasi kompensasi dan benefit saat tawaran kerja diberikan oleh rekruter luar negeri?",
    starGuide: {
      situation: "Menerima offering letter dengan struktur kompensasi berbasis USD/EUR dan opsi kontrak remote.",
      task: "Menegosiasikan rate yang sesuai dengan standar pasar internasional dan memperhitungkan kewajiban pajak/alat kerja lokal.",
      action: "Melakukan riset benchmark pasar (Levels.fyi, RemoteOK), mengomunikasikan value proposition unik, dan meminta tunjangan alat kerja/kesehatan.",
      result: "Rekruter menyetujui penyesuaian penawaran dengan kenaikan 15-20% atau paket equipment stipend tambahan."
    }
  }
];

let activeCategory = "all";

export function renderInterviewSimulator(container) {
  const categories = [
    { key: "all", label: "Semua Pertanyaan" },
    { key: "Umum & Remote", label: "🏠 Remote & Budaya" },
    { key: "Teknikal & Engineering", label: "💻 Teknikal & Coding" },
    { key: "Komunikasi & Kolaborasi", label: "🤝 Kolaborasi Tim" },
    { key: "Negosiasi & Karir", label: "💼 Negosiasi Gaji" }
  ];

  const filtered = activeCategory === "all"
    ? INTERVIEW_QUESTIONS
    : INTERVIEW_QUESTIONS.filter(q => q.role === activeCategory);

  container.innerHTML = `
    <div class="stack" style="gap:var(--space-4);">
      <div class="interview-tabs-bar" role="tablist" aria-label="Kategori Pertanyaan">
        ${categories.map(c => `
          <button
            type="button"
            class="interview-tab-btn ${activeCategory === c.key ? "is-active" : ""}"
            data-interview-filter="${c.key}"
            role="tab"
            aria-selected="${activeCategory === c.key}"
          >${escapeHtml(c.label)}</button>
        `).join("")}
      </div>

      <div class="stack" style="gap:var(--space-4);">
        ${filtered.map((q, idx) => `
          <article class="content-block" style="border:1px solid var(--md-sys-color-outline-variant);border-radius:16px;padding:24px;">
            <div class="cluster" style="margin-bottom:10px;justify-content:space-between;align-items:center;">
              <div class="cluster" style="gap:8px;">
                <span class="chip chip--outline chip--small" style="font-size:12px;">${escapeHtml(q.role)}</span>
                <span class="label-medium" style="color:var(--md-sys-color-primary);font-weight:700;">Kasus #${idx + 1}</span>
              </div>
              <span class="label-small" id="status-${q.id}" style="color:var(--md-sys-color-outline);font-size:12px;">Auto-tersimpan</span>
            </div>

            <h2 class="title-large" style="margin:0 0 16px;font-size:19px;line-height:1.4;">${escapeHtml(q.question)}</h2>

            <div class="ats-scorecard" style="background:var(--md-sys-color-surface-container-low);margin:0 0 16px;border-radius:12px;">
              <h3 class="title-medium" style="margin:0 0 10px;color:var(--md-sys-color-primary);font-size:15px;font-weight:700;">Panduan Jawaban Metode STAR:</h3>
              <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;" class="body-medium">
                <li><strong>S (Situation):</strong> ${escapeHtml(q.starGuide.situation)}</li>
                <li><strong>T (Task):</strong> ${escapeHtml(q.starGuide.task)}</li>
                <li><strong>A (Action):</strong> ${escapeHtml(q.starGuide.action)}</li>
                <li><strong>R (Result):</strong> ${escapeHtml(q.starGuide.result)}</li>
              </ul>
            </div>

            <div class="field">
              <label class="field__label" style="font-weight:600;margin-bottom:6px;">Draf Catatan Jawaban Anda (Pribadi & Auto-save):</label>
              <textarea
                class="field__input"
                data-practice-id="${q.id}"
                rows="4"
                placeholder="Tuliskan poin-poin cerita nyata Anda (Situation, Task, Action, Result)..."
                style="resize:vertical;font-family:inherit;font-size:14px;line-height:1.5;"
              ></textarea>
            </div>

            <div id="voice-widget-${q.id}"></div>
          </article>
        `).join("")}
      </div>
    </div>
  `;

  // Mount voice practice widgets
  filtered.forEach(q => {
    const vContainer = container.querySelector(`#voice-widget-${q.id}`);
    if (vContainer) createVoicePracticeWidget(vContainer, q.id);
  });

  // Attach filter listeners
  container.querySelectorAll("[data-interview-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-interview-filter");
      renderInterviewSimulator(container);
    });
  });

  // Restore saved drafts and bind auto-save
  container.querySelectorAll("textarea[data-practice-id]").forEach((textarea) => {
    const id = textarea.getAttribute("data-practice-id");
    const statusEl = document.getElementById(`status-${id}`);
    const saved = localStorage.getItem(`jsa_interview_note_${id}`);
    if (saved) {
      textarea.value = saved;
      if (statusEl) statusEl.textContent = "Tersimpan di lokal";
    }

    textarea.addEventListener("input", (e) => {
      localStorage.setItem(`jsa_interview_note_${id}`, e.target.value);
      if (statusEl) {
        statusEl.textContent = "Menyimpan...";
        clearTimeout(textarea._saveTimer);
        textarea._saveTimer = setTimeout(() => {
          statusEl.textContent = "Tersimpan di lokal ✓";
        }, 500);
      }
    });
  });
}
