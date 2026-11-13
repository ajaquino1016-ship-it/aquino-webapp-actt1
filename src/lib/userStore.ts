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
  FavoriteRecipe,
  Recipe,
  RecipeFilters,
  SearchHistoryItem,
} from '../types';

export const DEFAULT_FILTERS: RecipeFilters = {
  maxTimeMinutes: 0,
  diet: 'Any',
  servings: 2,
};

function getStorageKey(userId: string, section: 'favorites' | 'history' | 'filters') {
  return `pantryai_${userId}_${section}`;
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

export function loadLocalFilters(userId: string): RecipeFilters {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, 'filters'));
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<RecipeFilters>;
    return {
      maxTimeMinutes:
        parsed.maxTimeMinutes === 15 ||
        parsed.maxTimeMinutes === 30 ||
        parsed.maxTimeMinutes === 60
          ? parsed.maxTimeMinutes
          : 0,
      diet: parsed.diet || 'Any',
      servings:
        typeof parsed.servings === 'number' &&
        parsed.servings >= 1 &&
        parsed.servings <= 6
          ? parsed.servings
          : 2,
    };
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
      const data = snap.data() as Partial<RecipeFilters>;
      const merged: RecipeFilters = {
        maxTimeMinutes:
          data.maxTimeMinutes === 15 ||
          data.maxTimeMinutes === 30 ||
          data.maxTimeMinutes === 60
            ? data.maxTimeMinutes
            : 0,
        diet: data.diet || 'Any',
        servings:
          typeof data.servings === 'number' &&
          data.servings >= 1 &&
          data.servings <= 6
            ? data.servings
            : 2,
      };
      localStorage.setItem(getStorageKey(userId, 'filters'), JSON.stringify(merged));
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
  localStorage.setItem(getStorageKey(userId, 'filters'), JSON.stringify(filters));
  const path = `users/${userId}/preferences/filters`;
  try {
    await setDoc(doc(db, 'users', userId, 'preferences', 'filters'), {
      userId,
      maxTimeMinutes: filters.maxTimeMinutes,
      diet: filters.diet,
      servings: filters.servings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function loadLocalFavorites(userId: string): FavoriteRecipe[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, 'favorites'));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FavoriteRecipe[]) : [];
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
      remote.push(d.data() as FavoriteRecipe);
    });
    remote.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(remote));
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
    ...recipe,
    id,
    userId,
    name: recipe.name.slice(0, 180),
    description: (recipe.description || '').slice(0, 400),
    dietTags: (recipe.dietTags || []).slice(0, 12),
    ingredientsHave: (recipe.ingredientsHave || []).slice(0, 60),
    ingredientsNeed: (recipe.ingredientsNeed || []).slice(0, 60),
    steps: (recipe.steps || []).slice(0, 40),
    tips: (recipe.tips || []).slice(0, 20),
    savedAt: new Date().toISOString(),
  };

  const current = loadLocalFavorites(userId).filter((f) => f.id !== id);
  const updated = [favorite, ...current];
  localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(updated));

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
  localStorage.setItem(getStorageKey(userId, 'favorites'), JSON.stringify(current));

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
    localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(trimmed));
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
    recipes: recipes.slice(0, 5),
    createdAt: new Date().toISOString(),
  };

  const current = loadLocalHistory(userId);
  const updated = [item, ...current].slice(0, 20);
  localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(updated));

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
  localStorage.setItem(getStorageKey(userId, 'history'), JSON.stringify(current));

  const path = `users/${userId}/history/${historyId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'history', historyId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
