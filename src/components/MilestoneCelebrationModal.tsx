import React, { useEffect, useState } from 'react';
import { Award, Flame, Sparkles, X } from 'lucide-react';
import { StreakMilestone } from '../types';
import { MILESTONE_TITLES } from '../lib/streakStore';

interface MilestoneCelebrationModalProps {
  milestone: StreakMilestone | null;
  onClose: () => void;
}

const CONFETTI_PIECES = [
  { left: '8%', delay: '0s', color: 'var(--accent)' },
  { left: '16%', delay: '0.25s', color: 'var(--primary)' },
  { left: '24%', delay: '0.1s', color: 'var(--secondary)' },
  { left: '32%', delay: '0.4s', color: 'var(--accent)' },
  { left: '42%', delay: '0.15s', color: 'var(--primary)' },
  { left: '52%', delay: '0.35s', color: 'var(--soft-highlight)' },
  { left: '61%', delay: '0.05s', color: 'var(--accent)' },
  { left: '70%', delay: '0.3s', color: 'var(--primary)' },
  { left: '79%', delay: '0.2s', color: 'var(--secondary)' },
  { left: '88%', delay: '0.45s', color: 'var(--accent)' },
  { left: '94%', delay: '0.12s', color: 'var(--primary)' },
];

export function MilestoneCelebrationModal({
  milestone,
  onClose,
}: MilestoneCelebrationModalProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!milestone) return null;

  const badgeTitle = MILESTONE_TITLES[milestone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
      className="fixed inset-0 z-50 bg-[#1F2A36]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Confetti Animation (disabled when user prefers reduced motion) */}
      {!reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          {CONFETTI_PIECES.map((piece, idx) => (
            <span
              key={idx}
              className="animate-streak-confetti absolute top-0 w-2.5 h-4 rounded-xs"
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl border-2 border-[var(--accent)] shadow-[var(--card-shadow)] p-6 sm:p-8 text-center space-y-5 transition-colors duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close milestone popup"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Emblem */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-[var(--accent)] text-[var(--accent-text)] border-4 border-[var(--card)] shadow-md flex items-center justify-center">
          <Award className="w-11 h-11" />
          <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[var(--primary-btn)] text-[var(--primary-btn-text)] flex items-center justify-center border-2 border-[var(--card)]">
            <Flame className="w-4 h-4 fill-current" />
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-on-card)] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Milestone Reached</span>
          </p>
          <h2
            id="milestone-modal-title"
            className="font-serif text-3xl font-semibold text-[var(--text)]"
          >
            {milestone}-Day Streak!
          </h2>
          <p className="inline-block px-3 py-1 rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--secondary-text)]">
            Badge Earned: {badgeTitle}
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
            Congratulations on cooking {milestone} days in a row! Every homemade meal adds up.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Keep cooking
        </button>
      </div>
    </div>
  );
}
