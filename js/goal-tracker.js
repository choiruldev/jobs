/**
 * Weekly Application Goal & Job Search Momentum Tracker
 * Tracks weekly application goals, daily streaks, and search consistency.
 */

const GOAL_STORAGE_KEY = "jsa_weekly_goal_v1";

export const DEFAULT_GOAL = {
  targetPerWeek: 5,
  currentWeekCount: 0,
  currentStreakDays: 1,
  lastActivityDate: new Date().toISOString().split("T")[0],
  historyWeeks: []
};

export function readGoalData() {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    return raw ? { ...DEFAULT_GOAL, ...JSON.parse(raw) } : { ...DEFAULT_GOAL };
  } catch (err) {
    return { ...DEFAULT_GOAL };
  }
}

export function writeGoalData(data) {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}

export function recordApplicationActivity() {
  const goal = readGoalData();
  const today = new Date().toISOString().split("T")[0];

  if (goal.lastActivityDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (goal.lastActivityDate === yesterday) {
      goal.currentStreakDays += 1;
    } else {
      goal.currentStreakDays = 1;
    }
    goal.lastActivityDate = today;
  }

  goal.currentWeekCount += 1;
  writeGoalData(goal);
  return goal;
}

export function renderGoalBanner(container) {
  if (!container) return;
  const goal = readGoalData();
  const progressPercent = Math.min(100, Math.round((goal.currentWeekCount / (goal.targetPerWeek || 5)) * 100));

  container.innerHTML = `
    <div style="background:var(--md-sys-color-surface-container);border:1px solid var(--md-sys-color-outline-variant);border-radius:14px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">🔥</span>
        <div>
          <div style="font-size:14px;font-weight:800;color:var(--md-sys-color-primary);">
            Streak ${goal.currentStreakDays} Hari Konsisten!
          </div>
          <div style="font-size:12px;color:var(--md-sys-color-outline);">
            Target Pekan Ini: <strong>${goal.currentWeekCount} dari ${goal.targetPerWeek} lamaran</strong>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;min-width:180px;">
        <div style="flex:1;height:8px;background:var(--md-sys-color-outline-variant);border-radius:4px;overflow:hidden;">
          <div style="width:${progressPercent}%;height:100%;background:#2e7d32;border-radius:4px;"></div>
        </div>
        <span style="font-size:12px;font-weight:800;color:#2e7d32;">${progressPercent}%</span>
      </div>
    </div>
  `;
}
