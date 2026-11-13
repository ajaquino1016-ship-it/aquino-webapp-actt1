import {
  DayMealSlots,
  DayOfWeek,
  MealPlanWeek,
  MealSlotType,
  PlannedMeal,
  Recipe,
  ShoppingCategory,
  ShoppingListItem,
} from '../types';
import { categorizeShoppingItemsWithAI } from './pantryApi';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const MEAL_SLOTS: { key: MealSlotType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  'Produce',
  'Meat and Seafood',
  'Dairy and Eggs',
  'Grains and Pantry',
  'Other',
];

function getMealPlanStorageKey(userId: string): string {
  return `pantryai_${userId}_meal_plan`;
}

function getShoppingListStorageKey(userId: string): string {
  return `pantryai_${userId}_shopping_list`;
}

export function createEmptyDaySlots(): DayMealSlots {
  return {
    breakfast: null,
    lunch: null,
    dinner: null,
  };
}

export function createEmptyMealPlan(): MealPlanWeek {
  return {
    Monday: createEmptyDaySlots(),
    Tuesday: createEmptyDaySlots(),
    Wednesday: createEmptyDaySlots(),
    Thursday: createEmptyDaySlots(),
    Friday: createEmptyDaySlots(),
    Saturday: createEmptyDaySlots(),
    Sunday: createEmptyDaySlots(),
  };
}

function sanitizePlannedMeal(raw: unknown): PlannedMeal | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<PlannedMeal>;
  if (!candidate.recipe || typeof candidate.recipe.name !== 'string') return null;

  // Strip any legacy imageUrl field if present in stored JSON
  const cleanRecipe = { ...(candidate.recipe as Recipe & { imageUrl?: unknown }) };
  if ('imageUrl' in cleanRecipe) {
    delete cleanRecipe.imageUrl;
  }

  return {
    recipeId: typeof candidate.recipeId === 'string' ? candidate.recipeId : cleanRecipe.id || cleanRecipe.name,
    recipe: cleanRecipe,
    addedAt: typeof candidate.addedAt === 'string' ? candidate.addedAt : new Date().toISOString(),
  };
}

function sanitizeMealPlan(raw: unknown): MealPlanWeek {
  const empty = createEmptyMealPlan();
  if (!raw || typeof raw !== 'object') return empty;
  const obj = raw as Record<string, unknown>;

  for (const day of DAYS_OF_WEEK) {
    const dayRaw = obj[day];
    if (dayRaw && typeof dayRaw === 'object') {
      const slots = dayRaw as Record<string, unknown>;
      empty[day] = {
        breakfast: sanitizePlannedMeal(slots.breakfast),
        lunch: sanitizePlannedMeal(slots.lunch),
        dinner: sanitizePlannedMeal(slots.dinner),
      };
    }
  }
  return empty;
}

export function loadMealPlan(userId: string): MealPlanWeek {
  try {
    const raw = localStorage.getItem(getMealPlanStorageKey(userId));
    if (!raw) return createEmptyMealPlan();
    return sanitizeMealPlan(JSON.parse(raw));
  } catch {
    return createEmptyMealPlan();
  }
}

export function saveMealPlan(userId: string, plan: MealPlanWeek): void {
  try {
    localStorage.setItem(getMealPlanStorageKey(userId), JSON.stringify(plan));
  } catch {
    // Ignore localStorage quota errors
  }
}

export function loadShoppingList(userId: string): ShoppingListItem[] {
  try {
    const raw = localStorage.getItem(getShoppingListStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ShoppingListItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.quantity === 'string' &&
        typeof item.category === 'string' &&
        typeof item.checked === 'boolean'
    );
  } catch {
    return [];
  }
}

export function saveShoppingList(userId: string, list: ShoppingListItem[]): void {
  try {
    localStorage.setItem(getShoppingListStorageKey(userId), JSON.stringify(list));
  } catch {
    // Ignore localStorage quota errors
  }
}

export function getDayCalories(daySlots: DayMealSlots): number {
  let total = 0;
  for (const slot of MEAL_SLOTS) {
    const meal = daySlots[slot.key];
    if (meal) {
      total += meal.recipe.nutrition?.calories || 350;
    }
  }
  return total;
}

export function getWeeklyCalorieStats(plan: MealPlanWeek): {
  weeklyTotal: number;
  dailyAverage: number;
  totalMeals: number;
} {
  let weeklyTotal = 0;
  let totalMeals = 0;

  for (const day of DAYS_OF_WEEK) {
    const slots = plan[day];
    for (const slot of MEAL_SLOTS) {
      const meal = slots[slot.key];
      if (meal) {
        weeklyTotal += meal.recipe.nutrition?.calories || 350;
        totalMeals += 1;
      }
    }
  }

  return {
    weeklyTotal,
    dailyAverage: totalMeals > 0 ? Math.round(weeklyTotal / 7) : 0,
    totalMeals,
  };
}

