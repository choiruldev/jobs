import { recordPageView } from "./analytics.js?v=20260616v";

document.addEventListener("DOMContentLoaded", () => {
  recordPageView(document.body.dataset.page || "content", {
    title: document.title,
    path: window.location.pathname
  });
});
