import {
  getFilterOptions,
  getAllKnownJobs,
  rememberJobs,
  salaryAverage
} from "./data.js?v=20261106a";
import { detectExperienceLevel } from "./schema.js?v=20261106a";
import {
  JOB_SOURCES,
  PROVIDER_LABELS,
  INDONESIA_LOCATION_TERMS,
  isIndonesiaScope,
  matchesScope,
  loadJobsForSource
} from "./providers.js?v=20261106a";
import {
  escapeHtml,
  initBookmarkButtons,
  renderJobCard,
  showSnackbar
} from "./bookmark.js?v=20261106a";
import {
  clearMatchProfile,
  getProfileSummary,
  profileHasSignal,
  readMatchProfile,
  scoreJobForProfile,
  writeMatchProfile
} from "./profile.js?v=20261106a";
import {
  countNewJobs,
  deleteSavedSearch,
  markSearchSeen,
  readSavedSearches,
  saveSearch
} from "./saved-searches.js?v=20261106a";
import { recordPageView, trackEvent } from "./analytics.js?v=20261106a";
import { initThemeEngine } from "./theme-engine.js?v=20261106a";

const LAST_SEARCH_KEY = "jsa_last_search";
const FILTER_GROUPS_SINGLE = new Set(["location", "category", "salary"]);

const salaryFilters = [
  {
    value: "below_8",
    label: "Gaji: < Rp 8jt",
    match: (job) => salaryAverage(job) > 0 && salaryAverage(job) < 8000000
  },
  {
    value: "8_15",
    label: "Gaji: Rp 8-15jt",
    match: (job) => salaryAverage(job) >= 8000000 && salaryAverage(job) <= 15000000
  },
  {
    value: "above_15",
    label: "Gaji: > Rp 15jt",
    match: (job) => salaryAverage(job) > 15000000
  }
];

const HIDDEN_CATEGORIES = new Set(["all others", "germany"]);
const DATA_CREDIT = "Data resmi terintegrasi dari LinkedIn, JobStreet, Indeed, dan Portal Remote Global. Lamaran selalu diarahkan ke situs resmi.";
const SOURCE_TITLES = {
  indonesia: "Lowongan Kerja Indonesia",
  anywhere: "Remote-anywhere",
  apac: "Lowongan Asia/APAC",
  international: "Lowongan Global"
};
const SOURCE_RESULT_LABELS = {
  indonesia: "lowongan di Indonesia & remote",
  anywhere: "lowongan remote-anywhere",
  apac: "lowongan remote Asia/APAC",
  international: "lowongan remote global"
};

const SEARCH_STOPWORDS = new Set([
  "jobs", "job", "loker", "lowongan", "kerja", "pekerjaan", "vacancies", "vacancy", "hiring",
  "untuk", "di", "ke", "dari", "pada", "yang", "dan", "dengan", "buat", "cari", "mencari",
  "in", "at", "for", "the", "a", "an", "of", "to"
]);

function readLastSearch() {
  try {
    return localStorage.getItem(LAST_SEARCH_KEY) || "";
  } catch (error) {
    console.warn("Gagal membaca pencarian terakhir", error);
    return "";
  }
}

function writeLastSearch(value) {
  try {
    localStorage.setItem(LAST_SEARCH_KEY, value);
  } catch (error) {
    console.warn("Gagal menyimpan pencarian terakhir", error);
  }
}

function debounce(callback, delay = 300) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

function getSalaryFilter(value) {
  return salaryFilters.find((filter) => filter.value === value);
}

function detectDefaultSource() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const language = navigator.language || "";
  const languages = Array.isArray(navigator.languages) ? navigator.languages.join(" ") : "";
  if (/Asia\/(Jakarta|Makassar|Jayapura)/i.test(timeZone)) return "indonesia";
  if (/(^|\s)id[-_]?/i.test(`${language} ${languages}`)) return "indonesia";
  return "international";
}

function makeInitialState() {
  return {
    query: "",
    source: detectDefaultSource(),
    sort: "relevant",
    filters: {
      location: new Set(),
      type: new Set(),
      category: new Set(),
      salary: new Set(),
      exp: new Set(),
      platform: new Set()
    }
  };
}

