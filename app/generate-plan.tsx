import HugeIcon from '@/components/HugeIcon';
import Colors from '@/constants/colors';
import { generateFitnessPlanWithAI, GeneratedFitnessPlan, UserOnboardingInput } from '@/services/geminiService';
import { getUserOnboardingFromStorage, saveUserOnboardingToStorage, updateUserOnboarding } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const LOADING_STEPS = [
  { id: 0, text: 'Analyzing your physical profile & fitness goals' },
  { id: 1, text: 'Calculating BMR, TDEE & macro targets via Gemini AI' },
  { id: 2, text: 'Determining daily hydration & personalized fitness advice' },
  { id: 3, text: 'Saving your custom plan to Firebase database' },
];

export default function GeneratePlanScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedFitnessPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Animated progress bar
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let isMounted = true;

    async function runAIPipeline() {
      try {
        setIsGenerating(true);
        setErrorMsg('');
        setCompletedSteps([]);
        setActiveStepIndex(0);

        // 1. Step 0: Profile Analysis (0 -> 25%)
        Animated.timing(progressAnim, {
          toValue: 0.25,
          duration: 600,
          useNativeDriver: false,
        }).start();

        // Dummy delay for Step 0 checkmark
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;

        // Complete Step 0, start Step 1
        setCompletedSteps([0]);
        setActiveStepIndex(1);
        Animated.timing(progressAnim, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: false,
        }).start();

        // Load input data from params or local storage fallback
        let inputData: UserOnboardingInput = {
          gender: (params.gender as string) || 'male',
          goal: (params.goal as string) || 'lose weight',
          workoutDays: (params.workoutDays as string) || '3-4 days',
          birthdate: params.birthdate ? JSON.parse(params.birthdate as string) : { day: '15', month: '6', year: '1995' },
          height: (params.height as string) || `5'9"`,
          weight: (params.weight as string) || '75 kg',
        };

        if (user?.id && (!params.gender || !params.height)) {
          const stored = await getUserOnboardingFromStorage(user.id);
          if (stored) {
            inputData = {
              gender: stored.gender || inputData.gender,
              goal: stored.goal || inputData.goal,
              workoutDays: stored.workoutDays || inputData.workoutDays,
              birthdate: stored.birthdate || inputData.birthdate,
              height: stored.height || inputData.height,
              weight: stored.weight || inputData.weight,
            };
          }
        }

        // 2. Call Gemini AI (Step 1 finishes when AI responds)
        const aiPlan = await generateFitnessPlanWithAI(inputData);
        if (!isMounted) return;

        // Complete Step 1, start Step 2
        setCompletedSteps([0, 1]);
        setActiveStepIndex(2);
        Animated.timing(progressAnim, {
          toValue: 0.75,
          duration: 700,
          useNativeDriver: false,
        }).start();

        // Dummy delay for Step 2 (Hydration & advice determination)
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;

        // Complete Step 2, start Step 3 (Saving to Firebase & local storage)
        setCompletedSteps([0, 1, 2]);
        setActiveStepIndex(3);
        Animated.timing(progressAnim, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: false,
        }).start();

        const planPayload = {
          ...inputData,
          dailyCalorieGoal: aiPlan.dailyCalories,
          macroGoals: {
            protein: aiPlan.proteinGrams,
            carbs: aiPlan.carbsGrams,
            fat: aiPlan.fatGrams,
          },
          waterGoal: {
            liters: aiPlan.waterIntakeLiters,
            glasses: aiPlan.waterIntakeGlasses,
          },
          bmi: aiPlan.bmi,
          bmiCategory: aiPlan.bmiCategory,
          targetWeightPace: aiPlan.targetWeightPace,
          fitnessAdvice: aiPlan.fitnessAdvice,
          onboardingCompleted: true,
        };

        if (user?.id) {
          // Persist locally
          await saveUserOnboardingToStorage(user.id, planPayload);

          // Persist to Firebase Firestore
          await updateUserOnboarding(user.id, planPayload);
        }

        if (!isMounted) return;

        // Complete Step 3 (All 4 checkmarks completed!)
        setCompletedSteps([0, 1, 2, 3]);
        Animated.timing(progressAnim, {
          toValue: 1.0,
          duration: 400,
          useNativeDriver: false,
        }).start();

        // Brief delay so user sees all checkmarks finished
        await new Promise((r) => setTimeout(r, 650));

        if (isMounted) {
          setGeneratedPlan(aiPlan);
          setIsGenerating(false);
        }
      } catch (err: any) {
        console.error('Error generating AI plan:', err);
        if (isMounted) {
          setErrorMsg('Could not process your AI plan. Please try again.');
          setIsGenerating(false);
        }
      }
    }

    runAIPipeline();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFinishAndGoToDashboard = () => {
    router.replace('/');
  };

  // Render Animated Loading Screen with Interactive Step Checklist
  if (isGenerating) {
    const barWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.aiBadgeGlow}>
            <HugeIcon name="flame" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Generating Your AI Plan</Text>
          <Text style={styles.loadingSub}>Please wait while Gemini AI calculates your target plan</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
            </View>
          </View>

          {/* Interactive Checklist Steps */}
          <View style={styles.checklistContainer}>
            {LOADING_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              const isLoading = activeStepIndex === step.id && !isDone;

              return (
                <View key={step.id} style={styles.checklistItem}>
                  <View
                    style={[
                      styles.checkIconBox,
                      isDone && styles.checkIconBoxDone,
                      isLoading && styles.checkIconBoxLoading,
                    ]}
                  >
                    {isDone ? (
                      <HugeIcon name="checkmark" size={14} color={Colors.textOnPrimary} />
                    ) : isLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <View style={styles.checkIconDot} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.checkText,
                      isDone && styles.checkTextDone,
                      isLoading && styles.checkTextLoading,
                    ]}
                  >
                    {step.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !generatedPlan) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <HugeIcon name="arrowleft" size={32} color={Colors.error} />
          <Text style={[styles.loadingTitle, { color: Colors.error }]}>Generation Failed</Text>
          <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            {errorMsg || 'Something went wrong while generating your plan.'}
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={() => router.replace('/onboarding' as any)}>
            <Text style={styles.finishBtnText}>Back to Onboarding</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render Results Screen once generated and saved to Firebase
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Badge */}
        <View style={styles.headerRow}>
          <View style={styles.aiBadgePill}>
            <HugeIcon name="checkmark" size={16} color={Colors.primary} />
            <Text style={styles.aiBadgePillText}>AI Plan Generated & Saved</Text>
          </View>
          <Text style={styles.headerTitle}>Your Daily Nutrition Target</Text>
          <Text style={styles.headerSub}>Personalized based on your goals and biometric profile</Text>
        </View>

        {/* Hero Daily Calorie Card */}
        <View style={styles.heroCalorieCard}>
          <Text style={styles.heroCardLabel}>Daily Target Calories</Text>
          <View style={styles.heroCalorieRow}>
            <Text style={styles.heroCalorieVal}>{generatedPlan.dailyCalories.toLocaleString()}</Text>
            <Text style={styles.heroCalorieUnit}>kcal / day</Text>
          </View>

          <View style={styles.heroPaceBadge}>
            <HugeIcon name="scale" size={14} color={Colors.textOnPrimary} />
            <Text style={styles.heroPaceText}>{generatedPlan.targetWeightPace}</Text>
          </View>
        </View>

        {/* Macronutrient Grid */}
        <Text style={styles.sectionTitle}>Required Daily Macronutrients</Text>
        <View style={styles.macroGrid}>
          {/* Protein Card */}
          <View style={[styles.macroCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <HugeIcon name="dumbbell" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.macroCardValue}>{generatedPlan.proteinGrams}g</Text>
            <Text style={styles.macroCardName}>Protein</Text>
            <Text style={styles.macroCardPct}>{generatedPlan.macroPercentages.protein}% calories</Text>
          </View>

          {/* Carbs Card */}
          <View style={[styles.macroCard, { borderColor: 'rgba(234, 179, 8, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
              <HugeIcon name="flame" size={20} color="#EAB308" />
            </View>
            <Text style={styles.macroCardValue}>{generatedPlan.carbsGrams}g</Text>
            <Text style={styles.macroCardName}>Carbs</Text>
            <Text style={styles.macroCardPct}>{generatedPlan.macroPercentages.carbs}% calories</Text>
          </View>

          {/* Fat Card */}
          <View style={[styles.macroCard, { borderColor: 'rgba(236, 72, 153, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <HugeIcon name="weight" size={20} color="#EC4899" />
            </View>
            <Text style={styles.macroCardValue}>{generatedPlan.fatGrams}g</Text>
            <Text style={styles.macroCardName}>Fats</Text>
            <Text style={styles.macroCardPct}>{generatedPlan.macroPercentages.fat}% calories</Text>
          </View>
        </View>

        {/* Daily Hydration Card */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeaderRow}>
            <View style={styles.waterIconCircle}>
              <HugeIcon name="workoutlight" size={24} color="#38BDF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.waterTitle}>Daily Water Requirement</Text>
              <Text style={styles.waterSub}>Essential for optimal digestion & energy</Text>
            </View>
          </View>
          <View style={styles.waterStatRow}>
            <View style={styles.waterStatBox}>
              <Text style={styles.waterStatVal}>{generatedPlan.waterIntakeLiters} L</Text>
              <Text style={styles.waterStatLabel}>Liters per day</Text>
            </View>
            <View style={styles.waterStatDivider} />
            <View style={styles.waterStatBox}>
              <Text style={styles.waterStatVal}>~{generatedPlan.waterIntakeGlasses}</Text>
              <Text style={styles.waterStatLabel}>Glasses (250ml)</Text>
            </View>
          </View>
        </View>

        {/* Physical Profile & BMI Summary */}
        <View style={styles.bmiCard}>
          <Text style={styles.bmiCardTitle}>Physical Profile Summary</Text>
          <View style={styles.bmiRow}>
            <View style={styles.bmiCol}>
              <Text style={styles.bmiLabel}>Calculated BMI</Text>
              <Text style={styles.bmiVal}>{generatedPlan.bmi}</Text>
            </View>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiBadgeText}>{generatedPlan.bmiCategory}</Text>
            </View>
          </View>
        </View>

        {/* AI Recommendations & Advice */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeaderRow}>
            <HugeIcon name="checkmark" size={18} color={Colors.primary} />
            <Text style={styles.adviceTitle}>Gemini AI Fitness Recommendation</Text>
          </View>
          <Text style={styles.adviceText}>{generatedPlan.fitnessAdvice}</Text>
        </View>

        {/* Action Button to Dashboard */}
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishAndGoToDashboard} activeOpacity={0.8}>
          <Text style={styles.finishBtnText}>Go to Dashboard</Text>
          <HugeIcon name="arrowright" size={20} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  aiBadgeGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    marginVertical: 16,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  loadingSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  checklistContainer: {
    width: '100%',
    marginTop: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkIconBoxDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIconBoxLoading: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  checkIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  checkText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  checkTextLoading: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkTextDone: {
    color: Colors.text,
    fontWeight: '600',
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 12,
  },
  aiBadgePillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  heroCalorieCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 24,
  },
  heroCardLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroCalorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  heroCalorieVal: {
    color: Colors.primary,
    fontSize: 44,
    fontWeight: '900',
  },
  heroCalorieUnit: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  heroPaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
  },
  heroPaceText: {
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  macroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroCardValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  macroCardName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  macroCardPct: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  waterCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 20,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  waterSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  waterStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 12,
  },
  waterStatBox: {
    alignItems: 'center',
  },
  waterStatVal: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
  },
  waterStatLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  waterStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },
  bmiCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  bmiCardTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bmiLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginRight: 8,
  },
  bmiVal: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  bmiBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bmiBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  adviceCard: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 28,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  adviceText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  finishBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
