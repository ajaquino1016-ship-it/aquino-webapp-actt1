import React from 'react';
import {
  ArrowLeft,
  Heart,
  Clock,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  ChefHat,
  Utensils,
  Flame,
  Info,
} from 'lucide-react';
import { Recipe, RecipeFilters } from '../types';

interface ResultsViewProps {
  ingredients: string[];
  filters: RecipeFilters;
  recipes: Recipe[];
  noMatchReason: string | null;
  isLoading: boolean;
  error: string | null;
  favoriteIds: Set<string>;
  getRecipeId: (name: string) => string;
  onBackToHome: () => void;
  onRetry: () => void;
  onRelaxFilter: (patch: Partial<RecipeFilters>) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

export function ResultsView({
  ingredients,
  filters,
  recipes,
  noMatchReason,
  isLoading,
  error,
  favoriteIds,
  getRecipeId,
  onBackToHome,
  onRetry,
  onRelaxFilter,
  onViewRecipe,
  onToggleFavorite,
}: ResultsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-lg text-sm font-medium text-[var(--primary-text)] hover:bg-[var(--soft-highlight)]/40 flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit ingredients</span>
        </button>

        <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-1.5">
          <span>Using: {ingredients.join(', ')}</span>
          {filters.maxTimeMinutes > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>Max {filters.maxTimeMinutes} min</span>
            </>
          )}
          {filters.diet !== 'Any' && (
            <>
              <span aria-hidden="true">·</span>
              <span>{filters.diet}</span>
            </>
          )}
          {filters.cuisine !== 'Any' && (
            <>
              <span aria-hidden="true">·</span>
              <span>{filters.cuisine}</span>
            </>
          )}
          {filters.mood !== 'Any' && (
            <>
              <span aria-hidden="true">·</span>
              <span>{filters.mood}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{filters.servings} servings</span>
        </div>
      </div>

      {/* Loading State with Skeleton Loaders */}
      {isLoading && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-[var(--card-shadow)] transition-colors duration-200">
            <ChefHat className="w-5 h-5 text-[var(--primary-text)] animate-bounce shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                Checking your pantry...
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Matching your ingredients with 3 realistic recipes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-[var(--subtle)]/40 rounded w-3/4" />
                <div className="h-4 bg-[var(--subtle)]/30 rounded w-full" />
                <div className="h-3 bg-[var(--subtle)]/25 rounded w-2/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-[var(--subtle)]/40 rounded w-1/2" />
                  <div className="h-3 bg-[var(--subtle)]/35 rounded w-2/3" />
                </div>
                <div className="h-11 bg-[var(--subtle)]/40 rounded-lg w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-8 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[var(--warning)] border border-[var(--warning-border)] text-[var(--warning-text)] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try again</span>
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--primary)] text-[var(--primary-text)] hover:bg-[var(--soft-highlight)]/40 text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Back to ingredients
            </button>
          </div>
        </div>
      )}

      {/* Strict Filter No-Match State */}
      {!isLoading && !error && recipes.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-8 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--chip-text)] mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
              No matching recipes found
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {noMatchReason ||
                'No realistic recipe matched your current time and dietary constraints. Try relaxing one of your filters.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {filters.maxTimeMinutes > 0 && (
              <button
                type="button"
                onClick={() => onRelaxFilter({ maxTimeMinutes: 0 })}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors duration-200 cursor-pointer"
              >
                Set cooking time to Any
              </button>
            )}
            {filters.diet !== 'Any' && (
              <button
                type="button"
                onClick={() => onRelaxFilter({ diet: 'Any' })}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] text-sm font-medium transition-colors duration-200 cursor-pointer"
              >
                Set diet to Any
              </button>
            )}
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] text-sm font-medium transition-colors duration-200 cursor-pointer"
            >
              Adjust ingredients
            </button>
          </div>
        </div>
      )}

      {/* 3 Recipe Cards */}
      {!isLoading && !error && recipes.length > 0 && (
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
              Curated Selection
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              3 recipe ideas for you
            </h2>
          </div>

          {noMatchReason && (
            <div className="p-3.5 rounded-xl bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] border border-[var(--border)] flex items-start gap-2.5 text-xs sm:text-sm">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{noMatchReason}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {recipes.map((recipe, idx) => {
              const id = getRecipeId(recipe.name);
              const isFav = favoriteIds.has(id);
              const kcal = recipe.nutrition?.calories || 350;

              return (
                <article
                  key={`${id}-${idx}`}
                  className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 flex flex-col justify-between gap-4 transition-colors duration-200"
                >
                  <div className="space-y-3">
                    {/* Title + Utensils Icon + Favorite Heart */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-md bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--primary-text)] flex items-center justify-center shrink-0 mt-0.5">
                          <Utensils className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="font-serif text-xl font-semibold tracking-tight text-[var(--text)] leading-snug">
                          {recipe.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(recipe)}
                        aria-label={isFav ? 'Remove from favorites' : 'Save as favorite'}
                        className={`min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                          isFav
                            ? 'text-[var(--accent-on-card)] hover:bg-[var(--soft-highlight)]/35'
                            : 'text-[var(--text-secondary)] hover:text-[var(--accent-on-card)] hover:bg-[var(--soft-highlight)]/35'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav ? 'fill-[var(--accent)] text-[var(--accent)]' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Small Cuisine & Mood Tags */}
                    {(recipe.cuisine || recipe.mood) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {recipe.cuisine && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--chip-text)]">
                            {recipe.cuisine}
                          </span>
                        )}
                        {recipe.mood && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--accent)] text-[var(--accent-text)]">
                            {recipe.mood}
                          </span>
                        )}
                      </div>
                    )}

                    {/* One-line description */}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Clean Inline Metadata + Calories per serving estimate */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                        <span>{recipe.totalTimeMinutes} min</span>
                        <span aria-hidden="true">·</span>
                        <span>{recipe.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--accent-on-card)] flex items-center gap-1 tabular-nums">
                        <Flame className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                        <span>~{kcal} kcal per serving (est.)</span>
                      </p>
                    </div>

                    {/* You have & You need lists */}
                    <div className="pt-3 border-t border-[var(--border)] space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--primary-text)] flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>You have ({recipe.ingredientsHave.length})</span>
                        </p>
                        <ul className="space-y-1 text-xs text-[var(--secondary-text)] bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-2.5">
                          {recipe.ingredientsHave.map((ing, i) => (
                            <li key={i} className="leading-snug">
                              • {ing}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[var(--warning-on-card)] flex items-center gap-1.5 mb-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>You need ({recipe.ingredientsNeed.length})</span>
                        </p>
                        {recipe.ingredientsNeed.length === 0 ? (
                          <p className="text-xs text-[var(--text-secondary)] italic px-1">
                            Nothing extra needed!
                          </p>
                        ) : (
                          <ul className="space-y-1 text-xs text-[var(--need-text)] bg-[var(--need-bg)] border border-[var(--need-border)] rounded-lg p-2.5">
                            {recipe.ingredientsNeed.map((ing, i) => (
                              <li key={i} className="leading-snug">
                                • {ing.quantity ? `${ing.quantity} ` : ''}
                                {ing.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Recipe CTA */}
                  <button
                    type="button"
                    onClick={() => onViewRecipe(recipe)}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    View recipe
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