function parseUrlState(state) {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") ?? (params.has("source") ? "" : readLastSearch());
  state.source = JOB_SOURCES[params.get("source")] ? params.get("source") : state.source;
  state.sort = params.get("sort") || "relevant";

  if (params.get("exp") && state.filters.exp) {
    state.filters.exp.add(params.get("exp"));
  }

  if (params.get("platform") && state.filters.platform && params.get("platform") !== "all") {
    state.filters.platform.add(params.get("platform"));
  }

  const rawFilter = params.get("filter");
  if (!rawFilter) return;

  rawFilter.split(",").forEach((item) => {
    const [group, ...valueParts] = item.split(":");
    const value = valueParts.join(":");
    if (state.filters[group] && value) {
      state.filters[group].add(value);
    }
  });
}

function serializeFilters(filters) {
  const parts = [];
  Object.entries(filters).forEach(([group, values]) => {
    values.forEach((value) => parts.push(`${group}:${value}`));
  });
  return parts.join(",");
}

function syncUrl(state) {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.source !== detectDefaultSource()) params.set("source", state.source);

  const filter = serializeFilters(state.filters);
  if (filter) params.set("filter", filter);
  if (state.sort !== "relevant") params.set("sort", state.sort);

  const next = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
  window.history.replaceState({}, "", next);
}

function renderFilterChips(container, state, jobs) {
  const options = getFilterOptions(jobs);
  const chips = [
    ...options.types.slice(0, 8).map((value) => ({ group: "type", value, icon: "schedule", label: value })),
    ...options.categories
      .filter((value) => value.length <= 22 && !HIDDEN_CATEGORIES.has(value.toLowerCase()))
      .slice(0, 10)
      .map((value) => ({ group: "category", value, icon: "category", label: value })),
    ...salaryFilters
      .filter((filter) => jobs.some((job) => filter.match(job)))
      .map((filter) => ({ group: "salary", value: filter.value, icon: "payments", label: filter.label.replace("Gaji: ", "") }))
  ];

  container.innerHTML = chips.map((chip) => {
    const active = state.filters[chip.group].has(chip.value);
    return `
      <button
        class="filter-chip"
        type="button"
        data-filter-group="${escapeHtml(chip.group)}"
        data-filter-value="${escapeHtml(chip.value)}"
        aria-pressed="${String(active)}"
      >
        <span class="material-symbols-outlined" aria-hidden="true">${escapeHtml(chip.icon)}</span>
        ${escapeHtml(chip.label)}
      </button>
    `;
  }).join("");
}

function toggleFilter(state, group, value) {
  const selected = state.filters[group];
  if (!selected) return;

  if (FILTER_GROUPS_SINGLE.has(group)) {
    const wasActive = selected.has(value);
    selected.clear();
    if (!wasActive) selected.add(value);
    return;
  }

  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }
}

function tokenizeSmartQuery(query = "") {
  const matches = String(query).match(/"[^"]+"|\S+/g) || [];
  return matches.map((token) => token.replace(/^"|"$/g, "").trim()).filter(Boolean);
}

