import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CuisineOption,
  FavoriteRecipe,
  MoodOption,
  Recipe,
  RecipeFilters,
  SearchHistoryItem,
} from '../types';

export const DEFAULT_FILTERS: RecipeFilters = {
  maxTimeMinutes: 0,
  diet: 'Any',
  cuisine: 'Any',
  mood: 'Any',
  servings: 2,
};

const VALID_CUISINES: CuisineOption[] = [
  'Any',
  'Filipino',
  'Japanese',
  'Korean',
  'Italian',
  'Mexican',
];

const VALID_MOODS: MoodOption[] = [
  'Any',
  'Comfort food',
  'Light and healthy',
  'Quick snack',
  'Impress guests',
];

function getStorageKey(userId: string, section: 'favorites' | 'history' | 'filters') {
  return `pantryai_${userId}_${section}`;
}

export function clearLegacyImageCacheForUser(userId: string): void {
  try {
    localStorage.removeItem(`pantryai_${userId}_dish_images`);
    localStorage.removeItem(`pantryai_${userId}_settings`);
  } catch {
    // Ignore storage cleanup errors
  }
}

export function buildRecipeId(recipeName: string): string {
  const slug = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

  let hash = 0;
  for (let i = 0; i < recipeName.length; i++) {
    hash = (hash * 31 + recipeName.charCodeAt(i)) >>> 0;
  }
  return `rec_${slug || 'item'}_${hash.toString(36)}`;
}

function sanitizeFilters(raw: Partial<RecipeFilters> | null | undefined): RecipeFilters {
  return {
    maxTimeMinutes:
      raw?.maxTimeMinutes === 15 ||
      raw?.maxTimeMinutes === 30 ||
      raw?.maxTimeMinutes === 60
        ? raw.maxTimeMinutes
        : 0,
    diet: raw?.diet || 'Any',
    cuisine:
      raw?.cuisine && VALID_CUISINES.includes(raw.cuisine) ? raw.cuisine : 'Any',
    mood: raw?.mood && VALID_MOODS.includes(raw.mood) ? raw.mood : 'Any',
    servings:
      typeof raw?.servings === 'number' &&
      raw.servings >= 1 &&
      raw.servings <= 6
        ? raw.servings
        : 2,
  };
}

export function loadLocalFilters(userId: string): RecipeFilters {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, 'filters'));
    if (!raw) return DEFAULT_FILTERS;
    return sanitizeFilters(JSON.parse(raw) as Partial<RecipeFilters>);
  } catch {
    return DEFAULT_FILTERS;
  }
}

export async function loadUserFilters(userId: string): Promise<RecipeFilters> {
  const local = loadLocalFilters(userId);
  try {
    const ref = doc(db, 'users', userId, 'preferences', 'filters');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const merged = sanitizeFilters(snap.data() as Partial<RecipeFilters>);
      try {
        localStorage.setItem(getStorageKey(userId, 'filters'), JSON.stringify(merged));
      } catch {
        // Ignore quota errors
      }
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch remote filters, using local cache:', err);
  }
  return local;
}

export async function saveUserFilters(
  userId: string,
  filters: RecipeFilters
): Promise<void> {
  try {
    localStorage.setItem(getStorageKey(userId, 'filters'), JSON.stringify(filters));
  } catch {
    // Ignore quota errors
  }
  const path = `users/${userId}/preferences/filters`;
  try {
    await setDoc(doc(db, 'users', userId, 'preferences', 'filters'), {
      userId,
      maxTimeMinutes: filters.maxTimeMinutes,
      diet: filters.diet,
      cuisine: filters.cuisine,
      mood: filters.mood,
      servings: filters.servings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

function stripLegacyImageUrl<T extends object>(obj: T): T {
  if ('imageUrl' in obj) {
    const copy = { ...obj } as T & { imageUrl?: unknown };
    delete copy.imageUrl;
    return copy as T;
  }
  return obj;
}

export function loadLocalFavorites(userId: string): FavoriteRecipe[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, 'favorites'));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as FavoriteRecipe[]).map((fav) => stripLegacyImageUrl(fav));
  } catch {
    return [];
  }
}