// Basic pantry staples to skip automatically when building a shopping list
const PANTRY_STAPLES = new Set([
  'salt',
  'sea salt',
  'kosher salt',
  'table salt',
  'fine salt',
  'pepper',
  'black pepper',
  'ground black pepper',
  'cracked black pepper',
  'white pepper',
  'salt and pepper',
  'salt & pepper',
  'cooking oil',
  'vegetable oil',
  'canola oil',
  'neutral oil',
  'water',
  'cold water',
  'warm water',
  'hot water',
  'boiling water',
  'ice',
  'ice water',
]);

function isPantryStaple(rawName: string): boolean {
  const norm = rawName
    .toLowerCase()
    .replace(/[(),.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!norm) return true;
  if (PANTRY_STAPLES.has(norm)) return true;
  return false;
}

function normalizeIngredientKey(rawName: string): {
  key: string;
  displayName: string;
} {
  const cleaned = rawName
    .replace(/\s+/g, ' ')
    .replace(/^[-•*]\s*/, '')
    .trim();

  let norm = cleaned
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Singularize common plural endings cleanly for grouping (eggs -> egg, tomatoes -> tomato)
  if (norm.endsWith('oes') && norm.length > 4) {
    norm = norm.slice(0, -2);
  } else if (norm.endsWith('ies') && norm.length > 4) {
    norm = `${norm.slice(0, -3)}y`;
  } else if (
    norm.endsWith('s') &&
    !norm.endsWith('ss') &&
    !norm.endsWith('us') &&
    norm.length > 3
  ) {
    norm = norm.slice(0, -1);
  }

  const displayName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return { key: norm || cleaned.toLowerCase(), displayName };
}

const UNIT_ALIASES: Record<string, string> = {
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tbs: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'L',
  liter: 'L',
  liters: 'L',
  clove: 'clove',
  cloves: 'clove',
  can: 'can',
  cans: 'can',
  bunch: 'bunch',
  bunches: 'bunch',
  pack: 'pack',
  packs: 'pack',
  package: 'pack',
  packages: 'pack',
  piece: 'piece',
  pieces: 'piece',
  pcs: 'piece',
  slice: 'slice',
  slices: 'slice',
  stalk: 'stalk',
  stalks: 'stalk',
  head: 'head',
  heads: 'head',
  sprig: 'sprig',
  sprigs: 'sprig',
  bottle: 'bottle',
  bottles: 'bottle',
  jar: 'jar',
  jars: 'jar',
  pinch: 'pinch',
  pinches: 'pinch',
};

function parseUnicodeFractions(str: string): string {
  return str
    .replace(/½/g, ' 1/2')
    .replace(/⅓/g, ' 1/3')
    .replace(/⅔/g, ' 2/3')
    .replace(/¼/g, ' 1/4')
    .replace(/¾/g, ' 3/4')
    .replace(/⅛/g, ' 1/8')
    .trim();
}

interface ParsedQuantity {
  amount: number;
  unit: string; // '' when unitless count (e.g., "2")
}

function parseQuantity(rawQty: string): ParsedQuantity | null {
  const cleaned = parseUnicodeFractions(rawQty).replace(/,/g, '').trim();
  if (!cleaned) return null;

  // Match optional mixed fraction ("1 1/2"), simple fraction ("1/2"), or decimal/int ("2.5") + trailing unit
  const match = cleaned.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/
  );
  if (!match) return null;

  const numPart = match[1].trim();
  const restUnit = match[2].trim().toLowerCase();

  let amount = 0;
  if (numPart.includes(' ')) {
    const [whole, frac] = numPart.split(/\s+/);
    const [num, den] = frac.split('/').map(Number);
    if (!den) return null;
    amount = Number(whole) + num / den;
  } else if (numPart.includes('/')) {
    const [num, den] = numPart.split('/').map(Number);
    if (!den) return null;
    amount = num / den;
  } else {
    amount = Number(numPart);
  }

  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Normalize unit
  const normalizedUnitToken = restUnit.replace(/\.$/, '').trim();
  if (!normalizedUnitToken) {
    return { amount, unit: '' };
  }

  const canonicalUnit = UNIT_ALIASES[normalizedUnitToken];
  if (canonicalUnit !== undefined) {
    return { amount, unit: canonicalUnit };
  }

  return { amount, unit: normalizedUnitToken };
}

