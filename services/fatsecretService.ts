/**
 * FatSecret OAuth 2.0 & Foods API Service
 * Reference Docs:
 * OAuth2: https://platform.fatsecret.com/docs/guides/authentication/oauth2
 * foods.search: https://platform.fatsecret.com/docs/v1/foods.search
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns the base URL for the local API proxy routes.
 * - On web, relative URLs resolve against the dev server origin.
 * - On native (Expo Go / dev builds), the app must call the dev server's
 *   LAN address explicitly (same host it's already connected to via Metro).
 */
function getApiBase(): string {
  if (Platform.OS === 'web') {
    return '';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? `http://${hostUri}` : '';
}

export interface FatSecretFoodItem {
  food_id: string;
  food_name: string;
  food_description: string;
  food_type?: string;
  food_url?: string;
  serving_size: string;
  calories: string;
  calorie_number: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in milliseconds
}

let tokenCache: CachedToken | null = null;

const FATSECRET_CLIENT_ID = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || '';
const FATSECRET_CLIENT_SECRET = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || '';

const isFatSecretConfigured =
  !!FATSECRET_CLIENT_ID &&
  !!FATSECRET_CLIENT_SECRET &&
  FATSECRET_CLIENT_ID !== 'your_fatsecret_client_id_here' &&
  FATSECRET_CLIENT_SECRET !== 'your_fatsecret_client_secret_here';

/**
 * Retrieves OAuth 2.0 access token from FatSecret via the server proxy route.
 * Access token is valid for 24 hours (86400s).
 * Automatically generates a new token before expiration.
 */
export async function getFatSecretAccessToken(): Promise<string | null> {
  const now = Date.now();

  // Skip the token request entirely when credentials are missing/placeholders,
  // so the app can fall back to the local database without surfacing errors.
  if (!isFatSecretConfigured) {
    return null;
  }

  // Check if we have a valid cached token (with a 5-minute safety margin before 24h expiration)
  if (tokenCache && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  try {
    const response = await fetch(`${getApiBase()}/api/fatsecret-token`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FatSecret token proxy error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    if (data && data.access_token) {
      const expiresInSeconds = data.expires_in || 86400; // Default 24 hours
      tokenCache = {
        accessToken: data.access_token,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      };
      return tokenCache.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Failed to generate FatSecret access token:', error);
    return null;
  }
}

/**
 * Parses FatSecret food_description string.
 * Example input format:
 * "Per 100g - Calories: 143kcal | Fat: 9.51g | Carbs: 0.72g | Protein: 12.56g"
 */
export function parseFoodDescription(item: any): FatSecretFoodItem {
  const desc: string = item.food_description || '';
  let serving_size = '1 serving';
  let calories = '0 kcal';
  let calorie_number = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  if (desc) {
    // Split by hyphen to isolate serving size
    const parts = desc.split(' - ');
    if (parts.length > 0 && parts[0].trim()) {
      serving_size = parts[0].trim();
    }

    const metricsPart = parts.length > 1 ? parts[1] : desc;

    // Extract Calories
    const calMatch = metricsPart.match(/Calories:\s*([\d\.]+)/i);
    if (calMatch) {
      calorie_number = Math.round(parseFloat(calMatch[1])) || 0;
      calories = `${calorie_number} kcal`;
    }

    // Extract Fat
    const fatMatch = metricsPart.match(/Fat:\s*([\d\.]+)/i);
    if (fatMatch) {
      fat = parseFloat(fatMatch[1]) || 0;
    }

    // Extract Carbs
    const carbsMatch = metricsPart.match(/Carbs:\s*([\d\.]+)/i);
    if (carbsMatch) {
      carbs = parseFloat(carbsMatch[1]) || 0;
    }

    // Extract Protein
    const proteinMatch = metricsPart.match(/Protein:\s*([\d\.]+)/i);
    if (proteinMatch) {
      protein = parseFloat(proteinMatch[1]) || 0;
    }
  }

  return {
    food_id: String(item.food_id),
    food_name: item.food_name || 'Unknown Food',
    food_description: desc,
    food_type: item.food_type,
    food_url: item.food_url,
    serving_size,
    calories,
    calorie_number,
    protein,
    carbs,
    fat,
  };
}

/**
 * Searches FatSecret Food Database (foods.search)
 * Requests are proxied through the server route so only the server's public
 * IP needs to be whitelisted. Falls back to a local database on any failure.
 */
export async function searchFatSecretFoods(query: string): Promise<FatSecretFoodItem[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) {
    return [];
  }

  // Skip the proxy entirely when credentials are missing/placeholders
  if (!isFatSecretConfigured) {
    return getFallbackFoodResults(trimmedQuery);
  }

  try {
    const response = await fetch(
      `${getApiBase()}/api/fatsecret-search?q=${encodeURIComponent(trimmedQuery)}`
    );

    if (!response.ok) {
      console.warn('FatSecret search proxy HTTP error:', response.status);
      return getFallbackFoodResults(trimmedQuery);
    }

    const data = await response.json();

    if (!data || data.error || !Array.isArray(data.results)) {
      console.warn('FatSecret search proxy error or IP restricted:', data?.error || 'unknown');
      return getFallbackFoodResults(trimmedQuery);
    }

    const parsed = data.results.map(parseFoodDescription);
    return parsed.length > 0 ? parsed : getFallbackFoodResults(trimmedQuery);
  } catch (error) {
    console.error('Error fetching foods from FatSecret API:', error);
    return getFallbackFoodResults(trimmedQuery);
  }
}

/**
 * Helper to normalize search query words (handles plurals like eggs -> egg, apples -> apple)
 */
function normalizeWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length > 3 && w.endsWith('ies')) {
    return w.slice(0, -3) + 'y'; // e.g. berries -> berry
  }
  if (w.length > 3 && w.endsWith('es') && !w.endsWith('ces') && !w.endsWith('ses')) {
    return w.slice(0, -2); // e.g. potatoes -> potato
  }
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    return w.slice(0, -1); // e.g. eggs -> egg, apples -> apple, chickens -> chicken
  }
  return w;
}

