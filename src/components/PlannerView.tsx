import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Flame,
  Copy,
  Trash2,
  ShoppingCart,
  Search,
  Utensils,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Heart,
} from 'lucide-react';
import {
  DayOfWeek,
  FavoriteRecipe,
  MealPlanWeek,
  MealSlotType,
  Recipe,
  ShoppingListItem,
} from '../types';
import {
  DAYS_OF_WEEK,
  MEAL_SLOTS,
  SHOPPING_CATEGORIES,
  getDayCalories,
  getWeeklyCalorieStats,
} from '../lib/plannerStore';

interface PlannerViewProps {
  mealPlan: MealPlanWeek;
  favorites: FavoriteRecipe[];
  shoppingList: ShoppingListItem[];
  isBuildingShoppingList: boolean;
  onAssignMeal: (day: DayOfWeek, slot: MealSlotType, recipe: FavoriteRecipe) => void;
  onRemoveMeal: (day: DayOfWeek, slot: MealSlotType) => void;
  onCopyDay: (fromDay: DayOfWeek, targetDays: DayOfWeek[]) => void;
  onClearWeek: () => void;
  onViewRecipe: (recipe: Recipe) => void;
  onBuildShoppingList: () => Promise<boolean>;
  onToggleShoppingItem: (itemId: string) => void;
  onClearCheckedShoppingItems: () => void;
  onGoHome: () => void;
}