function formatAmount(num: number): string {
  const rounded = Math.round(num * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  // Show clean common fractions if close
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fractionMap: [number, string][] = [
    [0.25, '1/4'],
    [0.33, '1/3'],
    [0.5, '1/2'],
    [0.67, '2/3'],
    [0.75, '3/4'],
  ];
  for (const [val, label] of fractionMap) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }
  return String(Number(rounded.toFixed(1)));
}

function formatParsedQuantity(amount: number, unit: string): string {
  const amtStr = formatAmount(amount);
  if (!unit) return amtStr;
  // Simple pluralization for readable countable units
  const countable = new Set([
    'clove',
    'can',
    'cup',
    'bunch',
    'pack',
    'piece',
    'slice',
    'stalk',
    'head',
    'bottle',
    'jar',
    'pinch',
    'sprig',
  ]);
  if (amount > 1 && countable.has(unit)) {
    const plural = unit === 'bunch' || unit === 'pinch' ? `${unit}es` : `${unit}s`;
    return `${amtStr} ${plural}`;
  }
  return `${amtStr} ${unit}`;
}

function guessCategoryLocally(name: string): ShoppingCategory | null {
  const lower = name.toLowerCase();

  const produceKeywords = [
    'tomato',
    'onion',
    'garlic',
    'ginger',
    'scallion',
    'green onion',
    'spring onion',
    'shallot',
    'carrot',
    'potato',
    'sweet potato',
    'spinach',
    'kale',
    'lettuce',
    'cabbage',
    'bok choy',
    'broccoli',
    'cauliflower',
    'bell pepper',
    'jalapeno',
    'chili',
    'chilli',
    'cucumber',
    'zucchini',
    'eggplant',
    'mushroom',
    'avocado',
    'lemon',
    'lime',
    'orange',
    'apple',
    'banana',
    'mango',
    'berry',
    'cilantro',
    'parsley',
    'basil',
    'mint',
    'thyme',
    'rosemary',
    'dill',
    'celery',
    'corn',
    'peas',
    'green bean',
    'radish',
    'asparagus',
    'squash',
    'pumpkin',
    'leek',
    'okra',
    'calamansi',
    'lemongrass',
  ];

  const meatKeywords = [
    'chicken',
    'beef',
    'pork',
    'lamb',
    'turkey',
    'duck',
    'bacon',
    'sausage',
    'ham',
    'steak',
    'ground meat',
    'fish',
    'salmon',
    'tuna',
    'cod',
    'tilapia',
    'shrimp',
    'prawn',
    'crab',
    'lobster',
    'mussel',
    'clam',
    'squid',
    'calamari',
    'anchovy',
    'sardine',
    'tofu',
    'tempeh',
  ];

  const dairyKeywords = [
    'milk',
    'egg',
    'butter',
    'cheese',
    'cheddar',
    'mozzarella',
    'parmesan',
    'feta',
    'cream',
    'heavy cream',
    'sour cream',
    'cream cheese',
    'yogurt',
    'greek yogurt',
    'ghee',
    'ricotta',
    'mayo',
    'mayonnaise',
  ];

  const pantryKeywords = [
    'rice',
    'pasta',
    'spaghetti',
    'noodle',
    'ramen',
    'udon',
    'bread',
    'tortilla',
    'flour',
    'oat',
    'quinoa',
    'couscous',
    'soy sauce',
    'fish sauce',
    'oyster sauce',
    'vinegar',
    'olive oil',
    'sesame oil',
    'honey',
    'sugar',
    'brown sugar',
    'maple syrup',
    'broth',
    'stock',
    'coconut milk',
    'tomato paste',
    'tomato sauce',
    'ketchup',
    'mustard',
    'hot sauce',
    'sriracha',
    'gochujang',
    'miso',
    'curry',
    'paprika',
    'cumin',
    'oregano',
    'turmeric',
    'cinnamon',
    'garlic powder',
    'onion powder',
    'chili flakes',
    'cornstarch',
    'baking powder',
    'baking soda',
    'yeast',
    'bean',
    'lentil',
    'chickpea',
    'nut',
    'almond',
    'peanut',
    'sesame seed',
    'bay leaf',
  ];

  if (meatKeywords.some((k) => lower.includes(k))) return 'Meat and Seafood';
  if (dairyKeywords.some((k) => lower.includes(k))) return 'Dairy and Eggs';
  if (produceKeywords.some((k) => lower.includes(k))) return 'Produce';
  if (pantryKeywords.some((k) => lower.includes(k))) return 'Grains and Pantry';
  return null;
}

