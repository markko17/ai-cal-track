export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      return Response.json({ error: 'Gemini API key not configured on server' }, { status: 500 });
    }

    const prompt = `You are a world-class sports nutritionist and fitness expert.
Analyze the following user profile and return a JSON object containing accurate daily calorie, macronutrient, and hydration targets.

User Profile:
- Gender: ${body.gender}
- Primary Fitness Goal: ${body.goal}
- Weekly Workout Frequency: ${body.workoutDays}
- Birthdate/Age: ${JSON.stringify(body.birthdate)}
- Height: ${body.height}
- Weight: ${body.weight}

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
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
      return Response.json({ error: `Gemini API request failed with status ${response.status}` }, { status: response.status });
    }

    const resJson = await response.json();
    return Response.json(resJson);
  } catch (err: any) {
    return Response.json({ error: err.message || 'Server proxy internal error' }, { status: 500 });
  }
}
