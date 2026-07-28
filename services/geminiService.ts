import Colors from '../constants/colors';

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
  const carbsPct = 100 - proteinPct - fatPct;

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
 * Calls Gemini AI API to generate a personalized fitness plan based on user profile details.
 */
export async function generateFitnessPlanWithAI(data: UserOnboardingInput): Promise<GeneratedFitnessPlan> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey) {
    console.log('💡 [Gemini API] No EXPO_PUBLIC_GEMINI_API_KEY found in env. Using formula-based plan calculation.');
    return calculateFallbackPlan(data);
  }

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

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[Gemini API] Request failed with status ${response.status}. Falling back to formula plan.`);
      return calculateFallbackPlan(data);
    }

    const resJson = await response.json();
    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return calculateFallbackPlan(data);
    }

    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: GeneratedFitnessPlan = JSON.parse(cleanedText);

    return {
      dailyCalories: parsed.dailyCalories || 2000,
      proteinGrams: parsed.proteinGrams || 150,
      carbsGrams: parsed.carbsGrams || 200,
      fatGrams: parsed.fatGrams || 65,
      waterIntakeLiters: parsed.waterIntakeLiters || 3.0,
      waterIntakeGlasses: parsed.waterIntakeGlasses || 12,
      bmi: parsed.bmi || 23.0,
      bmiCategory: parsed.bmiCategory || 'Normal weight',
      targetWeightPace: parsed.targetWeightPace || 'Balanced maintenance',
      fitnessAdvice: parsed.fitnessAdvice || 'Maintain a balanced diet and stay consistent with your workout routine.',
      macroPercentages: parsed.macroPercentages || { protein: 30, carbs: 45, fat: 25 },
    };
  } catch (err) {
    console.error('❌ [Gemini API] Error generating plan:', err);
    return calculateFallbackPlan(data);
  }
}
