/**
 * FatSecret OAuth 2.0 & Foods API Service
 * Reference Docs:
 * OAuth2: https://platform.fatsecret.com/docs/guides/authentication/oauth2
 * foods.search: https://platform.fatsecret.com/docs/v1/foods.search
 */

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

// Standard pure JS base64 encoder for universal React Native / Web compatibility
function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = str.charCodeAt(i++);
    const chr3 = str.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

/**
 * Retrieves OAuth 2.0 access token from FatSecret.
 * Access token is valid for 24 hours (86400s).
 * Automatically generates a new token before expiration.
 */
export async function getFatSecretAccessToken(): Promise<string | null> {
  const clientId = (process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || '').trim();
  const clientSecret = (process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || '').trim();

  // Check if we have a valid cached token (with a 5-minute safety margin before 24h expiration)
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  // If no credentials supplied or placeholders present
  if (!clientId || !clientSecret || clientId === 'your_fatsecret_client_id_here') {
    console.warn('FatSecret API: EXPO_PUBLIC_FATSECRET_CLIENT_ID/SECRET not configured.');
    return null;
  }

  try {
    const tokenUrl = 'https://oauth.fatsecret.com/connect/token';
    const authHeader = `Basic ${toBase64(`${clientId}:${clientSecret}`)}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FatSecret OAuth Token Error:', response.status, errorText);
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
 * Returns top 5 results.
 */
export async function searchFatSecretFoods(query: string): Promise<FatSecretFoodItem[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) {
    return [];
  }

  const token = await getFatSecretAccessToken();

  if (!token) {
    // Return fallback search results if credentials are missing or token fetch fails
    return getFallbackFoodResults(trimmedQuery);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const searchUrl = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
      trimmedQuery
    )}&format=json&max_results=20`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        tokenCache = null;
      }
      console.warn('FatSecret foods.search HTTP error:', response.status);
      return getFallbackFoodResults(trimmedQuery);
    }

    const data = await response.json();

    // Check if FatSecret API returned an error object (e.g. Code 21: Invalid IP address, Code 5: Invalid key)
    if (data && data.error) {
      console.warn(
        `FatSecret API Error (${data.error.code}): ${data.error.message}`
      );
      return getFallbackFoodResults(trimmedQuery);
    }

    if (!data || !data.foods || !data.foods.food) {
      return getFallbackFoodResults(trimmedQuery);
    }

    const rawFoods = data.foods.food;
    const foodArray = Array.isArray(rawFoods) ? rawFoods : [rawFoods];

    // Get top 20 results & parse
    const parsed = foodArray.slice(0, 20).map(parseFoodDescription);
    return parsed.length > 0 ? parsed : getFallbackFoodResults(trimmedQuery);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching foods from FatSecret API:', error);
    return getFallbackFoodResults(trimmedQuery);
  }
}

/**
 * Robust local search fallback for seamless UI demo & offline support
 */
function getFallbackFoodResults(query: string): FatSecretFoodItem[] {
  const q = query.toLowerCase().trim();
  const mockDatabase: FatSecretFoodItem[] = [
    {
      food_id: 'mock_1',
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
      food_id: 'mock_2',
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
      food_id: 'mock_3',
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
      food_id: 'mock_4',
      food_name: 'Scrambled Eggs (with Milk & Butter)',
      food_description: 'Per 2 large eggs (120g) - Calories: 182kcal | Fat: 13g | Carbs: 1.5g | Protein: 12g',
      serving_size: 'Per 2 large eggs',
      calories: '182 kcal',
      calorie_number: 182,
      protein: 12,
      carbs: 1.5,
      fat: 13,
    },
    {
      food_id: 'mock_5',
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
      food_id: 'mock_6',
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
      food_id: 'mock_7',
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
      food_id: 'mock_8',
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
      food_id: 'mock_9',
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
      food_id: 'mock_10',
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
      food_id: 'mock_11',
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
      food_id: 'mock_12',
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
      food_id: 'mock_13',
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
      food_id: 'mock_14',
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
      food_id: 'mock_15',
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
      food_id: 'mock_16',
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
      food_id: 'mock_17',
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
      food_id: 'mock_18',
      food_name: 'Whey Protein Powder Shake',
      food_description: 'Per 1 scoop (30g) - Calories: 120kcal | Fat: 1.5g | Carbs: 3g | Protein: 24g',
      serving_size: 'Per 1 scoop (30g)',
      calories: '120 kcal',
      calorie_number: 120,
      protein: 24,
      carbs: 3,
      fat: 1.5,
    },
  ];

  const filtered = mockDatabase.filter((item) =>
    item.food_name.toLowerCase().includes(q)
  );

  return filtered.slice(0, 20);
}