interface IngredientBucket {
  key: string;
  displayName: string;
  // Map of unit -> summed numeric quantity
  numericUnits: Map<string, number>;
  // Fallback list of unparseable raw quantity strings
  rawStrings: string[];
}

export async function buildShoppingListFromPlan(
  plan: MealPlanWeek,
  existingList: ShoppingListItem[]
): Promise<ShoppingListItem[]> {
  const checkedById = new Map<string, boolean>();
  const checkedByKey = new Map<string, boolean>();

  for (const item of existingList) {
    checkedById.set(item.id, item.checked);
    const { key } = normalizeIngredientKey(item.name);
    if (item.checked) {
      checkedByKey.set(`${key}::${item.quantity.toLowerCase()}`, true);
      checkedByKey.set(key, true);
    }
  }

  const buckets = new Map<string, IngredientBucket>();

  for (const day of DAYS_OF_WEEK) {
    const slots = plan[day];
    for (const slot of MEAL_SLOTS) {
      const meal = slots[slot.key];
      if (!meal) continue;

      const needs = meal.recipe.ingredientsNeed || [];
      for (const ing of needs) {
        if (!ing?.name || isPantryStaple(ing.name)) continue;

        const { key, displayName } = normalizeIngredientKey(ing.name);
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = {
            key,
            displayName,
            numericUnits: new Map(),
            rawStrings: [],
          };
          buckets.set(key, bucket);
        }

        const rawQty = (ing.quantity || '').trim();
        if (!rawQty) {
          bucket.numericUnits.set('', (bucket.numericUnits.get('') || 0) + 1);
          continue;
        }

        const parsed = parseQuantity(rawQty);
        if (parsed) {
          bucket.numericUnits.set(
            parsed.unit,
            (bucket.numericUnits.get(parsed.unit) || 0) + parsed.amount
          );
        } else {
          bucket.rawStrings.push(rawQty);
        }
      }
    }
  }

  if (buckets.size === 0) {
    return [];
  }

  // Categorize locally first, then batch remaining items to Gemini categorization endpoint
  const categoryMap = new Map<string, ShoppingCategory>();
  const uncertainNames: string[] = [];

  for (const bucket of buckets.values()) {
    const guessed = guessCategoryLocally(bucket.displayName);
    if (guessed) {
      categoryMap.set(bucket.key, guessed);
    } else {
      uncertainNames.push(bucket.displayName);
    }
  }

  if (uncertainNames.length > 0) {
    const aiCategories = await categorizeShoppingItemsWithAI(uncertainNames);
    for (const bucket of buckets.values()) {
      if (!categoryMap.has(bucket.key)) {
        const aiCat = aiCategories[bucket.displayName.toLowerCase().trim()];
        if (aiCat && SHOPPING_CATEGORIES.includes(aiCat)) {
          categoryMap.set(bucket.key, aiCat);
        } else {
          categoryMap.set(bucket.key, 'Other');
        }
      }
    }
  }

  const items: ShoppingListItem[] = [];

  for (const bucket of buckets.values()) {
    const category = categoryMap.get(bucket.key) || 'Other';

    // When units match, quantities were already summed into numericUnits.
    // When units differ, emit separate lines per incompatible unit as requested.
    for (const [unit, totalAmount] of bucket.numericUnits.entries()) {
      const quantityText = formatParsedQuantity(totalAmount, unit);
      const id = `shop_${bucket.key}_${unit || 'count'}`.replace(/[^a-z0-9_]+/g, '_');
      const wasChecked =
        checkedById.get(id) ??
        checkedByKey.get(`${bucket.key}::${quantityText.toLowerCase()}`) ??
        (bucket.numericUnits.size === 1 && bucket.rawStrings.length === 0
          ? checkedByKey.get(bucket.key)
          : false) ??
        false;

      items.push({
        id,
        name: bucket.displayName,
        quantity: quantityText,
        category,
        checked: wasChecked,
      });
    }

    if (bucket.rawStrings.length > 0) {
      // Group identical unparseable strings or keep distinct ones separated cleanly
      const rawText = Array.from(new Set(bucket.rawStrings)).join(' + ');
      const id = `shop_${bucket.key}_raw_${rawText}`
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .slice(0, 80);
      const wasChecked =
        checkedById.get(id) ??
        checkedByKey.get(`${bucket.key}::${rawText.toLowerCase()}`) ??
        false;

      items.push({
        id,
        name: bucket.displayName,
        quantity: rawText,
        category,
        checked: wasChecked,
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}
