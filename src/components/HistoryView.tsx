import React from 'react';
import { Clock, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import { Recipe, SearchHistoryItem } from '../types';

interface HistoryViewProps {
  history: SearchHistoryItem[];
  isLoading: boolean;
  onRestoreSearch: (item: SearchHistoryItem) => void;
  onViewHistoryRecipes: (item: SearchHistoryItem) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onDeleteHistoryItem: (historyId: string) => void;
  onGoHome: () => void;
}

function formatHistoryDate(iso: string) {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

export function HistoryView({
  history,
  isLoading,
  onRestoreSearch,
  onViewHistoryRecipes,
  onViewRecipe,
  onDeleteHistoryItem,
  onGoHome,
}: HistoryViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B42B2F] dark:text-[#D9B9AA]">
          Kitchen Log
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
          Search history
        </h1>
        <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
          Your recent pantry searches and recipe suggestions
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 h-32 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && history.length === 0 && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-10 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#3D4547]/15 dark:border-[#424844] text-[#6E7234] dark:text-[#B5B86F] mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[#3D4547] dark:text-[#EDEEE9]">
              No searches yet
            </h2>
            <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
              Your past ingredient searches and recipe results will appear here automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Search ingredients
          </button>
        </div>
      )}

      {!isLoading && history.length > 0 && (
        <div className="space-y-4">
          {history.map((item) => (
            <article
              key={item.id}
              className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 space-y-4 transition-colors duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-serif text-base font-semibold text-[#3D4547] dark:text-[#EDEEE9]">
                    {item.ingredients.join(', ')}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#535C5E] dark:text-[#B8B9AF] tabular-nums">
                    <span>{formatHistoryDate(item.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.filters.maxTimeMinutes > 0
                        ? `Max ${item.filters.maxTimeMinutes} min`
                        : 'Any time'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.filters.diet}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.filters.servings} servings</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRestoreSearch(item)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Load inputs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    aria-label="Delete search from history"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#B42B2F] dark:hover:text-[#D65356] hover:bg-[#EDEEE9]/60 dark:hover:bg-[#343A36] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.recipes && item.recipes.length > 0 && (
                <div className="pt-3 border-t border-[#3D4547]/15 dark:border-[#424844] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF]">
                      Suggested recipes
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewHistoryRecipes(item)}
                      className="text-xs font-medium text-[#B42B2F] dark:text-[#D9B9AA] hover:underline cursor-pointer"
                    >
                      View all {item.recipes.length}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {item.recipes.map((r, rIdx) => (
                      <button
                        key={`${item.id}-r-${rIdx}`}
                        type="button"
                        onClick={() => onViewRecipe(r)}
                        className="min-h-[44px] p-3 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] hover:border-[#9C9F52] dark:hover:border-[#B5B86F] border border-[#3D4547]/15 dark:border-[#424844] text-left flex items-center justify-between gap-2 transition-colors duration-200 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#3D4547] dark:text-[#EDEEE9] truncate">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-[#535C5E] dark:text-[#B8B9AF] tabular-nums">
                            {r.totalTimeMinutes} min · {r.difficulty}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6E7234] dark:text-[#B5B86F] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
