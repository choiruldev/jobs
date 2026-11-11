# Antigravity Workspace Design & Architecture Rules (ZERO_SIDEBAR_LOCK)

> **CRITICAL ARCHITECTURAL CONTRACT**:
> Every code change, feature addition, or refactoring in this repository MUST unconditionally enforce the **ZERO-SIDEBAR** modern web application architecture (Linear & Airbnb standard).
> **NEVER ADD OR RESTORE ANY SIDEBAR** (neither vertical page-navigation sidebars nor 290px left filter sidebars). All sidebars are strictly prohibited.

---

## 1. Core Layout Architecture

### A. Desktop Viewport (>= 960px) - Zero Sidebar
- **Top Navigation Bar (Header Navbar)**:
  - Primary navigation lives entirely on the top bar: Brand Logo on the left, horizontal navigation pills in the center (`Cari Lowongan`, `Tracker Lamaran`, `Resume ATS`, `Kalkulator Gaji`, and `Semua Fitur ▾` dropdown popover), and Theme Toggle + Masuk/PRO button on the right.
  - **NO vertical page-navigation sidebar** (`.side-nav { display: none !important; }`). The content area has full-width breathing room (`max-width: 1200px; margin: 0 auto;`).
- **Search Page (Single Centered Feed, ~1040px max-width)**:
  - **NO 290px left filter sidebar**.
  - **Top Search Controls**:
    - Booster banner (compact tips card).
    - Omni-Search Bar.
    - **Quick Horizontal Filter Bar**: Wilayah dropdown (`[📍 Indonesia & Lokal ▾]`), Mode Kerja choice pills (`[Remote]`, `[Hybrid]`, `[On-site]`), Filter Lengkap button (`[tune] Filter Lengkap (N)`), and Sort dropdown (`[⇅ Urut: Relevan ▾]`).
    - Quick sub-navigation tabs (`Semua Loker`, `Loker Baru`, `Disimpan`).
  - **Universal Filter Modal / Dialog (`#search-filter-sidebar`)**:
    - Advanced filters (official portals, category specializations, salary range, reset/apply buttons) live in a clean centered pop-up dialog on desktop and bottom sheet on mobile.
    - Triggered on demand via `[tune] Filter Lengkap`.
  - **Job Cards Feed (`#job-grid`)**: Single full-width centered stream of spacious, readable job cards.

### B. Mobile Viewport (< 960px)
- **Full Width Content**: All job cards, tools, and forms span 100% width with zero horizontal clipping or page overflow.
- **Top App Bar**: Clean, compact header showing Logo, Auth status, and Theme toggle. No hamburger icon.
- **Mobile Filter Bottom Sheet**:
  - Tapping `[tune] Filter Loker` opens a smooth Bottom Sheet modal from the bottom of the screen.
  - Users toggle filters easily with their thumbs, and click "Terapkan Filter" to close and apply.
- **Bottom Navigation Bar**: Remains active at the bottom of the viewport for primary tabs (`Cari`, `Tracker`, `Resume`, `Simpan`, `Semua Fitur`).
- **Floating Buttons**: Floating widgets (such as `#beta-feedback-btn`) MUST hover above the bottom nav (`bottom: calc(var(--bottom-nav-height) + 14px) !important;`) and never block navigation tabs.

---

## 2. Visual Design & Aesthetics

- **Color Palette (60-30-10 Rule)**:
  - 60% Dominant: Clean surface white (`#FFFFFF`) / Dark surface (`#0f172a`).
  - 30% Neutral: Soft off-white cards (`#f8fafc`, `#f1f5f9`), subtle outlines `rgba(0,0,0,0.08)`.
  - 10% Accents:
    - Warm Amber/Yellow (`#F59E0B` / `#FEF3C7` / `#FCD34D`) for active highlight pills & booster banners.
    - Cybermint / Emerald (`#00C16E` / `#10B981`) for verified links, salaries, trust signals, and primary CTAs.
- **Cards & Geometry**:
  - Rounded corners: `border-radius: 18px` to `22px`.
  - Subtle borders: `1px solid var(--md-sys-color-outline-variant)`.
  - Smooth hover elevation: `transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.06);`.
  - **NO harsh rectangular cards, NO black borders, and NO dull cement-gray buttons**.
- **Anti-Squish Rules**:
  - Every chip, badge, pill, and action button inside flex containers or horizontal rows MUST have:
    ```css
    flex-shrink: 0 !important;
    white-space: nowrap !important;
    ```
  - Global `button` must NEVER have `min-width: 0;`.

---

## 3. Preservation & Verification Contract

Before claiming any task complete:
1. Run `npm test && npm run build` to ensure 100% test integrity.
2. Verify both desktop (1280px+) and mobile (375px–412px) layouts.
3. Ensure no text is clipped, no cards overflow, and git branches (`main`, `free-public`, `pro-vip`) stay synchronized.
