import { Recipe, RecipeFilters, ShoppingCategory } from '../types';

export interface RecipeGenerationResult {
  recipes: Recipe[];
  noMatchReason?: string;
}

export interface IngredientDetectionResult {
  ingredients: string[];
  errorHint?: string;
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

export function prepareImageForUpload(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: dataUrl, mimeType: file.type || 'image/jpeg' });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: compressed, mimeType: 'image/jpeg' });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function detectIngredientsFromPhoto(file: File): Promise<IngredientDetectionResult> {
  if (!navigator.onLine) {
    throw new Error('You appear to be offline. Please check your internet connection and try again.');
  }

  const { base64, mimeType } = await prepareImageForUpload(file);

  let response: Response;
  try {
    response = await fetch('/api/ingredients/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
  } catch {
    throw new Error('Could not reach PantryAI servers to scan your photo. Please try again.');
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throw new Error('Could not read photo scan results. Please try again.');
  }

  if (!response.ok) {
    const errObj = data as { error?: string } | null;
    throw new Error(errObj?.error || 'Failed to detect ingredients from this photo.');
  }

  const parsed = data as IngredientDetectionResult;
  if (!parsed || !Array.isArray(parsed.ingredients)) {
    throw new Error('Unexpected response while scanning your photo. Please try again.');
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
