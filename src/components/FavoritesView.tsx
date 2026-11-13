import React, { useMemo, useState } from 'react';
import { Heart, Search, Clock, Utensils, Trash2 } from 'lucide-react';
import { DietOption, FavoriteRecipe, MaxTimeOption } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteRecipe[];
  isLoading: boolean;
  onViewRecipe: (recipe: FavoriteRecipe) => void;
  onRemoveFavorite: (recipeId: string) => void;
  onGoHome: () => void;
}

const TIME_FILTERS: { label: string; value: MaxTimeOption }[] = [
  { label: 'Any time', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

const DIET_FILTERS: DietOption[] = [
  'Any',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Low-carb',
];

export function FavoritesView({
  favorites,
  isLoading,
  onViewRecipe,
  onRemoveFavorite,
  onGoHome,
}: FavoritesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxTime, setMaxTime] = useState<MaxTimeOption>(0);
  const [dietTag, setDietTag] = useState<DietOption>('Any');

  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!fav.name.toLowerCase().includes(q)) return false;
      }
      if (maxTime > 0 && fav.totalTimeMinutes > maxTime) {
        return false;
      }
      if (dietTag !== 'Any') {
        const tags = (fav.dietTags || []).map((t) => t.toLowerCase());
        if (!tags.some((t) => t.includes(dietTag.toLowerCase()))) {
          return false;
        }
      }
      return true;
    });
  }, [favorites, searchQuery, maxTime, dietTag]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B42B2F] dark:text-[#D9B9AA]">
            Saved Collection
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
            Saved favorites
          </h1>
          <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
            {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'} in your account
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {favorites.length > 0 && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-4 grid grid-cols-1 md:grid-cols-3 gap-3 transition-colors duration-200">
          {/* Search by name */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#535C5E] dark:text-[#B8B9AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved recipes..."
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] placeholder-[#535C5E]/65 dark:placeholder-[#B8B9AF]/55 focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
            />
          </div>

          {/* Max time filter */}
          <div className="relative flex items-center">
            <Clock className="w-4 h-4 text-[#6E7234] dark:text-[#B5B86F] absolute left-3.5 pointer-events-none" />
            <select
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value) as MaxTimeOption)}
              aria-label="Filter favorites by cooking time"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] cursor-pointer"
            >
              {TIME_FILTERS.map((t) => (
                <option key={t.label} value={t.value}>
                  {t.value === 0 ? 'Any cooking time' : `Under ${t.label}`}
                </option>
              ))}
            </select>
          </div>

          {/* Diet tag filter */}
          <div className="relative flex items-center">
            <Utensils className="w-4 h-4 text-[#6E7234] dark:text-[#B5B86F] absolute left-3.5 pointer-events-none" />
            <select
              value={dietTag}
              onChange={(e) => setDietTag(e.target.value as DietOption)}
              aria-label="Filter favorites by diet tag"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] cursor-pointer"
            >
              {DIET_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {d === 'Any' ? 'All diets' : d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 h-44 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-10 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#B42B2F]/20 dark:border-[#D65356]/30 text-[#B42B2F] dark:text-[#D65356] mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[#3D4547] dark:text-[#EDEEE9]">
              No saved recipes yet
            </h2>
            <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
              Tap the heart icon on any recipe you like to save it here for quick cooking later.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Find recipes
          </button>
        </div>
      )}

      {/* Filtered Empty State */}
      {!isLoading && favorites.length > 0 && filteredFavorites.length === 0 && (
        <div className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-8 text-center space-y-3 transition-colors duration-200">
          <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
            No saved recipes match your current search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setMaxTime(0);
              setDietTag('Any');
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-xs font-medium transition-colors cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      {!isLoading && filteredFavorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredFavorites.map((fav) => (
            <article
              key={fav.id}
              className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 flex flex-col justify-between gap-4 transition-colors duration-200"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold text-[#3D4547] dark:text-[#EDEEE9] leading-snug">
                    {fav.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(fav.id)}
                    aria-label={`Remove ${fav.name} from favorites`}
                    title="Remove from favorites"
                    className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#B42B2F] dark:hover:text-[#D65356] hover:bg-[#EDEEE9]/60 dark:hover:bg-[#343A36] transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF] line-clamp-2 leading-relaxed">
                  {fav.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] tabular-nums">
                  <span>{fav.totalTimeMinutes} min</span>
                  <span aria-hidden="true">·</span>
                  <span>{fav.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{fav.servings} servings</span>
                </div>

                {fav.dietTags && fav.dietTags.length > 0 && (
                  <p className="text-xs font-medium text-[#6E7234] dark:text-[#B5B86F]">
                    {fav.dietTags.join(' · ')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onViewRecipe(fav)}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
              >
                View recipe
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
