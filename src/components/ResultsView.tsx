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
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-lg text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9] hover:bg-[#ECD0C2]/60 dark:hover:bg-[#292F2D] flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit ingredients</span>
        </button>

        <div className="text-xs text-[#535C5E] dark:text-[#B8B9AF] flex flex-wrap items-center gap-1.5">
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
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{filters.servings} servings</span>
        </div>
      </div>

      {/* Loading State with Skeleton Loaders */}
      {isLoading && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ECD0C2] dark:bg-[#292F2D] border border-[#3D4547]/15 dark:border-[#424844] transition-colors duration-200">
            <ChefHat className="w-5 h-5 text-[#6E7234] dark:text-[#B5B86F] animate-bounce shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9]">
                Checking your pantry...
              </p>
              <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
                Matching your ingredients with 3 realistic recipes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-[#EDEEE9] dark:bg-[#343A36] rounded w-3/4" />
                <div className="h-4 bg-[#EDEEE9]/80 dark:bg-[#343A36]/80 rounded w-full" />
                <div className="h-3 bg-[#EDEEE9]/70 dark:bg-[#343A36]/70 rounded w-2/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-[#EDEEE9] dark:bg-[#343A36] rounded w-1/2" />
                  <div className="h-3 bg-[#EDEEE9] dark:bg-[#343A36] rounded w-2/3" />
                </div>
                <div className="h-11 bg-[#EDEEE9] dark:bg-[#343A36] rounded-lg w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-8 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#B42B2F]/25 dark:border-[#D65356]/30 text-[#B42B2F] dark:text-[#D65356] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[#3D4547] dark:text-[#EDEEE9]">
              Something went wrong
            </h2>
            <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try again</span>
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
            >
              Back to ingredients
            </button>
          </div>
        </div>
      )}

      {/* Strict Filter No-Match State */}
      {!isLoading && !error && recipes.length === 0 && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-8 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#3D4547]/15 dark:border-[#424844] text-[#3D4547] dark:text-[#D9B9AA] mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[#3D4547] dark:text-[#EDEEE9]">
              No matching recipes found
            </h2>
            <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
              {noMatchReason ||
                'No realistic recipe matched your current time and dietary constraints. Try relaxing one of your filters.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {filters.maxTimeMinutes > 0 && (
              <button
                type="button"
                onClick={() => onRelaxFilter({ maxTimeMinutes: 0 })}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium transition-colors duration-200 cursor-pointer"
              >
                Set cooking time to Any
              </button>
            )}
            {filters.diet !== 'Any' && (
              <button
                type="button"
                onClick={() => onRelaxFilter({ diet: 'Any' })}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-sm font-medium transition-colors duration-200 cursor-pointer"
              >
                Set diet to Any
              </button>
            )}
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#3D4547]/20 dark:border-[#424844] hover:border-[#9C9F52] dark:hover:border-[#B5B86F] text-[#3D4547] dark:text-[#EDEEE9] text-sm font-medium transition-colors duration-200 cursor-pointer"
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
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B42B2F] dark:text-[#D9B9AA]">
              Curated Selection
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
              3 recipe ideas for you
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {recipes.map((recipe, idx) => {
              const id = getRecipeId(recipe.name);
              const isFav = favoriteIds.has(id);

              return (
                <article
                  key={`${id}-${idx}`}
                  className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 flex flex-col justify-between gap-4 transition-colors duration-200"
                >
                  <div className="space-y-3">
                    {/* Title + Favorite Heart */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] leading-snug">
                        {recipe.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(recipe)}
                        aria-label={isFav ? 'Remove from favorites' : 'Save as favorite'}
                        className={`min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] ${
                          isFav
                            ? 'text-[#B42B2F] dark:text-[#D65356] hover:bg-[#EDEEE9]/70 dark:hover:bg-[#343A36]'
                            : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#B42B2F] dark:hover:text-[#D65356] hover:bg-[#EDEEE9]/60 dark:hover:bg-[#343A36]'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav ? 'fill-[#B42B2F] dark:fill-[#D65356]' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* One-line description */}
                    <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF] line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Clean Inline Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] tabular-nums">
                      <span>{recipe.totalTimeMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{recipe.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                      </span>
                    </div>

                    {/* You have & You need lists */}
                    <div className="pt-3 border-t border-[#3D4547]/15 dark:border-[#424844] space-y-3">
                      <div>
                        <p className="text-xs font-medium text-[#6E7234] dark:text-[#B5B86F] flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>You have ({recipe.ingredientsHave.length})</span>
                        </p>
                        <ul className="space-y-1 text-xs text-[#3D4547] dark:text-[#EDEEE9] bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] rounded-lg p-2.5">
                          {recipe.ingredientsHave.map((ing, i) => (
                            <li key={i} className="leading-snug">
                              • {ing}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-[#B42B2F] dark:text-[#D9B9AA] flex items-center gap-1.5 mb-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>You need ({recipe.ingredientsNeed.length})</span>
                        </p>
                        {recipe.ingredientsNeed.length === 0 ? (
                          <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF] italic px-1">
                            Nothing extra needed!
                          </p>
                        ) : (
                          <ul className="space-y-1 text-xs text-[#3D4547] dark:text-[#EDEEE9] bg-[#EDEEE9]/75 dark:bg-[#343A36] border border-[#B42B2F]/20 dark:border-[#424844] rounded-lg p-2.5">
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
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
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