function jobSearchText(job) {
  const isIndonesia = isIndonesiaScope(job);
  const wpType = String(job.workplaceType || "").toLowerCase();
  const remoteTier = String(job.remoteTier || "").toLowerCase();
  const platform = String(job.sourcePlatform || job.source?.name || "").toLowerCase();
  const types = Array.isArray(job.type) ? job.type.join(" ").toLowerCase() : "";

  const synonyms = [];
  if (isIndonesia || remoteTier === "indonesia" || types.includes("indonesia") || (job.location && INDONESIA_LOCATION_TERMS.some((term) => String(job.location).toLowerCase().includes(term)))) {
    synonyms.push("indonesia", "lokal", "local", "loker", "lowongan", "kerja", "loker indonesia", "lowongan kerja", "pekerjaan", "dalam negeri");
  }
  if (wpType.includes("remote") || types.includes("remote") || (job.location && /remote/i.test(job.location))) {
    synonyms.push("remote", "wfh", "kerja remote", "telecommute", "jarak jauh");
  }
  if (wpType.includes("onsite") || wpType.includes("on-site") || types.includes("onsite") || types.includes("on-site") || (job.location && !/remote/i.test(job.location))) {
    synonyms.push("onsite", "on-site", "wfo", "kantor", "kerja di kantor");
  }
  if (wpType.includes("hybrid") || types.includes("hybrid")) {
    synonyms.push("hybrid", "wfh wfo", "fleksibel");
  }
  if (platform) {
    synonyms.push(platform);
  }

  return [
    job.title,
    job.company,
    job.location,
    job.category,
    job.description,
    job.source?.name,
    job.sourcePlatform,
    types,
    wpType,
    (job.tags || []).join(" "),
    (job.requirements || []).join(" "),
    synonyms.join(" ")
  ].join(" ").toLowerCase();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchHaystackTerm(haystack, term) {
  if (!term) return true;
  if (term.length <= 4) {
    const rx = new RegExp("(?:^|[^a-zA-Z0-9])" + escapeRegExp(term) + "(?:[^a-zA-Z0-9]|$)", "i");
    return rx.test(haystack);
  }
  return haystack.includes(term);
}

function jobMatchesQuery(job, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = jobSearchText(job);
  const rawTokens = tokenizeSmartQuery(trimmed);

  const excluded = [];
  const positives = [];
  const orGroups = [];
  let currentOrGroup = [];
  let negateNext = false;
  let hasOr = false;

  const nonStopwordTokens = rawTokens.filter((t) => !SEARCH_STOPWORDS.has(t.toLowerCase()) && !["and", "or", "not"].includes(t.toLowerCase()));
  const activeTokens = nonStopwordTokens.length > 0 ? rawTokens.filter((t) => !SEARCH_STOPWORDS.has(t.toLowerCase())) : rawTokens;

  activeTokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (lower === "and") return;
    if (lower === "or") {
      hasOr = true;
      if (currentOrGroup.length) orGroups.push(currentOrGroup);
      currentOrGroup = [];
      return;
    }
    if (lower === "not") {
      negateNext = true;
      return;
    }

    const clean = lower.startsWith("-") ? lower.slice(1) : lower;
    if (!clean) return;
    if (negateNext || lower.startsWith("-")) {
      excluded.push(clean);
      negateNext = false;
      return;
    }

    positives.push(clean);
    currentOrGroup.push(clean);
  });

  if (excluded.some((term) => matchHaystackTerm(haystack, term))) return false;
  if (hasOr) {
    if (currentOrGroup.length) orGroups.push(currentOrGroup);
    return orGroups.some((group) => group.every((term) => matchHaystackTerm(haystack, term)));
  }

  return positives.every((term) => matchHaystackTerm(haystack, term));
}

function jobMatchesFilters(job, filters) {
  if (filters.location.size && !filters.location.has(job.location)) return false;
  if (filters.category.size && !filters.category.has(job.category)) return false;

  if (filters.type && filters.type.size) {
    const hasTypeMatch = Array.from(filters.type).some((type) => (job.type || []).includes(type));
    if (!hasTypeMatch) return false;
  }

  for (const value of filters.salary) {
    const filter = getSalaryFilter(value);
    if (filter && !filter.match(job)) return false;
  }

  if (filters.exp && filters.exp.size) {
    const level = job.experienceLevel || detectExperienceLevel(job.title, job.description || "");
    if (!filters.exp.has(level)) return false;
  }

  if (filters.platform && filters.platform.size) {
    const p = String(job.sourcePlatform || job.source?.name || "").toLowerCase();
    let hasMatch = false;
    for (const plat of filters.platform) {
      const pl = plat.toLowerCase();
      if (pl === "all") {
        hasMatch = true;
        break;
      }
      if (pl === "remotive" || pl === "remote") {
        if (p.includes("remotive") || p.includes("arbeitnow") || p.includes("remote")) {
          hasMatch = true;
          break;
        }
      } else if (p.includes(pl)) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) return false;
  }

  return true;
}

function relevanceScore(job, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return new Date(job.posted || job.date || 0).getTime();

  const tokens = tokenizeSmartQuery(trimmed).filter((t) => !SEARCH_STOPWORDS.has(t.toLowerCase()));
  const activeTokens = tokens.length ? tokens : tokenizeSmartQuery(trimmed);

  let score = 0;
  const title = (job.title || "").toLowerCase();
  const company = (job.company || "").toLowerCase();
  const location = (job.location || "").toLowerCase();
  const desc = (job.description || "").toLowerCase();
  const tags = (job.tags || []).map((t) => String(t).toLowerCase());

  if (title.includes(trimmed)) score += 30;
  if (company.includes(trimmed)) score += 20;

  activeTokens.forEach((token) => {
    const t = token.toLowerCase();
    if (title.includes(t)) score += 15;
    if (company.includes(t)) score += 10;
    if (tags.some((tag) => tag.includes(t))) score += 8;
    if (location.includes(t)) score += 6;
    if (desc.includes(t)) score += 3;
  });

  return score;
}

