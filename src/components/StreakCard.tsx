import React from 'react';
import {
  Flame,
  Snowflake,
  ChevronRight,
  Search,
  Bell,
  X,
  Trophy,
} from 'lucide-react';
import { UserStreakData } from '../types';
import { getCurrentWeekDays, getLocalDateKey } from '../lib/streakStore';

interface StreakCardProps {
  streak: UserStreakData;
  justExtendedDays: number | null;
  showEveningReminder: boolean;
  onOpenHistory: () => void;
  onFindRecipe: () => void;
  onDismissFreezeNotice: () => void;
  onDismissExtendedBanner: () => void;
}

export function StreakCard({
  streak,
  justExtendedDays,
  showEveningReminder,
  onOpenHistory,
  onFindRecipe,
  onDismissFreezeNotice,
  onDismissExtendedBanner,
}: StreakCardProps) {
  const todayKey = getLocalDateKey();
  const weekDays = getCurrentWeekDays();
  const cookedSet = new Set(streak.cookedDates);
  const freezeSet = new Set(streak.freezeDates);
  const cookedToday = cookedSet.has(todayKey);

  return (
    <section
      aria-label="Cooking streak summary"
      className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] transition-colors duration-200 overflow-hidden"
    >
      {/* Evening Reminder Banner (after 6 PM when streak >= 2 and not cooked today) */}
      {showEveningReminder && (
        <div
          role="status"
          className="px-4 sm:px-6 py-2.5 bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2 transition-colors duration-200"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Your {streak.cookingStreak}-day streak ends tonight!</span>
          </div>
          <button
            type="button"
            onClick={onFindRecipe}
            className="min-h-[34px] px-3 py-1 rounded-md bg-[var(--accent)] text-[var(--accent-text)] text-xs font-semibold transition-colors duration-200 cursor-pointer hover:opacity-90"
          >
            Find a recipe
          </button>
        </div>
      )}

      {/* Streak Freeze Saved Notice */}
      {streak.pendingFreezeNotice && (
        <div
          role="status"
          className="px-4 sm:px-6 py-2.5 bg-[var(--freeze-bg)] text-[var(--freeze-text)] border-b border-[var(--border)] flex items-center justify-between gap-2 transition-colors duration-200"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Snowflake className="w-4 h-4 shrink-0" />
            <span>Your Streak Freeze saved your streak.</span>
          </div>
          <button
            type="button"
            onClick={onDismissFreezeNotice}
            aria-label="Dismiss Streak Freeze notice"
            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md opacity-80 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Streak Extended Celebration Banner */}
      {justExtendedDays !== null && (
        <div
          role="status"
          className="px-4 sm:px-6 py-2.5 bg-[var(--secondary)] text-[var(--secondary-text)] border-b border-[var(--border)] flex items-center justify-between gap-2 transition-colors duration-200"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Flame className="w-4 h-4 shrink-0 text-[var(--accent)] fill-[var(--accent)] animate-streak-flame" />
            <span>
              Streak extended! {justExtendedDays}{' '}
              {justExtendedDays === 1 ? 'day' : 'days'}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismissExtendedBanner}
            aria-label="Dismiss streak extended message"
            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md opacity-80 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clickable Main Body -> Opens Streak History */}
      <div className="p-5 sm:p-6 space-y-5">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenHistory}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenHistory();
            }
          }}
          aria-label="Open Streak history calendar"
          className="flex flex-wrap items-start justify-between gap-4 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)] group"
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                streak.cookingStreak > 0
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface-nested)] border border-[var(--border)] text-[var(--text-secondary)]'
              } ${justExtendedDays !== null ? 'animate-streak-flame' : ''}`}
            >
              <Flame
                className={`w-6 h-6 ${
                  streak.cookingStreak > 0 ? 'fill-current' : ''
                }`}
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--text)] tabular-nums">
                  {streak.cookingStreak}-day streak
                </h2>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] flex flex-wrap items-center gap-x-2.5 gap-y-0.5 tabular-nums">
                <span>
                  Visit streak:{' '}
                  <strong className="font-semibold text-[var(--text)]">
                    {streak.visitStreak} {streak.visitStreak === 1 ? 'day' : 'days'}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[var(--accent-on-card)]" />
                  Best:{' '}
                  <strong className="font-semibold text-[var(--text)]">
                    {streak.bestCookingStreak}{' '}
                    {streak.bestCookingStreak === 1 ? 'day' : 'days'}
                  </strong>
                </span>
              </p>
            </div>
          </div>

          {/* Streak Freezes Stored */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--freeze-bg)] border border-[var(--freeze-border)] text-xs font-medium text-[var(--freeze-text)] tabular-nums shrink-0 transition-colors duration-200">
            <Snowflake className="w-3.5 h-3.5 shrink-0" />
            <span>Freezes: {streak.freezes}/2</span>
          </div>
        </div>

        {/* Mon to Sun 7-Day Row */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenHistory}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenHistory();
            }
          }}
          aria-label="Weekly cooking days, tap to view streak history"
          className="grid grid-cols-7 gap-2 pt-1 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
        >
          {weekDays.map(({ dayKey, shortLabel }) => {
            const isCooked = cookedSet.has(dayKey);
            const isFrozen = !isCooked && freezeSet.has(dayKey);
            const isToday = dayKey === todayKey;

            return (
              <div key={dayKey} className="flex flex-col items-center gap-1.5">
                <span
                  className={`text-[11px] font-medium ${
                    isToday
                      ? 'text-[var(--accent-on-card)] font-semibold'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {shortLabel}
                </span>

                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    isCooked
                      ? 'bg-[var(--primary)] text-[var(--primary-btn-text)]'
                      : isFrozen
                      ? 'bg-[var(--freeze-bg)] border-2 border-[var(--freeze-border)] text-[var(--freeze-text)]'
                      : 'bg-[var(--surface-nested)] border-2 border-[var(--subtle)] text-transparent'
                  } ${
                    isToday
                      ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--card)]'
                      : ''
                  }`}
                >
                  {isCooked ? (
                    <Flame className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
                  ) : isFrozen ? (
                    <Snowflake className="w-4 h-4" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gentle Prompt or Today's Completed State */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          {!cookedToday ? (
            <>
              <p className="text-xs sm:text-sm text-[var(--text)]">
                {streak.freshStartNotice && streak.cookingStreak === 0
                  ? "Fresh start! Let's cook today."
                  : 'Cook something today to keep your streak!'}
              </p>
              <button
                type="button"
                onClick={onFindRecipe}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find a recipe</span>
              </button>
            </>
          ) : (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-medium text-[var(--primary-text)] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
                <span>You cooked today! Streak is safe for today.</span>
              </p>
              <button
                type="button"
                onClick={onOpenHistory}
                className="min-h-[36px] text-xs font-semibold text-[var(--primary-text)] hover:underline cursor-pointer"
              >
                View streak history
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