/**
 * Robust local search fallback for seamless UI demo & offline support
 */
export function getFallbackFoodResults(query: string): FatSecretFoodItem[] {
  const rawQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeWord(rawQuery);
  const queryTokens = rawQuery.split(/\s+/).map(normalizeWord).filter((t) => t.length >= 2);

  const filtered = ComprehensiveFoodDatabase.filter((item) => {
    const nameLower = item.food_name.toLowerCase();
    const descLower = item.food_description.toLowerCase();

    // 1. Direct substring match
    if (nameLower.includes(rawQuery) || nameLower.includes(normalizedQuery)) {
      return true;
    }

    // 2. Token match (any token matches name or description for broader results)
    if (queryTokens.length > 0) {
      const anyTokenMatch = queryTokens.some(
        (token) => nameLower.includes(token) || descLower.includes(token)
      );
      if (anyTokenMatch) return true;
    }

    return false;
  });

  if (filtered.length > 0) {
    return filtered.slice(0, 50);
  }

  // Fallback: If no direct match in the database, dynamically generate plausible nutritional card
  return generateDynamicFoodResults(query);
}

/**
 * Generates dynamic food items for queries not found in the static database,
 * ensuring users can always find and log their desired meal.
 */
function generateDynamicFoodResults(query: string): FatSecretFoodItem[] {
  const capitalized = query
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const qLower = query.toLowerCase();
  let baseCal = 220;
  let baseProtein = 12;
  let baseCarbs = 24;
  let baseFat = 8;
  let serving = '1 serving (150g)';

  if (qLower.includes('salad') || qLower.includes('veggie')) {
    baseCal = 140;
    baseProtein = 5;
    baseCarbs = 10;
    baseFat = 8;
    serving = '1 bowl (200g)';
  } else if (qLower.includes('burger') || qLower.includes('sandwich')) {
    baseCal = 450;
    baseProtein = 26;
    baseCarbs = 40;
    baseFat = 20;
    serving = '1 sandwich (220g)';
  } else if (qLower.includes('pizza')) {
    baseCal = 285;
    baseProtein = 12;
    baseCarbs = 34;
    baseFat = 11;
    serving = '1 slice (107g)';
  } else if (qLower.includes('shake') || qLower.includes('smoothie') || qLower.includes('drink')) {
    baseCal = 210;
    baseProtein = 20;
    baseCarbs = 22;
    baseFat = 4;
    serving = '1 glass (350ml)';
  } else if (qLower.includes('coffee') || qLower.includes('latte') || qLower.includes('tea')) {
    baseCal = 120;
    baseProtein = 6;
    baseCarbs = 14;
    baseFat = 4;
    serving = '1 cup (350ml)';
  } else if (qLower.includes('steak') || qLower.includes('beef') || qLower.includes('pork')) {
    baseCal = 280;
    baseProtein = 32;
    baseCarbs = 0;
    baseFat = 16;
    serving = '1 portion (180g)';
  } else if (qLower.includes('soup') || qLower.includes('stew')) {
    baseCal = 180;
    baseProtein = 10;
    baseCarbs = 18;
    baseFat = 7;
    serving = '1 cup (240ml)';
  }

  const primaryItem: FatSecretFoodItem = {
    food_id: `dynamic_${query.replace(/\s+/g, '_')}_1`,
    food_name: `${capitalized} (Estimated)`,
    food_description: `Per ${serving} - Calories: ${baseCal}kcal | Fat: ${baseFat}g | Carbs: ${baseCarbs}g | Protein: ${baseProtein}g`,
    serving_size: serving,
    calories: `${baseCal} kcal`,
    calorie_number: baseCal,
    protein: baseProtein,
    carbs: baseCarbs,
    fat: baseFat,
  };

  const secondaryItem: FatSecretFoodItem = {
    food_id: `dynamic_${query.replace(/\s+/g, '_')}_2`,
    food_name: `Homemade ${capitalized}`,
    food_description: `Per 1 plate (200g) - Calories: ${Math.round(baseCal * 1.2)}kcal | Fat: ${Math.round(baseFat * 1.1)}g | Carbs: ${Math.round(baseCarbs * 1.1)}g | Protein: ${Math.round(baseProtein * 1.1)}g`,
    serving_size: 'Per 1 plate (200g)',
    calories: `${Math.round(baseCal * 1.2)} kcal`,
    calorie_number: Math.round(baseCal * 1.2),
    protein: Math.round(baseProtein * 1.1),
    carbs: Math.round(baseCarbs * 1.1),
    fat: Math.round(baseFat * 1.1),
  };

  return [primaryItem, secondaryItem];
}

