import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? Number(process.env.PORT) || 3000 : 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface IngredientNeed {
  name: string;
  quantity: string;
}

interface RecipeNutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

interface GeneratedRecipe {
  name: string;
  description: string;
  cuisine: string;
  mood: string;
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

interface RecipeGenerationPayload {
  recipes: GeneratedRecipe[];
  noMatchReason?: string;
}

function validateRecipePayload(raw: unknown): RecipeGenerationPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.recipes)) return null;

  if (obj.recipes.length === 0) {
    const reason =
      typeof obj.noMatchReason === 'string' && obj.noMatchReason.trim()
        ? obj.noMatchReason.trim()
        : 'No realistic recipes matched all of your active filters. Try relaxing your cooking time or dietary filter.';
    return { recipes: [], noMatchReason: reason };
  }

  const normalized: GeneratedRecipe[] = [];
  for (const item of obj.recipes.slice(0, 3)) {
    if (!item || typeof item !== 'object') return null;
    const r = item as Record<string, unknown>;
    if (typeof r.name !== 'string' || !r.name.trim()) return null;
    if (typeof r.description !== 'string') return null;

    const totalTime = Number(r.totalTimeMinutes);
    const prepTime = Number(r.prepTimeMinutes);
    const cookTime = Number(r.cookTimeMinutes);
    const servings = Number(r.servings);
    if (!Number.isFinite(totalTime) || !Number.isFinite(servings)) return null;

    const diffRaw = typeof r.difficulty === 'string' ? r.difficulty.trim() : 'Easy';
    const difficulty: 'Easy' | 'Medium' | 'Hard' =
      diffRaw === 'Medium' || diffRaw === 'Hard' ? diffRaw : 'Easy';

    const dietTags = Array.isArray(r.dietTags)
      ? r.dietTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    const ingredientsHave = Array.isArray(r.ingredientsHave)
      ? r.ingredientsHave.filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
      : [];

    const ingredientsNeed = Array.isArray(r.ingredientsNeed)
      ? r.ingredientsNeed
          .filter((i): i is Record<string, unknown> => Boolean(i && typeof i === 'object'))
          .map((i) => ({
            name: typeof i.name === 'string' ? i.name.trim() : '',
            quantity: typeof i.quantity === 'string' ? i.quantity.trim() : 'as needed',
          }))
          .filter((i) => i.name.length > 0)
      : [];

    const steps = Array.isArray(r.steps)
      ? r.steps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];

    if (steps.length === 0) return null;

    const tips = Array.isArray(r.tips)
      ? r.tips.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    const nutObj = (r.nutrition && typeof r.nutrition === 'object' ? r.nutrition : {}) as Record<
      string,
      unknown
    >;

    const cuisine =
      typeof r.cuisine === 'string' && r.cuisine.trim() ? r.cuisine.trim() : 'Global';
    const mood =
      typeof r.mood === 'string' && r.mood.trim() ? r.mood.trim() : 'Everyday';

    const nutrition: RecipeNutrition = {
      calories:
        Number.isFinite(Number(nutObj.calories)) && Number(nutObj.calories) > 0
          ? Math.round(Number(nutObj.calories))
          : 350,
      protein: typeof nutObj.protein === 'string' ? nutObj.protein : `${Math.round(Number(nutObj.protein) || 15)}g`,
      carbs: typeof nutObj.carbs === 'string' ? nutObj.carbs : `${Math.round(Number(nutObj.carbs) || 35)}g`,
      fat: typeof nutObj.fat === 'string' ? nutObj.fat : `${Math.round(Number(nutObj.fat) || 12)}g`,
    };

    normalized.push({
      name: r.name.trim(),
      description: r.description.trim(),
      cuisine,
      mood,
      totalTimeMinutes: Math.max(1, Math.round(totalTime)),
      prepTimeMinutes: Number.isFinite(prepTime) ? Math.max(0, Math.round(prepTime)) : Math.round(totalTime * 0.35),
      cookTimeMinutes: Number.isFinite(cookTime) ? Math.max(0, Math.round(cookTime)) : Math.round(totalTime * 0.65),
      difficulty,
      servings: Math.max(1, Math.min(12, Math.round(servings))),
      dietTags,
      ingredientsHave,
      ingredientsNeed,
      steps,
      tips,
      nutrition,
    });
  }

  if (normalized.length === 0) return null;
  const note =
    typeof obj.noMatchReason === 'string' && obj.noMatchReason.trim()
      ? obj.noMatchReason.trim()
      : undefined;
  return note ? { recipes: normalized, noMatchReason: note } : { recipes: normalized };
}

