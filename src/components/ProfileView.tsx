import React from 'react';
import {
  ArrowLeft,
  Award,
  Flame,
  Lock,
  Settings,
  Snowflake,
  Trophy,
  User,
} from 'lucide-react';
import { UserProfile, UserStreakData } from '../types';
import { STREAK_BADGES } from '../lib/streakStore';

interface ProfileViewProps {
  userEmail: string;
  userProfile: UserProfile | null;
  streak: UserStreakData;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenStreakHistory: () => void;
}

export function ProfileView({
  userEmail,
  userProfile,
  streak,
  onBack,
  onOpenSettings,
  onOpenStreakHistory,
}: ProfileViewProps) {
  const unlockedSet = new Set(streak.unlockedBadges);
  const displayName = userProfile?.displayName || userEmail.split('@')[0] || 'Chef';

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
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--card)] hover:bg-[var(--soft-highlight)] hover:text-[var(--soft-highlight-text)] border border-[var(--card-border)] shadow-[var(--card-shadow)] text-xs sm:text-sm font-medium text-[var(--text)] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[var(--primary-text)]" />
          <span>Settings & data</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-btn)] text-[var(--primary-btn-text)] flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
              Chef Profile
            </p>
            <h1 className="font-serif text-2xl font-semibold text-[var(--text)]">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {userEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenStreakHistory}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] hover:border-[var(--accent)] text-xs sm:text-sm font-medium text-[var(--text)] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Flame className="w-4 h-4 text-[var(--accent)]" />
          <span>
            {streak.cookingStreak}-day streak · {streak.freezes}/2{' '}
            <Snowflake className="w-3.5 h-3.5 inline text-[var(--freeze-text)]" />
          </span>
        </button>
      </section>

      {/* Streak Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 text-center space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Cooking streak</p>
          <p className="font-serif text-xl sm:text-2xl font-semibold text-[var(--text)] tabular-nums">
            {streak.cookingStreak}d
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 text-center space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Visit streak</p>
          <p className="font-serif text-xl sm:text-2xl font-semibold text-[var(--text)] tabular-nums">
            {streak.visitStreak}d
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 text-center space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Best streak</p>
          <p className="font-serif text-xl sm:text-2xl font-semibold text-[var(--text)] tabular-nums flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4 text-[var(--accent-on-card)]" />
            {streak.bestCookingStreak}d
          </p>
        </div>
      </div>

      {/* Badges Section */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
              Cooking badges
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Earn badges as you build your daily cooking habit.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--text)] tabular-nums">
            {streak.unlockedBadges.length} / {STREAK_BADGES.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STREAK_BADGES.map((badge) => {
            const unlocked = unlockedSet.has(badge.id);

            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 flex items-start gap-3.5 transition-colors ${
                  unlocked
                    ? 'bg-[var(--surface-nested)] border-[var(--accent)]'
                    : 'bg-[var(--surface-nested)]/60 border-[var(--subtle)] opacity-70 grayscale'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    unlocked
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--subtle)]/30 text-[var(--text-secondary)]'
                  }`}
                >
                  {unlocked ? (
                    <Award className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-base font-semibold text-[var(--text)]">
                      {badge.name}
                    </h3>
                    {unlocked && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--secondary)] text-[var(--secondary-text)]">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {badge.requirementText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
