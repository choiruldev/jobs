# UI Design System & Layout Preservation Rule (ZERO_SIDEBAR_LOCK)

This rule enforces the **Zero-Sidebar Modern Architecture (Linear & Airbnb standard)** across all pages of this application:

1. **Zero-Sidebar Across the Whole Platform**:
   - Strictly NO sidebars anywhere on the website (neither navigation sidebars nor 290px left filter sidebars).
   - Navigation lives on the Top Navigation Bar on desktop and Bottom Navigation Bar on mobile.

2. **Search Page Structure**:
   - Single centered content feed (`max-width: 1060px; margin: 0 auto;`).
   - Top Search Controls: Compact Booster Banner + Omni-Search Input + Quick Horizontal Filter Bar (Wilayah select, Mode Kerja pills, Filter Lengkap button, Sort select).
   - Advanced filters live in a clean **Filter Modal / Dialog** (centered pop-up on desktop, bottom sheet on mobile) opened on demand via `[tune] Filter Lengkap`.

3. **Styling & Components**:
   - Rounded card corners: 18px–22px.
   - Buttons & Pills: Anti-squish (`flex-shrink: 0 !important; white-space: nowrap !important;`).
   - Accents: Warm amber `#F59E0B` for subnav pills & booster highlights; Cybermint/Emerald `#00C16E` for salaries, verification, and primary actions.
   - Never use dull cement-gray square buttons.