function safeJsonParse(text: string | undefined): unknown {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Recipe Generation Endpoint
  app.post('/api/recipes/generate', async (req, res) => {
    try {
      const { ingredients, maxTimeMinutes, diet, cuisine, mood, servings } = req.body as {
        ingredients?: string[];
        maxTimeMinutes?: number | null;
        diet?: string;
        cuisine?: string;
        mood?: string;
        servings?: number;
      };

      if (!Array.isArray(ingredients) || ingredients.length < 2) {
        return res.status(400).json({
          error: 'Please provide at least 2 ingredients to generate recipe ideas.',
        });
      }

      const cleanIngredients = ingredients
        .map((i) => String(i).trim())
        .filter((i) => i.length > 0)
        .slice(0, 40);

      if (cleanIngredients.length < 2) {
        return res.status(400).json({
          error: 'Please provide at least 2 valid ingredients.',
        });
      }

      const targetServings = Math.max(1, Math.min(6, Number(servings) || 2));
      const targetDiet = typeof diet === 'string' && diet.trim() ? diet.trim() : 'Any';
      const targetCuisine = typeof cuisine === 'string' && cuisine.trim() ? cuisine.trim() : 'Any';
      const targetMood = typeof mood === 'string' && mood.trim() ? mood.trim() : 'Any';
      const targetMaxTime =
        typeof maxTimeMinutes === 'number' && maxTimeMinutes > 0 ? maxTimeMinutes : null;

      const ai = getGeminiClient();

      const moodGuidance =
        targetMood === 'Quick snack'
          ? 'Keep prep very short with minimal, simple steps suitable for a quick snack.'
          : targetMood === 'Light and healthy'
          ? 'Favor lower-calorie preparations, lighter cooking methods, and plenty of vegetables.'
          : targetMood === 'Impress guests'
          ? 'Elevate presentation, plating, and culinary technique to feel special for guests.'
          : targetMood === 'Comfort food'
          ? 'Make the dishes hearty, warming, and familiar comfort food.'
          : 'Balance everyday practicality with appetizing flavor.';

      const systemInstruction = `You are PantryAI, a practical, beginner-friendly culinary assistant.
Rules you MUST follow strictly:
1. Only suggest realistic, genuinely cookable, tasty recipes using the user's available ingredients.
2. Assume the user already has basic pantry staples (salt, black pepper, cooking oil, water) unless told otherwise, so list those in ingredientsHave when used rather than ingredientsNeed.
3. Minimize the number of extra ingredients needed (ingredientsNeed) — prioritize recipes that rely mostly on what the user already has.
4. STRICTLY respect the selected diet ("${targetDiet}"). Never include any ingredient, condiment, or hidden derivative that violates "${targetDiet}" (for example: no meat/poultry/fish for Vegetarian; no animal products/dairy/eggs/honey for Vegan; no pork/alcohol for Halal; no wheat/barley/rye for Gluten-free; no dairy for Dairy-free; minimal net carbs for Low-carb; no meat/poultry for Pescatarian).
5. ${
        targetMaxTime
          ? `STRICTLY respect the maximum cooking time of ${targetMaxTime} minutes. Every recipe's totalTimeMinutes (prepTimeMinutes + cookTimeMinutes) MUST be <= ${targetMaxTime}.`
          : 'Suggest reasonable everyday cooking times.'
      }
6. Cuisine preference ("${targetCuisine}"): ${
        targetCuisine !== 'Any'
          ? `Match ${targetCuisine} culinary style, flavor profiles, and cooking techniques closely.`
          : 'Choose fitting everyday cuisines and set each recipe "cuisine" field (e.g., Filipino, Japanese, Korean, Italian, Mexican, American, Mediterranean, etc.).'
      }
7. Mood preference ("${targetMood}"): ${moodGuidance} Always populate each recipe "mood" field (e.g., "${
        targetMood !== 'Any' ? targetMood : 'Comfort food'
      }" or another concise mood tag like "Light and healthy", "Quick snack", "Impress guests").
8. If NO realistic recipe can satisfy strict time or diet constraints at all, return an empty "recipes" array [] and explain why in "noMatchReason". However, if the user's ingredients only loosely fit the requested cuisine or mood (for example, ingredients aren't traditional for that cuisine), suggest the 3 closest realistic matches and set "noMatchReason" to a short friendly note explaining that these are the closest matches for those ingredients.
9. Otherwise, return EXACTLY 3 distinct recipes tailored for ${targetServings} serving(s).
10. In "ingredientsHave", include helpful quantities alongside each ingredient the user already has or pantry staple (e.g., "2 large eggs", "1 cup rice", "1 tbsp cooking oil").
11. Write "steps" as clear, friendly, numbered-style instructions suitable for beginners (do not include leading "1." numbers in the string, just clean sentences).
12. Include practical "tips" with clever substitutions (e.g., "No soy sauce? Use salt and a splash of vinegar").
13. Provide realistic estimated nutrition per serving for EVERY recipe: "calories" MUST be a positive integer representing kcal per serving, and protein/carbs/fat as strings like "22g".`;

      const userPrompt = `Available ingredients: ${cleanIngredients.join(', ')}.
Filters:
- Max cooking time: ${targetMaxTime ? `${targetMaxTime} minutes` : 'Any'}
- Diet requirement: ${targetDiet}
- Cuisine style: ${targetCuisine}
- Mood: ${targetMood}
- Servings: ${targetServings}

Generate 3 realistic recipe ideas (or empty recipes with noMatchReason if strict diet/time filters cannot be satisfied realistically).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                cuisine: { type: Type.STRING },
                mood: { type: Type.STRING },
                totalTimeMinutes: { type: Type.INTEGER },
                prepTimeMinutes: { type: Type.INTEGER },
                cookTimeMinutes: { type: Type.INTEGER },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                servings: { type: Type.INTEGER },
                dietTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                ingredientsHave: { type: Type.ARRAY, items: { type: Type.STRING } },
                ingredientsNeed: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      quantity: { type: Type.STRING },
                    },
                    required: ['name', 'quantity'],
                  },
                },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.INTEGER },
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING },
                  },
                  required: ['calories', 'protein', 'carbs', 'fat'],
                },
              },
              required: [
                'name',
                'description',
                'cuisine',
                'mood',
                'totalTimeMinutes',
                'prepTimeMinutes',
                'cookTimeMinutes',
                'difficulty',
                'servings',
                'dietTags',
                'ingredientsHave',
                'ingredientsNeed',
                'steps',
                'tips',
                'nutrition',
              ],
            },
          },
          noMatchReason: { type: Type.STRING },
        },
        required: ['recipes'],
      };

      let parsedPayload: RecipeGenerationPayload | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema,
            },
          });

          const rawJson = safeJsonParse(response.text);
          const validated = validateRecipePayload(rawJson);
          if (validated) {
            if (targetMaxTime && validated.recipes.length > 0) {
              const allWithinTime = validated.recipes.every(
                (r) => r.totalTimeMinutes <= targetMaxTime
              );
              if (!allWithinTime && attempt === 0) {
                continue;
              }
            }
            parsedPayload = validated;
            break;
          }
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('RESOURCE_EXHAUSTED')) {
            break;
          }
        }
      }

      if (!parsedPayload) {
        console.error('Recipe generation failed after retry:', lastError);
        return res.status(502).json({
          error: 'Could not generate valid recipes right now. Please try again in a moment.',
        });
      }

      return res.json(parsedPayload);
    } catch (err) {
      console.error('Error in /api/recipes/generate:', err);
      const message = err instanceof Error ? err.message : 'Unexpected server error.';
      return res.status(500).json({ error: message });
    }
  });

  // Shopping List Ingredient Categorization Endpoint
  app.post('/api/shopping-list/categorize', async (req, res) => {
    try {
      const { items } = req.body as { items?: string[] };
      const cleanItems = Array.isArray(items)
        ? items
            .filter((i): i is string => typeof i === 'string')
            .map((i) => i.trim())
            .filter((i) => i.length > 0)
            .slice(0, 60)
        : [];

      if (cleanItems.length === 0) {
        return res.json({ categories: {} });
      }

      const ai = getGeminiClient();
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          assignments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: ['Produce', 'Meat and Seafood', 'Dairy and Eggs', 'Grains and Pantry', 'Other'],
                },
              },
              required: ['name', 'category'],
            },
          },
        },
        required: ['assignments'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Categorize each grocery ingredient into exactly one category ("Produce", "Meat and Seafood", "Dairy and Eggs", "Grains and Pantry", or "Other"): ${cleanItems.join(', ')}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = safeJsonParse(response.text) as {
        assignments?: { name: string; category: string }[];
      } | null;

      const categories: Record<string, string> = {};
      for (const entry of parsed?.assignments ?? []) {
        if (entry?.name && entry?.category) {
          categories[entry.name.toLowerCase().trim()] = entry.category;
        }
      }

      return res.json({ categories });
    } catch {
      return res.json({ categories: {} });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PantryAI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PantryAI server:', err);
  process.exit(1);
});
