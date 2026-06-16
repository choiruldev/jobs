const SAVED_SEARCH_KEY = "jsa_saved_searches_v1";

function safeParseSearch(raw = "") {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Gagal membaca pencarian tersimpan", error);
    return [];
  }
}

function makeId() {
  return `search_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).map(([group, values]) => [
      group,
      Array.isArray(values) ? values : [...(values || [])]
    ])
  );
}

export function readSavedSearches() {
  const parsed = safeParseSearch(localStorage.getItem(SAVED_SEARCH_KEY));
  return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.state) : [];
}

export function writeSavedSearches(searches) {
  try {
    localStorage.setItem(SAVED_SEARCH_KEY, JSON.stringify(searches));
    return true;
  } catch (error) {
    console.warn("Gagal menyimpan pencarian", error);
    return false;
  }
}

export function serializeSearchState(state) {
  return {
    query: state.query || "",
    source: state.source || "indonesia",
    sort: state.sort || "relevant",
    filters: normalizeFilters(state.filters)
  };
}

export function searchFingerprint(state) {
  const serial = serializeSearchState(state);
  return JSON.stringify({
    query: serial.query.trim().toLowerCase(),
    source: serial.source,
    filters: Object.fromEntries(
      Object.entries(serial.filters).map(([group, values]) => [group, [...values].sort()])
    )
  });
}

export function saveSearch(state, jobs) {
  const searches = readSavedSearches();
  const fingerprint = searchFingerprint(state);
  const existing = searches.find((item) => item.fingerprint === fingerprint);
  const now = new Date().toISOString();
  const seenIds = jobs.map((job) => job.id).filter(Boolean);
  const label = state.query.trim()
    || (state.source === "indonesia"
      ? "Remote dari Indonesia"
      : state.source === "anywhere"
        ? "Remote-anywhere"
        : state.source === "apac"
          ? "Asia/APAC"
          : "Remote Global");
  const next = {
    id: existing?.id || makeId(),
    label,
    fingerprint,
    state: serializeSearchState(state),
    seenIds,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  const merged = [next, ...searches.filter((item) => item.id !== next.id)].slice(0, 8);
  writeSavedSearches(merged);
  return next;
}

export function deleteSavedSearch(id) {
  const next = readSavedSearches().filter((item) => item.id !== id);
  writeSavedSearches(next);
  return next;
}

export function markSearchSeen(id, jobs) {
  const searches = readSavedSearches();
  const next = searches.map((item) => item.id === id
    ? {
        ...item,
        seenIds: jobs.map((job) => job.id).filter(Boolean),
        updatedAt: new Date().toISOString()
      }
    : item);
  writeSavedSearches(next);
  return next.find((item) => item.id === id) || null;
}

export function countNewJobs(savedSearch, jobs) {
  const seen = new Set(savedSearch.seenIds || []);
  return jobs.filter((job) => job?.id && !seen.has(job.id)).length;
}
