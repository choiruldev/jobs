/**
 * Material Design 3 Dynamic Theme Engine (Light / Dark Mode)
 * Automatically syncs with system preference or user manual toggle, persisting in localStorage.
 */

const THEME_KEY = "jsa_theme_preference";
const SIDEBAR_KEY = "jsa_sidebar_collapsed";

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const targetTheme = theme || getPreferredTheme();
  document.documentElement.setAttribute("data-theme", targetTheme);
  document.documentElement.style.colorScheme = targetTheme;
  try {
    localStorage.setItem(THEME_KEY, targetTheme);
  } catch (e) {}

  // Update toggle icons if present
  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.setAttribute("aria-label", targetTheme === "dark" ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap");
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = targetTheme === "dark" ? "light_mode" : "dark_mode";
    }
  });

  return targetTheme;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initSidebar() {
  const layout = document.querySelector(".app-layout");
  if (!layout) return;

  // Restore desktop collapsed state
  try {
    const isCollapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
    if (isCollapsed && window.innerWidth >= 960) {
      layout.classList.add("sidebar-collapsed");
    }
  } catch (e) {}

  // Sidebar toggle button (desktop collapse / mobile open drawer)
  document.querySelectorAll(".js-sidebar-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth >= 960) {
        layout.classList.toggle("sidebar-collapsed");
        const collapsed = layout.classList.contains("sidebar-collapsed");
        try {
          localStorage.setItem(SIDEBAR_KEY, String(collapsed));
        } catch (e) {}
      } else {
        layout.classList.toggle("sidebar-open-mobile");
      }
    });
  });

  // Sidebar close button (inside side-nav)
  document.querySelectorAll(".js-sidebar-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth >= 960) {
        layout.classList.toggle("sidebar-collapsed");
        try {
          localStorage.setItem(SIDEBAR_KEY, String(layout.classList.contains("sidebar-collapsed")));
        } catch (e) {}
      } else {
        layout.classList.remove("sidebar-open-mobile");
      }
    });
  });

  // Backdrop click closes mobile drawer
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      layout.classList.remove("sidebar-open-mobile");
    });
  }

  // Close mobile drawer on navigation link tap
  document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 960) {
        layout.classList.remove("sidebar-open-mobile");
      }
    });
  });
}

export function initThemeEngine() {
  // Apply immediately to prevent flash of wrong theme
  applyTheme();

  // Listen to system theme change if not manually overridden
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch (err) {}
    });
  }

  // Bind any theme toggle buttons on page
  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleTheme();
    });
  });

  // Initialize responsive sidebar
  initSidebar();
}

// Auto-run when imported
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeEngine);
  } else {
    initThemeEngine();
  }
}