/**
 * Extensive offline database with verified foods
 */
const ComprehensiveFoodDatabase: FatSecretFoodItem[] = [
  // EGGS & BREAKFAST
  {
    food_id: 'fs_1',
    food_name: 'Large Whole Egg',
    food_description: 'Per 1 large (50g) - Calories: 72kcal | Fat: 4.8g | Carbs: 0.4g | Protein: 6.3g',
    serving_size: 'Per 1 large (50g)',
    calories: '72 kcal',
    calorie_number: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
  },
  {
    food_id: 'fs_2',
    food_name: 'Egg Whites (Liquid or Fresh)',
    food_description: 'Per 100g - Calories: 52kcal | Fat: 0.2g | Carbs: 0.7g | Protein: 11g',
    serving_size: 'Per 100g',
    calories: '52 kcal',
    calorie_number: 52,
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
  },
  {
    food_id: 'fs_3',
    food_name: 'Hard Boiled Egg',
    food_description: 'Per 1 medium (44g) - Calories: 68kcal | Fat: 4.7g | Carbs: 0.5g | Protein: 5.5g',
    serving_size: 'Per 1 medium (44g)',
    calories: '68 kcal',
    calorie_number: 68,
    protein: 5.5,
    carbs: 0.5,
    fat: 4.7,
  },
  {
    food_id: 'fs_4',
    food_name: 'Scrambled Eggs (with Butter)',
    food_description: 'Per 2 large eggs (120g) - Calories: 182kcal | Fat: 13g | Carbs: 1.5g | Protein: 12g',
    serving_size: 'Per 2 large eggs',
    calories: '182 kcal',
    calorie_number: 182,
    protein: 12,
    carbs: 1.5,
    fat: 13,
  },
  {
    food_id: 'fs_5',
    food_name: 'Egg Omelette (Plain)',
    food_description: 'Per 1 omelette (100g) - Calories: 154kcal | Fat: 11g | Carbs: 0.6g | Protein: 11g',
    serving_size: 'Per 100g',
    calories: '154 kcal',
    calorie_number: 154,
    protein: 11,
    carbs: 0.6,
    fat: 11,
  },
  {
    food_id: 'fs_6',
    food_name: 'Poached Egg',
    food_description: 'Per 1 large (50g) - Calories: 72kcal | Fat: 4.7g | Carbs: 0.4g | Protein: 6.3g',
    serving_size: 'Per 1 large (50g)',
    calories: '72 kcal',
    calorie_number: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.7,
  },
  {
    food_id: 'fs_7',
    food_name: 'Fried Egg',
    food_description: 'Per 1 large (46g) - Calories: 90kcal | Fat: 6.8g | Carbs: 0.4g | Protein: 6.3g',
    serving_size: 'Per 1 large (46g)',
    calories: '90 kcal',
    calorie_number: 90,
    protein: 6.3,
    carbs: 0.4,
    fat: 6.8,
  },

  // CHICKEN & POULTRY
  {
    food_id: 'fs_8',
    food_name: 'Chicken Breast (Grilled)',
    food_description: 'Per 100g - Calories: 165kcal | Fat: 3.6g | Carbs: 0g | Protein: 31g',
    serving_size: 'Per 100g',
    calories: '165 kcal',
    calorie_number: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    food_id: 'fs_9',
    food_name: 'Chicken Thigh (Skinless, Cooked)',
    food_description: 'Per 100g - Calories: 209kcal | Fat: 10.9g | Carbs: 0g | Protein: 26g',
    serving_size: 'Per 100g',
    calories: '209 kcal',
    calorie_number: 209,
    protein: 26,
    carbs: 0,
    fat: 10.9,
  },
  {
    food_id: 'fs_10',
    food_name: 'Chicken Wings (Baked)',
    food_description: 'Per 100g - Calories: 203kcal | Fat: 12.8g | Carbs: 0g | Protein: 20.2g',
    serving_size: 'Per 100g',
    calories: '203 kcal',
    calorie_number: 203,
    protein: 20.2,
    carbs: 0,
    fat: 12.8,
  },
  {
    food_id: 'fs_11',
    food_name: 'Roast Chicken (Meat with Skin)',
    food_description: 'Per 100g - Calories: 239kcal | Fat: 13.6g | Carbs: 0g | Protein: 27.3g',
    serving_size: 'Per 100g',
    calories: '239 kcal',
    calorie_number: 239,
    protein: 27.3,
    carbs: 0,
    fat: 13.6,
  },
  {
    food_id: 'fs_12',
    food_name: 'Chicken Tenders (Breaded)',
    food_description: 'Per 100g - Calories: 260kcal | Fat: 13g | Carbs: 16g | Protein: 19g',
    serving_size: 'Per 100g',
    calories: '260 kcal',
    calorie_number: 260,
    protein: 19,
    carbs: 16,
    fat: 13,
  },
  {
    food_id: 'fs_13',
    food_name: 'Chicken Nuggets',
    food_description: 'Per 6 pieces (100g) - Calories: 296kcal | Fat: 19g | Carbs: 16g | Protein: 15g',
    serving_size: 'Per 6 pieces (100g)',
    calories: '296 kcal',
    calorie_number: 296,
    protein: 15,
    carbs: 16,
    fat: 19,
  },
  {
    food_id: 'fs_14',
    food_name: 'Ground Turkey (93/7)',
    food_description: 'Per 100g - Calories: 172kcal | Fat: 9g | Carbs: 0g | Protein: 22g',
    serving_size: 'Per 100g',
    calories: '172 kcal',
    calorie_number: 172,
    protein: 22,
    carbs: 0,
    fat: 9,
  },

  // BEEF & PORK
  {
    food_id: 'fs_15',
    food_name: 'Lean Ground Beef (90/10)',
    food_description: 'Per 100g - Calories: 176kcal | Fat: 10g | Carbs: 0g | Protein: 20g',
    serving_size: 'Per 100g',
    calories: '176 kcal',
    calorie_number: 176,
    protein: 20,
    carbs: 0,
    fat: 10,
  },
  {
    food_id: 'fs_16',
    food_name: 'Sirloin Steak (Grilled)',
    food_description: 'Per 100g - Calories: 206kcal | Fat: 9.5g | Carbs: 0g | Protein: 28g',
    serving_size: 'Per 100g',
    calories: '206 kcal',
    calorie_number: 206,
    protein: 28,
    carbs: 0,
    fat: 9.5,
  },
  {
    food_id: 'fs_17',
    food_name: 'Ribeye Steak (Grilled)',
    food_description: 'Per 100g - Calories: 291kcal | Fat: 22g | Carbs: 0g | Protein: 24g',
    serving_size: 'Per 100g',
    calories: '291 kcal',
    calorie_number: 291,
    protein: 24,
    carbs: 0,
    fat: 22,
  },
  {
    food_id: 'fs_18',
    food_name: 'Pork Chop (Grilled)',
    food_description: 'Per 100g - Calories: 231kcal | Fat: 14g | Carbs: 0g | Protein: 24g',
    serving_size: 'Per 100g',
    calories: '231 kcal',
    calorie_number: 231,
    protein: 24,
    carbs: 0,
    fat: 14,
  },
  {
    food_id: 'fs_19',
    food_name: 'Crispy Bacon',
    food_description: 'Per 3 slices (34g) - Calories: 161kcal | Fat: 12g | Carbs: 0.6g | Protein: 12g',
    serving_size: 'Per 3 slices (34g)',
    calories: '161 kcal',
    calorie_number: 161,
    protein: 12,
    carbs: 0.6,
    fat: 12,
  },
  {
    food_id: 'fs_20',
    food_name: 'Pork Sausage Link',
    food_description: 'Per 2 links (68g) - Calories: 220kcal | Fat: 19g | Carbs: 1g | Protein: 10g',
    serving_size: 'Per 2 links (68g)',
    calories: '220 kcal',
    calorie_number: 220,
    protein: 10,
    carbs: 1,
    fat: 19,
  },

  // FISH & SEAFOOD
  {
    food_id: 'fs_21',
    food_name: 'Salmon (Baked or Grilled)',
    food_description: 'Per 100g - Calories: 206kcal | Fat: 12g | Carbs: 0g | Protein: 22g',
    serving_size: 'Per 100g',
    calories: '206 kcal',
    calorie_number: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
  },
  {
    food_id: 'fs_22',
    food_name: 'Canned Tuna (in Water, Drained)',
    food_description: 'Per 1 can (165g) - Calories: 191kcal | Fat: 1.4g | Carbs: 0g | Protein: 42g',
    serving_size: 'Per 1 can (165g)',
    calories: '191 kcal',
    calorie_number: 191,
    protein: 42,
    carbs: 0,
    fat: 1.4,
  },
  {
    food_id: 'fs_23',
    food_name: 'Tilapia Fillet (Baked)',
    food_description: 'Per 100g - Calories: 128kcal | Fat: 2.7g | Carbs: 0g | Protein: 26g',
    serving_size: 'Per 100g',
    calories: '128 kcal',
    calorie_number: 128,
    protein: 26,
    carbs: 0,
    fat: 2.7,
  },
  {
    food_id: 'fs_24',
    food_name: 'Shrimp (Steamed or Grilled)',
    food_description: 'Per 100g - Calories: 99kcal | Fat: 0.3g | Carbs: 0.2g | Protein: 24g',
    serving_size: 'Per 100g',
    calories: '99 kcal',
    calorie_number: 99,
    protein: 24,
    carbs: 0.2,
    fat: 0.3,
  },

  // RICE, GRAINS & PASTA
  {
    food_id: 'fs_25',
    food_name: 'White Rice (Cooked)',
    food_description: 'Per 1 cup (158g) - Calories: 205kcal | Fat: 0.4g | Carbs: 45g | Protein: 4.3g',
    serving_size: 'Per 1 cup (158g)',
    calories: '205 kcal',
    calorie_number: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
  },
  {
    food_id: 'fs_26',
    food_name: 'Brown Rice (Cooked)',
    food_description: 'Per 1 cup (195g) - Calories: 218kcal | Fat: 1.6g | Carbs: 46g | Protein: 4.5g',
    serving_size: 'Per 1 cup (195g)',
    calories: '218 kcal',
    calorie_number: 218,
    protein: 4.5,
    carbs: 46,
    fat: 1.6,
  },
  {
    food_id: 'fs_27',
    food_name: 'Jasmine Rice (Cooked)',
    food_description: 'Per 1 cup (150g) - Calories: 205kcal | Fat: 0.4g | Carbs: 45g | Protein: 4.2g',
    serving_size: 'Per 1 cup (150g)',
    calories: '205 kcal',
    calorie_number: 205,
    protein: 4.2,
    carbs: 45,
    fat: 0.4,
  },
  {
    food_id: 'fs_28',
    food_name: 'Fried Rice (Egg & Veggies)',
    food_description: 'Per 1 cup (166g) - Calories: 238kcal | Fat: 7.2g | Carbs: 37g | Protein: 5.5g',
    serving_size: 'Per 1 cup (166g)',
    calories: '238 kcal',
    calorie_number: 238,
    protein: 5.5,
    carbs: 37,
    fat: 7.2,
  },
  {
    food_id: 'fs_29',
    food_name: 'Quinoa (Cooked)',
    food_description: 'Per 1 cup (185g) - Calories: 222kcal | Fat: 3.6g | Carbs: 39g | Protein: 8.1g',
    serving_size: 'Per 1 cup (185g)',
    calories: '222 kcal',
    calorie_number: 222,
    protein: 8.1,
    carbs: 39,
    fat: 3.6,
  },
  {
    food_id: 'fs_30',
    food_name: 'Oatmeal (Cooked in Water)',
    food_description: 'Per 1 cup (234g) - Calories: 166kcal | Fat: 3.6g | Carbs: 28g | Protein: 5.9g',
    serving_size: 'Per 1 cup (234g)',
    calories: '166 kcal',
    calorie_number: 166,
    protein: 5.9,
    carbs: 28,
    fat: 3.6,
  },
  {
    food_id: 'fs_31',
    food_name: 'Spaghetti Pasta (Cooked)',
    food_description: 'Per 1 cup (140g) - Calories: 220kcal | Fat: 1.3g | Carbs: 43g | Protein: 8.1g',
    serving_size: 'Per 1 cup (140g)',
    calories: '220 kcal',
    calorie_number: 220,
    protein: 8.1,
    carbs: 43,
    fat: 1.3,
  },
  {
    food_id: 'fs_32',
    food_name: 'Macaroni & Cheese',
    food_description: 'Per 1 cup (200g) - Calories: 310kcal | Fat: 13g | Carbs: 35g | Protein: 12g',
    serving_size: 'Per 1 cup (200g)',
    calories: '310 kcal',
    calorie_number: 310,
    protein: 12,
    carbs: 35,
    fat: 13,
  },

  // DAIRY & CHEESE
  {
    food_id: 'fs_33',
    food_name: 'Greek Yogurt (Plain Low Fat)',
    food_description: 'Per 170g - Calories: 120kcal | Fat: 2g | Carbs: 7g | Protein: 18g',
    serving_size: 'Per 170g',
    calories: '120 kcal',
    calorie_number: 120,
    protein: 18,
    carbs: 7,
    fat: 2,
  },
  {
    food_id: 'fs_34',
    food_name: 'Whole Milk (3.25%)',
    food_description: 'Per 1 cup (244ml) - Calories: 149kcal | Fat: 8g | Carbs: 12g | Protein: 8g',
    serving_size: 'Per 1 cup (244ml)',
    calories: '149 kcal',
    calorie_number: 149,
    protein: 8,
    carbs: 12,
    fat: 8,
  },
  {
    food_id: 'fs_35',
    food_name: 'Almond Milk (Unsweetened)',
    food_description: 'Per 1 cup (240ml) - Calories: 30kcal | Fat: 2.5g | Carbs: 1g | Protein: 1g',
    serving_size: 'Per 1 cup (240ml)',
    calories: '30 kcal',
    calorie_number: 30,
    protein: 1,
    carbs: 1,
    fat: 2.5,
  },
  {
    food_id: 'fs_36',
    food_name: 'Cheddar Cheese (Shredded)',
    food_description: 'Per 1/4 cup (28g) - Calories: 115kcal | Fat: 9.4g | Carbs: 0.4g | Protein: 7g',
    serving_size: 'Per 1/4 cup (28g)',
    calories: '115 kcal',
    calorie_number: 115,
    protein: 7,
    carbs: 0.4,
    fat: 9.4,
  },
  {
    food_id: 'fs_37',
    food_name: 'Cottage Cheese (2% Low Fat)',
    food_description: 'Per 1/2 cup (113g) - Calories: 92kcal | Fat: 2.6g | Carbs: 5g | Protein: 12g',
    serving_size: 'Per 1/2 cup (113g)',
    calories: '92 kcal',
    calorie_number: 92,
    protein: 12,
    carbs: 5,
    fat: 2.6,
  },

  // BREADS & BAKERY
  {
    food_id: 'fs_38',
    food_name: 'Whole Wheat Bread',
    food_description: 'Per 1 slice (36g) - Calories: 92kcal | Fat: 1.1g | Carbs: 17g | Protein: 3.6g',
    serving_size: 'Per 1 slice (36g)',
    calories: '92 kcal',
    calorie_number: 92,
    protein: 3.6,
    carbs: 17,
    fat: 1.1,
  },
  {
    food_id: 'fs_39',
    food_name: 'White Bread',
    food_description: 'Per 1 slice (25g) - Calories: 67kcal | Fat: 0.9g | Carbs: 13g | Protein: 2g',
    serving_size: 'Per 1 slice (25g)',
    calories: '67 kcal',
    calorie_number: 67,
    protein: 2,
    carbs: 13,
    fat: 0.9,
  },
  {
    food_id: 'fs_40',
    food_name: 'Plain Bagel',
    food_description: 'Per 1 medium (105g) - Calories: 289kcal | Fat: 1.7g | Carbs: 56g | Protein: 11g',
    serving_size: 'Per 1 medium (105g)',
    calories: '289 kcal',
    calorie_number: 289,
    protein: 11,
    carbs: 56,
    fat: 1.7,
  },
  {
    food_id: 'fs_41',
    food_name: 'Butter Croissant',
    food_description: 'Per 1 medium (57g) - Calories: 231kcal | Fat: 12g | Carbs: 26g | Protein: 4.7g',
    serving_size: 'Per 1 medium (57g)',
    calories: '231 kcal',
    calorie_number: 231,
    protein: 4.7,
    carbs: 26,
    fat: 12,
  },
  {
    food_id: 'fs_42',
    food_name: 'Pancakes (Maple Syrup)',
    food_description: 'Per 2 medium (140g) - Calories: 310kcal | Fat: 7g | Carbs: 56g | Protein: 6g',
    serving_size: 'Per 2 medium (140g)',
    calories: '310 kcal',
    calorie_number: 310,
    protein: 6,
    carbs: 56,
    fat: 7,
  },

  // FRUITS & VEGETABLES
  {
    food_id: 'fs_43',
    food_name: 'Banana (Raw)',
    food_description: 'Per 1 medium (118g) - Calories: 105kcal | Fat: 0.3g | Carbs: 27g | Protein: 1.3g',
    serving_size: 'Per 1 medium (118g)',
    calories: '105 kcal',
    calorie_number: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
  },
  {
    food_id: 'fs_44',
    food_name: 'Apple (Fresh Medium)',
    food_description: 'Per 1 medium (182g) - Calories: 95kcal | Fat: 0.3g | Carbs: 25g | Protein: 0.5g',
    serving_size: 'Per 1 medium (182g)',
    calories: '95 kcal',
    calorie_number: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
  },
  {
    food_id: 'fs_45',
    food_name: 'Avocado (Fresh)',
    food_description: 'Per 1 medium (150g) - Calories: 240kcal | Fat: 22g | Carbs: 12g | Protein: 3g',
    serving_size: 'Per 1 medium (150g)',
    calories: '240 kcal',
    calorie_number: 240,
    protein: 3,
    carbs: 12,
    fat: 22,
  },
  {
    food_id: 'fs_46',
    food_name: 'Strawberries (Fresh)',
    food_description: 'Per 1 cup (152g) - Calories: 49kcal | Fat: 0.5g | Carbs: 11.7g | Protein: 1g',
    serving_size: 'Per 1 cup (152g)',
    calories: '49 kcal',
    calorie_number: 49,
    protein: 1,
    carbs: 11.7,
    fat: 0.5,
  },
  {
    food_id: 'fs_47',
    food_name: 'Sweet Mango (Fresh)',
    food_description: 'Per 1 cup (165g) - Calories: 99kcal | Fat: 0.6g | Carbs: 24.7g | Protein: 1.4g',
    serving_size: 'Per 1 cup (165g)',
    calories: '99 kcal',
    calorie_number: 99,
    protein: 1.4,
    carbs: 24.7,
    fat: 0.6,
  },
  {
    food_id: 'fs_48',
    food_name: 'Broccoli (Steamed)',
    food_description: 'Per 1 cup (156g) - Calories: 55kcal | Fat: 0.6g | Carbs: 11g | Protein: 3.7g',
    serving_size: 'Per 1 cup (156g)',
    calories: '55 kcal',
    calorie_number: 55,
    protein: 3.7,
    carbs: 11,
    fat: 0.6,
  },
  {
    food_id: 'fs_49',
    food_name: 'Sweet Potato (Baked)',
    food_description: 'Per 1 medium (114g) - Calories: 103kcal | Fat: 0.2g | Carbs: 24g | Protein: 2.3g',
    serving_size: 'Per 1 medium (114g)',
    calories: '103 kcal',
    calorie_number: 103,
    protein: 2.3,
    carbs: 24,
    fat: 0.2,
  },
  {
    food_id: 'fs_50',
    food_name: 'French Fries (Fast Food)',
    food_description: 'Per medium order (117g) - Calories: 365kcal | Fat: 17g | Carbs: 48g | Protein: 4g',
    serving_size: 'Per medium order (117g)',
    calories: '365 kcal',
    calorie_number: 365,
    protein: 4,
    carbs: 48,
    fat: 17,
  },
  {
    food_id: 'fs_51',
    food_name: 'Garden Green Salad (No Dressing)',
    food_description: 'Per 1 bowl (100g) - Calories: 20kcal | Fat: 0.2g | Carbs: 4g | Protein: 1.5g',
    serving_size: 'Per 1 bowl (100g)',
    calories: '20 kcal',
    calorie_number: 20,
    protein: 1.5,
    carbs: 4,
    fat: 0.2,
  },
  {
    food_id: 'fs_52',
    food_name: 'Caesar Salad with Chicken',
    food_description: 'Per 1 bowl (300g) - Calories: 390kcal | Fat: 22g | Carbs: 14g | Protein: 32g',
    serving_size: 'Per 1 bowl (300g)',
    calories: '390 kcal',
    calorie_number: 390,
    protein: 32,
    carbs: 14,
    fat: 22,
  },

  // FAST FOOD, INTERNATIONAL & MEALS
  {
    food_id: 'fs_53',
    food_name: 'Cheeseburger (Single Patty)',
    food_description: 'Per 1 burger (150g) - Calories: 380kcal | Fat: 18g | Carbs: 38g | Protein: 20g',
    serving_size: 'Per 1 burger (150g)',
    calories: '380 kcal',
    calorie_number: 380,
    protein: 20,
    carbs: 38,
    fat: 18,
  },
  {
    food_id: 'fs_54',
    food_name: 'Pepperoni Pizza',
    food_description: 'Per 1 slice (107g) - Calories: 298kcal | Fat: 12g | Carbs: 32g | Protein: 12g',
    serving_size: 'Per 1 slice (107g)',
    calories: '298 kcal',
    calorie_number: 298,
    protein: 12,
    carbs: 32,
    fat: 12,
  },
  {
    food_id: 'fs_55',
    food_name: 'Beef Taco (Hard Shell)',
    food_description: 'Per 1 taco (78g) - Calories: 170kcal | Fat: 10g | Carbs: 13g | Protein: 8g',
    serving_size: 'Per 1 taco (78g)',
    calories: '170 kcal',
    calorie_number: 170,
    protein: 8,
    carbs: 13,
    fat: 10,
  },
  {
    food_id: 'fs_56',
    food_name: 'Chicken Burrito Bowl',
    food_description: 'Per 1 bowl (400g) - Calories: 540kcal | Fat: 16g | Carbs: 62g | Protein: 38g',
    serving_size: 'Per 1 bowl (400g)',
    calories: '540 kcal',
    calorie_number: 540,
    protein: 38,
    carbs: 62,
    fat: 16,
  },
  {
    food_id: 'fs_57',
    food_name: 'Chicken Adobo (Filipino Style)',
    food_description: 'Per 1 cup (200g) - Calories: 320kcal | Fat: 18g | Carbs: 5g | Protein: 34g',
    serving_size: 'Per 1 cup (200g)',
    calories: '320 kcal',
    calorie_number: 320,
    protein: 34,
    carbs: 5,
    fat: 18,
  },
  {
    food_id: 'fs_58',
    food_name: 'Pork Sinigang (Filipino Sour Soup)',
    food_description: 'Per 1 bowl (350ml) - Calories: 240kcal | Fat: 12g | Carbs: 8g | Protein: 24g',
    serving_size: 'Per 1 bowl (350ml)',
    calories: '240 kcal',
    calorie_number: 240,
    protein: 24,
    carbs: 8,
    fat: 12,
  },
  {
    food_id: 'fs_59',
    food_name: 'Pork Lumpia (Filipino Spring Rolls)',
    food_description: 'Per 3 pieces (90g) - Calories: 210kcal | Fat: 11g | Carbs: 18g | Protein: 9g',
    serving_size: 'Per 3 pieces (90g)',
    calories: '210 kcal',
    calorie_number: 210,
    protein: 9,
    carbs: 18,
    fat: 11,
  },
  {
    food_id: 'fs_60',
    food_name: 'Tonkotsu Ramen Noodles',
    food_description: 'Per 1 bowl (450g) - Calories: 510kcal | Fat: 22g | Carbs: 58g | Protein: 21g',
    serving_size: 'Per 1 bowl (450g)',
    calories: '510 kcal',
    calorie_number: 510,
    protein: 21,
    carbs: 58,
    fat: 22,
  },

  // SNACKS, PROTEIN & BEVERAGES
  {
    food_id: 'fs_61',
    food_name: 'Whey Protein Powder Shake',
    food_description: 'Per 1 scoop (30g) - Calories: 120kcal | Fat: 1.5g | Carbs: 3g | Protein: 24g',
    serving_size: 'Per 1 scoop (30g)',
    calories: '120 kcal',
    calorie_number: 120,
    protein: 24,
    carbs: 3,
    fat: 1.5,
  },
  {
    food_id: 'fs_62',
    food_name: 'Peanut Butter (Smooth)',
    food_description: 'Per 2 tbsp (32g) - Calories: 188kcal | Fat: 16g | Carbs: 7g | Protein: 8g',
    serving_size: 'Per 2 tbsp (32g)',
    calories: '188 kcal',
    calorie_number: 188,
    protein: 8,
    carbs: 7,
    fat: 16,
  },
  {
    food_id: 'fs_63',
    food_name: 'Whole Almonds (Raw)',
    food_description: 'Per 1 oz (28g / ~23 nuts) - Calories: 164kcal | Fat: 14g | Carbs: 6g | Protein: 6g',
    serving_size: 'Per 1 oz (28g)',
    calories: '164 kcal',
    calorie_number: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
  },
  {
    food_id: 'fs_64',
    food_name: 'Black Coffee (No Sugar)',
    food_description: 'Per 1 cup (240ml) - Calories: 2kcal | Fat: 0g | Carbs: 0g | Protein: 0.3g',
    serving_size: 'Per 1 cup (240ml)',
    calories: '2 kcal',
    calorie_number: 2,
    protein: 0.3,
    carbs: 0,
    fat: 0,
  },
  {
    food_id: 'fs_65',
    food_name: 'Caffe Latte (Whole Milk)',
    food_description: 'Per 1 medium (350ml) - Calories: 190kcal | Fat: 9g | Carbs: 15g | Protein: 10g',
    serving_size: 'Per 1 medium (350ml)',
    calories: '190 kcal',
    calorie_number: 190,
    protein: 10,
    carbs: 15,
    fat: 9,
  },
];
