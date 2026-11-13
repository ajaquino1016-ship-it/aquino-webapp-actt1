import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthView } from './components/AuthView';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ResultsView } from './components/ResultsView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { FavoritesView } from './components/FavoritesView';
import { PlannerView } from './components/PlannerView';
import { HistoryView } from './components/HistoryView';
import { StreakHistoryView } from './components/StreakHistoryView';
import { ProfileView } from './components/ProfileView';
import { SettingsModal } from './components/SettingsModal';
import { MilestoneCelebrationModal } from './components/MilestoneCelebrationModal';
import {
  AppTab,
  DayOfWeek,
  FavoriteRecipe,
  MealPlanWeek,
  MealSlotType,
  Recipe,
  RecipeFilters,
  SearchHistoryItem,
  ShoppingListItem,
  StreakMilestone,
  StreakSettings,
  UserStreakData,
} from './types';
import { generateRecipes } from './lib/pantryApi';
import {
  DEFAULT_FILTERS,
  addSearchHistoryItem,
  buildRecipeId,
  clearLegacyImageCacheForUser,
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
import {
  buildShoppingListFromPlan,
  createEmptyMealPlan,
  loadMealPlan,
  loadShoppingList,
  saveMealPlan,
  saveShoppingList,
} from './lib/plannerStore';
import {
  createDefaultStreakData,
  evaluateStreakOnAppOpen,
  getLocalDateKey,
  loadAndSyncUserStreak,
  loadLocalStreak,
  recordCookingAction,
  resetUserStreak,
  saveUserStreak,
} from './lib/streakStore';
import { CheckCircle, Flame, Leaf } from 'lucide-react';

type ScreenState = 'home' | 'results' | 'detail' | 'streakHistory' | 'profile';
type DetailReturnTarget = 'results' | 'favorites' | 'planner' | 'history';

export default function App() {
  const { user, userProfile, loading } = useAuth();

  // Primary navigation tabs (Home, Favorites, Planner, History) + sub-screen state
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [homeScreen, setHomeScreen] = useState<ScreenState>('home');
  const [detailReturnTarget, setDetailReturnTarget] =
    useState<DetailReturnTarget>('results');

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

  // Per-user Favorites, History, Meal Plan & Shopping List
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [mealPlan, setMealPlan] = useState<MealPlanWeek>(createEmptyMealPlan);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isBuildingShoppingList, setIsBuildingShoppingList] = useState(false);

  // App Streak state
  const [streak, setStreak] = useState<UserStreakData>(() =>
    createDefaultStreakData('')
  );
  const [justExtendedDays, setJustExtendedDays] = useState<number | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<StreakMilestone | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clockTick, setClockTick] = useState<Date>(() => new Date());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    isStreak?: boolean;
  } | null>(null);

  const showToast = useCallback((text: string, isStreak = false) => {
    setToastMessage({ text, isStreak });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

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
      setMealPlan(createEmptyMealPlan());
      setShoppingList([]);
      setStreak(createDefaultStreakData(''));
      setJustExtendedDays(null);
      setActiveMilestone(null);
      setSettingsOpen(false);
      setIsBuildingShoppingList(false);
      setActiveTab('home');
      setHomeScreen('home');
      setHasSearchedOnce(false);
      return;
    }

    // Remove any legacy cached dish image keys from earlier versions
    clearLegacyImageCacheForUser(user.uid);

    // Straight to Home screen on login
    setActiveTab('home');
    setHomeScreen('home');
    setJustExtendedDays(null);

    // Immediate local hydration keyed by user.uid
    setFilters(loadLocalFilters(user.uid));
    setFavorites(loadLocalFavorites(user.uid));
    setHistory(loadLocalHistory(user.uid));
    setMealPlan(loadMealPlan(user.uid));
    setShoppingList(loadShoppingList(user.uid));
    const localEvaluatedStreak = evaluateStreakOnAppOpen(
      loadLocalStreak(user.uid),
      new Date()
    );
    setStreak(localEvaluatedStreak);

    let cancelled = false;
    setLoadingFavorites(true);
    setLoadingHistory(true);

    loadAndSyncUserStreak(user.uid, new Date())
      .then((synced) => {
        if (!cancelled) setStreak(synced);
      })
      .catch(() => {});

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

  // Keep local day & reminder clock fresh across midnight and evening hours
  useEffect(() => {
    if (!user) return;

    const refreshClockAndStreak = () => {
      const now = new Date();
      setClockTick(now);
      setStreak((prev) => {
        if (!prev.userId) return prev;
        const evaluated = evaluateStreakOnAppOpen(prev, now);
        if (evaluated !== prev) {
          saveUserStreak(user.uid, evaluated).catch(() => {});
        }
        return evaluated;
      });
    };

    const interval = window.setInterval(refreshClockAndStreak, 60000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshClockAndStreak();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user]);

  // Check optional browser Streak Reminder notification
  useEffect(() => {
    if (!user || !streak.userId) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    if (!streak.settings.notificationsEnabled || !streak.settings.streakReminderEnabled) {
      return;
    }

    const todayKey = getLocalDateKey(clockTick);
    const cookedToday = streak.cookedDates.includes(todayKey);
    if (cookedToday || streak.cookingStreak < 1) return;
    if (streak.settings.lastNotifiedDate === todayKey) return;

    const nowHHMM = `${String(clockTick.getHours()).padStart(2, '0')}:${String(
      clockTick.getMinutes()
    ).padStart(2, '0')}`;
    const targetTime = streak.settings.reminderTime || '18:00';

    if (nowHHMM >= targetTime) {
      try {
        new window.Notification('PantryAI Streak Reminder', {
          body:
            streak.cookingStreak >= 2
              ? `Your ${streak.cookingStreak}-day cooking streak ends tonight! Cook a quick recipe to keep it going.`
              : 'Cook something today to build your PantryAI streak!',
        });
        const updated: UserStreakData = {
          ...streak,
          settings: {
            ...streak.settings,
            lastNotifiedDate: todayKey,
          },
          updatedAt: new Date().toISOString(),
        };
        setStreak(updated);
        saveUserStreak(user.uid, updated).catch(() => {});
      } catch {
        // Browser blocked notification instantiation in current context
      }
    }
  }, [user, streak, clockTick]);

  const cookedToday = useMemo(() => {
    const todayKey = getLocalDateKey(clockTick);
    return streak.cookedDates.includes(todayKey);
  }, [streak.cookedDates, clockTick]);

  const showEveningReminder = useMemo(() => {
    return (
      streak.cookingStreak >= 2 &&
      !cookedToday &&
      clockTick.getHours() >= 18
    );
  }, [streak.cookingStreak, cookedToday, clockTick]);

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
      setIsGenerating(false);

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
      setIsGenerating(false);
    }
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!user) return;
    const id = recipe.id || buildRecipeId(recipe.name);
    const exists = favoriteIds.has(id);

    if (exists) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      showToast(`Removed "${recipe.name}" from favorites`);
      try {
        await removeFavoriteRecipe(user.uid, id);
      } catch {
        // Reload handled seamlessly
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

  const handleOpenRecipeDetail = (recipe: Recipe, from: DetailReturnTarget) => {
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
    } else if (detailReturnTarget === 'planner') {
      setActiveTab('planner');
      setHomeScreen('home');
    } else if (detailReturnTarget === 'history') {
      setActiveTab('history');
      setHomeScreen('home');
    } else {
      setActiveTab('home');
      setHomeScreen('results');
    }
  };

  // Cooking Action -> Updates Streak, Freezes, Badges, and Milestones
  const handleCookedRecipe = (recipe: Recipe) => {
    if (!user) return;
    const result = recordCookingAction(streak, new Date());
    setStreak(result.streak);
    saveUserStreak(user.uid, result.streak).catch(() => {});

    if (result.streakExtended) {
      setJustExtendedDays(result.newCookingStreak);
      const dayLabel = result.newCookingStreak === 1 ? 'day' : 'days';
      const freezeNote = result.earnedFreeze ? ' +1 Streak Freeze earned!' : '';
      showToast(
        `Streak extended! ${result.newCookingStreak} ${dayLabel}.${freezeNote}`,
        true
      );
      if (result.milestoneReached) {
        setActiveMilestone(result.milestoneReached);
      }
    } else {
      showToast(`Logged "${recipe.name}"! Great job cooking today.`, true);
    }
  };

  const handleDismissFreezeNotice = () => {
    if (!user) return;
    const updated: UserStreakData = {
      ...streak,
      pendingFreezeNotice: false,
      updatedAt: new Date().toISOString(),
    };
    setStreak(updated);
    saveUserStreak(user.uid, updated).catch(() => {});
  };

  const handleUpdateStreakSettings = (nextSettings: StreakSettings) => {
    if (!user) return;
    const updated: UserStreakData = {
      ...streak,
      settings: nextSettings,
      updatedAt: new Date().toISOString(),
    };
    setStreak(updated);
    saveUserStreak(user.uid, updated).catch(() => {});
  };

  const handleResetStreak = async () => {
    if (!user) return;
    const reset = await resetUserStreak(user.uid, streak.settings);
    setStreak(reset);
    setJustExtendedDays(null);
    setActiveMilestone(null);
    showToast('Streak reset. Ready for a fresh start!');
  };

  const handleExportData = () => {
    if (!user) return;
    const bundle = {
      exportedAt: new Date().toISOString(),
      app: 'PantryAI',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: userProfile?.displayName || null,
      },
      streak,
      filters,
      favorites,
      history,
      mealPlan,
      shoppingList,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pantryai-data-${getLocalDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported your PantryAI data');
  };

  // Meal Planner Handlers
  const updateAndPersistMealPlan = (updater: (prev: MealPlanWeek) => MealPlanWeek) => {
    setMealPlan((prev) => {
      const next = updater(prev);
      if (user) {
        saveMealPlan(user.uid, next);
      }
      return next;
    });
  };

  const handleAssignMeal = (
    day: DayOfWeek,
    slot: MealSlotType,
    recipe: FavoriteRecipe
  ) => {
    updateAndPersistMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: {
          recipeId: recipe.id,
          recipe,
          addedAt: new Date().toISOString(),
        },
      },
    }));
    showToast(`Added "${recipe.name}" to ${day} ${slot}`);
  };

  const handleRemoveMeal = (day: DayOfWeek, slot: MealSlotType) => {
    updateAndPersistMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: null,
      },
    }));
  };

  const handleCopyDay = (fromDay: DayOfWeek, targetDays: DayOfWeek[]) => {
    updateAndPersistMealPlan((prev) => {
      const source = prev[fromDay];
      const next = { ...prev };
      const now = new Date().toISOString();
      for (const target of targetDays) {
        next[target] = {
          breakfast: source.breakfast ? { ...source.breakfast, addedAt: now } : null,
          lunch: source.lunch ? { ...source.lunch, addedAt: now } : null,
          dinner: source.dinner ? { ...source.dinner, addedAt: now } : null,
        };
      }
      return next;
    });
    showToast(
      `Copied ${fromDay}'s meals to ${targetDays.length} ${
        targetDays.length === 1 ? 'day' : 'days'
      }`
    );
  };

  const handleClearWeek = () => {
    const empty = createEmptyMealPlan();
    setMealPlan(empty);
    if (user) {
      saveMealPlan(user.uid, empty);
    }
    showToast('Cleared weekly meal plan');
  };

  const handleBuildShoppingList = async (): Promise<boolean> => {
    if (!user) return false;
    setIsBuildingShoppingList(true);
    try {
      const rebuilt = await buildShoppingListFromPlan(mealPlan, shoppingList);
      setShoppingList(rebuilt);
      saveShoppingList(user.uid, rebuilt);
      return true;
    } catch {
      showToast('Could not build shopping list right now.');
      return false;
    } finally {
      setIsBuildingShoppingList(false);
    }
  };

  const handleToggleShoppingItem = (itemId: string) => {
    setShoppingList((prev) => {
      const next = prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      if (user) saveShoppingList(user.uid, next);
      return next;
    });
  };

  const handleClearCheckedShoppingItems = () => {
    setShoppingList((prev) => {
      const next = prev.filter((item) => !item.checked);
      if (user) saveShoppingList(user.uid, next);
      return next;
    });
    showToast('Cleared checked items');
  };

  // Loading auth session
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
        <div className="w-12 h-12 rounded-lg bg-[var(--primary-btn)] text-[var(--primary-btn-text)] flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">
          Loading PantryAI...
        </p>
      </div>
    );
  }

  // Keep existing login page untouched when unauthenticated
  if (!user) {
    return <AuthView />;
  }

  const selectedRecipeId = selectedRecipe
    ? selectedRecipe.id || buildRecipeId(selectedRecipe.name)
    : '';

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      {/* Top Bar */}
      <TopBar
        onGoHome={() => {
          setActiveTab('home');
          setHomeScreen('home');
        }}
        onOpenProfile={() => {
          setActiveTab('home');
          setHomeScreen('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        settings={streak.settings}
        onUpdateSettings={handleUpdateStreakSettings}
        onExportData={handleExportData}
        onResetStreak={handleResetStreak}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Full-Screen Milestone Congratulations Popup */}
      <MilestoneCelebrationModal
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--card-border)] shadow-[var(--card-shadow)] text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap">
          {toastMessage.isStreak ? (
            <Flame className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)] animate-streak-flame shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-[var(--primary-text)] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Responsive Content Container (pb-24 clears the bottom nav bar cleanly) */}
      <main
        className={`flex-1 w-full ${
          activeTab === 'planner' ? 'max-w-7xl' : 'max-w-5xl'
        } mx-auto px-4 sm:px-6 pt-6 pb-24 flex flex-col justify-between`}
      >
        <div>
          {activeTab === 'home' && homeScreen === 'home' && (
            <HomeView
              ingredients={ingredients}
              onUpdateIngredients={setIngredients}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onFindRecipes={() => runRecipeSearch(ingredients, filters)}
              showExamples={!hasSearchedOnce || ingredients.length === 0}
              streak={streak}
              justExtendedDays={justExtendedDays}
              showEveningReminder={showEveningReminder}
              onOpenStreakHistory={() => {
                setHomeScreen('streakHistory');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDismissFreezeNotice={handleDismissFreezeNotice}
              onDismissExtendedBanner={() => setJustExtendedDays(null)}
            />
          )}

          {activeTab === 'home' && homeScreen === 'streakHistory' && (
            <StreakHistoryView
              streak={streak}
              onBack={() => {
                setHomeScreen('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenBadges={() => {
                setHomeScreen('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeTab === 'home' && homeScreen === 'profile' && (
            <ProfileView
              userEmail={user.email || ''}
              userProfile={userProfile}
              streak={streak}
              onBack={() => {
                setHomeScreen('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenStreakHistory={() => {
                setHomeScreen('streakHistory');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              isFavorite={favoriteIds.has(selectedRecipeId)}
              onBack={handleDetailBack}
              onToggleFavorite={handleToggleFavorite}
              onCookedRecipe={handleCookedRecipe}
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

          {activeTab === 'planner' && (
            <PlannerView
              mealPlan={mealPlan}
              favorites={favorites}
              shoppingList={shoppingList}
              isBuildingShoppingList={isBuildingShoppingList}
              onAssignMeal={handleAssignMeal}
              onRemoveMeal={handleRemoveMeal}
              onCopyDay={handleCopyDay}
              onClearWeek={handleClearWeek}
              onViewRecipe={(recipe) => handleOpenRecipeDetail(recipe, 'planner')}
              onBuildShoppingList={handleBuildShoppingList}
              onToggleShoppingItem={handleToggleShoppingItem}
              onClearCheckedShoppingItems={handleClearCheckedShoppingItems}
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
        <footer className="mt-12 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--text-secondary)]">
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
          if (tab === 'home' && homeScreen !== 'home') {
            setHomeScreen('home');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
