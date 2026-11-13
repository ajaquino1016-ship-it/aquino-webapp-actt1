import React from 'react';
import { Home, Heart, Calendar, Clock } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  favoritesCount: number;
  onSelectTab: (tab: AppTab) => void;
}

export function BottomNav({
  activeTab,
  favoritesCount,
  onSelectTab,
}: BottomNavProps) {
  const tabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--card-border)] shadow-[0_-2px_10px_rgba(31,42,54,0.05)] transition-colors duration-200"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200 cursor-pointer relative focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)] ${
                isActive
                  ? 'text-[var(--primary-text)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[var(--primary)]"
                />
              )}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 ${
                    isActive && tab.id === 'favorites'
                      ? 'fill-[var(--accent)] text-[var(--accent-on-card)]'
                      : isActive
                      ? 'text-[var(--primary-text)]'
                      : ''
                  }`}
                />
                {tab.id === 'favorites' && favoritesCount > 0 && (
                  <span className="ml-1 text-[10px] font-semibold tabular-nums text-[var(--accent-on-card)]">
                    ({favoritesCount})
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
