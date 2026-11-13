export type DietOption =
  | 'Any'
  | 'Vegetarian'
  | 'Vegan'
  | 'Pescatarian'
  | 'Gluten-free'
  | 'Dairy-free'
  | 'Halal'
  | 'Low-carb';

export type MaxTimeOption = 0 | 15 | 30 | 60;

export interface RecipeFilters {
  maxTimeMinutes: MaxTimeOption;
  diet: DietOption;
  servings: number;
}

export interface IngredientNeed {
  name: string;
  quantity: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  id?: string;
  name: string;
  description: string;
  totalTimeMinutes: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  dietTags: string[];
  ingredientsHave: string[];
  ingredientsNeed: IngredientNeed[];
  steps: string[];
  tips: string[];
  nutrition: RecipeNutrition;
}

export interface FavoriteRecipe extends Recipe {
  id: string;
  userId: string;
  savedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  ingredients: string[];
  filters: RecipeFilters;
  recipes: Recipe[];
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role?: string;
  companyOrStudio?: string;
  storageUsedBytes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AppTab = 'home' | 'favorites' | 'history';
