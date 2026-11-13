import React from 'react';
import { Home, Heart, Clock } from 'lucide-react';
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
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#EDEEE9]/95 dark:bg-[#191E1F]/95 backdrop-blur-md border-t border-[#3D4547]/15 dark:border-[#424844] transition-colors duration-200"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer relative focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#9C9F52] ${
                isActive
                  ? 'text-[#3D4547] dark:text-[#B5B86F] font-semibold'
                  : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#9C9F52] dark:bg-[#B5B86F]"
                />
              )}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 ${
                    isActive && tab.id === 'favorites'
                      ? 'fill-[#B42B2F] text-[#B42B2F] dark:fill-[#D65356] dark:text-[#D65356]'
                      : isActive
                      ? 'text-[#6E7234] dark:text-[#B5B86F]'
                      : ''
                  }`}
                />
                {tab.id === 'favorites' && favoritesCount > 0 && (
                  <span className="ml-1 text-[10px] font-medium tabular-nums text-[#B42B2F] dark:text-[#D9B9AA]">
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