export async function loadUserFavorites(userId: string): Promise<FavoriteRecipe[]> {
  const local = loadLocalFavorites(userId);
  const path = `users/${userId}/favorites`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'favorites'));
    const remote: FavoriteRecipe[] = [];
    snap.forEach((d) => {
      remote.push(stripLegacyImageUrl(d.data() as FavoriteRecipe));
    });
    remote.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    try {
      localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(remote));
    } catch {
      // Ignore quota errors
    }
    return remote;
  } catch (err) {
    console.warn('Could not load remote favorites, using local cache:', err);
    if (local.length > 0) return local;
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveFavoriteRecipe(
  userId: string,
  recipe: Recipe
): Promise<FavoriteRecipe> {
  const id = buildRecipeId(recipe.name);
  const favorite: FavoriteRecipe = {
    id,
    userId,
    name: recipe.name.slice(0, 180),
    description: (recipe.description || '').slice(0, 400),
    cuisine: (recipe.cuisine || 'Global').slice(0, 64),
    mood: (recipe.mood || 'Everyday').slice(0, 64),
    totalTimeMinutes: recipe.totalTimeMinutes,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    dietTags: (recipe.dietTags || []).slice(0, 12),
    ingredientsHave: (recipe.ingredientsHave || []).slice(0, 60),
    ingredientsNeed: (recipe.ingredientsNeed || []).slice(0, 60),
    steps: (recipe.steps || []).slice(0, 40),
    tips: (recipe.tips || []).slice(0, 20),
    nutrition: recipe.nutrition,
    savedAt: new Date().toISOString(),
  };

  const current = loadLocalFavorites(userId).filter((f) => f.id !== id);
  const updated = [favorite, ...current];
  try {
    localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }

  const path = `users/${userId}/favorites/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'favorites', id), favorite);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
  return favorite;
}

export async function removeFavoriteRecipe(
  userId: string,
  recipeId: string
): Promise<void> {
  const current = loadLocalFavorites(userId).filter((f) => f.id !== recipeId);
  try {
    localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(current));
  } catch {
    // Ignore quota errors
  }

  const path = `users/${userId}/favorites/${recipeId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorites', recipeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function loadLocalHistory(userId: string): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, 'history'));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SearchHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export async function loadUserHistory(userId: string): Promise<SearchHistoryItem[]> {
  const local = loadLocalHistory(userId);
  const path = `users/${userId}/history`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'history'));
    const remote: SearchHistoryItem[] = [];
    snap.forEach((d) => {
      remote.push(d.data() as SearchHistoryItem);
    });
    remote.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const trimmed = remote.slice(0, 20);
    try {
      localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(trimmed));
    } catch {
      // Ignore quota errors
    }
    return trimmed;
  } catch (err) {
    console.warn('Could not load remote history, using local cache:', err);
    if (local.length > 0) return local;
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addSearchHistoryItem(
  userId: string,
  ingredients: string[],
  filters: RecipeFilters,
  recipes: Recipe[]
): Promise<SearchHistoryItem> {
  const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: SearchHistoryItem = {
    id,
    userId,
    ingredients: ingredients.slice(0, 50),
    filters,
    recipes: recipes.slice(0, 5).map((r) => stripLegacyImageUrl(r)),
    createdAt: new Date().toISOString(),
  };

  const current = loadLocalHistory(userId);
  const updated = [item, ...current].slice(0, 20);
  try {
    localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }

  const path = `users/${userId}/history/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'history', id), item);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return item;
}

export async function deleteSearchHistoryItem(
  userId: string,
  historyId: string
): Promise<void> {
  const current = loadLocalHistory(userId).filter((h) => h.id !== historyId);
  try {
    localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(current));
  } catch {
    // Ignore quota errors
  }

  const path = `users/${userId}/history/${historyId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'history', historyId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
