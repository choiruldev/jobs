import { recordPageView } from "./analytics.js?v=20261106a";
import "./error-logger.js?v=20261106a";
import { initThemeEngine } from "./theme-engine.js?v=20261106a";
import "./pwa-prompt.js?v=20261106a";
import "./beta-feedback.js?v=20261106a";
import "./onboarding.js?v=20261106a";

// Register Service Worker for PWA & Offline Support
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const pathname = window.location.pathname || "";
    const swPath = pathname.includes("/pages/guides/")
      ? "../../sw.js"
      : (pathname.includes("/pages/") ? "../sw.js" : "sw.js");
    navigator.serviceWorker.register(swPath).catch((err) => {
      console.warn("ServiceWorker registration error:", err);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  recordPageView(document.body.dataset.page || "content", {
    title: document.title,
    path: window.location.pathname
  });
});