const SHORT_DAY_LABEL: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export function PlannerView({
  mealPlan,
  favorites,
  shoppingList,
  isBuildingShoppingList,
  onAssignMeal,
  onRemoveMeal,
  onCopyDay,
  onClearWeek,
  onViewRecipe,
  onBuildShoppingList,
  onToggleShoppingItem,
  onClearCheckedShoppingItems,
  onGoHome,
}: PlannerViewProps) {
  const [viewMode, setViewMode] = useState<'planner' | 'shopping'>('planner');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Modals & notices
  const [pickerTarget, setPickerTarget] = useState<{
    day: DayOfWeek;
    slot: MealSlotType;
  } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const [copySourceDay, setCopySourceDay] = useState<DayOfWeek | null>(null);
  const [copyTargets, setCopyTargets] = useState<DayOfWeek[]>([]);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [emptyPlanNotice, setEmptyPlanNotice] = useState(false);
  const [copiedListFeedback, setCopiedListFeedback] = useState(false);

  // Touch swipe tracking for mobile day switcher
  const touchStartXRef = useRef<number | null>(null);

  const weeklyStats = useMemo(() => getWeeklyCalorieStats(mealPlan), [mealPlan]);

  const filteredFavorites = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.cuisine || '').toLowerCase().includes(q) ||
        (f.mood || '').toLowerCase().includes(q)
    );
  }, [favorites, pickerSearch]);

  const groupedShoppingList = useMemo(() => {
    return SHOPPING_CATEGORIES.map((category) => ({
      category,
      items: shoppingList.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [shoppingList]);

  const checkedCount = useMemo(
    () => shoppingList.filter((i) => i.checked).length,
    [shoppingList]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) {
      setSelectedDayIndex((prev) => (prev + 1) % DAYS_OF_WEEK.length);
    } else {
      setSelectedDayIndex((prev) => (prev - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length);
    }
  };

  const handleTriggerBuildShoppingList = async () => {
    if (weeklyStats.totalMeals === 0) {
      setEmptyPlanNotice(true);
      return;
    }
    setEmptyPlanNotice(false);
    const ok = await onBuildShoppingList();
    if (ok) {
      setViewMode('shopping');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyShoppingListText = async () => {
    if (shoppingList.length === 0) return;
    const lines: string[] = ['PantryAI Weekly Shopping List', ''];
    for (const group of groupedShoppingList) {
      lines.push(group.category);
      for (const item of group.items) {
        const mark = item.checked ? '[x]' : '[ ]';
        const qty = item.quantity ? ` — ${item.quantity}` : '';
        lines.push(`${mark} ${item.name}${qty}`);
      }
      lines.push('');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n').trim());
      setCopiedListFeedback(true);
      setTimeout(() => setCopiedListFeedback(false), 2200);
    } catch {
      // Clipboard API may be restricted in some environments
    }
  };

  const openCopyModal = (day: DayOfWeek) => {
    setCopySourceDay(day);
    setCopyTargets([]);
  };

  const toggleCopyTarget = (day: DayOfWeek) => {
    setCopyTargets((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleConfirmCopy = () => {
    if (!copySourceDay || copyTargets.length === 0) return;
    onCopyDay(copySourceDay, copyTargets);
    setCopySourceDay(null);
    setCopyTargets([]);
  };

  const DAILY_CALORIE_GOAL = 2000;

  const renderDayCard = (day: DayOfWeek) => {
    const daySlots = mealPlan[day];
    const dayCalories = getDayCalories(daySlots);
    const dayHasMeals = MEAL_SLOTS.some((s) => Boolean(daySlots[s.key]));
    const isOverGoal = dayCalories > DAILY_CALORIE_GOAL;
    const progressPercent = Math.min(
      100,
      Math.round((dayCalories / DAILY_CALORIE_GOAL) * 100)
    );

    return (
      <section
        key={day}
        className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-3.5 flex flex-col justify-between gap-3 transition-colors duration-200"
      >
        <div className="space-y-3">
          {/* Day Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
            <h2 className="font-serif text-base font-semibold text-[var(--text)]">
              {day}
            </h2>
            {dayHasMeals && (
              <button
                type="button"
                onClick={() => openCopyModal(day)}
                title={`Copy ${day}'s meals to another day`}
                aria-label={`Copy ${day}'s meals to another day`}
                className="min-h-[36px] px-2 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--soft-highlight)]/60 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="lg:hidden xl:inline">Copy</span>
              </button>
            )}
          </div>

          {/* 3 Slots: Breakfast, Lunch, Dinner */}
          <div className="space-y-2.5">
            {MEAL_SLOTS.map(({ key, label }) => {
              const meal = daySlots[key];
              if (!meal) {
                return (
                  <div
                    key={key}
                    className="rounded-lg bg-[var(--surface-nested)] border border-dashed border-[var(--subtle)] p-2.5 space-y-1.5"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      {label}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerSearch('');
                        setPickerTarget({ day, slot: key });
                      }}
                      className="w-full min-h-[44px] px-2.5 py-2 rounded-md bg-[var(--card)] hover:bg-[var(--soft-highlight)] hover:text-[var(--soft-highlight-text)] border border-[var(--subtle)] text-xs font-medium text-[var(--text)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                      <span>Add meal</span>
                    </button>
                  </div>
                );
              }

              const kcal = meal.recipe.nutrition?.calories || 350;

              return (
                <div
                  key={key}
                  className="rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] p-2.5 space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-text)]">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveMeal(day, key)}
                      aria-label={`Remove ${meal.recipe.name} from ${day} ${label}`}
                      title="Remove meal"
                      className="min-h-[32px] min-w-[32px] -mt-1 -mr-1 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--warning-on-card)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewRecipe(meal.recipe)}
                    className="w-full text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded"
                  >
                    <p className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--primary-text)] line-clamp-2 leading-snug transition-colors">
                      {meal.recipe.name}
                    </p>
                  </button>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {meal.recipe.cuisine && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--chip-bg)] text-[var(--chip-text)]">
                        {meal.recipe.cuisine}
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-[var(--accent-on-card)] tabular-nums flex items-center gap-0.5">
                      <Flame className="w-3 h-3 shrink-0" />
                      ~{kcal} kcal/serv (est.)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Calorie Total & Progress Bar */}
        <div className="pt-2.5 border-t border-[var(--border)] space-y-1.5">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className="text-[var(--text-secondary)] font-medium">Day total</span>
            <span
              className={`font-semibold ${
                isOverGoal ? 'text-[var(--warning-on-card)]' : 'text-[var(--text)]'
              }`}
            >
              ~{dayCalories.toLocaleString()} kcal
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full bg-[var(--subtle)]/40 overflow-hidden"
            aria-label={`${day} calorie progress: ${dayCalories} of ${DAILY_CALORIE_GOAL} kcal`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverGoal
                  ? 'bg-[var(--warning)] border border-[var(--warning-border)]'
                  : 'bg-[var(--primary)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>
    );
  };

  // ========================
  // SHOPPING LIST SCREEN
  // ========================
  if (viewMode === 'shopping') {
    return (
      <div className="space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setViewMode('planner')}
              className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] hover:text-[var(--primary-text)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to planner</span>
            </button>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
              Weekly Groceries
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Shopping list
            </h1>
            <p className="text-sm text-[var(--text-secondary)] tabular-nums">
              {shoppingList.length === 0
                ? 'No extra ingredients needed right now'
                : `${checkedCount} of ${shoppingList.length} items checked`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={onClearCheckedShoppingItems}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[var(--warning)] hover:bg-[var(--warning-hover)] border border-[var(--warning-border)] text-xs sm:text-sm font-medium text-[var(--warning-text)] transition-colors cursor-pointer"
              >
                Clear checked
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyShoppingListText}
              disabled={shoppingList.length === 0}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] disabled:opacity-50 text-[var(--primary-btn-text)] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {copiedListFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied list</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy list</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Empty / Staples-only state */}
        {shoppingList.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] mx-auto flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
                Nothing extra to buy
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Your planned meals don&apos;t require extra ingredients beyond basic pantry staples like salt, pepper, cooking oil, and water.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('planner')}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors cursor-pointer"
            >
              Back to planner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedShoppingList.map((group) => (
              <section
                key={group.category}
                className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 space-y-3 transition-colors duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <h2 className="font-serif text-lg font-semibold text-[var(--text)]">
                    {group.category}
                  </h2>
                  <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <label className="min-h-[44px] px-3 py-2 rounded-lg bg-[var(--surface-nested)] border border-[var(--subtle)] flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--primary)] transition-colors">
                        <span className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => onToggleShoppingItem(item.id)}
                            className="w-4 h-4 rounded accent-[var(--primary)] cursor-pointer shrink-0"
                          />
                          <span
                            className={`text-sm font-medium truncate ${
                              item.checked
                                ? 'line-through text-[var(--text-secondary)] opacity-70'
                                : 'text-[var(--text)]'
                            }`}
                          >
                            {item.name}
                          </span>
                        </span>
                        {item.quantity && (
                          <span
                            className={`text-xs font-medium tabular-nums shrink-0 ${
                              item.checked
                                ? 'line-through text-[var(--text-secondary)] opacity-60'
                                : 'text-[var(--primary-text)]'
                            }`}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========================
  // WEEKLY PLANNER SCREEN
  // ========================
  const activeMobileDay = DAYS_OF_WEEK[selectedDayIndex];

  return (
    <div className="space-y-6">
      {/* Header & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
            Weekly Menu
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Meal planner
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Schedule saved recipes for Monday through Sunday and build a combined grocery list.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerBuildShoppingList}
            disabled={isBuildingShoppingList}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] disabled:opacity-60 text-[var(--primary-btn-text)] text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isBuildingShoppingList ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Building list...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Build shopping list</span>
              </>
            )}
          </button>

          {shoppingList.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode('shopping')}
              className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] hover:opacity-90 text-sm font-medium transition-colors cursor-pointer"
            >
              View list ({shoppingList.length})
            </button>
          )}

          {weeklyStats.totalMeals > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[var(--card)] hover:bg-[var(--warning)] hover:text-[var(--warning-text)] border border-[var(--warning-border)] text-sm font-medium text-[var(--warning-on-card)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear week</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Plan Guard Message */}
      {emptyPlanNotice && (
        <div
          role="alert"
          className="bg-[var(--card)] border border-[var(--warning-border)] rounded-xl p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[var(--warning-on-card)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text)]">
              Your meal planner is empty. Add at least one meal to your week before building a shopping list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmptyPlanNotice(false)}
            aria-label="Dismiss message"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Weekly Calorie Summary Strip */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--accent-on-card)] flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Weekly calorie total
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--text)] tabular-nums">
              ~{weeklyStats.weeklyTotal.toLocaleString()} kcal{' '}
              <span className="text-xs font-sans font-normal text-[var(--text-secondary)]">
                (est.)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border)] sm:pl-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Daily average (7 days)
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--text)] tabular-nums">
              ~{weeklyStats.dailyAverage.toLocaleString()} kcal{' '}
              <span className="text-xs font-sans font-normal text-[var(--text-secondary)]">
                / day (est.)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border)] sm:pl-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--primary-text)] flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Planned meals
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--text)] tabular-nums">
              {weeklyStats.totalMeals}{' '}
              <span className="text-xs font-sans font-normal text-[var(--text-secondary)]">
                of 21 slots
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Friendly No-Favorites Callout */}
      {favorites.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-[var(--accent-on-card)] shrink-0" />
            <p className="text-sm text-[var(--text)]">
              Save favorite recipes first so you can add them to your weekly meal plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-xs font-medium transition-colors cursor-pointer"
          >
            Find recipes
          </button>
        </div>
      )}

      {/* Mobile: 1 Day at a Time with Day Selector + Arrow/Swipe Navigation */}
      <div className="lg:hidden space-y-3">
        {/* Day Selector Strip */}
        <div className="grid grid-cols-7 gap-1 bg-[var(--card)] p-1.5 rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)]">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const hasMeals = MEAL_SLOTS.some((s) => Boolean(mealPlan[day][s.key]));
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`min-h-[44px] rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] font-semibold'
                    : 'text-[var(--text)] hover:bg-[var(--surface-nested)]'
                }`}
              >
                <span>{SHORT_DAY_LABEL[day]}</span>
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasMeals
                      ? isSelected
                        ? 'bg-[var(--soft-highlight-text)]'
                        : 'bg-[var(--primary)]'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Arrow Navigation Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              setSelectedDayIndex(
                (prev) => (prev - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length
              )
            }
            aria-label="Previous day"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text)] cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Swipe or tap arrows to switch day ({selectedDayIndex + 1}/7)
          </span>
          <button
            type="button"
            onClick={() =>
              setSelectedDayIndex((prev) => (prev + 1) % DAYS_OF_WEEK.length)
            }
            aria-label="Next day"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text)] cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {renderDayCard(activeMobileDay)}
        </div>
      </div>

      {/* Desktop / Larger Screens: Full 7-Day Week Grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-3 items-stretch">
        {DAYS_OF_WEEK.map((day) => renderDayCard(day))}
      </div>

      {/* ======================== */}
      {/* FAVORITE RECIPE PICKER MODAL */}
      {/* ======================== */}
      {pickerTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="picker-modal-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
                  {pickerTarget.day} · {pickerTarget.slot}
                </p>
                <h2
                  id="picker-modal-title"
                  className="font-serif text-xl font-semibold text-[var(--text)]"
                >
                  Choose a saved recipe
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                aria-label="Close recipe picker"
                className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {favorites.length === 0 ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--surface-nested)] border border-[var(--card-border)] text-[var(--accent-on-card)] mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-serif text-lg font-semibold text-[var(--text)]">
                    No saved recipes yet
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Find recipes from your pantry and tap the heart icon to save them for your meal plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget(null);
                    onGoHome();
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium transition-colors cursor-pointer"
                >
                  Find recipes
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search saved recipes by name or cuisine..."
                    autoFocus
                    className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="overflow-y-auto space-y-2 pr-1">
                  {filteredFavorites.length === 0 ? (
                    <p className="text-sm text-center py-6 text-[var(--text-secondary)]">
                      No saved recipes match &ldquo;{pickerSearch}&rdquo;.
                    </p>
                  ) : (
                    filteredFavorites.map((fav) => {
                      const kcal = fav.nutrition?.calories || 350;
                      return (
                        <button
                          key={fav.id}
                          type="button"
                          onClick={() => {
                            onAssignMeal(pickerTarget.day, pickerTarget.slot, fav);
                            setPickerTarget(null);
                          }}
                          className="w-full min-h-[52px] p-3 rounded-xl bg-[var(--surface-nested)] hover:bg-[var(--soft-highlight)]/45 border border-[var(--card-border)] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="font-serif text-sm font-semibold text-[var(--text)] truncate">
                              {fav.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)] tabular-nums">
                              {fav.cuisine && <span>{fav.cuisine}</span>}
                              {fav.cuisine && <span aria-hidden="true">·</span>}
                              <span>{fav.totalTimeMinutes} min</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-[var(--accent-on-card)] font-medium">
                                ~{kcal} kcal/serv (est.)
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-[var(--primary-btn)] text-[var(--primary-btn-text)] text-xs font-medium shrink-0">
                            Select
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* COPY DAY MODAL */}
      {/* ======================== */}
      {copySourceDay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="copy-day-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="copy-day-title"
                  className="font-serif text-xl font-semibold text-[var(--text)]"
                >
                  Copy {copySourceDay}&apos;s meals
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Select one or more days to replace with {copySourceDay}&apos;s Breakfast, Lunch, and Dinner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCopySourceDay(null)}
                aria-label="Close copy day dialog"
                className="min-h-[40px] min-w-[40px] -mt-1 -mr-1 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.filter((d) => d !== copySourceDay).map((day) => {
                const selected = copyTargets.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleCopyTarget(day)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium border flex items-center justify-between transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[var(--soft-highlight)] border-[var(--primary)] text-[var(--soft-highlight-text)]'
                        : 'bg-[var(--surface-nested)] border-[var(--subtle)] text-[var(--text)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <span>{day}</span>
                    {selected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCopySourceDay(null)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--surface-nested)] border border-[var(--subtle)] text-sm font-medium text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={copyTargets.length === 0}
                onClick={handleConfirmCopy}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] disabled:opacity-50 text-[var(--primary-btn-text)] text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Copy meals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* CLEAR WEEK CONFIRMATION DIALOG */}
      {/* ======================== */}
      {confirmClearOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-week-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-xl p-5 space-y-4">
            <h2
              id="clear-week-title"
              className="font-serif text-xl font-semibold text-[var(--text)]"
            >
              Clear the whole week?
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              This will remove all {weeklyStats.totalMeals} planned{' '}
              {weeklyStats.totalMeals === 1 ? 'meal' : 'meals'} from Monday through Sunday. Your saved favorites will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--surface-nested)] border border-[var(--subtle)] text-sm font-medium text-[var(--text)] cursor-pointer"
              >
                Keep meals
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearWeek();
                  setConfirmClearOpen(false);
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--warning)] hover:bg-[var(--warning-hover)] border border-[var(--warning-border)] text-[var(--warning-text)] text-sm font-medium transition-colors cursor-pointer"
              >
                Clear week
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
