import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthView } from './components/AuthView';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ResultsView } from './components/ResultsView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import {
  AppTab,
  FavoriteRecipe,
  Recipe,
  RecipeFilters,
  SearchHistoryItem,
} from './types';
import { generateRecipes } from './lib/pantryApi';
import {
  DEFAULT_FILTERS,
  addSearchHistoryItem,
  buildRecipeId,
  deleteSearchHistoryItem,
  loadLocalFavorites,
  loadLocalFilters,
  loadLocalHistory,
  loadUserFavorites,
  loadUserFilters,
  loadUserHistory,
  removeFavoriteRecipe,
  saveFavoriteRecipe,
  saveUserFilters,
} from './lib/userStore';
import { CheckCircle, Leaf } from 'lucide-react';

type ScreenState = 'home' | 'results' | 'detail';

export default function App() {
  const { user, loading } = useAuth();

  // Primary navigation tabs (Home, Favorites, History) + sub-screen state
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [homeScreen, setHomeScreen] = useState<ScreenState>('home');
  const [detailReturnTarget, setDetailReturnTarget] = useState<'results' | 'favorites' | 'history'>('results');

  // Ingredient & Filter state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  // Results state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [noMatchReason, setNoMatchReason] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Per-user Favorites & History
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // Load user-specific data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      // Clear in-memory user data on sign out so different accounts never see each other's state
      setIngredients([]);
      setFilters(DEFAULT_FILTERS);
      setRecipes([]);
      setNoMatchReason(null);
      setSelectedRecipe(null);
      setFavorites([]);
      setHistory([]);
      setActiveTab('home');
      setHomeScreen('home');
      setHasSearchedOnce(false);
      return;
    }

    // Straight to Home screen on login
    setActiveTab('home');
    setHomeScreen('home');

    // Immediate local hydration keyed by user.uid
    setFilters(loadLocalFilters(user.uid));
    setFavorites(loadLocalFavorites(user.uid));
    setHistory(loadLocalHistory(user.uid));

    let cancelled = false;
    setLoadingFavorites(true);
    setLoadingHistory(true);

    loadUserFilters(user.uid)
      .then((f) => {
        if (!cancelled) setFilters(f);
      })
      .catch(() => {});

    loadUserFavorites(user.uid)
      .then((favs) => {
        if (!cancelled) setFavorites(favs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingFavorites(false);
      });

    loadUserHistory(user.uid)
      .then((hist) => {
        if (!cancelled) {
          setHistory(hist);
          if (hist.length > 0) setHasSearchedOnce(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const favoriteIds = useMemo(() => {
    return new Set(favorites.map((f) => f.id));
  }, [favorites]);

  const handleUpdateFilters = (next: RecipeFilters) => {
    setFilters(next);
    if (user) {
      saveUserFilters(user.uid, next).catch(() => {});
    }
  };

  const runRecipeSearch = async (
    targetIngredients: string[],
    targetFilters: RecipeFilters
  ) => {
    if (!user || targetIngredients.length < 2) return;

    setActiveTab('home');
    setHomeScreen('results');
    setIsGenerating(true);
    setGenerateError(null);
    setNoMatchReason(null);
    setRecipes([]);
    setHasSearchedOnce(true);

    // Persist last-used filters
    saveUserFilters(user.uid, targetFilters).catch(() => {});

    try {
      const result = await generateRecipes(targetIngredients, targetFilters);
      setRecipes(result.recipes);
      setNoMatchReason(result.noMatchReason || null);

      if (result.recipes.length > 0) {
        addSearchHistoryItem(
          user.uid,
          targetIngredients,
          targetFilters,
          result.recipes
        )
          .then((savedItem) => {
            setHistory((prev) => [savedItem, ...prev].slice(0, 20));
          })
          .catch(() => {});
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not generate recipes right now. Please try again.';
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!user) return;
    const id = recipe.id || buildRecipeId(recipe.name);
    const exists = favoriteIds.has(id);

    if (exists) {
      // Optimistic UI update
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      showToast(`Removed "${recipe.name}" from favorites`);
      try {
        await removeFavoriteRecipe(user.uid, id);
      } catch {
        // Reload if needed
      }
    } else {
      try {
        const saved = await saveFavoriteRecipe(user.uid, recipe);
        setFavorites((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)]);
        showToast(`Saved "${recipe.name}" to favorites`);
      } catch {
        showToast('Could not save favorite right now.');
      }
    }
  };

  const handleRemoveFavoriteById = async (recipeId: string) => {
    if (!user) return;
    setFavorites((prev) => prev.filter((f) => f.id !== recipeId));
    showToast('Removed from favorites');
    try {
      await removeFavoriteRecipe(user.uid, recipeId);
    } catch {
      // Handled
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (!user) return;
    setHistory((prev) => prev.filter((h) => h.id !== historyId));
    try {
      await deleteSearchHistoryItem(user.uid, historyId);
    } catch {
      // Handled
    }
  };

  const handleOpenRecipeDetail = (
    recipe: Recipe,
    from: 'results' | 'favorites' | 'history'
  ) => {
    setSelectedRecipe(recipe);
    setDetailReturnTarget(from);
    setActiveTab('home');
    setHomeScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDetailBack = () => {
    setSelectedRecipe(null);
    if (detailReturnTarget === 'favorites') {
      setActiveTab('favorites');
      setHomeScreen('home');
    } else if (detailReturnTarget === 'history') {
      setActiveTab('history');
      setHomeScreen('home');
    } else {
      setActiveTab('home');
      setHomeScreen('results');
    }
  };

  // Loading auth session
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#EDEEE9] dark:bg-[#191E1F] text-[#3D4547] dark:text-[#EDEEE9] transition-colors duration-200">
        <div className="w-12 h-12 rounded-lg bg-[#3D4547] dark:bg-[#B5B86F] text-[#EDEEE9] dark:text-[#191E1F] flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6" />
        </div>
        <p className="mt-4 text-sm font-medium text-[#535C5E] dark:text-[#B8B9AF]">
          Loading PantryAI...
        </p>
      </div>
    );
  }

  // Keep existing login page untouched when unauthenticated
  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#EDEEE9] dark:bg-[#191E1F] text-[#3D4547] dark:text-[#EDEEE9] transition-colors duration-200">
      {/* Top Bar */}
      <TopBar
        onGoHome={() => {
          setActiveTab('home');
          setHomeScreen('home');
        }}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[#3D4547] text-[#EDEEE9] dark:bg-[#343A36] dark:text-[#EDEEE9] border border-[#3D4547]/20 dark:border-[#424844] text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap">
          <CheckCircle className="w-4 h-4 text-[#9C9F52] dark:text-[#B5B86F] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Content Container (pb-24 clears the bottom nav bar cleanly) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 flex flex-col justify-between">
        <div>
          {activeTab === 'home' && homeScreen === 'home' && (
            <HomeView
              ingredients={ingredients}
              onUpdateIngredients={setIngredients}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onFindRecipes={() => runRecipeSearch(ingredients, filters)}
              showExamples={!hasSearchedOnce || ingredients.length === 0}
            />
          )}

          {activeTab === 'home' && homeScreen === 'results' && (
            <ResultsView
              ingredients={ingredients}
              filters={filters}
              recipes={recipes}
              noMatchReason={noMatchReason}
              isLoading={isGenerating}
              error={generateError}
              favoriteIds={favoriteIds}
              getRecipeId={buildRecipeId}
              onBackToHome={() => setHomeScreen('home')}
              onRetry={() => runRecipeSearch(ingredients, filters)}
              onRelaxFilter={(patch) => {
                const updated = { ...filters, ...patch };
                handleUpdateFilters(updated);
                runRecipeSearch(ingredients, updated);
              }}
              onViewRecipe={(recipe) => handleOpenRecipeDetail(recipe, 'results')}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'home' && homeScreen === 'detail' && selectedRecipe && (
            <RecipeDetailView
              recipe={selectedRecipe}
              isFavorite={favoriteIds.has(
                selectedRecipe.id || buildRecipeId(selectedRecipe.name)
              )}
              onBack={handleDetailBack}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              isLoading={loadingFavorites}
              onViewRecipe={(fav) => handleOpenRecipeDetail(fav, 'favorites')}
              onRemoveFavorite={handleRemoveFavoriteById}
              onGoHome={() => {
                setActiveTab('home');
                setHomeScreen('home');
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              isLoading={loadingHistory}
              onRestoreSearch={(item) => {
                setIngredients(item.ingredients);
                handleUpdateFilters(item.filters);
                setActiveTab('home');
                setHomeScreen('home');
              }}
              onViewHistoryRecipes={(item) => {
                setIngredients(item.ingredients);
                setFilters(item.filters);
                setRecipes(item.recipes);
                setNoMatchReason(null);
                setGenerateError(null);
                setIsGenerating(false);
                setActiveTab('home');
                setHomeScreen('results');
              }}
              onViewRecipe={(recipe) => handleOpenRecipeDetail(recipe, 'history')}
              onDeleteHistoryItem={handleDeleteHistory}
              onGoHome={() => {
                setActiveTab('home');
                setHomeScreen('home');
              }}
            />
          )}
        </div>

        {/* Footer Note */}
        <footer className="mt-12 pt-6 border-t border-[#3D4547]/15 dark:border-[#424844] text-center">
          <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
            PantryAI. Nutrition values are estimates. Always check ingredients for allergies.
          </p>
        </footer>
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        favoritesCount={favorites.length}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home' && homeScreen === 'detail') {
            setHomeScreen('home');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
