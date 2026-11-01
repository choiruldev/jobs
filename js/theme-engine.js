/**
 * Material Design 3 Dynamic Theme Engine (Light / Dark Mode)
 * Automatically syncs with system preference or user manual toggle, persisting in localStorage.
 */

const THEME_KEY = "jsa_theme_preference";

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const targetTheme = theme || getPreferredTheme();
  document.documentElement.setAttribute("data-theme", targetTheme);
  document.documentElement.style.colorScheme = targetTheme;
  localStorage.setItem(THEME_KEY, targetTheme);

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

export function initThemeEngine() {
  // Apply immediately to prevent flash of wrong theme
  applyTheme();

  // Listen to system theme change if not manually overridden
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }

  // Bind any theme toggle buttons on page
  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleTheme();
    });
  });
}

// Auto-run when imported
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeEngine);
  } else {
    initThemeEngine();
  }
}
