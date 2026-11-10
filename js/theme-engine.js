/**
 * Material Design 3 Dynamic Theme Engine (Light / Dark Mode) & Unified Sidebar Controller
 * Automatically syncs with system preference or user manual toggle, persisting in localStorage.
 */

import { initAuthQuotaEngine } from "./auth-quota.js?v=20261110a";
import { initAutoEmailApplyEngine } from "./auto-email-apply.js?v=20261110a";

const THEME_KEY = "jsa_theme_preference";
const SIDEBAR_KEY = "jsa_sidebar_collapsed";

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {}
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const targetTheme = theme || getPreferredTheme();
  document.documentElement.setAttribute("data-theme", targetTheme);
  document.documentElement.style.colorScheme = targetTheme;
  try {
    localStorage.setItem(THEME_KEY, targetTheme);
  } catch (e) {}

  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    btn.setAttribute("aria-label", targetTheme === "dark" ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap");
    btn.setAttribute("title", targetTheme === "dark" ? "Mode Terang" : "Mode Gelap");
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

function syncActiveNavLinks() {
  const rawPath = window.location.pathname || "";
  const currentFile = rawPath.split("/").pop() || "index.html";
  const pageAttr = document.body?.dataset?.page || "";

  document.querySelectorAll(".side-nav .nav-link, .bottom-nav .nav-link").forEach((link) => {
    const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
    const targetFile = href.split("/").pop();
    const isDetailOnSearch = currentFile === "detail.html" && targetFile === "search.html";
    const isRemoteLandingOnSearch = currentFile.includes("-remote") && targetFile === "search.html";
    const isGuideOnSearch = rawPath.includes("/guides/") && targetFile === "search.html";
    const isMatch =
      (targetFile && targetFile === currentFile) ||
      isDetailOnSearch ||
      isRemoteLandingOnSearch ||
      isGuideOnSearch ||
      (pageAttr === "home" && targetFile === "index.html");

    link.classList.toggle("nav-link--active", isMatch);
    if (isMatch) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

export function initSidebar() {
  const layout = document.querySelector(".app-layout");
  if (!layout) return;

  // Ensure backdrop exists for mobile drawer
  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    backdrop.id = "sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    layout.prepend(backdrop);
  }

  // Restore desktop collapsed state
  try {
    const isCollapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
    if (isCollapsed && window.innerWidth >= 960) {
      layout.classList.add("sidebar-collapsed");
    }
  } catch (e) {}

  // Sidebar toggle button (desktop collapse / mobile open drawer)
  document.querySelectorAll(".js-sidebar-toggle").forEach((btn) => {
    if (btn.dataset.jsaSidebarBound === "1") return;
    btn.dataset.jsaSidebarBound = "1";
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
    if (btn.dataset.jsaSidebarBound === "1") return;
    btn.dataset.jsaSidebarBound = "1";
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
  if (backdrop.dataset.jsaSidebarBound !== "1") {
    backdrop.dataset.jsaSidebarBound = "1";
    backdrop.addEventListener("click", () => {
      layout.classList.remove("sidebar-open-mobile");
    });
  }

  // Close mobile drawer on navigation link tap
  document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
    if (link.dataset.jsaSidebarBound === "1") return;
    link.dataset.jsaSidebarBound = "1";
    link.addEventListener("click", () => {
      if (window.innerWidth < 960) {
        layout.classList.remove("sidebar-open-mobile");
      }
    });
  });

  if (!window.__jsaSidebarKeybound) {
    window.__jsaSidebarKeybound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        layout.classList.remove("sidebar-open-mobile");
      }
    });
  }

  syncActiveNavLinks();
}

export function initThemeEngine() {
  applyTheme();

  if (!window.__jsaThemeMediaBound && window.matchMedia) {
    window.__jsaThemeMediaBound = true;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch (err) {}
    });
  }

  document.querySelectorAll(".js-theme-toggle").forEach((btn) => {
    if (btn.dataset.jsaThemeBound === "1") return;
    btn.dataset.jsaThemeBound = "1";
    btn.addEventListener("click", () => {
      toggleTheme();
    });
  });

  initSidebar();
  initAuthQuotaEngine();
  initAutoEmailApplyEngine();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeEngine);
  } else {
    initThemeEngine();
  }
}
