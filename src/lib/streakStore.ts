import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CookActionResult,
  StreakBadgeDefinition,
  StreakBadgeId,
  StreakMilestone,
  StreakSettings,
  UserStreakData,
} from '../types';

export const STREAK_MILESTONES: StreakMilestone[] = [3, 7, 14, 30, 60, 100];

export const STREAK_BADGES: StreakBadgeDefinition[] = [
  {
    id: 'first_flame',
    name: 'First Flame',
    requirementText: 'Cook your first meal',
    requiredDays: 1,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    requirementText: 'Reach a 7-day cooking streak',
    requiredDays: 7,
  },
  {
    id: 'fortnight_chef',
    name: 'Fortnight Chef',
    requirementText: 'Reach a 14-day cooking streak',
    requiredDays: 14,
  },
  {
    id: 'monthly_master',
    name: 'Monthly Master',
    requirementText: 'Reach a 30-day cooking streak',
    requiredDays: 30,
  },
  {
    id: 'century_cook',
    name: 'Century Cook',
    requirementText: 'Reach a 100-day cooking streak',
    requiredDays: 100,
  },
];

export const MILESTONE_TITLES: Record<StreakMilestone, string> = {
  3: '3-Day Spark',
  7: 'Week Warrior',
  14: 'Fortnight Chef',
  30: 'Monthly Master',
  60: '60-Day Dedication',
  100: 'Century Cook',
};

export const DEFAULT_STREAK_SETTINGS: StreakSettings = {
  notificationsEnabled: false,
  streakReminderEnabled: true,
  reminderTime: '18:00',
  lastNotifiedDate: null,
};

