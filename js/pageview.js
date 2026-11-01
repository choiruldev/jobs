import { recordPageView } from "./analytics.js?v=20260616z";
import "./error-logger.js?v=20260616z";
import "./theme-engine.js?v=20260616z";
import "./pwa-prompt.js?v=20260616z";
import "./beta-feedback.js?v=20260616z";
import "./onboarding.js?v=20260616z";

// Register Service Worker for PWA & Offline Support
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swPath = window.location.pathname.includes("/pages/") ? "../sw.js" : "sw.js";
    navigator.serviceWorker.register(swPath).catch((err) => {
      console.warn("ServiceWorker registration error:", err);
    });
  });
}

function syncActiveNav() {
  const path = window.location.pathname;
  let activeNav = "";
  if (path.includes("search") || path.includes("-remote")) activeNav = "search";
  else if (path.includes("apply")) activeNav = "applications";
  else if (path.includes("resume")) activeNav = "resume";
  else if (path.includes("bookmark")) activeNav = "bookmarks";
  else if (path.includes("companies")) activeNav = "companies";

  if (activeNav) {
    document.querySelectorAll(".bottom-nav .nav-link").forEach((link) => {
      if (link.dataset.nav === activeNav) {
        link.classList.add("nav-link--active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("nav-link--active");
        link.removeAttribute("aria-current");
      }
    });
    document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
      if (link.dataset.nav === activeNav) {
        link.classList.add("nav-link--active");
        link.setAttribute("aria-current", "page");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  syncActiveNav();
  recordPageView(document.body.dataset.page || "content", {
    title: document.title,
    path: window.location.pathname
  });
});
