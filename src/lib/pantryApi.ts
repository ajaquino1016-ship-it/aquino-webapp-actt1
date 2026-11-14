import { Recipe, RecipeFilters, ShoppingCategory } from '../types';

export interface RecipeGenerationResult {
  recipes: Recipe[];
  noMatchReason?: string;
}

export async function generateRecipes(
  ingredients: string[],
  filters: RecipeFilters
): Promise<RecipeGenerationResult> {
  if (!navigator.onLine) {
    throw new Error('You appear to be offline. Please check your internet connection and try again.');
  }

  let response: Response;
  try {
    response = await fetch('/api/recipes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients,
        maxTimeMinutes: filters.maxTimeMinutes > 0 ? filters.maxTimeMinutes : null,
        diet: filters.diet,
        cuisine: filters.cuisine,
        mood: filters.mood,
        servings: filters.servings,
      }),
    });
  } catch {
    throw new Error('Could not reach PantryAI servers. Please check your connection and try again.');
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throw new Error('Received an unexpected response from PantryAI. Please try again.');
  }

  if (!response.ok) {
    const errObj = data as { error?: string } | null;
    throw new Error(errObj?.error || 'Failed to generate recipes. Please try again.');
  }

  const parsed = data as RecipeGenerationResult;
  if (!parsed || !Array.isArray(parsed.recipes)) {
    throw new Error('Unexpected recipe data received. Please try again.');
  }

  return parsed;
}

export async function categorizeShoppingItemsWithAI(
  items: string[]
): Promise<Record<string, ShoppingCategory>> {
  if (!navigator.onLine || items.length === 0) {
    return {};
  }

  try {
    const response = await fetch('/api/shopping-list/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) return {};
    const data = (await response.json()) as {
      categories?: Record<string, ShoppingCategory>;
    };
    return data.categories || {};
  } catch {
    return {};
  }
}
