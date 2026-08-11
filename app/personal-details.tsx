import Colors from '@/constants/colors';
import {
  getUserFromFirestore,
  getUserOnboardingFromStorage,
  updateUserMacroTargets,
  updateUserOnboarding,
} from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function PersonalDetailsScreen() {
  const { user } = useUser();
  const router = useRouter();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Nutrition targets state
  const [calorieGoal, setCalorieGoal] = useState<string>('2000');
  const [proteinGoal, setProteinGoal] = useState<string>('150');
  const [carbsGoal, setCarbsGoal] = useState<string>('200');
  const [fatGoal, setFatGoal] = useState<string>('65');
  const [waterLiters, setWaterLiters] = useState<string>('2.5');

  // Biometrics & fitness goals state
  const [height, setHeight] = useState<string>("5'9\"");
  const [weight, setWeight] = useState<string>('75');
  const [goal, setGoal] = useState<string>('Maintain Weight');
  const [workoutDays, setWorkoutDays] = useState<string>('3-4 days/week');

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'User';
  const userFullName = user?.fullName || user?.firstName || 'Fitness Enthusiast';
  const userAvatar = user?.imageUrl;

  useEffect(() => {
    let isMounted = true;
    async function loadCurrentDetails() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        let data = await getUserOnboardingFromStorage(user.id);
        if (!data) {
          const dbRes = await getUserFromFirestore(user.id);
          data = dbRes.data || {};
        }

        if (isMounted) {
          if (data.dailyCalorieGoal) setCalorieGoal(String(data.dailyCalorieGoal));
          if (data.macroGoals?.protein) setProteinGoal(String(data.macroGoals.protein));
          if (data.macroGoals?.carbs) setCarbsGoal(String(data.macroGoals.carbs));
          if (data.macroGoals?.fat) setFatGoal(String(data.macroGoals.fat));
          if (data.waterGoal?.liters) setWaterLiters(String(data.waterGoal.liters));
          if (data.height) setHeight(String(data.height));
          if (data.weight) setWeight(String(data.weight));
          if (data.goal) setGoal(String(data.goal));
          if (data.workoutDays) setWorkoutDays(String(data.workoutDays));
        }
      } catch (err) {
        console.error('Error loading personal details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCurrentDetails();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Derived Macro Calculations
  const cCal = parseInt(calorieGoal, 10) || 0;
  const pG = parseInt(proteinGoal, 10) || 0;
  const cG = parseInt(carbsGoal, 10) || 0;
  const fG = parseInt(fatGoal, 10) || 0;
  const wL = parseFloat(waterLiters) || 0;

  const proteinCals = pG * 4;
  const carbsCals = cG * 4;
  const fatCals = fG * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;

  const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 30;
  const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 50;
  const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 20;

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    currentStr: string,
    delta: number,
    minVal: number = 0
  ) => {
    const current = parseFloat(currentStr) || 0;
    const updated = Math.max(minVal, current + delta);
    setter(String(Number(updated.toFixed(1))));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (cCal < 500 || cCal > 10000 || pG <= 0 || cG <= 0 || fG <= 0 || wL <= 0) {
      Alert.alert('Invalid Inputs', 'Please ensure calories are between 500-10,000 and all macros/water are positive numbers.');
      return;
    }

    const calculateBMI = (hStr: string, wStr: string) => {
      let weightKg = parseFloat(wStr) || 75;
      if (wStr.toLowerCase().includes('lb')) {
        weightKg = (parseFloat(wStr) || 165) * 0.453592;
      }
      
      let heightCm = 175;
      if (hStr.includes("'")) {
        const parts = hStr.split("'");
        const feet = parseInt(parts[0]) || 0;
        const inches = parseInt(parts[1]?.replace('"', '')) || 0;
        heightCm = (feet * 12 + inches) * 2.54;
      } else {
        heightCm = parseFloat(hStr) || 175;
      }
  
      const heightM = heightCm / 100;
      const bmi = weightKg / (heightM * heightM);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';
      
      return { bmi: parseFloat(bmi.toFixed(1)), bmiCategory: category };
    };

    const { bmi, bmiCategory } = calculateBMI(height, weight);

    setIsSaving(true);
    try {
      // 1. Update Macro Targets
      await updateUserMacroTargets(user.id, {
        dailyCalorieGoal: cCal,
        protein: pG,
        carbs: cG,
        fat: fG,
        waterLiters: wL,
      });

      // 2. Update Onboarding & Biometrics
      await updateUserOnboarding(user.id, {
        height,
        weight,
        goal,
        workoutDays,
        bmi,
        bmiCategory,
      });

      Alert.alert('Success!', 'Your personal details and nutrition goals have been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('Error saving personal details:', err);
      Alert.alert('Save Failed', err?.message || 'Could not update your personal details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Personal Details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} activeOpacity={0.7}>
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User Profile Overview */}
          <View style={styles.profileOverviewCard}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={26} color={Colors.primary} />
              </View>
            )}
            <View style={styles.profileOverviewText}>
              <Text style={styles.profileName}>{userFullName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <View style={styles.syncBadge}>
                <Ionicons name="cloud-done-outline" size={12} color={Colors.primary} />
                <Text style={styles.syncBadgeText}>Synced with Cloud</Text>
              </View>
            </View>
          </View>

          {/* SECTION 1: Daily Calorie & Macro Intake */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="nutrition-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Daily Nutrition Goals</Text>
          </View>

          {/* Daily Calorie Goal Input */}
          <View style={styles.cardBox}>
            <View style={styles.inputHeaderRow}>
              <View style={styles.labelIconGroup}>
                <View style={[styles.iconBg, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="flame" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>Daily Calorie Intake</Text>
                  <Text style={styles.inputSubLabel}>Target daily calories (kcal)</Text>
                </View>
              </View>
            </View>

            <View style={styles.numberInputRow}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustValue(setCalorieGoal, calorieGoal, -50, 500)}
              >
                <Ionicons name="remove" size={20} color={Colors.text} />
              </TouchableOpacity>

              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.mainNumberInput}
                  value={calorieGoal}
                  onChangeText={setCalorieGoal}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.unitSuffix}>kcal</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustValue(setCalorieGoal, calorieGoal, 50)}
              >
                <Ionicons name="add" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Calorie Presets */}
            <View style={styles.presetRow}>
              {[1500, 1800, 2000, 2200, 2500].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    cCal === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setCalorieGoal(String(preset))}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      cCal === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Macro Breakdown Inputs (Protein, Carbs, Fat) */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Macro Breakdown Targets</Text>

            {/* Protein Input */}
            <View style={styles.macroRowItem}>
              <View style={styles.macroBadgeCol}>
                <View style={[styles.macroDot, { backgroundColor: Colors.protein }]} />
                <Text style={styles.macroItemLabel}>Protein</Text>
              </View>

              <View style={styles.macroAdjustWrapper}>
                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setProteinGoal, proteinGoal, -5, 10)}
                >
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={styles.macroTextInput}
                  value={proteinGoal}
                  onChangeText={setProteinGoal}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>

                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setProteinGoal, proteinGoal, 5)}
                >
                  <Ionicons name="add" size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* Carbs Input */}
            <View style={styles.macroRowItem}>
              <View style={styles.macroBadgeCol}>
                <View style={[styles.macroDot, { backgroundColor: Colors.carbs }]} />
                <Text style={styles.macroItemLabel}>Carbs</Text>
              </View>

              <View style={styles.macroAdjustWrapper}>
                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setCarbsGoal, carbsGoal, -10, 10)}
                >
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={styles.macroTextInput}
                  value={carbsGoal}
                  onChangeText={setCarbsGoal}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>

                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setCarbsGoal, carbsGoal, 10)}
                >
                  <Ionicons name="add" size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* Fat Input */}
            <View style={styles.macroRowItem}>
              <View style={styles.macroBadgeCol}>
                <View style={[styles.macroDot, { backgroundColor: Colors.fats }]} />
                <Text style={styles.macroItemLabel}>Fat</Text>
              </View>

              <View style={styles.macroAdjustWrapper}>
                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setFatGoal, fatGoal, -5, 5)}
                >
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={styles.macroTextInput}
                  value={fatGoal}
                  onChangeText={setFatGoal}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>

                <TouchableOpacity
                  style={styles.smallAdjustBtn}
                  onPress={() => adjustValue(setFatGoal, fatGoal, 5)}
                >
                  <Ionicons name="add" size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Macro Visualizer Card */}
          <View style={styles.visualizerCard}>
            <View style={styles.visualizerHeader}>
              <Text style={styles.visualizerTitle}>Calculated Macro Balance</Text>
              <Text style={styles.visualizerCals}>{totalMacroCals} kcal</Text>
            </View>

            {/* Split Bar */}
            <View style={styles.macroTrackBar}>
              <View style={[styles.macroSegment, { flex: proteinPct, backgroundColor: Colors.protein }]} />
              <View style={[styles.macroSegment, { flex: carbsPct, backgroundColor: Colors.carbs }]} />
              <View style={[styles.macroSegment, { flex: fatPct, backgroundColor: Colors.fats }]} />
            </View>

            <View style={styles.macroLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.protein }]} />
                <Text style={styles.legendText}>Protein {proteinPct}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.carbs }]} />
                <Text style={styles.legendText}>Carbs {carbsPct}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.fats }]} />
                <Text style={styles.legendText}>Fat {fatPct}%</Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: Water Intake */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="water-outline" size={20} color="#38BDF8" />
            <Text style={styles.sectionTitle}>Daily Water Goal</Text>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.inputHeaderRow}>
              <View style={styles.labelIconGroup}>
                <View style={[styles.iconBg, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="water" size={18} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>Water Target</Text>
                  <Text style={styles.inputSubLabel}>Daily target volume in Liters</Text>
                </View>
              </View>
            </View>

            <View style={styles.numberInputRow}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustValue(setWaterLiters, waterLiters, -0.25, 0.5)}
              >
                <Ionicons name="remove" size={20} color={Colors.text} />
              </TouchableOpacity>

              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.mainNumberInput}
                  value={waterLiters}
                  onChangeText={setWaterLiters}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>Liters</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustValue(setWaterLiters, waterLiters, 0.25)}
              >
                <Ionicons name="add" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Water Chips */}
            <View style={styles.presetRow}>
              {[1.5, 2.0, 2.5, 3.0, 3.5].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    wL === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setWaterLiters(String(preset))}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      wL === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset} L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SECTION 3: Body & Fitness Metrics */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="fitness-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Body Metrics & Fitness Goal</Text>
          </View>

          <View style={styles.cardBox}>
            {/* Height & Weight Inputs */}
            <View style={styles.dualInputRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.subInputLabel}>Height</Text>
                <TextInput
                  style={styles.standardInput}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g. 5'10&quot; or 178 cm"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subInputLabel}>Weight</Text>
                <TextInput
                  style={styles.standardInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 75 kg"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Primary Goal Choice */}
            <Text style={[styles.subInputLabel, { marginTop: 14 }]}>Primary Goal</Text>
            <View style={styles.chipOptionContainer}>
              {['Weight Loss', 'Maintain Weight', 'Muscle Gain'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    goal === option && styles.optionChipActive,
                  ]}
                  onPress={() => setGoal(option)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      goal === option && styles.optionChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Workout Frequency Choice */}
            <Text style={[styles.subInputLabel, { marginTop: 14 }]}>Workout Frequency</Text>
            <View style={styles.chipOptionContainer}>
              {['1-2 days/week', '3-4 days/week', '5+ days/week'].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.optionChip,
                    workoutDays === days && styles.optionChipActive,
                  ]}
                  onPress={() => setWorkoutDays(days)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      workoutDays === days && styles.optionChipTextActive,
                    ]}
                  >
                    {days}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom Save Action Button */}
          <TouchableOpacity
            style={styles.saveSubmitBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveSubmitBtnText}>Save Changes</Text>
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSaveText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 8,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile Overview Card
  profileOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileOverviewText: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 1,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  syncBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  // Card Box Base
  cardBox: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  cardBoxTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },

  // Input Row Layouts
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  inputSubLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },

  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
  },
  adjustBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainNumberInput: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 80,
  },
  unitSuffix: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },

  // Preset Chips
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },

  // Macro Items
  macroRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  macroBadgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroItemLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  macroAdjustWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  smallAdjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroTextInput: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    width: 50,
  },
  macroUnit: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.divider,
  },

  // Visualizer Card
  visualizerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  visualizerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  visualizerTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  visualizerCals: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  macroTrackBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  macroSegment: {
    height: '100%',
  },
  macroLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Form Controls
  dualInputRow: {
    flexDirection: 'row',
  },
  subInputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  standardInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  chipOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Submit Button
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
