/**
 * In-App Beta Feedback & Bug Reporter Widget
 * Allows beta testers to report bugs, suggest features, and rate platform experience.
 * Data is stored in IndexedDB (zero-login privacy) with optional webhook and clipboard export.
 */

const DB_NAME = "JobSearchFeedbackDB";
const STORE_NAME = "feedbacks";
const DB_VERSION = 1;

function openFeedbackDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFeedbackLocally(feedbackData) {
  try {
    const db = await openFeedbackDB();
    if (!db) {
      // Fallback to localStorage
      const existing = JSON.parse(localStorage.getItem("jobsearch_feedbacks") || "[]");
      existing.push({ ...feedbackData, id: Date.now() });
      localStorage.setItem("jobsearch_feedbacks", JSON.stringify(existing));
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(feedbackData);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[BetaFeedback] Gagal menyimpan ke DB:", err);
    return false;
  }
}

export async function getAllFeedbacks() {
  try {
    const db = await openFeedbackDB();
    if (!db) {
      return JSON.parse(localStorage.getItem("jobsearch_feedbacks") || "[]");
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export function initBetaFeedbackWidget() {
  if (typeof document === "undefined" || document.getElementById("beta-feedback-btn")) return;

  // 1. Create Floating Button
  const btn = document.createElement("button");
  btn.id = "beta-feedback-btn";
  btn.setAttribute("aria-label", "Beri masukan beta testing");
  btn.title = "Beri Masukan / Laporkan Bug Beta";
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 998;
    background: #006a6a;
    color: #ffffff;
    border: none;
    border-radius: 28px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(0, 106, 106, 0.35);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  `;

  btn.innerHTML = `
    <span class="material-symbols-outlined" style="font-size: 18px;">bug_report</span>
    <span>Masukan Beta</span>
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "translateY(-2px)";
    btn.style.boxShadow = "0 6px 20px rgba(0, 106, 106, 0.45)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translateY(0)";
    btn.style.boxShadow = "0 4px 16px rgba(0, 106, 106, 0.35)";
  });

  btn.addEventListener("click", () => openFeedbackModal());

  document.body.appendChild(btn);
}

function openFeedbackModal() {
  if (document.getElementById("beta-feedback-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "beta-feedback-modal";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column;">
      <div style="background: #006a6a; color: #ffffff; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="material-symbols-outlined" style="font-size: 24px;">rate_review</span>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Masukan Beta Tester</h3>
            <p style="margin: 0; font-size: 11px; opacity: 0.85;">Bantu kami menyempurnakan JobSearch sebelum rilis publik</p>
          </div>
        </div>
        <button id="close-feedback-modal" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 4px; display: flex;" aria-label="Tutup">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="feedback-form" style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #1a1c1e; margin-bottom: 6px;">Kategori Masukan</label>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; padding: 8px; border: 1px solid #c4c7c5; border-radius: 8px;">
              <input type="radio" name="feedback_type" value="bug" checked>
              <span>🐛 Laporkan Bug</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; padding: 8px; border: 1px solid #c4c7c5; border-radius: 8px;">
              <input type="radio" name="feedback_type" value="feature">
              <span>💡 Usul Fitur Baru</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; padding: 8px; border: 1px solid #c4c7c5; border-radius: 8px;">
              <input type="radio" name="feedback_type" value="job_data">
              <span>📋 Loker Kadaluwarsa</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; padding: 8px; border: 1px solid #c4c7c5; border-radius: 8px;">
              <input type="radio" name="feedback_type" value="ui_ux">
              <span>✨ Kenyamanan UI/UX</span>
            </label>
          </div>
        </div>

        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #1a1c1e; margin-bottom: 6px;">Kepuasan Pengalaman</label>
          <div style="display: flex; justify-content: space-between; font-size: 24px; padding: 4px 8px; background: #f2f4f7; border-radius: 10px;" id="rating-emojis">
            <label style="cursor: pointer;"><input type="radio" name="rating" value="1" style="display:none;"> <span>😡</span></label>
            <label style="cursor: pointer;"><input type="radio" name="rating" value="2" style="display:none;"> <span>🙁</span></label>
            <label style="cursor: pointer;"><input type="radio" name="rating" value="3" style="display:none;"> <span>😐</span></label>
            <label style="cursor: pointer;"><input type="radio" name="rating" value="4" style="display:none;" checked> <span style="transform:scale(1.2); display:inline-block;">🙂</span></label>
            <label style="cursor: pointer;"><input type="radio" name="rating" value="5" style="display:none;"> <span>🤩</span></label>
          </div>
        </div>

        <div>
          <label for="feedback-detail" style="display: block; font-size: 12px; font-weight: 700; color: #1a1c1e; margin-bottom: 6px;">Deskripsi / Ceritakan Masalah</label>
          <textarea id="feedback-detail" rows="4" placeholder="Jelaskan apa yang terjadi, apa yang Anda harapkan, atau ide perbaikan..." style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #c4c7c5; font-size: 13px; font-family: inherit; resize: vertical;" required></textarea>
        </div>

        <div>
          <label for="feedback-contact" style="display: block; font-size: 12px; font-weight: 700; color: #1a1c1e; margin-bottom: 6px;">Kontak Anda (Opsional, jika ingin dihubungi kembali)</label>
          <input type="text" id="feedback-contact" placeholder="Email / Username Telegram / X" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 8px; border: 1px solid #c4c7c5; font-size: 13px;">
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
          <button type="button" id="cancel-feedback-btn" class="button button--secondary" style="font-size: 13px; padding: 8px 16px;">Batal</button>
          <button type="submit" class="button button--primary" style="font-size: 13px; padding: 8px 20px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
            <span>Kirim Masukan</span>
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Rating emoji visual highlight
  const emojiLabels = overlay.querySelectorAll("#rating-emojis label");
  emojiLabels.forEach((lbl) => {
    lbl.addEventListener("click", () => {
      emojiLabels.forEach(l => {
        const span = l.querySelector("span");
        if (span) span.style.transform = "scale(1)";
      });
      const currentSpan = lbl.querySelector("span");
      if (currentSpan) currentSpan.style.transform = "scale(1.25)";
    });
  });

  const handleKeydown = (e) => {
    if (e.key === "Escape") closeModal();
  };
  window.addEventListener("keydown", handleKeydown);

  const closeModal = () => {
    window.removeEventListener("keydown", handleKeydown);
    overlay.remove();
  };

  overlay.querySelector("#close-feedback-modal").addEventListener("click", closeModal);
  overlay.querySelector("#cancel-feedback-btn").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Handle Form Submit
  const form = overlay.querySelector("#feedback-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedType = form.querySelector("input[name='feedback_type']:checked")?.value || "general";
    const selectedRating = form.querySelector("input[name='rating']:checked")?.value || "4";
    const detail = form.querySelector("#feedback-detail")?.value?.trim() || "";
    const contact = form.querySelector("#feedback-contact")?.value?.trim() || "";

    if (!detail) return;

    const payload = {
      type: selectedType,
      rating: parseInt(selectedRating, 10),
      detail: detail,
      contact: contact,
      url: window.location.href,
      pathname: window.location.pathname,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    };

    await saveFeedbackLocally(payload);

    closeModal();
    showToastFeedbackSuccess(payload);
  });
}

function showToastFeedbackSuccess(feedback) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #0f5223;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 30px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10001;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 600;
  `;

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="font-size: 20px;">check_circle</span>
    <span>Terima kasih! Masukan Anda tersimpan secara lokal.</span>
    <button id="copy-feedback-btn" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; font-weight:700;">Salin Teks</button>
  `;

  document.body.appendChild(toast);

  toast.querySelector("#copy-feedback-btn")?.addEventListener("click", () => {
    const summary = `[JobSearch Beta Feedback]\nKategori: ${feedback.type}\nRating: ${feedback.rating}/5\nPesan: ${feedback.detail}\nHalaman: ${feedback.pathname}\nTanggal: ${feedback.timestamp}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      toast.querySelector("#copy-feedback-btn").innerText = "Tersalin! ✓";
    }
  });

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}

// Auto initialize on DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBetaFeedbackWidget);
  } else {
    initBetaFeedbackWidget();
  }
}
