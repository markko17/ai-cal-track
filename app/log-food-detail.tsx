import Colors from '@/constants/colors';
import { addLogEntryToFirestore, formatDateKey } from '@/services/dailyLogService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogFoodDetailScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    foodName?: string;
    servingSize?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  }>();

  const foodName = params.foodName || 'Selected Food';
  const baseServingUnit = params.servingSize || '1 serving';

  // Base nutrition values per 1 serving
  const baseCalories = Number(params.calories) || 0;
  const baseProtein = Number(params.protein) || 0;
  const baseCarbs = Number(params.carbs) || 0;
  const baseFat = Number(params.fat) || 0;

  // Form states
  const [quantity, setQuantity] = useState('1');
  const [servingDescription, setServingDescription] = useState(baseServingUnit);
  const [calories, setCalories] = useState(String(baseCalories));
  const [protein, setProtein] = useState(String(baseProtein));
  const [carbs, setCarbs] = useState(String(baseCarbs));
  const [fat, setFat] = useState(String(baseFat));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate calories and macros dynamically when quantity changes
  const handleQuantityChange = (newQtyStr: string) => {
    setQuantity(newQtyStr);
    const qty = parseFloat(newQtyStr);
    if (!isNaN(qty) && qty > 0) {
      const newCal = Math.round(baseCalories * qty);
      const newProt = Number((baseProtein * qty).toFixed(1));
      const newCarb = Number((baseCarbs * qty).toFixed(1));
      const newFat = Number((baseFat * qty).toFixed(1));

      setCalories(String(newCal));
      setProtein(String(newProt));
      setCarbs(String(newCarb));
      setFat(String(newFat));
    }
  };

  // Adjust quantity via stepper buttons (- / +)
  const handleStepQuantity = (delta: number) => {
    const current = parseFloat(quantity) || 1;
    const next = Math.max(0.25, parseFloat((current + delta).toFixed(2)));
    handleQuantityChange(String(next));
  };

  const handleSaveLog = async () => {
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to log your meal.');
      return;
    }

    const calNum = Number(calories);
    if (isNaN(calNum) || calNum < 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = formatDateKey(new Date());
      const qtyNum = parseFloat(quantity) || 1;
      const logTitle =
        qtyNum !== 1
          ? `${foodName.trim()} (${qtyNum}x - ${servingDescription})`
          : `${foodName.trim()} (${servingDescription})`;

      const servingStr =
        qtyNum !== 1
          ? `${qtyNum}x ${servingDescription.trim()}`
          : servingDescription.trim();

      await addLogEntryToFirestore(user.id, todayStr, {
        type: 'meal',
        title: foodName.trim(),
        calories: calNum,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingSize: servingStr,
      });

      // Navigate back to home screen with updated log data
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Error logging food:', error);
      Alert.alert('Error', error?.message || 'Failed to save food log to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQtyNum = parseFloat(quantity) || 1;
  const pNum = Number(protein) || 0;
  const cNum = Number(carbs) || 0;
  const fNum = Number(fat) || 0;
  const totalMacroGrams = pNum + cNum + fNum || 1;

  const pPct = Math.round((pNum / totalMacroGrams) * 100);
  const cPct = Math.round((cNum / totalMacroGrams) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {/* Top Bar Navigation */}
            <View style={styles.topHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Log Food</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Hero Food Card */}
              <View style={styles.heroCard}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="sparkles" size={12} color="#059669" />
                  <Text style={styles.verifiedBadgeText}>Verified Nutrition</Text>
                </View>

                <Text style={styles.foodTitle}>{foodName}</Text>

                <View style={styles.baseServingTag}>
                  <Ionicons name="restaurant-outline" size={14} color="#64748B" />
                  <Text style={styles.baseServingTagText}>
                    Base Unit: {baseServingUnit} ({baseCalories} kcal)
                  </Text>
                </View>
              </View>

              {/* Serving Size & Quantity Stepper Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Portion & Servings</Text>
                </View>

                {/* Base Serving Unit Description Field */}
                <TextInput
                  style={styles.inputField}
                  value={servingDescription}
                  onChangeText={setServingDescription}
                  placeholder="e.g. 1 cup (158g)"
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Stepper Controls */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperCircleBtn}
                    onPress={() => handleStepQuantity(-0.5)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="remove" size={22} color={Colors.text} />
                  </TouchableOpacity>

                  <View style={styles.quantityDisplayWrapper}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={handleQuantityChange}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <Text style={styles.servingsUnitText}>
                      {currentQtyNum === 1 ? 'serving' : 'servings'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperCircleBtn}
                    onPress={() => handleStepQuantity(0.5)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add" size={22} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Quick Multiplier Chips */}
                <View style={styles.multiplierChipsRow}>
                  {[0.5, 1, 1.5, 2, 3].map((multiplier) => {
                    const isSelected = currentQtyNum === multiplier;
                    return (
                      <TouchableOpacity
                        key={multiplier}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                        ]}
                        onPress={() => handleQuantityChange(String(multiplier))}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {multiplier}x
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Hero Calories Card */}
              <View style={styles.caloriesCard}>
                <View style={styles.caloriesCardHeader}>
                  <View style={styles.flameIconBg}>
                    <Ionicons name="flame" size={28} color="#EF4444" />
                  </View>
                  <View style={styles.caloriesTitleWrapper}>
                    <Text style={styles.caloriesCardTitle}>Total Calories</Text>
                    <Text style={styles.caloriesCardSub}>
                      {currentQtyNum !== 1
                        ? `${currentQtyNum}x portion (${baseCalories} kcal/base)`
                        : 'Energy value in kcal'}
                    </Text>
                  </View>
                </View>

                <View style={styles.caloriesInputWrapper}>
                  <TextInput
                    style={styles.caloriesInput}
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={5}
                  />
                  <Text style={styles.kcalUnit}>kcal</Text>
                </View>
              </View>

              {/* Macronutrient Section with Distribution Bar */}
              <View style={styles.macrosHeaderRow}>
                <Text style={styles.macrosSectionHeader}>Macronutrients</Text>
                <Text style={styles.macroTotalSubtitle}>
                  {pNum}g P • {cNum}g C • {fNum}g F
                </Text>
              </View>

              {/* Visual Macro Proportion Bar */}
              <View style={styles.macroProgressBarWrapper}>
                <View
                  style={[
                    styles.macroBarSegment,
                    { flex: pPct || 1, backgroundColor: Colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.macroBarSegment,
                    { flex: cPct || 1, backgroundColor: '#3B82F6' },
                  ]}
                />
                <View
                  style={[
                    styles.macroBarSegment,
                    { flex: fPct || 1, backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>

              {/* 3 Macro Cards Grid */}
              <View style={styles.macrosContainer}>
                {/* Protein */}
                <View style={styles.macroCard}>
                  <View style={styles.macroHeader}>
                    <View
                      style={[
                        styles.macroIconBg,
                        { backgroundColor: 'rgba(17, 24, 39, 0.08)' },
                      ]}
                    >
                      <Ionicons name="fitness" size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      maxLength={5}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>
                </View>

                {/* Carbs */}
                <View style={styles.macroCard}>
                  <View style={styles.macroHeader}>
                    <View
                      style={[
                        styles.macroIconBg,
                        { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
                      ]}
                    >
                      <Ionicons name="leaf" size={16} color="#3B82F6" />
                    </View>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      maxLength={5}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>
                </View>

                {/* Fat */}
                <View style={styles.macroCard}>
                  <View style={styles.macroHeader}>
                    <View
                      style={[
                        styles.macroIconBg,
                        { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                      ]}
                    >
                      <Ionicons name="water" size={16} color="#F59E0B" />
                    </View>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      maxLength={5}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Sticky Floating Bottom CTA Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.logButton, isSubmitting && styles.logButtonDisabled]}
                onPress={handleSaveLog}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.logButtonText}>
                      Log Meal • {calories} kcal
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentWrapper: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 42,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 10,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  foodTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  baseServingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baseServingTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  stepperCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityDisplayWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  },
  servingsUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -2,
  },
  multiplierChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  caloriesCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  caloriesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  flameIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesTitleWrapper: {
    flex: 1,
  },
  caloriesCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#991B1B',
  },
  caloriesCardSub: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
  },
  caloriesInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 16,
    height: 54,
  },
  caloriesInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#991B1B',
  },
  kcalUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },
  macrosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macrosSectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroTotalSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  macroProgressBarWrapper: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
    gap: 2,
  },
  macroBarSegment: {
    height: '100%',
    borderRadius: 3,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  macroIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    height: 40,
  },
  macroInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logButton: {
    backgroundColor: '#0F172A',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logButtonDisabled: {
    opacity: 0.7,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
