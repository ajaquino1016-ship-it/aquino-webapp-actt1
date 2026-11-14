import React, { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  X,
  Trash2,
  Clock,
  Utensils,
  Users,
  Pencil,
  Check,
  Globe2,
  Sparkles,
} from 'lucide-react';
import {
  CuisineOption,
  DietOption,
  MaxTimeOption,
  MoodOption,
  RecipeFilters,
  UserStreakData,
} from '../types';
import { StreakCard } from './StreakCard';

interface HomeViewProps {
  ingredients: string[];
  onUpdateIngredients: (next: string[]) => void;
  filters: RecipeFilters;
  onUpdateFilters: (next: RecipeFilters) => void;
  onFindRecipes: () => void;
  showExamples: boolean;
  streak: UserStreakData;
  justExtendedDays: number | null;
  showEveningReminder: boolean;
  onOpenStreakHistory: () => void;
  onDismissFreezeNotice: () => void;
  onDismissExtendedBanner: () => void;
}

const EXAMPLE_INGREDIENTS = ['chicken', 'tomato', 'onion'];

const COMMON_INGREDIENT_CHIPS = [
  'eggs',
  'rice',
  'onion',
  'garlic',
  'tomato',
  'chicken',
  'pasta',
  'potato',
];

const INGREDIENT_SUGGESTIONS = [
  'eggs',
  'rice',
  'onion',
  'garlic',
  'tomato',
  'chicken',
  'pasta',
  'potato',
  'avocado',
  'bacon',
  'banana',
  'basil',
  'beef',
  'bell pepper',
  'black beans',
  'bok choy',
  'bread',
  'broccoli',
  'brown sugar',
  'butter',
  'cabbage',
  'carrot',
  'cauliflower',
  'celery',
  'cheddar cheese',
  'cheese',
  'chicken breast',
  'chicken thighs',
  'chickpeas',
  'chili',
  'cilantro',
  'coconut milk',
  'corn',
  'cream cheese',
  'cucumber',
  'eggplant',
  'fish',
  'fish sauce',
  'flour',
  'ginger',
  'green beans',
  'green onion',
  'ground beef',
  'ground pork',
  'ham',
  'heavy cream',
  'honey',
  'jalapeno',
  'kale',
  'kimchi',
  'lemon',
  'lentils',
  'lettuce',
  'lime',
  'mayonnaise',
  'milk',
  'miso paste',
  'mozzarella',
  'mushrooms',
  'noodles',
  'oats',
  'olive oil',
  'oyster sauce',
  'parmesan',
  'parsley',
  'peanut butter',
  'peas',
  'pork',
  'pork belly',
  'quinoa',
  'ramen noodles',
  'red onion',
  'salmon',
  'sausage',
  'scallions',
  'sesame oil',
  'shallot',
  'shrimp',
  'sour cream',
  'soy sauce',
  'spaghetti',
  'spinach',
  'sweet potato',
  'tofu',
  'tomato paste',
  'tomato sauce',
  'tortilla',
  'tuna',
  'turkey',
  'udon noodles',
  'vinegar',
  'yogurt',
  'zucchini',
];

