/**
 * Client-Side Error Logging & Telemetry for Beta Testing
 * Automatically captures uncaught runtime errors and unhandled promise rejections.
 * Stores telemetry in localStorage (Zero-Login privacy) for developer inspection and bug reports.
 */

const ERROR_STORAGE_KEY = "jobsearch_client_errors_v1";
const MAX_STORED_ERRORS = 25;

export function getErrorLogs() {
  try {
    const raw = localStorage.getItem(ERROR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function clearErrorLogs() {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
    return true;
  } catch (err) {
    return false;
  }
}

export function recordError(errorData) {
  try {
    const logs = getErrorLogs();
    const entry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: String(errorData.message || "Unknown error"),
      source: errorData.source || window.location.pathname,
      lineno: errorData.lineno || null,
      colno: errorData.colno || null,
      stack: errorData.stack ? String(errorData.stack).split("\n").slice(0, 5).join("\n") : null,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
      url: window.location.href
    };

    logs.unshift(entry);
    if (logs.length > MAX_STORED_ERRORS) {
      logs.length = MAX_STORED_ERRORS;
    }

    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(logs));
    return entry;
  } catch (err) {
    console.warn("[ErrorLogger] Gagal menyimpan error log:", err);
    return null;
  }
}

export function initGlobalErrorLogging() {
  if (typeof window === "undefined" || window.__jobsearch_logger_init) return;
  window.__jobsearch_logger_init = true;

  // 1. Uncaught JS Runtime Errors
  window.addEventListener("error", (event) => {
    // Ignore cross-origin script errors with no info
    if (!event.message || event.message === "Script error.") return;

    recordError({
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // 2. Unhandled Promise Rejections (e.g. failed async fetches)
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    recordError({
      message: `Unhandled Promise: ${reason?.message || String(reason)}`,
      source: "Promise",
      stack: reason?.stack
    });
  });
}

// Auto-init on script load
if (typeof window !== "undefined") {
  initGlobalErrorLogging();
}
