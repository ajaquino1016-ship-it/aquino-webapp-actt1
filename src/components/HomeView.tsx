import React, { useRef, useState } from 'react';
import {
  Camera,
  Plus,
  Search,
  X,
  Trash2,
  Clock,
  Utensils,
  Users,
  Pencil,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DietOption, MaxTimeOption, RecipeFilters } from '../types';
import { detectIngredientsFromPhoto } from '../lib/pantryApi';

interface HomeViewProps {
  ingredients: string[];
  onUpdateIngredients: (next: string[]) => void;
  filters: RecipeFilters;
  onUpdateFilters: (next: RecipeFilters) => void;
  onFindRecipes: () => void;
  showExamples: boolean;
}

const EXAMPLE_INGREDIENTS = ['chicken', 'tomato', 'onion'];
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

export function HomeView({
  ingredients,
  onUpdateIngredients,
  filters,
  onUpdateFilters,
  onFindRecipes,
  showExamples,
}: HomeViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const addIngredientsFromText = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.length <= 50);

    if (parts.length === 0) return;

    const existingSet = new Set(ingredients.map((i) => i.toLowerCase()));
    const next = [...ingredients];
    for (const part of parts) {
      if (!existingSet.has(part)) {
        existingSet.add(part);
        next.push(part);
      }
    }
    onUpdateIngredients(next);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addIngredientsFromText(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      onUpdateIngredients(ingredients.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
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
      onUpdateIngredients(Array.from(new Set(next)));
    }
    setEditingIndex(null);
    setEditingText('');
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError(null);
    setPhotoMessage(null);
    setIsScanningPhoto(true);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(previewUrl);

    try {
      const result = await detectIngredientsFromPhoto(file);
      if (result.ingredients.length === 0) {
        setPhotoError(
          result.errorHint ||
            'No recognizable food ingredients were spotted in that photo. Try a clearer, well-lit angle or type your ingredients below.'
        );
      } else {
        const existingSet = new Set(ingredients.map((i) => i.toLowerCase()));
        const next = [...ingredients];
        let addedCount = 0;
        for (const item of result.ingredients) {
          if (!existingSet.has(item.toLowerCase())) {
            existingSet.add(item.toLowerCase());
            next.push(item);
            addedCount++;
          }
        }
        onUpdateIngredients(next);
        setPhotoMessage(
          addedCount > 0
            ? `Added ${addedCount} ingredient${addedCount === 1 ? '' : 's'} from your photo. Tap any tag to edit or remove.`
            : 'All detected ingredients were already in your list.'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not scan that photo. Please try again.';
      setPhotoError(message);
    } finally {
      setIsScanningPhoto(false);
    }
  };

  const canSearch = ingredients.length >= 2 && !isScanningPhoto;

  return (
    <div className="space-y-8">
      {/* Editorial Hero Header */}
      <section className="space-y-2 pt-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B42B2F] dark:text-[#D9B9AA]">
          Pantry Journal
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] leading-[1.2] text-balance">
          Turn your ingredients into dinner
        </h1>
        <p className="text-sm sm:text-base text-[#535C5E] dark:text-[#B8B9AF] max-w-2xl leading-relaxed">
          List what is waiting in your fridge or pantry, or upload a quick photograph. PantryAI composes three practical recipes and notes any missing essentials.
        </p>
      </section>

      {/* Primary Card (#ECD0C2 warm blush in light mode, #292F2D dark surface in dark mode) */}
      <section className="bg-[#ECD0C2] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-5 sm:p-8 space-y-6 transition-colors duration-200">
        {/* Input Row */}
        <div className="space-y-2.5">
          <label
            htmlFor="ingredient-input"
            className="block text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9]"
          >
            Your ingredients
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 flex items-center">
              <input
                id="ingredient-input"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Type an ingredient (e.g., egg, rice, garlic) and press Enter"
                className="w-full min-h-[48px] pl-4 pr-20 py-2.5 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] placeholder-[#535C5E]/65 dark:placeholder-[#B8B9AF]/55 focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddButtonClick}
                disabled={!inputValue.trim()}
                className="absolute right-1.5 min-h-[36px] px-3 rounded-md bg-[#9C9F52] hover:bg-[#8B8E47] disabled:bg-[#3D4547]/10 dark:disabled:bg-[#343A36] text-[#191E1F] disabled:text-[#535C5E] dark:disabled:text-[#B8B9AF]/50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Secondary Button: Take or upload photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanningPhoto}
              className="min-h-[48px] px-4 py-2.5 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
            >
              {isScanningPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning photo...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Take or upload photo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Photo Scan Feedback */}
        {(photoPreviewUrl || photoMessage || photoError) && (
          <div className="p-3.5 rounded-lg bg-[#EDEEE9] dark:bg-[#343A36] border border-[#3D4547]/15 dark:border-[#424844] flex items-start gap-3">
            {photoPreviewUrl && (
              <img
                src={photoPreviewUrl}
                alt="Uploaded fridge or pantry photo"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-md object-cover border border-[#3D4547]/15 dark:border-[#424844] shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 text-xs sm:text-sm">
              {isScanningPhoto && (
                <p className="text-[#3D4547] dark:text-[#EDEEE9] font-medium">
                  Examining your photograph for ingredients...
                </p>
              )}
              {!isScanningPhoto && photoMessage && (
                <p className="text-[#3D4547] dark:text-[#B5B86F] font-medium">
                  {photoMessage}
                </p>
              )}
              {!isScanningPhoto && photoError && (
                <p className="text-[#B42B2F] dark:text-[#D65356] font-medium flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{photoError}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPhotoPreviewUrl(null);
                setPhotoMessage(null);
                setPhotoError(null);
              }}
              aria-label="Dismiss photo notice"
              className="p-1.5 text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Ingredient Tags / Example Chips */}
        <div className="space-y-3">
          {ingredients.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF]">
                  {ingredients.length} ingredient{ingredients.length === 1 ? '' : 's'} added · Tap any item to edit
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateIngredients([])}
                  className="min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium text-[#535C5E] hover:text-[#B42B2F] dark:text-[#B8B9AF] dark:hover:text-[#D65356] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {ingredients.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    className="inline-flex items-center bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#9C9F52]/50 dark:border-[#B5B86F]/40 rounded-lg overflow-hidden min-h-[40px]"
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
                          className="w-28 bg-white dark:bg-[#292F2D] border border-[#9C9F52] dark:border-[#B5B86F] rounded px-2 py-1 text-xs text-[#3D4547] dark:text-[#EDEEE9] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitEdit(idx)}
                          aria-label="Save ingredient edit"
                          className="p-1 text-[#6E7234] dark:text-[#B5B86F] cursor-pointer"
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
                          className="pl-3 pr-1.5 py-2 text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9] flex items-center gap-1.5 hover:text-[#6E7234] dark:hover:text-[#B5B86F] cursor-pointer"
                        >
                          <span>{item}</span>
                          <Pencil className="w-3 h-3 opacity-45" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          aria-label={`Remove ${item}`}
                          className="pr-2.5 pl-1 py-2 text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#B42B2F] dark:hover:text-[#D65356] cursor-pointer"
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
              <div className="p-4 rounded-lg bg-[#EDEEE9]/80 dark:bg-[#191E1F]/60 border border-[#3D4547]/12 dark:border-[#424844] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF]">
                    Quick start — tap example ingredients to try PantryAI:
                  </span>
                  <button
                    type="button"
                    onClick={() => addIngredientsFromText(EXAMPLE_INGREDIENTS.join(','))}
                    className="text-xs font-medium text-[#B42B2F] dark:text-[#D9B9AA] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
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
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#EDEEE9] dark:bg-[#292F2D] border border-[#3D4547]/20 dark:border-[#424844] hover:border-[#9C9F52] dark:hover:border-[#B5B86F] text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#6E7234] dark:text-[#B5B86F]" />
                      <span>{ex}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Optional Filters */}
        <div className="pt-5 border-t border-[#3D4547]/15 dark:border-[#424844] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Cooking Time */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6E7234] dark:text-[#B5B86F]" />
                <span>Max cooking time</span>
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/15 dark:border-[#424844] rounded-lg">
                {TIME_OPTIONS.map((opt) => {
                  const active = filters.maxTimeMinutes === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        onUpdateFilters({ ...filters, maxTimeMinutes: opt.value })
                      }
                      className={`min-h-[38px] px-1.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                          : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9]'
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
                className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-[#6E7234] dark:text-[#B5B86F]" />
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
                className="w-full min-h-[48px] px-3 py-2 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/15 dark:border-[#424844] rounded-lg text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9] focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] cursor-pointer"
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
              <label className="text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#6E7234] dark:text-[#B5B86F]" />
                <span>Servings</span>
              </label>
              <div className="grid grid-cols-6 gap-1 p-1 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/15 dark:border-[#424844] rounded-lg">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const active = filters.servings === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        onUpdateFilters({ ...filters, servings: num })
                      }
                      className={`min-h-[38px] rounded-md text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                          : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9]'
                      }`}
                    >
                      {num}
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
            className="w-full min-h-[52px] px-6 py-3.5 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] disabled:bg-[#3D4547]/25 text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:disabled:bg-[#343A36] dark:text-[#191E1F] dark:disabled:text-[#B8B9AF]/50 font-medium text-base transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
          >
            <Search className="w-4 h-4" />
            <span>Find Recipes</span>
          </button>

          {ingredients.length < 2 && (
            <p className="text-center text-xs text-[#535C5E] dark:text-[#B8B9AF]">
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