function sourceRank(job) {
  const plat = String(job.sourcePlatform || job.source?.name || "").toLowerCase();
  if (plat.includes("linkedin")) return 10;
  if (plat.includes("jobstreet")) return 9;
  if (plat.includes("indeed")) return 8;
  if (job.source?.key === "remotive") return 5;
  if (job.source?.key === "arbeitnow") return 4;
  if (job.source?.key === "jobicy") return 3;
  return 1;
}

function scopeRank(job, source) {
  const location = String(job.location || "").toLowerCase();
  if (source === "indonesia") {
    if (location.includes("indonesia")) return 4;
    if (location === "remote" || location === "remote,") return 2;
  }
  if (source === "anywhere") {
    if (location.includes("worldwide") || location.includes("anywhere") || location.includes("global")) return 4;
  }
  if (source === "apac") {
    if (location.includes("apac") || location.includes("asia") || location.includes("asean")) return 4;
    if (location.includes("indonesia")) return 3;
  }
  return 0;
}

function filterAndSortJobs(state, allJobs) {
  const jobs = allJobs
    .filter((job) => jobMatchesQuery(job, state.query))
    .filter((job) => jobMatchesFilters(job, state.filters));

  return [...jobs].sort((a, b) => {
    const timeA = new Date(a.postedAt || a.posted || 0).getTime();
    const timeB = new Date(b.postedAt || b.posted || 0).getTime();

    if (state.sort === "latest") {
      return timeB - timeA;
    }

    if (state.sort === "salary") {
      return salaryAverage(b) - salaryAverage(a);
    }

    if (state.sort === "match" && profileHasSignal(readMatchProfile())) {
      return scoreJobForProfile(b).score - scoreJobForProfile(a).score
        || (timeB - timeA);
    }

    if (!state.query.trim()) {
      return scopeRank(b, state.source) - scopeRank(a, state.source)
        || sourceRank(b) - sourceRank(a)
        || (timeB - timeA);
    }

    const scoreDiff = relevanceScore(b, state.query) - relevanceScore(a, state.query);
    return scoreDiff || (timeB - timeA);
  });
}

function updateFilterButtonStates(container, state) {
  container.querySelectorAll(".filter-chip").forEach((chip) => {
    const group = chip.dataset.filterGroup;
    const value = chip.dataset.filterValue;
    chip.setAttribute("aria-pressed", String(state.filters[group]?.has(value)));
  });
}

function resetFilters(state) {
  state.query = "";
  state.sort = "relevant";
  Object.values(state.filters).forEach((set) => set.clear());
}

function hydrateSearchState(savedState = {}) {
  const next = makeInitialState();
  next.query = savedState.query || "";
  next.source = JOB_SOURCES[savedState.source] ? savedState.source : next.source;
  next.sort = savedState.sort || "relevant";
  Object.entries(savedState.filters || {}).forEach(([group, values]) => {
    if (!next.filters[group]) return;
    (Array.isArray(values) ? values : []).forEach((value) => next.filters[group].add(value));
  });
  return next;
}

function copySearchState(target, source) {
  target.query = source.query || "";
  target.source = JOB_SOURCES[source.source] ? source.source : target.source;
  target.sort = source.sort || "relevant";
  Object.keys(target.filters).forEach((group) => {
    target.filters[group].clear();
    (source.filters[group] || new Set()).forEach((value) => target.filters[group].add(value));
  });
}

