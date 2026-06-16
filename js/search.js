import {
  getFilterOptions,
  rememberJobs,
  salaryAverage
} from "./data.js?v=20260616v";
import {
  JOB_SOURCES,
  PROVIDER_LABELS,
  loadJobsForSource
} from "./providers.js?v=20260616v";
import {
  escapeHtml,
  initBookmarkButtons,
  renderJobCard,
  showSnackbar
} from "./bookmark.js?v=20260616v";
import {
  clearMatchProfile,
  getProfileSummary,
  profileHasSignal,
  readMatchProfile,
  scoreJobForProfile,
  writeMatchProfile
} from "./profile.js?v=20260616v";
import {
  countNewJobs,
  deleteSavedSearch,
  markSearchSeen,
  readSavedSearches,
  saveSearch
} from "./saved-searches.js?v=20260616v";
import { recordPageView, trackEvent } from "./analytics.js?v=20260616v";

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
const DATA_CREDIT = "Data publik dari Remotive, Remote OK, Arbeitnow, dan Jobicy. Apply selalu diarahkan ke laman resmi, lalu bisa dicatat di tracker pribadi.";
const SOURCE_TITLES = {
  indonesia: "Remote dari Indonesia",
  anywhere: "Remote-anywhere",
  apac: "Remote Asia/APAC",
  international: "Remote Global"
};
const SOURCE_RESULT_LABELS = {
  indonesia: "lowongan bisa dilamar dari Indonesia",
  anywhere: "lowongan remote-anywhere",
  apac: "lowongan remote Asia/APAC",
  international: "lowongan remote global"
};

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
      salary: new Set()
    }
  };
}

function parseUrlState(state) {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || readLastSearch();
  state.source = JOB_SOURCES[params.get("source")] ? params.get("source") : state.source;
  state.sort = params.get("sort") || "relevant";

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
        data-filter-group="${chip.group}"
        data-filter-value="${chip.value}"
        aria-pressed="${String(active)}"
      >
        <span class="material-symbols-outlined" aria-hidden="true">${chip.icon}</span>
        ${chip.label}
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
  return [
    job.title,
    job.company,
    job.location,
    job.category,
    job.description,
    job.source?.name,
    (job.tags || []).join(" "),
    (job.requirements || []).join(" ")
  ].join(" ").toLowerCase();
}

function jobMatchesQuery(job, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = jobSearchText(job);
  const tokens = tokenizeSmartQuery(trimmed);
  const excluded = [];
  const positives = [];
  const orGroups = [];
  let currentOrGroup = [];
  let negateNext = false;
  let hasOr = false;

  tokens.forEach((token) => {
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

  if (excluded.some((term) => haystack.includes(term))) return false;
  if (hasOr) {
    if (currentOrGroup.length) orGroups.push(currentOrGroup);
    return orGroups.some((group) => group.every((term) => haystack.includes(term)));
  }

  return positives.every((term) => haystack.includes(term));
}

function jobMatchesFilters(job, filters) {
  if (filters.location.size && !filters.location.has(job.location)) return false;
  if (filters.category.size && !filters.category.has(job.category)) return false;

  for (const type of filters.type) {
    if (!(job.type || []).includes(type)) return false;
  }

  for (const value of filters.salary) {
    const filter = getSalaryFilter(value);
    if (filter && !filter.match(job)) return false;
  }

  return true;
}

function relevanceScore(job, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return new Date(job.posted).getTime();

  let score = 0;
  if (job.title.toLowerCase().includes(trimmed)) score += 10;
  if (job.company.toLowerCase().includes(trimmed)) score += 5;
  if ((job.tags || []).some((tag) => tag.toLowerCase().includes(trimmed))) score += 4;
  if (job.description.toLowerCase().includes(trimmed)) score += 2;
  if (job.location.toLowerCase().includes(trimmed)) score += 1;
  return score;
}

function sourceRank(job) {
  if (job.source?.key === "jobicy") return 4;
  if (job.source?.key === "remotive") return 3;
  if (job.source?.key === "remoteok") return 2;
  if (job.source?.key === "arbeitnow") return 1;
  return 0;
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
    if (state.sort === "latest") {
      return new Date(b.posted) - new Date(a.posted);
    }

    if (state.sort === "salary") {
      return salaryAverage(b) - salaryAverage(a);
    }

    if (state.sort === "match" && profileHasSignal(readMatchProfile())) {
      return scoreJobForProfile(b).score - scoreJobForProfile(a).score
        || new Date(b.posted) - new Date(a.posted);
    }

    if (!state.query.trim()) {
      return scopeRank(b, state.source) - scopeRank(a, state.source)
        || sourceRank(b) - sourceRank(a)
        || new Date(b.posted) - new Date(a.posted);
    }

    const scoreDiff = relevanceScore(b, state.query) - relevanceScore(a, state.query);
    return scoreDiff || new Date(b.posted) - new Date(a.posted);
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

  let allJobs = [];
  let visibleJobs = [];
  let currentLoadId = 0;

  input.value = state.query;
  populateProfileForm(readMatchProfile());
  syncControls();
  renderFilterChips(filterRow, state, allJobs);

  function syncControls() {
    sourceSelect.value = state.source;
    sortSelect.value = state.sort;
  }

  function populateProfileForm(profile) {
    if (!profileForm) return;
    profileForm.elements.targetRole.value = profile.targetRole || "";
    profileForm.elements.skills.value = profile.skills || "";
    profileForm.elements.experience.value = profile.experience || "";
    profileForm.elements.expectedSalary.value = profile.expectedSalary || "";
    profileForm.elements.timezone.value = profile.timezone || "Asia/Jakarta";
    renderProfileSummary(profile);
  }

  function renderProfileSummary(profile = readMatchProfile()) {
    if (!profileSummary) return;
    const summary = getProfileSummary(profile);
    profileSummary.textContent = summary || "Profil belum diisi.";
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
        <article class="saved-search-card" data-search-id="${item.id}">
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
    renderFilterChips(filterRow, state, allJobs);
    render();
  });

  initBookmarkButtons(page, ({ bookmarked }) => {
    showSnackbar(bookmarked ? "Lowongan disimpan" : "Lowongan dihapus dari tersimpan");
  });

  [50, 400, 1200].forEach((delay) => {
    window.setTimeout(syncControls, delay);
  });

  refreshJobs();
}

document.addEventListener("DOMContentLoaded", initSearchPage);
