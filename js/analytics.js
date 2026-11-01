const ANALYTICS_KEY = "jsa_analytics_events_v1";
const SESSION_KEY = "jsa_analytics_session_v1";
const TELEMETRY_OPT_KEY = "jsa_telemetry_enabled";
const MAX_EVENTS = 800;

export function isTelemetryEnabled() {
  const pref = localStorage.getItem(TELEMETRY_OPT_KEY);
  return pref === null ? true : pref === "true";
}

export function setTelemetryEnabled(enabled) {
  localStorage.setItem(TELEMETRY_OPT_KEY, String(Boolean(enabled)));
  if (!enabled) {
    clearAnalyticsEvents();
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Gagal membaca analytics lokal", error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Gagal menyimpan analytics lokal", error);
    return false;
  }
}

function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = makeId("session");
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function sanitizePayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 180) : value])
  );
}

export function readAnalyticsEvents() {
  const events = readJson(ANALYTICS_KEY, []);
  return Array.isArray(events) ? events : [];
}

export function trackEvent(name, payload = {}) {
  if (!name || !isTelemetryEnabled()) return null;
  const event = {
    id: makeId(),
    name,
    payload: sanitizePayload(payload),
    path: window.location.pathname,
    query: window.location.search,
    sessionId: getSessionId(),
    createdAt: nowIso()
  };
  const events = [...readAnalyticsEvents(), event].slice(-MAX_EVENTS);
  writeJson(ANALYTICS_KEY, events);
  return event;
}

export function recordPageView(page, payload = {}) {
  return trackEvent("page_view", { page, ...payload });
}

export function clearAnalyticsEvents() {
  writeJson(ANALYTICS_KEY, []);
}

export function getAnalyticsSummary() {
  const events = readAnalyticsEvents();
  const byName = events.reduce((acc, event) => {
    acc[event.name] = (acc[event.name] || 0) + 1;
    return acc;
  }, {});
  const topSearches = events
    .filter((event) => event.name === "search_query" && event.payload?.query)
    .reduce((acc, event) => {
      const query = String(event.payload.query).toLowerCase();
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {});
  const topSources = events
    .filter((event) => event.payload?.source)
    .reduce((acc, event) => {
      const source = String(event.payload.source);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

  const rank = (object) => Object.entries(object)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  return {
    totalEvents: events.length,
    byName,
    topSearches: rank(topSearches),
    topSources: rank(topSources),
    lastEventAt: events.at(-1)?.createdAt || ""
  };
}
