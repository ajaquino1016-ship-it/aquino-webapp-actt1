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
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
          Kitchen Log
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
          Search history
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Your recent pantry searches and recipe suggestions
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-5 h-32 animate-pulse"
            >
              <div className="h-4 w-1/2 rounded bg-[var(--subtle)]/60 mb-3" />
              <div className="h-3.5 w-1/3 rounded bg-[var(--subtle)]/45" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && history.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-10 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
              No searches yet
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Your past ingredient searches and recipe results will appear here automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors duration-200 cursor-pointer"
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
              className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 space-y-4 transition-colors duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-serif text-base font-semibold text-[var(--text)]">
                    {item.ingredients.join(', ')}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)] tabular-nums">
                    <span>{formatHistoryDate(item.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.filters.maxTimeMinutes > 0
                        ? `Max ${item.filters.maxTimeMinutes} min`
                        : 'Any time'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.filters.diet}</span>
                    {item.filters.cuisine && item.filters.cuisine !== 'Any' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.filters.cuisine}</span>
                      </>
                    )}
                    {item.filters.mood && item.filters.mood !== 'Any' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.filters.mood}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{item.filters.servings} servings</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRestoreSearch(item)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] hover:opacity-90 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Load inputs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    aria-label="Delete search from history"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--warning-on-card)] hover:bg-[var(--surface-nested)] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.recipes && item.recipes.length > 0 && (
                <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Suggested recipes
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewHistoryRecipes(item)}
                      className="text-xs font-medium text-[var(--primary-text)] hover:underline cursor-pointer"
                    >
                      View all {item.recipes.length}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {item.recipes.map((r, rIdx) => {
                      const kcal = r.nutrition?.calories || 350;
                      return (
                        <button
                          key={`${item.id}-r-${rIdx}`}
                          type="button"
                          onClick={() => onViewRecipe(r)}
                          className="min-h-[44px] p-3 rounded-lg bg-[var(--surface-nested)] hover:border-[var(--primary)] border border-[var(--subtle)] text-left flex items-center justify-between gap-2 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-semibold text-[var(--text)] truncate">
                              {r.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] tabular-nums truncate">
                              {r.totalTimeMinutes} min · ~{kcal} kcal/serv (est.)
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--primary-text)] shrink-0" />
                        </button>
                      );
                    })}
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
