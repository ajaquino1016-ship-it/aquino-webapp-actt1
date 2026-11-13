export type DietOption =
  | 'Any'
  | 'Vegetarian'
  | 'Vegan'
  | 'Pescatarian'
  | 'Gluten-free'
  | 'Dairy-free'
  | 'Halal'
  | 'Low-carb';

export type CuisineOption =
  | 'Any'
  | 'Filipino'
  | 'Japanese'
  | 'Korean'
  | 'Italian'
  | 'Mexican';

export type MoodOption =
  | 'Any'
  | 'Comfort food'
  | 'Light and healthy'
  | 'Quick snack'
  | 'Impress guests';

export type MaxTimeOption = 0 | 15 | 30 | 60;

export interface RecipeFilters {
  maxTimeMinutes: MaxTimeOption;
  diet: DietOption;
  cuisine: CuisineOption;
  mood: MoodOption;
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
  cuisine?: string;
  mood?: string;
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

export type AppTab = 'home' | 'favorites' | 'planner' | 'history';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type MealSlotType = 'breakfast' | 'lunch' | 'dinner';

export interface PlannedMeal {
  recipeId: string;
  recipe: Recipe;
  addedAt: string;
}

export type DayMealSlots = {
  breakfast: PlannedMeal | null;
  lunch: PlannedMeal | null;
  dinner: PlannedMeal | null;
};

export type MealPlanWeek = Record<DayOfWeek, DayMealSlots>;

export type ShoppingCategory =
  | 'Produce'
  | 'Meat and Seafood'
  | 'Dairy and Eggs'
  | 'Grains and Pantry'
  | 'Other';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: ShoppingCategory;
  checked: boolean;
}

export type StreakBadgeId =
  | 'first_flame'
  | 'week_warrior'
  | 'fortnight_chef'
  | 'monthly_master'
  | 'century_cook';

export type StreakMilestone = 3 | 7 | 14 | 30 | 60 | 100;

export interface StreakBadgeDefinition {
  id: StreakBadgeId;
  name: string;
  requirementText: string;
  requiredDays: number;
}

export interface StreakSettings {
  notificationsEnabled: boolean;
  streakReminderEnabled: boolean;
  reminderTime: string; // "HH:MM", default "18:00"
  lastNotifiedDate: string | null;
}

export interface UserStreakData {
  userId: string;
  visitStreak: number;
  bestVisitStreak: number;
  lastVisitDate: string | null; // YYYY-MM-DD local
  cookingStreak: number;
  bestCookingStreak: number;
  lastCookedDate: string | null; // YYYY-MM-DD local
  freezes: number; // 0..2
  cookedDates: string[]; // unique YYYY-MM-DD local dates
  freezeDates: string[]; // unique YYYY-MM-DD local dates where a freeze was consumed
  unlockedBadges: StreakBadgeId[];
  celebratedMilestones: StreakMilestone[];
  monthlyRecipeCounts: Record<string, number>; // "YYYY-MM" -> recipes cooked count
  pendingFreezeNotice: boolean;
  freshStartNotice: boolean;
  settings: StreakSettings;
  updatedAt: string;
}

export interface CookActionResult {
  streak: UserStreakData;
  alreadyCookedToday: boolean;
  streakExtended: boolean;
  newCookingStreak: number;
  earnedFreeze: boolean;
  milestoneReached: StreakMilestone | null;
  newlyUnlockedBadges: StreakBadgeId[];
}