const TIME_OPTIONS: { label: string; value: MaxTimeOption }[] = [
  { label: 'Any', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];
const DIET_OPTIONS: DietOption[] = [
  'Any',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Low-carb',
];
const CUISINE_OPTIONS: CuisineOption[] = [
  'Any',
  'Filipino',
  'Japanese',
  'Korean',
  'Italian',
  'Mexican',
];
const MOOD_OPTIONS: MoodOption[] = [
  'Any',
  'Comfort food',
  'Light and healthy',
  'Quick snack',
  'Impress guests',
];

export function HomeView({
  ingredients,
  onUpdateIngredients,
  filters,
  onUpdateFilters,
  onFindRecipes,
  showExamples,
  streak,
  justExtendedDays,
  showEveningReminder,
  onOpenStreakHistory,
  onDismissFreezeNotice,
  onDismissExtendedBanner,
}: HomeViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [duplicateHint, setDuplicateHint] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const ingredientInputRef = useRef<HTMLInputElement>(null);
  const duplicateTimerRef = useRef<number | null>(null);

  const existingSet = useMemo(
    () => new Set(ingredients.map((i) => i.trim().toLowerCase())),
    [ingredients]
  );

  const autocompleteMatches = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];
    const prefixMatches: string[] = [];
    const substringMatches: string[] = [];

    for (const item of INGREDIENT_SUGGESTIONS) {
      if (existingSet.has(item)) continue;
      if (item.startsWith(q)) {
        prefixMatches.push(item);
      } else if (item.includes(q)) {
        substringMatches.push(item);
      }
    }

    return [...prefixMatches, ...substringMatches].slice(0, 6);
  }, [inputValue, existingSet]);

  const showAutocomplete = isInputFocused && autocompleteMatches.length > 0;

  const showDuplicateFeedback = (label: string) => {
    if (duplicateTimerRef.current) {
      window.clearTimeout(duplicateTimerRef.current);
    }
    setDuplicateHint(`"${label}" is already in your ingredient list.`);
    duplicateTimerRef.current = window.setTimeout(() => {
      setDuplicateHint(null);
    }, 2400);
  };

  const focusIngredientInput = () => {
    ingredientInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => ingredientInputRef.current?.focus(), 200);
  };

  const addIngredientsFromText = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.length <= 50);

    if (parts.length === 0) return;

    const currentSet = new Set(ingredients.map((i) => i.trim().toLowerCase()));
    const next = [...ingredients];
    const skippedDuplicates: string[] = [];

    for (const part of parts) {
      if (!currentSet.has(part)) {
        currentSet.add(part);
        next.push(part);
      } else {
        skippedDuplicates.push(part);
      }
    }

    if (next.length !== ingredients.length) {
      onUpdateIngredients(next);
      setDuplicateHint(null);
    } else if (skippedDuplicates.length > 0) {
      showDuplicateFeedback(skippedDuplicates[0]);
    }
  };

  const handleSelectAutocomplete = (suggestion: string) => {
    addIngredientsFromText(suggestion);
    setInputValue('');
    setHighlightedIndex(-1);
    ingredientInputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete && e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < autocompleteMatches.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (showAutocomplete && e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : autocompleteMatches.length - 1
      );
      return;
    }

    if (e.key === 'Escape' && showAutocomplete) {
      e.preventDefault();
      setHighlightedIndex(-1);
      setIsInputFocused(false);
      return;
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (
        e.key === 'Enter' &&
        showAutocomplete &&
        highlightedIndex >= 0 &&
        autocompleteMatches[highlightedIndex]
      ) {
        handleSelectAutocomplete(autocompleteMatches[highlightedIndex]);
        return;
      }
      if (inputValue.trim()) {
        addIngredientsFromText(inputValue);
        setInputValue('');
        setHighlightedIndex(-1);
      }
    } else if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      onUpdateIngredients(ingredients.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDuplicateHint(null);
    setHighlightedIndex(-1);
    if (val.includes(',')) {
      const segments = val.split(',');
      const last = segments.pop() ?? '';
      const completed = segments.join(',');
      if (completed.trim()) {
        addIngredientsFromText(completed);
      }
      setInputValue(last);
    } else {
      setInputValue(val);
    }
  };

  const handleAddButtonClick = () => {
    if (inputValue.trim()) {
      addIngredientsFromText(inputValue);
      setInputValue('');
      setHighlightedIndex(-1);
      ingredientInputRef.current?.focus();
    }
  };

  const handleRemoveIngredient = (index: number) => {
    onUpdateIngredients(ingredients.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(ingredients[index]);
  };

  const handleCommitEdit = (index: number) => {
    const cleaned = editingText.trim().toLowerCase();
    if (!cleaned) {
      handleRemoveIngredient(index);
    } else {
      const next = [...ingredients];
      next[index] = cleaned;
      onUpdateIngredients(Array.from(new Set(next.map((item) => item.trim().toLowerCase()))));
    }
    setEditingIndex(null);
    setEditingText('');
  };

  const canSearch = ingredients.length >= 2;

  return (
    <div className="space-y-8">
      {/* Home Screen Streak Card */}
      <StreakCard
        streak={streak}
        justExtendedDays={justExtendedDays}
        showEveningReminder={showEveningReminder}
        onOpenHistory={onOpenStreakHistory}
        onFindRecipe={focusIngredientInput}
        onDismissFreezeNotice={onDismissFreezeNotice}
        onDismissExtendedBanner={onDismissExtendedBanner}
      />

      {/* Editorial Hero Header */}
      <section className="space-y-2 pt-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent-on-card)]">
          Pantry Journal
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text)] leading-[1.2] text-balance">
          Turn your ingredients into dinner
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Type the ingredients you have in your fridge or pantry. PantryAI composes three practical recipes and notes any missing essentials.
        </p>
      </section>

      {/* Primary Card */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-[var(--card-shadow)] p-5 sm:p-8 space-y-6 transition-colors duration-200">
        {/* Prominent Typed Ingredient Input */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor="ingredient-input"
              className="block text-base font-semibold text-[var(--text)]"
            >
              Type the ingredients you have
            </label>
            <span className="text-xs text-[var(--text-secondary)]">
              Try: chicken, garlic, rice
            </span>
          </div>

          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-4 pointer-events-none" />
              <input
                ref={ingredientInputRef}
                id="ingredient-input"
                type="text"
                role="combobox"
                aria-expanded={showAutocomplete}
                aria-controls="ingredient-autocomplete-list"
                aria-autocomplete="list"
                aria-activedescendant={
                  highlightedIndex >= 0 ? `ingredient-option-${highlightedIndex}` : undefined
                }
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setIsInputFocused(false);
                    setHighlightedIndex(-1);
                  }, 120);
                }}
                placeholder="Type an ingredient and press Enter or comma..."
                className="w-full min-h-[54px] pl-11 pr-24 py-3 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-xl text-base text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/25 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={handleAddButtonClick}
                disabled={!inputValue.trim()}
                className="absolute right-2 min-h-[40px] px-3.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] disabled:bg-[var(--subtle)]/40 text-[var(--primary-btn-text)] disabled:text-[var(--text-secondary)] text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {showAutocomplete && (
              <ul
                id="ingredient-autocomplete-list"
                role="listbox"
                aria-label="Ingredient suggestions"
                className="absolute z-30 left-0 right-0 mt-1.5 bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-[var(--card-shadow)] overflow-hidden py-1"
              >
                {autocompleteMatches.map((suggestion, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={suggestion}
                      id={`ingredient-option-${idx}`}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAutocomplete(suggestion);
                        }}
                        className={`w-full min-h-[42px] px-4 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isHighlighted
                            ? 'bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] font-medium'
                            : 'text-[var(--text)] hover:bg-[var(--surface-nested)]'
                        }`}
                      >
                        <span>{suggestion}</span>
                        <span className="text-xs opacity-75 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-secondary)]">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-nested)] border border-[var(--border)] text-[var(--text)] font-sans text-[11px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-nested)] border border-[var(--border)] text-[var(--text)] font-sans text-[11px]">,</kbd> after each ingredient.
            </p>
            {duplicateHint && (
              <p role="status" className="text-xs font-medium text-[var(--accent-on-card)]">
                {duplicateHint}
              </p>
            )}
          </div>

          {/* Tappable Common Ingredient Chips */}
          <div className="pt-1 space-y-2">
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              Tap to add common ingredients:
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_INGREDIENT_CHIPS.map((item) => {
                const alreadyAdded = existingSet.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => addIngredientsFromText(item)}
                    aria-label={alreadyAdded ? `${item} already added` : `Add ${item}`}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors duration-200 ${
                      alreadyAdded
                        ? 'bg-[var(--surface-nested)] border-[var(--border)] text-[var(--text-secondary)] opacity-60 cursor-default'
                        : 'bg-[var(--chip-bg)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--soft-highlight)]/45 text-[var(--chip-text)] cursor-pointer'
                    }`}
                  >
                    {alreadyAdded ? (
                      <Check className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                    )}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ingredient Tags / Example Chips */}
        <div className="space-y-3">
          {ingredients.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {ingredients.length} ingredient{ingredients.length === 1 ? '' : 's'} added · Tap any item to edit
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateIngredients([])}
                  className="min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--warning-on-card)] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {ingredients.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    className="inline-flex items-center bg-[var(--chip-bg)] border border-[var(--border)] rounded-lg overflow-hidden min-h-[40px] transition-colors duration-200"
                  >
                    {editingIndex === idx ? (
                      <div className="flex items-center px-2 gap-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitEdit(idx);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          autoFocus
                          className="w-28 bg-[var(--card)] border border-[var(--primary)] rounded px-2 py-1 text-xs text-[var(--text)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitEdit(idx)}
                          aria-label="Save ingredient edit"
                          className="p-1 text-[var(--primary-text)] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx)}
                          title="Tap to edit ingredient"
                          className="pl-3 pr-1.5 py-2 text-sm font-medium text-[var(--chip-text)] flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
                        >
                          <span>{item}</span>
                          <Pencil className="w-3 h-3 opacity-55" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          aria-label={`Remove ${item}`}
                          className="pr-2.5 pl-1 py-2 text-[var(--chip-text)] opacity-75 hover:opacity-100 hover:text-[var(--warning-on-card)] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            showExamples && (
              <div className="p-4 rounded-lg bg-[var(--surface-nested)] border border-[var(--border)] space-y-2.5 transition-colors duration-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Quick start — try a sample ingredient trio:
                  </span>
                  <button
                    type="button"
                    onClick={() => addIngredientsFromText(EXAMPLE_INGREDIENTS.join(','))}
                    className="text-xs font-semibold text-[var(--primary-text)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Use all 3
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_INGREDIENTS.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => addIngredientsFromText(ex)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--chip-bg)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-medium text-[var(--chip-text)] flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                      <span>{ex}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Optional Filters */}
        <div className="pt-5 border-t border-[var(--border)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Cooking Time */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                <span>Max cooking time</span>
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg">
                {TIME_OPTIONS.map((opt) => {
                  const active = filters.maxTimeMinutes === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        onUpdateFilters({ ...filters, maxTimeMinutes: opt.value })
                      }
                      className={`min-h-[38px] px-1.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                        active
                          ? 'bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--soft-highlight)]/35'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diet Filter */}
            <div className="space-y-2">
              <label
                htmlFor="diet-select"
                className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                <span>Diet preference</span>
              </label>
              <select
                id="diet-select"
                value={filters.diet}
                onChange={(e) =>
                  onUpdateFilters({
                    ...filters,
                    diet: e.target.value as DietOption,
                  })
                }
                className="w-full min-h-[48px] px-3 py-2 bg-[var(--card)] border border-[var(--subtle)] rounded-lg text-sm font-medium text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/25 cursor-pointer transition-colors duration-200"
              >
                {DIET_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'Any' ? 'Any diet' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Servings 1 to 6 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                <span>Servings</span>
              </label>
              <div className="grid grid-cols-6 gap-1 p-1 bg-[var(--surface-nested)] border border-[var(--subtle)] rounded-lg">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const active = filters.servings === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        onUpdateFilters({ ...filters, servings: num })
                      }
                      className={`min-h-[38px] rounded-md text-xs font-medium tabular-nums transition-colors duration-200 cursor-pointer ${
                        active
                          ? 'bg-[var(--soft-highlight)] text-[var(--soft-highlight-text)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--soft-highlight)]/35'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cuisine & Mood Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Cuisine */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[var(--primary-text)]" />
                <span>Cuisine</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CUISINE_OPTIONS.map((c) => {
                  const active = filters.cuisine === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdateFilters({ ...filters, cuisine: c })}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 cursor-pointer ${
                        active
                          ? 'bg-[var(--soft-highlight)] border-[var(--primary)] text-[var(--soft-highlight-text)] font-semibold'
                          : 'bg-[var(--card)] border-[var(--subtle)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text)] hover:bg-[var(--soft-highlight)]/30'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-on-card)]" />
                <span>Mood</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((m) => {
                  const active = filters.mood === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdateFilters({ ...filters, mood: m })}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 cursor-pointer ${
                        active
                          ? 'bg-[var(--soft-highlight)] border-[var(--primary)] text-[var(--soft-highlight-text)] font-semibold'
                          : 'bg-[var(--card)] border-[var(--subtle)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text)] hover:bg-[var(--soft-highlight)]/30'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA: Find Recipes */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onFindRecipes}
            disabled={!canSearch}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-lg bg-[var(--primary-btn)] hover:bg-[var(--primary-btn-hover)] disabled:opacity-45 text-[var(--primary-btn-text)] font-medium text-base transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <Search className="w-4 h-4" />
            <span>Find Recipes</span>
          </button>

          {ingredients.length < 2 && (
            <p className="text-center text-xs text-[var(--text-secondary)]">
              {ingredients.length === 0
                ? 'Add at least 2 ingredients to get started.'
                : 'Add 1 more ingredient to unlock recipe suggestions.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
