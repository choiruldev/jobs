/**
 * Viral Job Sharing Engine
 * Supports Native Web Share API, WhatsApp, LinkedIn, Telegram, and 1-Click Clipboard.
 */

import { showToast } from "./bookmark.js?v=20260616z";

/**
 * Format payload teks share untuk media sosial
 */
export function formatSharePayload(job) {
  const title = job.title || "Lowongan Menarik";
  const company = job.company || "Perusahaan";
  const location = job.location || "Remote";
  const baseUrl = window.location.origin;
  const jobUrl = `${baseUrl}/pages/detail.html?id=${encodeURIComponent(job.id)}`;

  const text = `🔥 Info Loker: *${title}* di *${company}*
📍 Wilayah: ${location}
💼 Detail & Apply langsung di JobSearch:
${jobUrl}`;

  return {
    title: `${title} - ${company} | JobSearch`,
    text,
    url: jobUrl
  };
}

/**
 * Trigger aksi share (Native Web Share dengan Fallback Modal / Clipboard)
 */
export async function shareJob(job) {
  const payload = formatSharePayload(job);

  if (navigator.share) {
    try {
      await navigator.share(payload);
      showToast("Berhasil dibagikan!", "success");
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // User batalkan dialog native
    }
  }

  // Fallback: Tampilkan Share Sheet Modal Kustom
  openShareModal(job, payload);
}

/**
 * Buka modal opsi share untuk browser desktop / perangkat tanpa Web Share API
 */
export function openShareModal(job, payload) {
  let modal = document.getElementById("job-share-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "job-share-modal";
    modal.className = "dialog-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
  }

  const encodedText = encodeURIComponent(payload.text);
  const encodedUrl = encodeURIComponent(payload.url);

  modal.innerHTML = `
    <div class="dialog" style="max-width:440px;width:90%;">
      <div class="dialog__header" style="display:flex;justify-content:space-between;align-items:center;">
        <h2 class="dialog__title" style="margin:0;font-size:1.15rem;">Bagikan Lowongan</h2>
        <button type="button" class="icon-button" id="btn-close-share" aria-label="Tutup dialog">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>
      <div class="dialog__content stack" style="gap:16px;padding:16px 0;">
        <p class="body-medium" style="margin:0;color:var(--md-sys-color-on-surface-variant);">
          Bagikan info lowongan <strong>${job.title}</strong> di <strong>${job.company}</strong> ke rekan pencari kerja:
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <a class="button button--tonal" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;background:#e8f5e9;color:#1b5e20;" href="https://api.whatsapp.com/send?text=${encodedText}" target="_blank" rel="noopener noreferrer">
            <span>💬 WhatsApp</span>
          </a>
          <a class="button button--tonal" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;background:#e3f2fd;color:#0d47a1;" href="https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(job.title + ' - ' + job.company)}" target="_blank" rel="noopener noreferrer">
            <span>✈️ Telegram</span>
          </a>
          <a class="button button--tonal" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;background:#e8eaf6;color:#1a237e;" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <span>💼 LinkedIn</span>
          </a>
          <a class="button button--tonal" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;background:#fce4ec;color:#880e4f;" href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Info loker remote ' + job.title + ' di ' + job.company)}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
            <span>🐦 X / Twitter</span>
          </a>
        </div>

        <div style="margin-top:8px;">
          <label class="field-label" style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Salin Tautan Langsung:</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="share-copy-input" class="text-input" value="${payload.url}" readonly style="flex:1;font-size:13px;padding:8px 12px;background:var(--md-sys-color-surface-container);">
            <button type="button" class="button button--primary" id="btn-copy-share-url" style="white-space:nowrap;">
              <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>
              <span>Salin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("dialog-backdrop--visible");

  modal.querySelector("#btn-close-share")?.addEventListener("click", () => {
    modal.classList.remove("dialog-backdrop--visible");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("dialog-backdrop--visible");
  });

  modal.querySelector("#btn-copy-share-url")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(payload.url);
      showToast("Tautan lowongan berhasil disalin ke clipboard!", "success");
      modal.classList.remove("dialog-backdrop--visible");
    } catch {
      showToast("Gagal menyalin tautan", "error");
    }
  });
}
