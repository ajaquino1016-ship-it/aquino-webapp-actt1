import React from 'react';
import { Leaf, Sun, Moon, LogOut, Settings, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  onGoHome: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  onGoHome,
  onOpenProfile,
  onOpenSettings,
}: TopBarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[var(--primary-btn)] text-[var(--primary-btn-text)] flex items-center justify-center transition-colors duration-200">
            <Leaf className="w-4 h-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--text)]">
            PantryAI
          </span>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Open profile and badges"
            title="Profile & badges"
            className="min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[var(--text)] hover:bg-[var(--soft-highlight)]/45 flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <User className="w-4 h-4 text-[var(--primary-text)] shrink-0" />
            {(userProfile?.displayName || user?.email) && (
              <span className="hidden sm:inline-block text-xs font-medium text-[var(--text)] truncate max-w-[140px]">
                {userProfile?.displayName || user?.email}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--soft-highlight)]/45 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--soft-highlight)]/45 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--primary-text)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-lg border border-[var(--border)] bg-transparent hover:bg-[var(--soft-highlight)]/45 text-[var(--text)] text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <LogOut className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
