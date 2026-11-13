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
} from 'lucide-react';
import { Recipe } from '../types';

interface RecipeDetailViewProps {
  recipe: Recipe;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

export function RecipeDetailView({
  recipe,
  isFavorite,
  onBack,
  onToggleFavorite,
}: RecipeDetailViewProps) {
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-lg text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9] hover:bg-[#ECD0C2]/60 dark:hover:bg-[#292F2D] flex items-center gap-1.5 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleFavorite(recipe)}
          className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] ${
            isFavorite
              ? 'bg-[#ECD0C2] dark:bg-[#343A36] border-[#B42B2F]/40 dark:border-[#D65356]/50 text-[#B42B2F] dark:text-[#D65356]'
              : 'bg-[#ECD0C2]/60 dark:bg-[#292F2D] border-[#3D4547]/20 dark:border-[#424844] text-[#3D4547] dark:text-[#EDEEE9] hover:bg-[#ECD0C2] dark:hover:bg-[#343A36]'
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? 'fill-[#B42B2F] text-[#B42B2F] dark:fill-[#D65356] dark:text-[#D65356]' : ''
            }`}
          />
          <span>{isFavorite ? 'Saved' : 'Save favorite'}</span>
        </button>
      </div>

      {/* Main Header Card */}
      <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-7 space-y-4 transition-colors duration-200">
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] text-balance leading-tight">
            {recipe.name}
          </h1>
          <p className="text-sm sm:text-base text-[#535C5E] dark:text-[#B8B9AF] leading-relaxed">
            {recipe.description}
          </p>
        </div>

        {/* Clean Metadata & Time Breakdown */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-[#3D4547]/15 dark:border-[#424844] text-xs sm:text-sm text-[#535C5E] dark:text-[#B8B9AF] tabular-nums">
          <span className="flex items-center gap-1.5 font-medium text-[#3D4547] dark:text-[#EDEEE9]">
            <Clock className="w-4 h-4 text-[#6E7234] dark:text-[#B5B86F]" />
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
            <Users className="w-3.5 h-3.5 text-[#6E7234] dark:text-[#B5B86F]" />
            <span>{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</span>
          </span>
        </div>

        {recipe.dietTags && recipe.dietTags.length > 0 && (
          <p className="text-xs font-medium text-[#6E7234] dark:text-[#B5B86F]">
            Dietary tags: {recipe.dietTags.join(' · ')}
          </p>
        )}
      </section>

      {/* Ingredients + Shopping List */}
      <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-7 space-y-5 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
            Ingredients
          </h2>

          {recipe.ingredientsNeed && recipe.ingredientsNeed.length > 0 && (
            <button
              type="button"
              onClick={handleCopyShoppingList}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] ${
                copiedShoppingList
                  ? 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                  : 'bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10'
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
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#6E7234] dark:text-[#B5B86F] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>You already have</span>
            </h3>
            <ul className="divide-y divide-[#3D4547]/12 dark:divide-[#424844] bg-[#EDEEE9] dark:bg-[#191E1F] rounded-lg border border-[#3D4547]/15 dark:border-[#424844] px-4">
              {recipe.ingredientsHave.map((item, idx) => (
                <li
                  key={idx}
                  className="py-2.5 text-sm text-[#3D4547] dark:text-[#EDEEE9] flex items-center justify-between gap-2"
                >
                  <span>{item}</span>
                  <span className="text-xs font-medium text-[#6E7234] dark:text-[#B5B86F] shrink-0">
                    In pantry
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Need to Buy */}
          <div className="space-y-2.5">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#B42B2F] dark:text-[#D9B9AA] flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Extra to buy</span>
            </h3>
            {recipe.ingredientsNeed.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/15 dark:border-[#424844] text-sm text-[#535C5E] dark:text-[#B8B9AF]">
                No extra ingredients needed — you have everything for this recipe.
              </div>
            ) : (
              <ul className="divide-y divide-[#3D4547]/12 dark:divide-[#424844] bg-[#EDEEE9] dark:bg-[#191E1F] rounded-lg border border-[#B42B2F]/20 dark:border-[#424844] px-4">
                {recipe.ingredientsNeed.map((item, idx) => (
                  <li
                    key={idx}
                    className="py-2.5 text-sm text-[#3D4547] dark:text-[#EDEEE9] flex items-center justify-between gap-2"
                  >
                    <span>
                      <span className="font-medium">{item.quantity}</span> {item.name}
                    </span>
                    <span className="text-xs font-medium text-[#B42B2F] dark:text-[#D9B9AA] shrink-0">
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
      <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-7 space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
            Step-by-step instructions
          </h2>
          <span className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
            Tap a step to mark done
          </span>
        </div>

        <ol className="space-y-3">
          {recipe.steps.map((step, idx) => {
            const done = completedSteps.has(idx);
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => toggleStepDone(idx)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 flex items-start gap-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] ${
                    done
                      ? 'bg-[#EDEEE9]/65 dark:bg-[#343A36]/75 border-[#9C9F52]/50 dark:border-[#B5B86F]/50 opacity-80'
                      : 'bg-[#EDEEE9] dark:bg-[#191E1F] border-[#3D4547]/15 dark:border-[#424844] hover:border-[#9C9F52] dark:hover:border-[#B5B86F]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md text-xs font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      done
                        ? 'bg-[#9C9F52] text-[#191E1F] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                        : 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#343A36] dark:text-[#EDEEE9] border border-transparent dark:border-[#424844]'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  <span
                    className={`text-sm sm:text-base leading-relaxed ${
                      done
                        ? 'line-through text-[#535C5E] dark:text-[#B8B9AF]'
                        : 'text-[#3D4547] dark:text-[#EDEEE9]'
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
          <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-6 space-y-3 transition-colors duration-200">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#B42B2F] dark:text-[#D9B9AA]" />
              <span>Tips & substitutions</span>
            </h2>
            <ul className="space-y-2 text-sm text-[#3D4547] dark:text-[#EDEEE9]">
              {recipe.tips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  • {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-6 space-y-3 transition-colors duration-200">
          <div className="space-y-0.5">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#6E7234] dark:text-[#B5B86F]" />
              <span>Estimated nutrition per serving</span>
            </h2>
            <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
              Rough estimate based on standard ingredient portions
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-3 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] text-center">
              <p className="text-lg font-semibold tabular-nums text-[#3D4547] dark:text-[#EDEEE9]">
                {recipe.nutrition.calories}
              </p>
              <p className="text-[11px] text-[#535C5E] dark:text-[#B8B9AF]">kcal</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] text-center">
              <p className="text-lg font-semibold tabular-nums text-[#3D4547] dark:text-[#EDEEE9]">
                {recipe.nutrition.protein}
              </p>
              <p className="text-[11px] text-[#535C5E] dark:text-[#B8B9AF]">Protein</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] text-center">
              <p className="text-lg font-semibold tabular-nums text-[#3D4547] dark:text-[#EDEEE9]">
                {recipe.nutrition.carbs}
              </p>
              <p className="text-[11px] text-[#535C5E] dark:text-[#B8B9AF]">Carbs</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] text-center">
              <p className="text-lg font-semibold tabular-nums text-[#3D4547] dark:text-[#EDEEE9]">
                {recipe.nutrition.fat}
              </p>
              <p className="text-[11px] text-[#535C5E] dark:text-[#B8B9AF]">Fat</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
