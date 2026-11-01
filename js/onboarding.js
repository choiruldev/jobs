/**
 * Interactive Onboarding Walkthrough for JobSearch Beta
 * Guides first-time users through the core privacy-first features:
 * 1. Verified Search & Filters
 * 2. Local-First Application Tracker & Kanban
 * 3. Career Tools (ATS Resume Builder, STAR Interview, Salary Calculator)
 */

const STORAGE_KEY = "jobsearch_onboarding_seen_v1";

const SLIDES = [
  {
    icon: "travel_explore",
    badge: "1 / 3: Pencarian Pintar",
    title: "Cari Lowongan Remote & Lokal Indonesia",
    description: "Temukan ratusan lowongan kerja resmi dan terverifikasi dari LinkedIn, Jobstreet, Glints, dan Kalibrr. Filter berdasarkan tipe remote, gaji IDR, atau kota dengan pencarian instan.",
    actionText: "Lanjut ke Tracker →"
  },
  {
    icon: "view_kanban",
    badge: "2 / 3: Privasi Zero-Login",
    title: "Tracker Lamaran & Papan Kanban Pribadi",
    description: "Lacak perjalanan lamaran Anda mulai dari Dikirim, Interview, hingga Penawaran Kerja. Tanpa akun, tanpa email — seluruh data tersimpan 100% aman di perangkat Anda secara offline.",
    actionText: "Lanjut ke Tools Karir →"
  },
  {
    icon: "auto_awesome",
    badge: "3 / 3: Akselerasi Karir",
    title: "ATS Resume Builder & Simulasi Interview",
    description: "Buat CV standar ATS 1 halaman yang siap diekspor ke PDF, latihan tanya-jawab metode STAR dengan perekam suara, dan hitung estimasi gaji bersih dengan Kalkulator Pajak PPh 21.",
    actionText: "Mulai Jelajahi JobSearch 🚀"
  }
];

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch (err) {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch (err) {}
}

export function openOnboardingModal(force = false) {
  if (typeof document === "undefined") return;
  if (!force && hasSeenOnboarding()) return;
  if (document.getElementById("onboarding-modal-root")) return;

  let currentSlide = 0;

  const overlay = document.createElement("div");
  overlay.id = "onboarding-modal-root";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10005;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.25s ease;
  `;

  overlay.innerHTML = `
    <div style="background: var(--md-sys-color-surface, #ffffff); color: var(--md-sys-color-on-surface, #111); width: 100%; max-width: 480px; border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--md-sys-color-outline-variant, #e0e2ec);">
      <div style="padding: 28px 28px 16px; text-align: center; display: flex; flex-direction: column; align-items: center;">
        <div id="onboarding-icon-box" style="width: 72px; height: 72px; border-radius: 50%; background: #e0f2f1; color: #006a6a; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span class="material-symbols-outlined" style="font-size: 38px;" id="onboarding-icon">travel_explore</span>
        </div>
        <span id="onboarding-badge" style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; background: #e0f2f1; color: #006a6a; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">1 / 3: Pencarian Pintar</span>
        <h2 id="onboarding-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 800; line-height: 1.3;">Cari Lowongan Remote & Lokal Indonesia</h2>
        <p id="onboarding-desc" style="margin: 0; font-size: 13.5px; color: var(--md-sys-color-outline, #555); line-height: 1.6;">Temukan ratusan lowongan kerja resmi dan terverifikasi dari LinkedIn, Jobstreet, Glints, dan Kalibrr. Filter berdasarkan tipe remote, gaji IDR, atau kota dengan pencarian instan.</p>
      </div>

      <!-- Slide dots -->
      <div style="display: flex; justify-content: center; gap: 8px; margin: 12px 0 20px;" id="onboarding-dots">
        <span class="onboarding-dot" style="width: 24px; height: 8px; border-radius: 4px; background: #006a6a; transition: all 0.2s ease;"></span>
        <span class="onboarding-dot" style="width: 8px; height: 8px; border-radius: 4px; background: #ccc; transition: all 0.2s ease;"></span>
        <span class="onboarding-dot" style="width: 8px; height: 8px; border-radius: 4px; background: #ccc; transition: all 0.2s ease;"></span>
      </div>

      <!-- Actions -->
      <div style="padding: 16px 28px 24px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--md-sys-color-outline-variant, #eee);">
        <button type="button" id="onboarding-skip-btn" style="background: transparent; border: none; color: var(--md-sys-color-outline, #666); font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px 12px;">Lewati</button>
        <button type="button" id="onboarding-next-btn" class="button button--primary" style="padding: 10px 22px; font-size: 13px; font-weight: 700;">
          <span id="onboarding-action-text">Lanjut ke Tracker →</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const iconEl = overlay.querySelector("#onboarding-icon");
  const badgeEl = overlay.querySelector("#onboarding-badge");
  const titleEl = overlay.querySelector("#onboarding-title");
  const descEl = overlay.querySelector("#onboarding-desc");
  const actionTextEl = overlay.querySelector("#onboarding-action-text");
  const nextBtn = overlay.querySelector("#onboarding-next-btn");
  const skipBtn = overlay.querySelector("#onboarding-skip-btn");
  const dots = overlay.querySelectorAll(".onboarding-dot");

  const closeTour = () => {
    markOnboardingSeen();
    overlay.remove();
  };

  const updateSlide = () => {
    const slide = SLIDES[currentSlide];
    iconEl.textContent = slide.icon;
    badgeEl.textContent = slide.badge;
    titleEl.textContent = slide.title;
    descEl.textContent = slide.description;
    actionTextEl.textContent = slide.actionText;

    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.style.width = "24px";
        dot.style.background = "#006a6a";
      } else {
        dot.style.width = "8px";
        dot.style.background = "#ccc";
      }
    });
  };

  nextBtn.addEventListener("click", () => {
    if (currentSlide < SLIDES.length - 1) {
      currentSlide++;
      updateSlide();
    } else {
      closeTour();
    }
  });

  skipBtn.addEventListener("click", closeTour);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeTour();
  });

  const handleKey = (e) => {
    if (e.key === "Escape") {
      window.removeEventListener("keydown", handleKey);
      closeTour();
    }
  };
  window.addEventListener("keydown", handleKey);
}

// Auto prompt on index.html if user hasn't seen it
if (typeof document !== "undefined") {
  window.addEventListener("load", () => {
    const isHome = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
    if (isHome && !hasSeenOnboarding()) {
      setTimeout(() => openOnboardingModal(false), 800);
    }
  });
}
