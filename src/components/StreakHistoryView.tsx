import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Snowflake,
  Trophy,
  Calendar,
  Utensils,
  Award,
} from 'lucide-react';
import { UserStreakData } from '../types';
import { getLocalDateKey } from '../lib/streakStore';

interface StreakHistoryViewProps {
  streak: UserStreakData;
  onBack: () => void;
  onOpenBadges: () => void;
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StreakHistoryView({
  streak,
  onBack,
  onOpenBadges,
}: StreakHistoryViewProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0..11

  const todayKey = getLocalDateKey(now);
  const cookedSet = useMemo(() => new Set(streak.cookedDates), [streak.cookedDates]);
  const freezeSet = useMemo(() => new Set(streak.freezeDates), [streak.freezeDates]);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Total recipes cooked in the currently viewed month (with fallback to cooked days in that month)
  const recipesThisMonth = useMemo(() => {
    const logged = streak.monthlyRecipeCounts?.[monthKey];
    if (typeof logged === 'number' && logged > 0) return logged;
    return streak.cookedDates.filter((d) => d.startsWith(monthKey)).length;
  }, [streak.monthlyRecipeCounts, streak.cookedDates, monthKey]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Convert JS getDay (0=Sun..6=Sat) into Monday-first offset (0=Mon..6=Sun)
    const leadingBlanks = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cells: ({ dayNum: number; dateKey: string } | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${monthKey}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateKey });
    }
    return cells;
  }, [viewYear, viewMonth, monthKey]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--card)] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          type="button"
          onClick={onOpenBadges}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--card)] hover:bg-[var(--soft-highlight)] hover:text-[var(--soft-highlight-text)] border border-[var(--card-border)] shadow-[var(--card-shadow)] text-xs sm:text-sm font-medium text-[var(--text)] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Award className="w-4 h-4 text-[var(--accent-on-card)]" />
          <span>View badges ({streak.unlockedBadges.length})</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
          Cooking Consistency
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
          Streak history
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Track your daily cooking streaks, Streak Freezes, and monthly progress.
        </p>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 space-y-1">
          <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[var(--accent-on-card)]" />
            <span>Current streak</span>
          </span>
          <p className="font-serif text-2xl font-semibold text-[var(--text)] tabular-nums">
            {streak.cookingStreak} {streak.cookingStreak === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 space-y-1">
          <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[var(--accent-on-card)]" />
            <span>Longest streak</span>
          </span>
          <p className="font-serif text-2xl font-semibold text-[var(--text)] tabular-nums">
            {streak.bestCookingStreak}{' '}
            {streak.bestCookingStreak === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 space-y-1">
          <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary-text)]" />
            <span>Total days cooked</span>
          </span>
          <p className="font-serif text-2xl font-semibold text-[var(--text)] tabular-nums">
            {streak.cookedDates.length}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 space-y-1">
          <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[var(--primary-text)]" />
            <span>Recipes this month</span>
          </span>
          <p className="font-serif text-2xl font-semibold text-[var(--text)] tabular-nums">
            {recipesThisMonth}
          </p>
        </div>
      </div>

      {/* Monthly Calendar */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
            {monthLabel}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="min-h-[44px] min-w-[44px] rounded-lg bg-[var(--surface-nested)] border border-[var(--subtle)] flex items-center justify-center text-[var(--text)] hover:border-[var(--primary)] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="min-h-[44px] min-w-[44px] rounded-lg bg-[var(--surface-nested)] border border-[var(--subtle)] flex items-center justify-center text-[var(--text)] hover:border-[var(--primary)] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {WEEKDAY_HEADERS.map((wd) => (
            <div
              key={wd}
              className="text-xs font-semibold text-[var(--text-secondary)] py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`blank-${idx}`} className="h-12 sm:h-14" />;
            }

            const isCooked = cookedSet.has(cell.dateKey);
            const isFrozen = !isCooked && freezeSet.has(cell.dateKey);
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={cell.dateKey}
                className={`h-12 sm:h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 tabular-nums transition-colors ${
                  isCooked
                    ? 'bg-[var(--primary)]/20 border-[var(--primary)]'
                    : isFrozen
                    ? 'bg-[var(--freeze-bg)] border-[var(--freeze-border)]'
                    : 'bg-[var(--surface-nested)] border-[var(--subtle)]/70'
                } ${isToday ? 'ring-2 ring-[var(--accent)]' : ''}`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isToday
                      ? 'text-[var(--accent-on-card)] font-bold'
                      : isFrozen
                      ? 'text-[var(--freeze-text)]'
                      : 'text-[var(--text)]'
                  }`}
                >
                  {cell.dayNum}
                </span>
                {isCooked ? (
                  <Flame
                    aria-label="Cooked"
                    className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]"
                  />
                ) : isFrozen ? (
                  <Snowflake
                    aria-label="Streak Freeze used"
                    className="w-3.5 h-3.5 text-[var(--freeze-text)]"
                  />
                ) : (
                  <span className="h-3.5" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
            <span>Cooked day</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Snowflake className="w-3.5 h-3.5 text-[var(--freeze-text)]" />
            <span>Streak Freeze saved</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[var(--accent)]" />
            <span>Today</span>
          </span>
        </div>
      </section>
    </div>
  );
}
