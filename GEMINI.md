# Antigravity Workspace Design & Architecture Rules (DESIGN_LOCK)

> **CRITICAL ARCHITECTURAL CONTRACT**:
> Every code change, feature addition, or refactoring in this repository MUST unconditionally preserve the modern **Welcome to the Jungle (WTTJ) & Linear** design system established for this platform. NEVER revert to stacked top-filters, rectangular gray buttons, or a 272px push-sidebar on desktop.

---

## 1. Core Layout Architecture

### A. Desktop Viewport (>= 992px)
- **Top Navigation Bar (Header Navbar)**:
  - Primary navigation lives entirely on the top bar: Brand Logo on the left, horizontal navigation pills in the center (`Cari Lowongan`, `Tracker Lamaran`, `Resume ATS`, `Kalkulator Gaji`, `Semua Fitur ▾`), and Theme Toggle + Masuk/PRO button on the right.
  - **NO 272px vertical page-navigation sidebar** on desktop. The content area has full-width breathing room (`max-width: 1320px; margin: 0 auto;`).
- **Search Page 2-Column Split (Welcome to the Jungle Style)**:
  - **Left Column (`.search-filter-sidebar`, width: ~300px)**: Dedicated Sticky Filter Card containing accordions for Lokasi, Mode Kerja (Remote/Hybrid/Onsite), Portal Resmi (LinkedIn, Indeed, JobStreet, Greenhouse, dll.), Estimasi Gaji, and Kategori.
  - **Right Column (`.search-main-content`, flex: 1)**: Booster banner, Search Bar, Quick sub-navigation tabs (`Semua Loker`, `Loker Baru`, `Disimpan`), Sort dropdown, and Job Cards Grid (`#job-grid`).
  - **NEVER stack 20+ filter chips on top of the search bar**. Filters belong in the left sidebar on desktop.

### B. Mobile Viewport (< 992px)
- **Full Width Content**: All job cards, tools, and forms must span 100% width with zero horizontal clipping or page overflow.
- **Mobile Filter Drawer / Bottom Sheet**:
  - The left filter sidebar is hidden from the normal page flow.
  - A clean floating or sticky button (`[tune] Filter Loker`) opens a smooth Bottom Sheet modal from the bottom of the screen.
  - Users toggle filters easily with their thumbs, and click "Terapkan Filter" to close and apply.
- **Bottom Navigation Bar**: Remains active at the bottom of the viewport for primary tabs (`Beranda`, `Cari`, `Tracker`, `Resume`, `Menu`).

---

## 2. Visual Design & Aesthetics

- **Color Palette (60-30-10 Rule)**:
  - 60% Dominant: Clean surface white (`#FFFFFF`) / Dark surface (`#0f172a`).
  - 30% Neutral: Soft off-white cards (`#f8fafc`, `#f1f5f9`), subtle outlines `rgba(0,0,0,0.08)`.
  - 10% Accents:
    - Warm Amber/Yellow (`#F59E0B` / `#FEF3C7` / `#FCD34D`) for active highlight pills & booster banners (Welcome to the Jungle signature).
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
