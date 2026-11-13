import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Copy,
  Check,
  Lightbulb,
  Flame,
  Users,
  Utensils,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Recipe } from '../types';

interface RecipeDetailViewProps {
  recipe: Recipe;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onCookedRecipe: (recipe: Recipe) => void;
}

export function RecipeDetailView({
  recipe,
  isFavorite,
  onBack,
  onToggleFavorite,
  onCookedRecipe,
}: RecipeDetailViewProps) {
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [cookedJustNow, setCookedJustNow] = useState(false);
  const [cookingModeOpen, setCookingModeOpen] = useState(false);
  const [cookingStepIndex, setCookingStepIndex] = useState(0);

  const handleCopyShoppingList = async () => {
    if (!recipe.ingredientsNeed || recipe.ingredientsNeed.length === 0) return;
    const text = [
      `Shopping list for ${recipe.name}:`,
      ...recipe.ingredientsNeed.map(
        (item) => `- ${item.quantity ? `${item.quantity} ` : ''}${item.name}`
      ),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShoppingList(true);
      setTimeout(() => setCopiedShoppingList(false), 2500);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopiedShoppingList(true);
      setTimeout(() => setCopiedShoppingList(false), 2500);
    }
  };

  const toggleStepDone = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const kcal = recipe.nutrition?.calories || 350;

  const handleMarkCooked = () => {
    onCookedRecipe(recipe);
    setCookedJustNow(true);
    setCookingModeOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-lg text-sm font-medium text-[var(--primary-text)] hover:bg-[var(--soft-highlight)]/40 flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleMarkCooked}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              cookedJustNow
                ? 'bg-[var(--primary-btn)] text-[var(--primary-btn-text)]'
                : 'bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)]'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{cookedJustNow ? 'Cooked!' : 'Cooked it!'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(recipe)}
            className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
              isFavorite
                ? 'bg-[var(--soft-highlight)] border-[var(--accent)] text-[var(--soft-highlight-text)]'
                : 'bg-[var(--card)] border-[var(--card-border)] text-[var(--text)] hover:bg-[var(--soft-highlight)]/40'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--primary-text)]'
              }`}
            />
            <span>{isFavorite ? 'Saved' : 'Save favorite'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-7 space-y-4 transition-colors duration-200">
        <div className="space-y-3">
          {(recipe.cuisine || recipe.mood) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {recipe.cuisine && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--chip-text)]">
                  {recipe.cuisine}
                </span>
              )}
              {recipe.mood && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--accent)] text-[var(--accent-text)]">
                  {recipe.mood}
                </span>
              )}
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--primary-text)] flex items-center justify-center shrink-0 mt-1">
              <Utensils className="w-4 h-4" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)] text-balance leading-tight">
              {recipe.name}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {recipe.description}
          </p>
        </div>

        {/* Clean Metadata & Time Breakdown */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-[var(--border)] text-xs sm:text-sm text-[var(--text-secondary)] tabular-nums">
          <span className="flex items-center gap-1.5 font-medium text-[var(--primary-text)]">
            <Clock className="w-4 h-4" />
            <span>Total {recipe.totalTimeMinutes} min</span>
          </span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span>Prep: {recipe.prepTimeMinutes} min</span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span>Cook: {recipe.cookTimeMinutes} min</span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span>{recipe.difficulty}</span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[var(--primary-text)]" />
            <span>{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</span>
          </span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 font-semibold text-[var(--accent-on-card)]">
            <Flame className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>~{kcal} kcal/serving (est.)</span>
          </span>
        </div>

        {recipe.dietTags && recipe.dietTags.length > 0 && (
          <p className="text-xs font-medium text-[var(--primary-text)]">
            Dietary tags: {recipe.dietTags.join(' · ')}
          </p>
        )}
      </section>

      {/* Ingredients + Shopping List */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-7 space-y-5 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[var(--text)]">
            Ingredients
          </h2>

          {recipe.ingredientsNeed && recipe.ingredientsNeed.length > 0 && (
            <button
              type="button"
              onClick={handleCopyShoppingList}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                copiedShoppingList
                  ? 'bg-[var(--primary-btn)] text-[var(--primary-btn-text)]'
                  : 'bg-[var(--soft-highlight)] hover:opacity-90 text-[var(--soft-highlight-text)]'
              }`}
            >
              {copiedShoppingList ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Shopping list copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy shopping list ({recipe.ingredientsNeed.length})</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Already Have */}
          <div className="space-y-2.5">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--primary-text)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>You already have</span>
            </h3>
            <ul className="divide-y divide-[var(--border)]/45 bg-[var(--secondary)] rounded-lg border border-[var(--border)] px-4">
              {recipe.ingredientsHave.map((item, idx) => (
                <li
                  key={idx}
                  className="py-2.5 text-sm text-[var(--secondary-text)] flex items-center justify-between gap-2"
                >
                  <span>{item}</span>
                  <span className="text-xs font-semibold shrink-0 opacity-85">
                    In pantry
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Need to Buy */}
          <div className="space-y-2.5">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--warning-on-card)] flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Extra to buy</span>
            </h3>
            {recipe.ingredientsNeed.length === 0 ? (
              <div className="p-4 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                No extra ingredients needed — you have everything for this recipe.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--need-border)]/40 bg-[var(--need-bg)] rounded-lg border border-[var(--need-border)] px-4">
                {recipe.ingredientsNeed.map((item, idx) => (
                  <li
                    key={idx}
                    className="py-2.5 text-sm text-[var(--need-text)] flex items-center justify-between gap-2"
                  >
                    <span>
                      <span className="font-semibold">{item.quantity}</span> {item.name}
                    </span>
                    <span className="text-xs font-semibold shrink-0 opacity-90">
                      To buy
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Numbered Step-by-Step Instructions */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-7 space-y-4 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold tracking-tight text-[var(--text)]">
              Step-by-step instructions
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">
              Tap a step to mark done
            </span>
          </div>

          {recipe.steps.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCookingStepIndex(0);
                setCookingModeOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Cooking Mode</span>
            </button>
          )}
        </div>

        <ol className="space-y-3">
          {recipe.steps.map((step, idx) => {
            const done = completedSteps.has(idx);
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => toggleStepDone(idx)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 flex items-start gap-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                    done
                      ? 'bg-[var(--surface-nested)] border-[var(--primary)] opacity-80'
                      : 'bg-[var(--surface-nested)] border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md text-xs font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      done
                        ? 'bg-[var(--primary-btn)] text-[var(--primary-btn-text)]'
                        : 'bg-[var(--card)] text-[var(--text)] border border-[var(--border)]'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  <span
                    className={`text-sm sm:text-base leading-relaxed ${
                      done
                        ? 'line-through text-[var(--text-secondary)]'
                        : 'text-[var(--text)]'
                    }`}
                  >
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Tips & Substitutions + Nutrition Estimate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recipe.tips && recipe.tips.length > 0 && (
          <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-6 space-y-3 transition-colors duration-200">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[var(--text)] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[var(--accent-on-card)]" />
              <span>Tips & substitutions</span>
            </h2>
            <ul className="space-y-2 text-sm text-[var(--text)]">
              {recipe.tips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  • {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-6 space-y-3 transition-colors duration-200">
          <div className="space-y-0.5">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[var(--text)] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[var(--accent)]" />
              <span>Estimated nutrition per serving</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Nutrition & calorie values are estimates based on standard portions
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-3 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--text)]">
                ~{kcal}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">kcal (est.)</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--text)]">
                {recipe.nutrition.protein}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">Protein</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--text)]">
                {recipe.nutrition.carbs}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">Carbs</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--text)]">
                {recipe.nutrition.fat}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">Fat</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Finish Cooking Banner */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--accent)] shadow-[var(--card-shadow)] p-5 flex flex-wrap items-center justify-between gap-4 transition-colors duration-200">
        <div className="space-y-0.5">
          <p className="font-serif text-lg font-semibold text-[var(--text)]">
            Finished making this dish?
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Tap below to count it toward your daily cooking streak.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkCooked}
          className={`min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors duration-200 cursor-pointer ${
            cookedJustNow
              ? 'bg-[var(--primary-btn)] text-[var(--primary-btn-text)]'
              : 'bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)]'
          }`}
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>{cookedJustNow ? 'Logged to streak!' : 'Cooked it!'}</span>
        </button>
      </section>

      {/* Guided Step-by-Step Cooking Mode Overlay (high-contrast text + accent highlights) */}
      {cookingModeOpen && recipe.steps.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cooking-mode-title"
          className="fixed inset-0 z-50 bg-[#1F2A36]/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-6 space-y-6 transition-colors duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
                  Cooking Mode · Step {cookingStepIndex + 1} of {recipe.steps.length}
                </p>
                <h2
                  id="cooking-mode-title"
                  className="font-serif text-xl font-semibold text-[var(--text)] mt-0.5"
                >
                  {recipe.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCookingModeOpen(false)}
                aria-label="Exit Cooking Mode"
                className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[var(--subtle)]/35 overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-200"
                style={{
                  width: `${Math.round(((cookingStepIndex + 1) / recipe.steps.length) * 100)}%`,
                }}
              />
            </div>

            <div className="min-h-[150px] p-5 rounded-xl bg-[var(--surface-nested)] border border-[var(--border)] flex items-center">
              <p className="text-lg sm:text-xl leading-relaxed font-medium text-[var(--text)]">
                {recipe.steps[cookingStepIndex]}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={cookingStepIndex === 0}
                onClick={() => setCookingStepIndex((i) => Math.max(0, i - 1))}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--chip-bg)] border border-[var(--border)] disabled:opacity-40 text-sm font-medium text-[var(--chip-text)] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {cookingStepIndex < recipe.steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCookingStepIndex((i) => Math.min(recipe.steps.length - 1, i + 1))
                  }
                  className="min-h-[44px] px-5 py-2 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] text-[var(--primary-btn-text)] text-sm font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Next step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkCooked}
                  className="min-h-[44px] px-5 py-2 rounded-lg bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Finish Cooking Mode</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
