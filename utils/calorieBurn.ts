export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface WorkoutCalorieInput {
  workoutId: string;
  intensity: WorkoutIntensity;
  durationMinutes: number;
  weight?: string;
  height?: string;
  gender?: string;
  birthdate?: { day?: string; month?: string; year?: string } | string;
}

export interface WorkoutCalorieEstimate {
  activeCalories: number;
  met: number;
  bmr: number;
}

const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_AGE = 25;

const parseNumber = (value?: string) => {
  const match = value?.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

const getWeightKg = (weight?: string) => {
  const value = parseNumber(weight);
  if (!value) return DEFAULT_WEIGHT_KG;
  return /lb|lbs|pounds?/i.test(weight || '') ? value * 0.453592 : value;
};

const getHeightCm = (height?: string) => {
  if (!height) return DEFAULT_HEIGHT_CM;
  const imperial = height.match(/(\d+)\s*'\s*(\d+)?/);
  if (imperial) return (Number(imperial[1]) * 12 + Number(imperial[2] || 0)) * 2.54;
  const value = parseNumber(height);
  if (!value) return DEFAULT_HEIGHT_CM;
  return /ft|feet|inches|inch/i.test(height) ? value * 30.48 : value;
};

const getAge = (birthdate?: WorkoutCalorieInput['birthdate']) => {
  let birthYear: number | undefined;
  if (typeof birthdate === 'object') birthYear = Number(birthdate?.year);
  else if (birthdate) {
    const date = new Date(birthdate);
    if (!Number.isNaN(date.getTime())) birthYear = date.getFullYear();
  }

  const age = birthYear ? new Date().getFullYear() - birthYear : DEFAULT_AGE;
  return age >= 13 && age <= 100 ? age : DEFAULT_AGE;
};

const getMet = (workoutId: string, intensity: WorkoutIntensity) => {
  const isWeightTraining = workoutId === 'weight_lifting';
  const values = isWeightTraining
    ? { low: 3.5, medium: 5, high: 6 }
    : { low: 6, medium: 8.3, high: 11 };
  return values[intensity];
};

/**
 * Wearable-style estimate without heart-rate data.
 *
 * BMR (Mifflin-St Jeor) = 10W + 6.25H - 5A + sex adjustment.
 * Active workout calories = (MET - 1) × (BMR / 1440) × minutes.
 *
 * The MET values are standard activity-intensity values. Subtracting one MET
 * records only active exercise energy, so the daily log does not also count
 * the calories the body would have burned at rest.
 */
export const calculateWorkoutCalories = (
  input: WorkoutCalorieInput
): WorkoutCalorieEstimate => {
  const weightKg = getWeightKg(input.weight);
  const heightCm = getHeightCm(input.height);
  const age = getAge(input.birthdate);
  const gender = input.gender?.toLowerCase() || '';
  const sexAdjustment = gender.includes('female') ? -161 : gender.includes('male') ? 5 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexAdjustment;
  const met = getMet(input.workoutId, input.intensity);
  const activeCalories = Math.max(
    0,
    Math.round((met - 1) * (bmr / 1440) * Math.max(0, input.durationMinutes))
  );

  return { activeCalories, met, bmr: Math.round(bmr) };
};
