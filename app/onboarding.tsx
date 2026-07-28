import HugeIcon from '@/components/HugeIcon';
import Colors from '@/constants/colors';
import { saveUserOnboardingToStorage, updateUserOnboarding } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [workoutDays, setWorkoutDays] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const handleNextStep = () => {
    setErrorMsg('');

    // Validation per step
    if (currentStep === 1 && !gender) {
      setErrorMsg('Please select your gender to proceed.');
      return;
    }
    if (currentStep === 2 && !goal) {
      setErrorMsg('Please select your primary fitness goal.');
      return;
    }
    if (currentStep === 3 && !workoutDays) {
      setErrorMsg('Please select your weekly workout frequency.');
      return;
    }
    if (currentStep === 4) {
      if (!day || !month || !year) {
        setErrorMsg('Please enter a valid day, month, and year.');
        return;
      }
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      const currentYear = new Date().getFullYear();
      if (
        isNaN(dayNum) ||
        dayNum < 1 ||
        dayNum > 31 ||
        isNaN(monthNum) ||
        monthNum < 1 ||
        monthNum > 12 ||
        isNaN(yearNum) ||
        yearNum < 1920 ||
        yearNum > currentYear
      ) {
        setErrorMsg('Please enter a realistic birthdate.');
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmitOnboarding();
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!heightFeet || !weightKg) {
      setErrorMsg('Please enter both your height and weight.');
      return;
    }

    const parsedFeet = parseFloat(heightFeet);
    const parsedInches = parseFloat(heightInches || '0');
    const parsedWeight = parseFloat(weightKg);

    if (isNaN(parsedFeet) || parsedFeet < 3 || parsedFeet > 8) {
      setErrorMsg('Please enter a valid height in feet (e.g. 5).');
      return;
    }
    if (isNaN(parsedInches) || parsedInches < 0 || parsedInches > 11) {
      setErrorMsg('Please enter valid height inches (0–11).');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      setErrorMsg('Please enter a valid weight in kg (e.g. 75).');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const heightFormatted = `${heightFeet}'${heightInches || '0'}"`;
      const birthdateObj = { day, month, year };

      const onboardingPayload = {
        gender,
        goal,
        workoutDays,
        birthdate: birthdateObj,
        height: heightFormatted,
        weight: `${parsedWeight} kg`,
        onboardingCompleted: true,
      };

      if (user?.id) {
        // Save locally to SecureStore / localStorage
        await saveUserOnboardingToStorage(user.id, onboardingPayload);

        // Save to Firebase Firestore database
        await updateUserOnboarding(user.id, onboardingPayload);
      }

      router.replace({
        pathname: '/generate-plan',
        params: {
          gender,
          goal,
          workoutDays,
          birthdate: JSON.stringify(birthdateObj),
          height: heightFormatted,
          weight: `${parsedWeight} kg`,
        },
      } as any);
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setErrorMsg('Failed to save your profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = `${(currentStep / TOTAL_STEPS) * 100}%`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top Header & Progress Indicator */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            {currentStep > 1 ? (
              <TouchableOpacity onPress={handlePrevStep} style={styles.backBtn} activeOpacity={0.7}>
                <HugeIcon name="arrowleft" size={20} color={Colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={styles.stepBadgeText}>
              Step <Text style={{ color: Colors.primary }}>{currentStep}</Text> of {TOTAL_STEPS}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Gold Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressPercentage as any }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Message Display */}
          {errorMsg ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* STEP 1: GENDER */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Your Gender</Text>
              <Text style={styles.stepSubTitle}>
                We use this to calculate your personalized baseline metabolism (BMR).
              </Text>

              <View style={styles.optionsList}>
                {[
                  { id: 'male', label: 'Male', desc: 'Biological male metabolism calculation', icon: 'male' },
                  { id: 'female', label: 'Female', desc: 'Biological female metabolism calculation', icon: 'female' },
                  { id: 'other', label: 'Other / Prefer not to say', desc: 'Standard calorie estimation formula', icon: 'user' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionCard, gender === item.id && styles.optionCardActive]}
                    onPress={() => {
                      setGender(item.id);
                      if (errorMsg) setErrorMsg('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.optionIconContainer, gender === item.id && styles.optionIconContainerActive]}>
                      <HugeIcon
                        name={item.icon}
                        size={24}
                        color={gender === item.id ? Colors.textOnPrimary : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, gender === item.id && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, gender === item.id && styles.radioCircleActive]}>
                      {gender === item.id && <View style={styles.radioInnerCircle} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: FITNESS GOAL */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{"What's Your Goal?"}</Text>

              <Text style={styles.stepSubTitle}>
                Your target guides your daily calorie surplus or deficit.
              </Text>

              <View style={styles.optionsList}>
                {[
                  {
                    id: 'lose_weight',
                    label: 'Lose Weight',
                    desc: 'Burn body fat & get lean with a structured calorie deficit',
                    icon: 'loseweight',
                  },
                  {
                    id: 'maintain',
                    label: 'Maintain Weight',
                    desc: 'Keep current weight & optimize your daily macros',
                    icon: 'maintain',
                  },
                  {
                    id: 'gain_weight',
                    label: 'Gain Weight / Build Muscle',
                    desc: 'Pack on lean muscle mass with a calorie surplus',
                    icon: 'gainweight',
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionCard, goal === item.id && styles.optionCardActive]}
                    onPress={() => {
                      setGoal(item.id);
                      if (errorMsg) setErrorMsg('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.optionIconContainer, goal === item.id && styles.optionIconContainerActive]}>
                      <HugeIcon
                        name={item.icon}
                        size={24}
                        color={goal === item.id ? Colors.textOnPrimary : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, goal === item.id && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, goal === item.id && styles.radioCircleActive]}>
                      {goal === item.id && <View style={styles.radioInnerCircle} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3: WORKOUT FREQUENCY */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Workout Activity</Text>
              <Text style={styles.stepSubTitle}>
                How often do you train or hit the gym each week?
              </Text>

              <View style={styles.optionsList}>
                {[
                  {
                    id: '2-3_days',
                    label: '2 - 3 Days / Week',
                    desc: 'Light to moderate exercise or casual lifting',
                    icon: 'workoutlight',
                  },
                  {
                    id: '3-4_days',
                    label: '3 - 4 Days / Week',
                    desc: 'Consistent training & regular weightlifting',
                    icon: 'workoutmoderate',
                  },
                  {
                    id: '5-6_days',
                    label: '5 - 6 Days / Week',
                    desc: 'Heavy lifting & high intensity training',
                    icon: 'workoutheavy',
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionCard, workoutDays === item.id && styles.optionCardActive]}
                    onPress={() => {
                      setWorkoutDays(item.id);
                      if (errorMsg) setErrorMsg('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.optionIconContainer,
                        workoutDays === item.id && styles.optionIconContainerActive,
                      ]}
                    >
                      <HugeIcon
                        name={item.icon}
                        size={24}
                        color={workoutDays === item.id ? Colors.textOnPrimary : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, workoutDays === item.id && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, workoutDays === item.id && styles.radioCircleActive]}>
                      {workoutDays === item.id && <View style={styles.radioInnerCircle} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 4: BIRTHDATE */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>When Were You Born?</Text>
              <Text style={styles.stepSubTitle}>
                Age is essential for precise basal metabolic rate estimations.
              </Text>

              <View style={styles.dateInputRow}>
                {/* Day */}
                <View style={styles.dateCol}>
                  <Text style={styles.inputFieldLabel}>Day</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    placeholderTextColor={Colors.textMuted}
                    value={day}
                    onChangeText={(t) => {
                      setDay(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                {/* Month */}
                <View style={styles.dateCol}>
                  <Text style={styles.inputFieldLabel}>Month</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    placeholderTextColor={Colors.textMuted}
                    value={month}
                    onChangeText={(t) => {
                      setMonth(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                {/* Year */}
                <View style={[styles.dateCol, { flex: 1.4 }]}>
                  <Text style={styles.inputFieldLabel}>Year</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.textMuted}
                    value={year}
                    onChangeText={(t) => {
                      setYear(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 5: HEIGHT & WEIGHT */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Height & Weight</Text>
              <Text style={styles.stepSubTitle}>
                Enter your current metrics in feet (ft/in) and kilograms (kg).
              </Text>

              <View style={styles.metricGroup}>
                {/* Height */}
                <Text style={styles.inputFieldLabel}>Height (Feet & Inches)</Text>
                <View style={styles.heightInputRow}>
                  <View style={[styles.metricInputWrapper, { flex: 1, marginRight: 8 }]}>
                    <HugeIcon name="height" size={20} color={Colors.primary} />
                    <TextInput
                      style={styles.metricInput}
                      placeholder="5"
                      placeholderTextColor={Colors.textMuted}
                      value={heightFeet}
                      onChangeText={(t) => {
                        setHeightFeet(t);
                        if (errorMsg) setErrorMsg('');
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unitText}>ft</Text>
                  </View>

                  <View style={[styles.metricInputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.metricInput}
                      placeholder="10"
                      placeholderTextColor={Colors.textMuted}
                      value={heightInches}
                      onChangeText={(t) => {
                        setHeightInches(t);
                        if (errorMsg) setErrorMsg('');
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.unitText}>in</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricGroup}>
                {/* Weight */}
                <Text style={styles.inputFieldLabel}>Current Weight (Kilograms)</Text>
                <View style={styles.metricInputWrapper}>
                  <HugeIcon name="weight" size={20} color={Colors.primary} />
                  <TextInput
                    style={styles.metricInput}
                    placeholder="75"
                    placeholderTextColor={Colors.textMuted}
                    value={weightKg}
                    onChangeText={(t) => {
                      setWeightKg(t);
                      if (errorMsg) setErrorMsg('');
                    }}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitText}>kg</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.7 }]}
            onPress={handleNextStep}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textOnPrimary} size="small" />
            ) : (
              <View style={styles.nextBtnContent}>
                <Text style={styles.nextBtnText}>
                  {currentStep === TOTAL_STEPS ? 'Complete & Start Tracking' : 'Continue'}
                </Text>
                <HugeIcon name="arrowright" size={20} color={Colors.textOnPrimary} />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  errorAlert: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionIconContainerActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateCol: {
    flex: 1,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    height: 56,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  metricGroup: {
    marginBottom: 20,
  },
  heightInputRow: {
    flexDirection: 'row',
  },
  metricInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  metricInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  unitText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
