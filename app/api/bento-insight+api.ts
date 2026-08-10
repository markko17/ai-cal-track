export async function POST(request: Request) {
  try {
    const data = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return Response.json(
        { error: 'GEMINI_API_KEY is not configured on server' },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const prompt = `You are a high-performance AI fitness coach analyzing live user health telemetry.
Analyze the following live database records and return a personalized JSON assessment:

Live Database Data:
- Consumed Calories: ${data.consumedCalories || 0} kcal (Goal: ${data.dailyCalorieGoal || 2000} kcal)
- Burned Calories: ${data.burnedCalories || 0} kcal
- Water Consumed: ${data.consumedWaterLiters || 0} Liters (Goal: ${data.waterGoalLiters || 2.5} L)
- Protein Consumed: ${data.consumedProtein || 0}g (Goal: ${data.proteinGoal || 150}g)
- Carbs Consumed: ${data.consumedCarbs || 0}g (Goal: ${data.carbsGoal || 200}g)
- Fat Consumed: ${data.consumedFat || 0}g (Goal: ${data.fatGoal || 65}g)
- User Primary Goal: ${data.userGoal || 'Fitness'}
- Current Weight: ${data.userWeight || '75 kg'}
- Logged Entries Today: ${data.entriesCount || 0}

CRITICAL: Return ONLY a valid raw JSON object matching this structure:
{
  "aiAssessment": "Short 2-sentence encouraging assessment of their daily progress and energy status.",
  "recoveryScore": number (0-100 score based on calorie, hydration & macro balance),
  "actionableTip": "One specific, actionable tip for the rest of the day.",
  "statusLabel": "Status (e.g. Optimal Deficit, Hydration On Track, Surplus, Recovery Mode)"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return Response.json(
        { error: `Gemini API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const resJson = await response.json();
    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return Response.json(parsed);
    }

    return Response.json({ error: 'Empty response from AI model' }, { status: 500 });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Bento AI proxy error' },
      { status: 500 }
    );
  }
}
