# UI Design System & Layout Preservation Rule

This rule enforces the **Welcome to the Jungle (WTTJ) + Linear** design system across all pages of this application:

1. **Search Page Structure**:
   - Desktop (`>= 992px`): Left Filter Sidebar Card (~300px width) + Right Main Content Feed (Job Cards & Controls).
   - Mobile (`< 992px`): Filter converts to a smooth Bottom Sheet triggered by a sticky `[tune] Filter Loker` button. Content is 100% full-width.
   - Do NOT stack 20+ filter chips on top of the search input.

2. **Top Navigation Bar**:
   - Primary navigation lives on the sticky Top Header Navbar.
   - Do NOT introduce a 272px left navigation drawer that pushes or shrinks desktop content.

3. **Styling & Components**:
   - Rounded card corners: 18px–20px.
   - Buttons & Pills: Anti-squish (`flex-shrink: 0 !important; white-space: nowrap !important;`).
   - Accents: Warm amber `#F59E0B` for subnav pills & booster highlights; Cybermint/Emerald `#00C16E` for salaries, verification, and primary actions.
   - Never use dull cement-gray square buttons.