function getStreakStorageKey(userId: string): string {
  return `pantryai_${userId}_streak`;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(key: string): Date {
  const [yStr, mStr, dStr] = key.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  // Use local noon to protect against DST 23h/25h transitions
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const dt = parseLocalDateKey(dateKey);
  dt.setDate(dt.getDate() + days);
  return getLocalDateKey(dt);
}

export function diffCalendarDays(earlierKey: string, laterKey: string): number {
  const a = parseLocalDateKey(earlierKey);
  const b = parseLocalDateKey(laterKey);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function getCurrentWeekDays(
  referenceDate: Date = new Date()
): { dayKey: string; shortLabel: string }[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const jsDay = referenceDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const todayKey = getLocalDateKey(referenceDate);
  const mondayKey = addDaysToDateKey(todayKey, mondayOffset);

  return labels.map((shortLabel, idx) => ({
    dayKey: addDaysToDateKey(mondayKey, idx),
    shortLabel,
  }));
}

export function createDefaultStreakData(
  userId: string,
  settings: StreakSettings = DEFAULT_STREAK_SETTINGS
): UserStreakData {
  return {
    userId,
    visitStreak: 0,
    bestVisitStreak: 0,
    lastVisitDate: null,
    cookingStreak: 0,
    bestCookingStreak: 0,
    lastCookedDate: null,
    freezes: 0,
    cookedDates: [],
    freezeDates: [],
    unlockedBadges: [],
    celebratedMilestones: [],
    monthlyRecipeCounts: {},
    pendingFreezeNotice: false,
    freshStartNotice: false,
    settings: { ...settings },
    updatedAt: new Date().toISOString(),
  };
}

function isValidDateKey(val: unknown): val is string {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function sanitizeStreakData(
  userId: string,
  raw: Partial<UserStreakData> | null | undefined
): UserStreakData {
  const base = createDefaultStreakData(userId);
  if (!raw || typeof raw !== 'object') return base;

  const cookedDates = Array.isArray(raw.cookedDates)
    ? Array.from(new Set(raw.cookedDates.filter(isValidDateKey))).sort().slice(-1500)
    : [];

  const freezeDates = Array.isArray(raw.freezeDates)
    ? Array.from(new Set(raw.freezeDates.filter(isValidDateKey))).sort().slice(-400)
    : [];

  const validBadgeIds = new Set(STREAK_BADGES.map((b) => b.id));
  const unlockedBadges = Array.isArray(raw.unlockedBadges)
    ? Array.from(
        new Set(
          raw.unlockedBadges.filter((b): b is StreakBadgeId =>
            validBadgeIds.has(b as StreakBadgeId)
          )
        )
      )
    : [];

  const validMilestones = new Set<number>(STREAK_MILESTONES);
  const celebratedMilestones = Array.isArray(raw.celebratedMilestones)
    ? Array.from(
        new Set(
          raw.celebratedMilestones.filter((m): m is StreakMilestone =>
            validMilestones.has(Number(m))
          )
        )
      )
    : [];

  const monthlyRecipeCounts: Record<string, number> = {};
  if (raw.monthlyRecipeCounts && typeof raw.monthlyRecipeCounts === 'object') {
    for (const [k, v] of Object.entries(raw.monthlyRecipeCounts)) {
      if (/^\d{4}-\d{2}$/.test(k) && typeof v === 'number' && v >= 0) {
        monthlyRecipeCounts[k] = Math.floor(v);
      }
    }
  }

  const rawSettings = raw.settings;
  const settings: StreakSettings = {
    notificationsEnabled: Boolean(rawSettings?.notificationsEnabled),
    streakReminderEnabled:
      rawSettings?.streakReminderEnabled !== undefined
        ? Boolean(rawSettings.streakReminderEnabled)
        : true,
    reminderTime:
      typeof rawSettings?.reminderTime === 'string' &&
      /^\d{2}:\d{2}$/.test(rawSettings.reminderTime)
        ? rawSettings.reminderTime
        : '18:00',
    lastNotifiedDate: isValidDateKey(rawSettings?.lastNotifiedDate)
      ? rawSettings.lastNotifiedDate
      : null,
  };

  return {
    userId,
    visitStreak:
      typeof raw.visitStreak === 'number' && raw.visitStreak >= 0
        ? Math.floor(raw.visitStreak)
        : 0,
    bestVisitStreak:
      typeof raw.bestVisitStreak === 'number' && raw.bestVisitStreak >= 0
        ? Math.floor(raw.bestVisitStreak)
        : 0,
    lastVisitDate: isValidDateKey(raw.lastVisitDate) ? raw.lastVisitDate : null,
    cookingStreak:
      typeof raw.cookingStreak === 'number' && raw.cookingStreak >= 0
        ? Math.floor(raw.cookingStreak)
        : 0,
    bestCookingStreak:
      typeof raw.bestCookingStreak === 'number' && raw.bestCookingStreak >= 0
        ? Math.floor(raw.bestCookingStreak)
        : 0,
    lastCookedDate: isValidDateKey(raw.lastCookedDate) ? raw.lastCookedDate : null,
    freezes:
      typeof raw.freezes === 'number'
        ? Math.min(2, Math.max(0, Math.floor(raw.freezes)))
        : 0,
    cookedDates,
    freezeDates,
    unlockedBadges,
    celebratedMilestones,
    monthlyRecipeCounts,
    pendingFreezeNotice: Boolean(raw.pendingFreezeNotice),
    freshStartNotice: Boolean(raw.freshStartNotice),
    settings,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

function getLatestActiveCookingDate(data: UserStreakData): string | null {
  const candidates: string[] = [];
  if (data.lastCookedDate) candidates.push(data.lastCookedDate);
  if (data.cookedDates.length > 0) {
    candidates.push(data.cookedDates[data.cookedDates.length - 1]);
  }
  if (data.freezeDates.length > 0) {
    candidates.push(data.freezeDates[data.freezeDates.length - 1]);
  }
  if (candidates.length === 0) return null;
  candidates.sort();
  return candidates[candidates.length - 1];
}

function computeEarnedBadges(
  cookedDatesCount: number,
  bestCookingStreak: number,
  existing: StreakBadgeId[]
): { all: StreakBadgeId[]; newlyUnlocked: StreakBadgeId[] } {
  const nextSet = new Set<StreakBadgeId>(existing);
  const newlyUnlocked: StreakBadgeId[] = [];

  for (const badge of STREAK_BADGES) {
    const qualified =
      badge.id === 'first_flame'
        ? cookedDatesCount >= 1
        : bestCookingStreak >= badge.requiredDays;
    if (qualified && !nextSet.has(badge.id)) {
      nextSet.add(badge.id);
      newlyUnlocked.push(badge.id);
    }
  }

  return { all: Array.from(nextSet), newlyUnlocked };
}

/**
 * Evaluates visit streak & cooking streak (including Streak Freeze protection)
 * using the device's local calendar date. Safe against DST, timezone jumps,
 * and minor backward clock changes.
 */
export function evaluateStreakOnAppOpen(
  input: UserStreakData,
  now: Date = new Date()
): UserStreakData {
  const todayKey = getLocalDateKey(now);
  let changed = false;

  let visitStreak = input.visitStreak;
  let bestVisitStreak = input.bestVisitStreak;
  let lastVisitDate = input.lastVisitDate;

  // 1. Evaluate Visit Streak
  if (!lastVisitDate) {
    visitStreak = 1;
    bestVisitStreak = Math.max(bestVisitStreak, 1);
    lastVisitDate = todayKey;
    changed = true;
  } else {
    const visitDiff = diffCalendarDays(lastVisitDate, todayKey);
    if (visitDiff === 1) {
      visitStreak += 1;
      bestVisitStreak = Math.max(bestVisitStreak, visitStreak);
      lastVisitDate = todayKey;
      changed = true;
    } else if (visitDiff > 1) {
      visitStreak = 1;
      bestVisitStreak = Math.max(bestVisitStreak, 1);
      lastVisitDate = todayKey;
      changed = true;
    }
    // visitDiff <= 0: same local day or timezone/clock shift backwards -> keep streak intact!
  }

  // 2. Evaluate Cooking Streak & Auto-apply Streak Freeze if missed yesterday
  let cookingStreak = input.cookingStreak;
  let freezes = input.freezes;
  const freezeDates = [...input.freezeDates];
  let pendingFreezeNotice = input.pendingFreezeNotice;
  let freshStartNotice = input.freshStartNotice;

  const latestActive = getLatestActiveCookingDate(input);
  if (latestActive && cookingStreak > 0) {
    const cookDiff = diffCalendarDays(latestActive, todayKey);
    if (cookDiff > 1) {
      const missedDays = cookDiff - 1;
      if (freezes >= missedDays) {
        // Consume freezes for the missed day(s) automatically
        for (let offset = 1; offset <= missedDays; offset++) {
          const missedKey = addDaysToDateKey(latestActive, offset);
          if (!freezeDates.includes(missedKey)) {
            freezeDates.push(missedKey);
          }
        }
        freezeDates.sort();
        freezes -= missedDays;
        pendingFreezeNotice = true;
        freshStartNotice = false;
        changed = true;
      } else {
        // Streak resets to 0 with gentle fresh-start encouragement
        cookingStreak = 0;
        freshStartNotice = true;
        changed = true;
      }
    }
  }

  const badgeCheck = computeEarnedBadges(
    input.cookedDates.length,
    Math.max(input.bestCookingStreak, cookingStreak),
    input.unlockedBadges
  );
  if (badgeCheck.newlyUnlocked.length > 0) {
    changed = true;
  }

  if (!changed) return input;

  return {
    ...input,
    visitStreak,
    bestVisitStreak,
    lastVisitDate,
    cookingStreak,
    freezes,
    freezeDates,
    unlockedBadges: badgeCheck.all,
    pendingFreezeNotice,
    freshStartNotice,
    updatedAt: new Date().toISOString(),
  };
}

export function recordCookingAction(
  input: UserStreakData,
  now: Date = new Date()
): CookActionResult {
  // First ensure today's visit/freeze state is up-to-date
  const evaluated = evaluateStreakOnAppOpen(input, now);
  const todayKey = getLocalDateKey(now);
  const monthKey = todayKey.slice(0, 7);

  const nextMonthlyCounts = {
    ...evaluated.monthlyRecipeCounts,
    [monthKey]: (evaluated.monthlyRecipeCounts[monthKey] || 0) + 1,
  };

  // Already cooked on this local calendar date?
  if (evaluated.cookedDates.includes(todayKey)) {
    const updated: UserStreakData = {
      ...evaluated,
      monthlyRecipeCounts: nextMonthlyCounts,
      freshStartNotice: false,
      updatedAt: new Date().toISOString(),
    };
    return {
      streak: updated,
      alreadyCookedToday: true,
      streakExtended: false,
      newCookingStreak: updated.cookingStreak,
      earnedFreeze: false,
      milestoneReached: null,
      newlyUnlockedBadges: [],
    };
  }

  const latestBeforeToday = getLatestActiveCookingDate(evaluated);
  let newCookingStreak = 1;
  if (latestBeforeToday) {
    const diff = diffCalendarDays(latestBeforeToday, todayKey);
    if (diff <= 1 && evaluated.cookingStreak > 0) {
      // Consecutive day (or timezone shift backwards while streak is active)
      newCookingStreak = evaluated.cookingStreak + 1;
    } else if (diff === 0 && evaluated.cookingStreak > 0) {
      newCookingStreak = evaluated.cookingStreak;
    }
  }

  const newBestCookingStreak = Math.max(evaluated.bestCookingStreak, newCookingStreak);
  const nextCookedDates = [...evaluated.cookedDates, todayKey].sort();

  // Earn 1 Streak Freeze every 7-day cooking streak (max 2 stored)
  let nextFreezes = evaluated.freezes;
  let earnedFreeze = false;
  if (newCookingStreak > 0 && newCookingStreak % 7 === 0 && nextFreezes < 2) {
    nextFreezes += 1;
    earnedFreeze = true;
  }

  // Unlock badges
  const badgeCheck = computeEarnedBadges(
    nextCookedDates.length,
    newBestCookingStreak,
    evaluated.unlockedBadges
  );

  // Check milestones (3, 7, 14, 30, 60, 100)
  let milestoneReached: StreakMilestone | null = null;
  const nextCelebrated = [...evaluated.celebratedMilestones];
  if (
    (STREAK_MILESTONES as number[]).includes(newCookingStreak) &&
    !nextCelebrated.includes(newCookingStreak as StreakMilestone)
  ) {
    milestoneReached = newCookingStreak as StreakMilestone;
    nextCelebrated.push(milestoneReached);
  }

  const updated: UserStreakData = {
    ...evaluated,
    cookingStreak: newCookingStreak,
    bestCookingStreak: newBestCookingStreak,
    lastCookedDate: todayKey,
    freezes: nextFreezes,
    cookedDates: nextCookedDates,
    unlockedBadges: badgeCheck.all,
    celebratedMilestones: nextCelebrated,
    monthlyRecipeCounts: nextMonthlyCounts,
    freshStartNotice: false,
    updatedAt: new Date().toISOString(),
  };

  return {
    streak: updated,
    alreadyCookedToday: false,
    streakExtended: true,
    newCookingStreak,
    earnedFreeze,
    milestoneReached,
    newlyUnlockedBadges: badgeCheck.newlyUnlocked,
  };
}

export function loadLocalStreak(userId: string): UserStreakData {
  try {
    const raw = localStorage.getItem(getStreakStorageKey(userId));
    if (!raw) return createDefaultStreakData(userId);
    return sanitizeStreakData(userId, JSON.parse(raw) as Partial<UserStreakData>);
  } catch {
    return createDefaultStreakData(userId);
  }
}

export function saveLocalStreak(userId: string, data: UserStreakData): void {
  try {
    localStorage.setItem(getStreakStorageKey(userId), JSON.stringify(data));
  } catch {
    // Ignore localStorage quota errors
  }
}

export async function saveUserStreak(
  userId: string,
  data: UserStreakData
): Promise<void> {
  const sanitized = sanitizeStreakData(userId, data);
  saveLocalStreak(userId, sanitized);

  const path = `users/${userId}/streak/current`;
  try {
    await setDoc(doc(db, 'users', userId, 'streak', 'current'), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

function mergeStreakRecords(
  userId: string,
  local: UserStreakData,
  remote: UserStreakData
): UserStreakData {
  const localTime = new Date(local.updatedAt).getTime() || 0;
  const remoteTime = new Date(remote.updatedAt).getTime() || 0;
  const primary = remoteTime >= localTime ? remote : local;
  const secondary = remoteTime >= localTime ? local : remote;

  const mergedCooked = Array.from(
    new Set([...primary.cookedDates, ...secondary.cookedDates])
  ).sort();
  const mergedFreezes = Array.from(
    new Set([...primary.freezeDates, ...secondary.freezeDates])
  ).sort();
  const mergedBadges = Array.from(
    new Set([...primary.unlockedBadges, ...secondary.unlockedBadges])
  );
  const mergedMilestones = Array.from(
    new Set([...primary.celebratedMilestones, ...secondary.celebratedMilestones])
  );

  const mergedMonthly: Record<string, number> = { ...secondary.monthlyRecipeCounts };
  for (const [k, v] of Object.entries(primary.monthlyRecipeCounts)) {
    mergedMonthly[k] = Math.max(mergedMonthly[k] || 0, v);
  }

  return sanitizeStreakData(userId, {
    ...primary,
    bestVisitStreak: Math.max(primary.bestVisitStreak, secondary.bestVisitStreak),
    bestCookingStreak: Math.max(primary.bestCookingStreak, secondary.bestCookingStreak),
    cookedDates: mergedCooked,
    freezeDates: mergedFreezes,
    unlockedBadges: mergedBadges,
    celebratedMilestones: mergedMilestones,
    monthlyRecipeCounts: mergedMonthly,
  });
}

export async function loadAndSyncUserStreak(
  userId: string,
  now: Date = new Date()
): Promise<UserStreakData> {
  const local = loadLocalStreak(userId);
  let base = local;

  try {
    const ref = doc(db, 'users', userId, 'streak', 'current');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const remote = sanitizeStreakData(
        userId,
        snap.data() as Partial<UserStreakData>
      );
      base = mergeStreakRecords(userId, local, remote);
    }
  } catch (err) {
    console.warn('Could not fetch remote streak, using local cache:', err);
  }

  const evaluated = evaluateStreakOnAppOpen(base, now);
  saveLocalStreak(userId, evaluated);

  if (evaluated !== base || base.visitStreak === 1) {
    saveUserStreak(userId, evaluated).catch(() => {});
  }

  return evaluated;
}

export async function resetUserStreak(
  userId: string,
  preserveSettings?: StreakSettings
): Promise<UserStreakData> {
  const fresh = createDefaultStreakData(userId, preserveSettings);
  // Keep visit streak at 1 for today's active session while resetting cooking streak & history
  const resetState: UserStreakData = {
    ...fresh,
    visitStreak: 1,
    bestVisitStreak: 1,
    lastVisitDate: getLocalDateKey(),
    updatedAt: new Date().toISOString(),
  };
  await saveUserStreak(userId, resetState);
  return resetState;
}
