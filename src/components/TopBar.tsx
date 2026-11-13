import React from 'react';
import { Leaf, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  onGoHome: () => void;
}

export function TopBar({ onGoHome }: TopBarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#EDEEE9]/95 dark:bg-[#191E1F]/95 backdrop-blur-md border-b border-[#3D4547]/15 dark:border-[#424844] transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] dark:focus-visible:outline-[#B5B86F] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#3D4547] dark:bg-[#B5B86F] text-[#EDEEE9] dark:text-[#191E1F] flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
            PantryAI
          </span>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {(userProfile?.displayName || user?.email) && (
            <span className="hidden sm:inline-block text-xs text-[#535C5E] dark:text-[#B8B9AF] truncate max-w-[160px] mr-1">
              {userProfile?.displayName || user?.email}
            </span>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#3D4547] dark:text-[#EDEEE9] hover:bg-[#ECD0C2]/60 dark:hover:bg-[#292F2D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] dark:focus-visible:outline-[#B5B86F]"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#B5B86F]" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#3D4547]/20 dark:border-[#424844] bg-transparent hover:bg-[#ECD0C2]/50 dark:hover:bg-[#292F2D] text-[#3D4547] dark:text-[#EDEEE9] text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
          >
            <LogOut className="w-3.5 h-3.5 text-[#535C5E] dark:text-[#B8B9AF]" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
