
export interface UserOnboardingInput {
  gender: string;
  goal: string;
  workoutDays: string;
  birthdate?: { day: string; month: string; year: string } | string;
  height: string;
  weight: string;
}

export interface GeneratedFitnessPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterIntakeLiters: number;
  waterIntakeGlasses: number;
  bmi: number;
  bmiCategory: string;
  targetWeightPace: string;
  fitnessAdvice: string;
  macroPercentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

import * as FileSystem from 'expo-file-system';
import Colors from '../constants/colors';

/**
 * Calculates a fallback fitness plan using the Mifflin-St Jeor formula and standard nutrition guidelines.
 */
export function calculateFallbackPlan(data: UserOnboardingInput): GeneratedFitnessPlan {
  // Parse weight in kg
  const weightMatch = data.weight?.match(/(\d+(\.\d+)?)/);
  const weightKg = weightMatch ? parseFloat(weightMatch[1]) : 70;

  // Parse height in feet/inches or cm
  let heightCm = 170;
  if (data.height?.includes("'")) {
    const feetMatch = data.height.match(/(\d+)'(\d+)?/);
    if (feetMatch) {
      const feet = parseFloat(feetMatch[1]);
      const inches = parseFloat(feetMatch[2] || '0');
      heightCm = Math.round((feet * 12 + inches) * 2.54);
    }
  } else {
    const hMatch = data.height?.match(/(\d+(\.\d+)?)/);
    if (hMatch) heightCm = parseFloat(hMatch[1]);
  }

  // Calculate age from birthdate
  let age = 25;
  if (typeof data.birthdate === 'object' && data.birthdate?.year) {
    const birthYear = parseInt(data.birthdate.year, 10);
    if (!isNaN(birthYear) && birthYear > 1920) {
      age = new Date().getFullYear() - birthYear;
    }
  }

  // Calculate BMR (Mifflin-St Jeor)
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (data.gender?.toLowerCase() === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity multiplier
  let activityMultiplier = 1.2;
  const daysStr = data.workoutDays?.toLowerCase() || '';
  if (daysStr.includes('5-7') || daysStr.includes('heavy') || daysStr.includes('daily')) {
    activityMultiplier = 1.55;
  } else if (daysStr.includes('3-4') || daysStr.includes('moderate')) {
    activityMultiplier = 1.375;
  } else if (daysStr.includes('1-2') || daysStr.includes('light')) {
    activityMultiplier = 1.25;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  // Adjust for Goal
  let dailyCalories = tdee;
  let targetPace = 'Maintain current weight';
  const goalStr = data.goal?.toLowerCase() || '';

  if (goalStr.includes('lose') || goalStr.includes('fat')) {
    dailyCalories = Math.round(tdee * 0.82); // 18% deficit
    targetPace = 'Lose ~0.5 kg / week';
  } else if (goalStr.includes('gain') || goalStr.includes('muscle')) {
    dailyCalories = Math.round(tdee * 1.12); // 12% surplus
    targetPace = 'Gain ~0.25 kg / week (lean bulk)';
  }

  // Macro calculation
  const proteinGrams = Math.round(weightKg * 2.0);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = dailyCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);

  const carbCalories = Math.max(dailyCalories - proteinCalories - fatCalories, dailyCalories * 0.3);
  const carbsGrams = Math.round(carbCalories / 4);

  let waterLiters = weightKg * 0.035 + (activityMultiplier > 1.3 ? 0.5 : 0.2);
  waterLiters = Math.round(waterLiters * 10) / 10;
  const waterGlasses = Math.round((waterLiters * 1000) / 250);

  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obese';

  const proteinPct = Math.round((proteinCalories / dailyCalories) * 100);
  const fatPct = Math.round((fatCalories / dailyCalories) * 100);
  const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

  return {
    dailyCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterIntakeLiters: waterLiters,
    waterIntakeGlasses: waterGlasses,
    bmi,
    bmiCategory,
    targetWeightPace: targetPace,
    fitnessAdvice: `Based on your profile (${weightKg}kg, ${heightCm}cm, ${data.workoutDays}), focus on consuming ${proteinGrams}g of protein daily spread over 3-4 meals. Stay consistent with your hydration goal of ${waterLiters}L of water per day!`,
    macroPercentages: {
      protein: proteinPct,
      carbs: carbsPct,
      fat: fatPct,
    },
  };
}

/**
 * Calls Gemini AI API via server proxy (or fallback) to generate a personalized fitness plan.
 */
export async function generateFitnessPlanWithAI(data: UserOnboardingInput): Promise<GeneratedFitnessPlan> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    let resJson: any = null;
    const serverKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    // Attempt to call server-side proxy route first
    try {
      const proxyResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (proxyResponse.ok) {
        resJson = await proxyResponse.json();
      }
    } catch (_proxyErr) {
      // Proxy unavailable; fall back to direct call if serverKey is present
      if (serverKey) {
        const prompt = `You are a world-class sports nutritionist and fitness expert.
Analyze the following user profile and return a JSON object containing accurate daily calorie, macronutrient, and hydration targets.

User Profile:
- Gender: ${data.gender}
- Primary Fitness Goal: ${data.goal}
- Weekly Workout Frequency: ${data.workoutDays}
- Birthdate/Age: ${JSON.stringify(data.birthdate)}
- Height: ${data.height}
- Weight: ${data.weight}

CRITICAL: Return ONLY a valid, raw JSON object with NO markdown codeblocks or extra text.
JSON Structure:
{
  "dailyCalories": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "waterIntakeLiters": number,
  "waterIntakeGlasses": number,
  "bmi": number,
  "bmiCategory": string,
  "targetWeightPace": string,
  "fitnessAdvice": string,
  "macroPercentages": {
    "protein": number,
    "carbs": number,
    "fat": number
  }
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${serverKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          resJson = await response.json();
        }
      }
    }

    clearTimeout(timeoutId);

    if (!resJson) {
      return calculateFallbackPlan(data);
    }

    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return calculateFallbackPlan(data);
    }

    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: Partial<GeneratedFitnessPlan> = JSON.parse(cleanedText);

    const macroObj = (parsed.macroPercentages || {}) as Record<string, any>;
    const proteinPct = typeof macroObj.protein === 'number' && !isNaN(macroObj.protein) ? macroObj.protein : 30;
    const carbsPct = typeof macroObj.carbs === 'number' && !isNaN(macroObj.carbs) ? macroObj.carbs : 45;
    const fatPct = typeof macroObj.fat === 'number' && !isNaN(macroObj.fat) ? macroObj.fat : 25;


    return {
      dailyCalories: typeof parsed.dailyCalories === 'number' ? parsed.dailyCalories : 2000,
      proteinGrams: typeof parsed.proteinGrams === 'number' ? parsed.proteinGrams : 150,
      carbsGrams: typeof parsed.carbsGrams === 'number' ? parsed.carbsGrams : 200,
      fatGrams: typeof parsed.fatGrams === 'number' ? parsed.fatGrams : 65,
      waterIntakeLiters: typeof parsed.waterIntakeLiters === 'number' ? parsed.waterIntakeLiters : 3.0,
      waterIntakeGlasses: typeof parsed.waterIntakeGlasses === 'number' ? parsed.waterIntakeGlasses : 12,
      bmi: typeof parsed.bmi === 'number' ? parsed.bmi : 23.0,
      bmiCategory: parsed.bmiCategory || 'Normal weight',
      targetWeightPace: parsed.targetWeightPace || 'Balanced maintenance',
      fitnessAdvice: parsed.fitnessAdvice || 'Maintain a balanced diet and stay consistent with your workout routine.',
      macroPercentages: {
        protein: proteinPct,
        carbs: carbsPct,
        fat: fatPct,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('❌ [Gemini API] Request failed or timed out:', err);
    return calculateFallbackPlan(data);
  }
}

export interface AIFoodAnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export function getFallbackFoodAnalysis(imageUri?: string): AIFoodAnalysisResult {
  const uriLower = (imageUri || '').toLowerCase();

  if (uriLower.includes('pizza') || uriLower.includes('slice')) {
    return {
      foodName: 'Pepperoni Pizza Slice',
      calories: 520,
      protein: 22,
      carbs: 58,
      fat: 22,
      servingSize: '2 slices (240g)',
    };
  }

  if (uriLower.includes('egg') || uriLower.includes('sunny') || uriLower.includes('fried')) {
    return {
      foodName: 'Sunny Side Up Fried Egg',
      calories: 145,
      protein: 12,
      carbs: 1,
      fat: 10,
      servingSize: '2 eggs',
    };
  }

  if (uriLower.includes('salad') || uriLower.includes('green') || uriLower.includes('veg')) {
    return {
      foodName: 'Chicken Caesar Salad',
      calories: 340,
      protein: 28,
      carbs: 14,
      fat: 18,
      servingSize: '1 bowl (300g)',
    };
  }

  if (uriLower.includes('burger') || uriLower.includes('beef') || uriLower.includes('steak')) {
    return {
      foodName: 'Classic Cheeseburger',
      calories: 580,
      protein: 32,
      carbs: 45,
      fat: 28,
      servingSize: '1 burger (250g)',
    };
  }

  return {
    foodName: 'Scanned Healthy Meal',
    calories: 450,
    protein: 30,
    carbs: 42,
    fat: 14,
    servingSize: '1 serving (350g)',
  };
}

async function convertUriToBase64(uri: string): Promise<string> {
  if (!uri) return '';
  if (uri.startsWith('data:image')) {
    const parts = uri.split(',');
    return parts[1] || '';
  }

  // Strategy 1: FileSystem.readAsStringAsync
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    if (base64 && base64.length > 50) {
      return base64;
    }
  } catch (_fsErr) {
    // Fallback to strategy 2
  }

  // Strategy 2: fetch blob + FileReader
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        if (resultStr && resultStr.includes(',')) {
          resolve(resultStr.split(',')[1] || '');
        } else {
          resolve(resultStr || '');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (_fetchErr) {
    console.warn('⚠️ Base64 conversion failed for URI:', uri);
    return '';
  }
}

export async function analyzeFoodImageWithGemini(
  imageUri?: string,
  providedBase64?: string
): Promise<AIFoodAnalysisResult> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  let base64Data = providedBase64 || '';

  if (!base64Data && imageUri) {
    base64Data = await convertUriToBase64(imageUri);
  }

  if (!apiKey || !base64Data) {
    console.warn('⚠️ Gemini Food Scan: Base64 image data or API key missing.');
    return getFallbackFoodAnalysis(imageUri);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash'];

  const prompt = `You are an expert AI nutritionist and food recognition specialist.
Look closely at the food in this photo.

ACCURACY RULES:
- Identify ONLY the food items that are clearly visible in the image.
- Never guess, infer, or invent a dish that is not actually in the photo.
- If you cannot tell what the food is, name your best guess (e.g. "Unknown baked dish") instead of inventing a specific recipe.
- Estimate calories, protein (g), carbs (g), fat (g), and serving size from the visible portion using standard nutrition data.

CRITICAL: Return ONLY a valid raw JSON object (no markdown, no extra text) matching exactly this structure:
{
  "foodName": "Exact Dish Name",
  "calories": 550,
  "protein": 24,
  "carbs": 62,
  "fat": 22,
  "servingSize": "1 serving (250g)"
}`;

  const uriLower = (imageUri || '').toLowerCase();
  const mimeType = uriLower.includes('.png')
    ? 'image/png'
    : uriLower.includes('.webp')
    ? 'image/webp'
    : uriLower.includes('.heic') || uriLower.includes('.heif')
    ? 'image/heic'
    : 'image/jpeg';

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          clearTimeout(timeoutId);
          const jsonStart = rawText.indexOf('{');
          const jsonEnd = rawText.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonSubstring = rawText.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonSubstring);

            if (parsed && parsed.foodName) {
              return {
                foodName: parsed.foodName,
                calories: typeof parsed.calories === 'number' ? Math.round(parsed.calories) : 450,
                protein: typeof parsed.protein === 'number' ? Math.round(parsed.protein) : 25,
                carbs: typeof parsed.carbs === 'number' ? Math.round(parsed.carbs) : 40,
                fat: typeof parsed.fat === 'number' ? Math.round(parsed.fat) : 15,
                servingSize: parsed.servingSize || '1 serving',
              };
            }
          }
        }
      } else {
        const errBody = await response.text();
        console.warn(`[Gemini AI] Model ${modelName} HTTP ${response.status}:`, errBody);
      }
    } catch (err: any) {
      console.warn(`[Gemini AI] Model ${modelName} fetch error:`, err?.message || err);
    }
  }

  clearTimeout(timeoutId);
  console.warn('⚠️ All Gemini AI model attempts failed. Returning smart fallback estimation.');
  return getFallbackFoodAnalysis(imageUri);
}

