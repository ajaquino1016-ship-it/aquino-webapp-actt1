import React, { useMemo, useState } from 'react';
import {
  Heart,
  Search,
  Clock,
  Utensils,
  Trash2,
  Globe2,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  CuisineOption,
  DietOption,
  FavoriteRecipe,
  MaxTimeOption,
  MoodOption,
} from '../types';

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

const CUISINE_FILTERS: CuisineOption[] = [
  'Any',
  'Filipino',
  'Japanese',
  'Korean',
  'Italian',
  'Mexican',
];

const MOOD_FILTERS: MoodOption[] = [
  'Any',
  'Comfort food',
  'Light and healthy',
  'Quick snack',
  'Impress guests',
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
  const [cuisineFilter, setCuisineFilter] = useState<CuisineOption>('Any');
  const [moodFilter, setMoodFilter] = useState<MoodOption>('Any');

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
      if (cuisineFilter !== 'Any') {
        const c = (fav.cuisine || '').toLowerCase();
        if (!c.includes(cuisineFilter.toLowerCase())) {
          return false;
        }
      }
      if (moodFilter !== 'Any') {
        const m = (fav.mood || '').toLowerCase();
        if (!m.includes(moodFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [favorites, searchQuery, maxTime, dietTag, cuisineFilter, moodFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
            Saved Collection
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Saved favorites
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'} in your account
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {favorites.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 transition-colors duration-200">
          {/* Search by name */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
            />
          </div>

          {/* Max time filter */}
          <div className="relative flex items-center">
            <Clock className="w-4 h-4 text-[var(--primary-text)] absolute left-3.5 pointer-events-none" />
            <select
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value) as MaxTimeOption)}
              aria-label="Filter favorites by cooking time"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {TIME_FILTERS.map((t) => (
                <option key={t.label} value={t.value}>
                  {t.value === 0 ? 'Any time' : `Under ${t.label}`}
                </option>
              ))}
            </select>
          </div>

          {/* Diet tag filter */}
          <div className="relative flex items-center">
            <Utensils className="w-4 h-4 text-[var(--primary-text)] absolute left-3.5 pointer-events-none" />
            <select
              value={dietTag}
              onChange={(e) => setDietTag(e.target.value as DietOption)}
              aria-label="Filter favorites by diet tag"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {DIET_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {d === 'Any' ? 'All diets' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Cuisine filter */}
          <div className="relative flex items-center">
            <Globe2 className="w-4 h-4 text-[var(--primary-text)] absolute left-3.5 pointer-events-none" />
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value as CuisineOption)}
              aria-label="Filter favorites by cuisine"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {CUISINE_FILTERS.map((c) => (
                <option key={c} value={c}>
                  {c === 'Any' ? 'All cuisines' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Mood filter */}
          <div className="relative flex items-center">
            <Sparkles className="w-4 h-4 text-[var(--primary-text)] absolute left-3.5 pointer-events-none" />
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value as MoodOption)}
              aria-label="Filter favorites by mood"
              className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {MOOD_FILTERS.map((m) => (
                <option key={m} value={m}>
                  {m === 'Any' ? 'All moods' : m}
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
              className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-5 h-44 animate-pulse"
            >
              <div className="h-5 w-2/3 rounded bg-[var(--subtle)]/60 mb-3" />
              <div className="h-3.5 w-full rounded bg-[var(--subtle)]/45 mb-2" />
              <div className="h-3.5 w-4/5 rounded bg-[var(--subtle)]/45" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-10 text-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-nested)] border border-[var(--accent)]/40 text-[var(--accent-on-card)] mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
              No saved recipes yet
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Tap the heart icon on any recipe you like to save it here for quick cooking later.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Find recipes
          </button>
        </div>
      )}

      {/* Filtered Empty State */}
      {!isLoading && favorites.length > 0 && filteredFavorites.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-8 text-center space-y-3 transition-colors duration-200">
          <p className="text-sm text-[var(--text-secondary)]">
            No saved recipes match your current search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setMaxTime(0);
              setDietTag('Any');
              setCuisineFilter('Any');
              setMoodFilter('Any');
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] hover:opacity-90 text-xs font-medium transition-colors cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      {!isLoading && filteredFavorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredFavorites.map((fav) => {
            const kcal = fav.nutrition?.calories || 350;

            return (
              <article
                key={fav.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 flex flex-col justify-between gap-4 transition-colors duration-200"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-md bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] flex items-center justify-center shrink-0 mt-0.5">
                        <Utensils className="w-3.5 h-3.5" />
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-[var(--text)] leading-snug">
                        {fav.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(fav.id)}
                      aria-label={`Remove ${fav.name} from favorites`}
                      title="Remove from favorites"
                      className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--warning-on-card)] hover:bg-[var(--surface-nested)] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {(fav.cuisine || fav.mood) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fav.cuisine && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--chip-bg)] border border-[var(--subtle)] text-[var(--chip-text)]">
                          {fav.cuisine}
                        </span>
                      )}
                      {fav.mood && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)]">
                          {fav.mood}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {fav.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                      <span>{fav.totalTimeMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{fav.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{fav.servings} servings</span>
                    </div>
                    <p className="text-xs font-medium text-[var(--accent-on-card)] flex items-center gap-1 tabular-nums">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>~{kcal} kcal per serving (est.)</span>
                    </p>
                  </div>

                  {fav.dietTags && fav.dietTags.length > 0 && (
                    <p className="text-xs font-medium text-[var(--primary-text)]">
                      {fav.dietTags.join(' · ')}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onViewRecipe(fav)}
                  className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  View recipe
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