function initSearchPage() {
  const page = document.querySelector('[data-page="search"]');
  if (!page) return;

  const state = makeInitialState();
  parseUrlState(state);
  recordPageView("search", { source: state.source, query: state.query.trim() });

  const input = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");
  const focusSearchButton = document.getElementById("focus-search");
  const filterRow = document.getElementById("filter-row");
  const sourceSelect = document.getElementById("source-select");
  const platformSelect = document.getElementById("platform-select");
  const sourceStatus = document.getElementById("source-status");
  const sourceCredit = document.getElementById("source-credit");
  const searchTitle = document.getElementById("search-title");
  const sortSelect = document.getElementById("sort-select");
  const resultCount = document.getElementById("result-count");
  const grid = document.getElementById("job-grid");
  const empty = document.getElementById("search-empty");
  const resetButton = document.getElementById("reset-filters");
  const profileForm = document.getElementById("profile-form");
  const profileSummary = document.getElementById("profile-summary");
  const editProfileButton = document.getElementById("edit-profile");
  const clearProfileButton = document.getElementById("clear-profile");
  const saveSearchButton = document.getElementById("save-search");
  const savedSearchList = document.getElementById("saved-search-list");
  const savedSearchSummary = document.getElementById("saved-search-summary");

  const portalPills = document.querySelectorAll(".portal-pill");
  const toggleToolsBtn = document.getElementById("toggle-search-tools");
  const toolsWrapper = document.getElementById("search-tools-wrapper");
  const toolsButtonText = document.getElementById("tools-button-text");

  const known = getAllKnownJobs();
  let allJobs = known.length ? known.filter((j) => matchesScope(j, state.source)) : [];
  let visibleJobs = [];
  let currentLoadId = 0;

  input.value = state.query;
  populateProfileForm(readMatchProfile());
  syncControls();
  renderFilterChips(filterRow, state, allJobs);
  if (allJobs.length) {
    render();
  }

  function syncControls() {
    sourceSelect.value = state.source;
    sortSelect.value = state.sort;
    const selected = Array.from(state.filters.platform || [])[0] || "all";
    if (platformSelect) {
      platformSelect.value = selected;
    }
    portalPills.forEach((pill) => {
      pill.classList.toggle("is-active", (pill.dataset.platform || "all") === selected);
    });
  }

  function populateProfileForm(profile = {}) {
    if (!profileForm || !profileForm.elements) return;
    if (profileForm.elements.targetRole) profileForm.elements.targetRole.value = profile?.targetRole || "";
    if (profileForm.elements.skills) profileForm.elements.skills.value = profile?.skills || "";
    if (profileForm.elements.experience) profileForm.elements.experience.value = profile?.experience || "";
    if (profileForm.elements.expectedSalary) profileForm.elements.expectedSalary.value = profile?.expectedSalary || "";
    if (profileForm.elements.timezone) profileForm.elements.timezone.value = profile?.timezone || "Asia/Jakarta";
    renderProfileSummary(profile);
  }

  function renderProfileSummary(profile = readMatchProfile()) {
    if (!profileSummary) return;
    const summary = getProfileSummary(profile);
    profileSummary.textContent = summary || "Profil belum diisi.";
    if (toolsButtonText) {
      const hasSignal = profileHasSignal(profile);
      toolsButtonText.textContent = hasSignal ? "Profil (Aktif)" : "Profil Match";
    }
  }

  function jobsForSavedSearch(savedSearch) {
    if (savedSearch.state.source !== state.source) return [];
    return filterAndSortJobs(hydrateSearchState(savedSearch.state), allJobs);
  }

  function renderSavedSearches() {
    if (!savedSearchList || !savedSearchSummary) return;
    const searches = readSavedSearches();
    savedSearchSummary.textContent = searches.length
      ? `${searches.length} tersimpan di browser ini.`
      : "Belum ada alert tersimpan.";

    savedSearchList.innerHTML = searches.map((item) => {
      const sameSource = item.state.source === state.source;
      const newCount = sameSource ? countNewJobs(item, jobsForSavedSearch(item)) : 0;
      const scopeLabel = JOB_SOURCES[item.state.source] || "Scope";
      return `
        <article class="saved-search-card" data-search-id="${escapeHtml(item.id)}">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>Alert lokal . ${escapeHtml(scopeLabel)}${item.state.query ? ` . ${escapeHtml(item.state.query)}` : ""}</span>
          </div>
          <div class="saved-search-card__actions">
            ${newCount ? `<span class="badge">${newCount} baru</span>` : ""}
            <button class="icon-button js-open-search" type="button" aria-label="Buka pencarian ${escapeHtml(item.label)}">
              <span class="material-symbols-outlined" aria-hidden="true">travel_explore</span>
            </button>
            <button class="icon-button js-mark-seen" type="button" aria-label="Tandai sudah dilihat">
              <span class="material-symbols-outlined" aria-hidden="true">done_all</span>
            </button>
            <button class="icon-button js-delete-search" type="button" aria-label="Hapus pencarian ${escapeHtml(item.label)}">
              <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function setSourceStatus(message, tone = "neutral") {
    sourceStatus.textContent = message;
    sourceStatus.dataset.tone = tone;
    if (sourceCredit) sourceCredit.textContent = DATA_CREDIT;
  }

  function render() {
    syncControls();
    const jobs = filterAndSortJobs(state, allJobs);
    visibleJobs = jobs;
    if (searchTitle) {
      searchTitle.textContent = SOURCE_TITLES[state.source] || "Cari Lowongan";
    }
    resultCount.textContent = `${jobs.length} ${SOURCE_RESULT_LABELS[state.source] || "lowongan ditemukan"}`;
    const badgeTotal = document.getElementById("badge-total-count");
    if (badgeTotal) badgeTotal.textContent = String(allJobs.length || jobs.length);
    const mobileStatus = document.getElementById("mobile-status-pill");
    if (mobileStatus) mobileStatus.textContent = `${jobs.length} Loker`;
    clearButton.hidden = !state.query;
    grid.hidden = jobs.length === 0;
    empty.hidden = jobs.length > 0;
    grid.innerHTML = jobs.map((job) => renderJobCard(job, { query: state.query })).join("");
    updateFilterButtonStates(filterRow, state);
    renderProfileSummary();
    renderSavedSearches();
    writeLastSearch(state.query.trim());
    syncUrl(state);
  }

  async function refreshJobs() {
    const loadId = ++currentLoadId;
    const sourceLabel = JOB_SOURCES[state.source] || "sumber terpilih";
    resultCount.textContent = "Mengambil lowongan...";
    grid.hidden = true;
    empty.hidden = true;
    setSourceStatus(`Mengambil lowongan dari ${sourceLabel}...`);

    try {
      const result = await loadJobsForSource(state.source);
      if (loadId !== currentLoadId) return;

      allJobs = result.jobs;
      rememberJobs(allJobs);
      renderFilterChips(filterRow, state, allJobs);

      if (result.fallback) {
        setSourceStatus(`${sourceLabel} memakai data cadangan lokal karena sumber publik belum tersedia.`, "warning");
      } else if (result.failures.length && allJobs.length) {
        setSourceStatus(`Sebagian data gagal dimuat: ${result.failures.map((source) => PROVIDER_LABELS[source] || source).join(", ")}. Menampilkan data yang berhasil.`, "warning");
      } else if (result.failures.length) {
        setSourceStatus("Data lowongan gagal dimuat. Tidak ada data cadangan yang ditampilkan.", "warning");
      } else if (result.fromCache) {
        setSourceStatus(`${sourceLabel} dimuat dari cache lokal.`, "neutral");
      } else {
        setSourceStatus(`${sourceLabel} siap ditelusuri.`, "success");
      }

      trackEvent("jobs_loaded", {
        source: state.source,
        count: allJobs.length,
        failures: result.failures.join(","),
        fallback: Boolean(result.fallback)
      });
      render();
    } catch (error) {
      if (loadId !== currentLoadId) return;
      console.warn("Gagal memuat sumber lowongan", error);
      allJobs = [];
      renderFilterChips(filterRow, state, allJobs);
      setSourceStatus("Data lowongan gagal dimuat. Tidak ada data cadangan yang ditampilkan.", "warning");
      render();
    }
  }

  const debouncedRender = debounce(render, 300);

  input.addEventListener("input", () => {
    state.query = input.value;
    if (state.query.trim().length >= 3) {
      trackEvent("search_query", { query: state.query.trim(), source: state.source });
    }
    debouncedRender();
  });

  clearButton.addEventListener("click", () => {
    state.query = "";
    input.value = "";
    input.focus();
    render();
  });

  focusSearchButton?.addEventListener("click", () => {
    input.focus();
  });

  filterRow.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip");
    if (!chip) return;
    toggleFilter(state, chip.dataset.filterGroup, chip.dataset.filterValue);
    trackEvent("filter_toggle", {
      group: chip.dataset.filterGroup,
      value: chip.dataset.filterValue,
      source: state.source
    });
    render();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    trackEvent("sort_change", { sort: state.sort, source: state.source });
    render();
  });

  sourceSelect.addEventListener("change", () => {
    state.source = sourceSelect.value;
    Object.values(state.filters).forEach((set) => set.clear());
    trackEvent("source_change", { source: state.source });
    refreshJobs();
  });

  if (platformSelect) {
    platformSelect.addEventListener("change", () => {
      state.filters.platform.clear();
      if (platformSelect.value && platformSelect.value !== "all") {
        state.filters.platform.add(platformSelect.value);
      }
      portalPills.forEach((p) => p.classList.toggle("is-active", (p.dataset.platform || "all") === platformSelect.value));
      render();
    });
  }

  portalPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const platform = pill.dataset.platform || "all";
      state.filters.platform.clear();
      if (platform !== "all") {
        state.filters.platform.add(platform);
      }
      if (platformSelect) {
        platformSelect.value = platform;
      }
      portalPills.forEach((p) => p.classList.toggle("is-active", p === pill));
      trackEvent("platform_pill_click", { platform, source: state.source });
      render();
    });
  });

  toggleToolsBtn?.addEventListener("click", () => {
    if (!toolsWrapper) return;
    const isHidden = toolsWrapper.hasAttribute("hidden");
    if (isHidden) {
      toolsWrapper.removeAttribute("hidden");
      toggleToolsBtn.setAttribute("aria-expanded", "true");
      toggleToolsBtn.querySelector(".js-expand-icon")?.style.setProperty("transform", "rotate(180deg)");
    } else {
      toolsWrapper.setAttribute("hidden", "");
      toggleToolsBtn.setAttribute("aria-expanded", "false");
      toggleToolsBtn.querySelector(".js-expand-icon")?.style.setProperty("transform", "rotate(0deg)");
    }
  });

  window.addEventListener("forex:updated", () => {
    if (visibleJobs.length) {
      render();
    }
  });

  profileForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    writeMatchProfile({
      targetRole: formData.get("targetRole"),
      skills: formData.get("skills"),
      experience: formData.get("experience"),
      expectedSalary: formData.get("expectedSalary"),
      timezone: formData.get("timezone")
    });
    if (state.sort === "relevant") state.sort = "match";
    profileForm.classList.remove("profile-form--editing");
    trackEvent("profile_match_save", { source: state.source });
    showSnackbar("Profil match disimpan.");
    render();
  });

  editProfileButton?.addEventListener("click", () => {
    profileForm.classList.add("profile-form--editing");
  });

  clearProfileButton?.addEventListener("click", () => {
    populateProfileForm(clearMatchProfile());
    profileForm.classList.remove("profile-form--editing");
    if (state.sort === "match") state.sort = "relevant";
    trackEvent("profile_match_reset", { source: state.source });
    showSnackbar("Profil match direset.");
    render();
  });

  saveSearchButton?.addEventListener("click", () => {
    const saved = saveSearch(state, visibleJobs);
    markSearchSeen(saved.id, visibleJobs);
    trackEvent("job_alert_save", {
      source: state.source,
      query: state.query.trim(),
      resultCount: visibleJobs.length
    });
    showSnackbar("Job alert tersimpan di browser ini.");
    renderSavedSearches();
  });

  savedSearchList?.addEventListener("click", (event) => {
    const card = event.target.closest(".saved-search-card");
    if (!card) return;
    const id = card.dataset.searchId;
    const saved = readSavedSearches().find((item) => item.id === id);
    if (!saved) return;

    if (event.target.closest(".js-delete-search")) {
      deleteSavedSearch(id);
      trackEvent("job_alert_delete", { source: saved.state.source });
      showSnackbar("Job alert dihapus.");
      renderSavedSearches();
      return;
    }

    if (event.target.closest(".js-mark-seen")) {
      markSearchSeen(id, jobsForSavedSearch(saved));
      trackEvent("job_alert_seen", { source: saved.state.source });
      showSnackbar("Job alert ditandai sudah dilihat.");
      renderSavedSearches();
      return;
    }

    if (event.target.closest(".js-open-search")) {
      const nextState = hydrateSearchState(saved.state);
      const sourceChanged = nextState.source !== state.source;
      copySearchState(state, nextState);
      input.value = state.query;
      renderFilterChips(filterRow, state, allJobs);
      if (sourceChanged) {
        refreshJobs();
      } else {
        render();
      }
      trackEvent("job_alert_open", { source: saved.state.source, query: saved.state.query || "" });
      return;
    }
  });

  resetButton.addEventListener("click", () => {
    resetFilters(state);
    input.value = "";
    sortSelect.value = "relevant";
    portalPills.forEach((p) => p.classList.toggle("is-active", (p.dataset.platform || "all") === "all"));
    renderFilterChips(filterRow, state, allJobs);
    render();
  });

  document.querySelectorAll(".search-suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      resetFilters(state);
      state.query = chip.dataset.query || "";
      input.value = state.query;
      portalPills.forEach((p) => p.classList.toggle("is-active", (p.dataset.platform || "all") === "all"));
      renderFilterChips(filterRow, state, allJobs);
      render();
    });
  });

  initBookmarkButtons(page, ({ bookmarked }) => {
    showSnackbar(bookmarked ? "Lowongan disimpan" : "Lowongan dihapus dari tersimpan");
  });

  document.getElementById("reset-filters-empty")?.addEventListener("click", () => {
    resetButton.click();
  });

  // Mobile Bottom Sheet Filter Drawer controls
  const filterSidebar = document.getElementById("search-filter-sidebar");
  const mobileFilterOpenBtn = document.getElementById("mobile-filter-open-btn");
  const closeFilterBtn = document.getElementById("close-filter-sidebar");

  mobileFilterOpenBtn?.addEventListener("click", () => {
    filterSidebar?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  });

  const closeMobileFilter = () => {
    filterSidebar?.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  closeFilterBtn?.addEventListener("click", closeMobileFilter);
  filterSidebar?.addEventListener("click", (e) => {
    if (e.target === filterSidebar) closeMobileFilter();
  });

  // WTTJ Mode Choice Pills (Remote, Hybrid, Onsite)
  document.querySelectorAll("[data-mode-val]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.modeVal;
      const wasActive = btn.classList.contains("is-active");
      document.querySelectorAll("[data-mode-val]").forEach((b) => b.classList.remove("is-active"));
      state.filters.type.delete("Remote");
      state.filters.type.delete("Hybrid");
      state.filters.type.delete("On-site");
      if (!wasActive) {
        btn.classList.add("is-active");
        if (val === "remote") state.filters.type.add("Remote");
        else if (val === "hybrid") state.filters.type.add("Hybrid");
        else state.filters.type.add("On-site");
      }
      render();
    });
  });

  // WTTJ Sub-nav Tabs (Semua Loker, Loker Baru)
  const tabAll = document.getElementById("tab-all-jobs");
  const tabNew = document.getElementById("tab-new-jobs");
  tabAll?.addEventListener("click", () => {
    tabAll.classList.add("is-active");
    tabNew?.classList.remove("is-active");
    state.query = state.query.replace(/\bbaru\b/gi, "").trim();
    input.value = state.query;
    render();
  });
  tabNew?.addEventListener("click", () => {
    tabNew.classList.add("is-active");
    tabAll?.classList.remove("is-active");
    if (!state.query.toLowerCase().includes("baru")) {
      state.query = `${state.query} baru`.trim();
      input.value = state.query;
    }
    render();
  });

  // Booster Banner dismissal
  const boosterBanner = document.getElementById("search-booster-banner");
  const closeBoosterBtn = document.getElementById("close-booster-banner");
  closeBoosterBtn?.addEventListener("click", () => {
    if (boosterBanner) boosterBanner.style.display = "none";
    try {
      localStorage.setItem("jsa_dismiss_booster", "1");
    } catch (_) {}
  });
  try {
    if (localStorage.getItem("jsa_dismiss_booster") === "1" && boosterBanner) {
      boosterBanner.style.display = "none";
    }
  } catch (_) {}

  [50, 400, 1200].forEach((delay) => {
    window.setTimeout(syncControls, delay);
  });

  refreshJobs();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchPage);
  } else {
    initSearchPage();
  }
}
