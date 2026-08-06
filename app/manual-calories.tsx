import Colors from '@/constants/colors';
import { addLogEntryToFirestore, formatDateKey } from '@/services/dailyLogService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ManualCaloriesScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [logType, setLogType] = useState<'workout' | 'meal'>('workout');
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presets = [50, 100, 250, 500];

  const handleAddPreset = (amount: number) => {
    const current = Number(calories) || 0;
    setCalories(String(current + amount));
  };

  const handleLogSubmit = async () => {
    const calNum = Number(calories);
    if (!calories || isNaN(calNum) || calNum <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to log calories.');
      return;
    }

    const defaultTitle = logType === 'workout' ? 'Manual Workout' : 'Manual Meal';
    const finalTitle = title.trim() ? title.trim() : defaultTitle;

    setIsSubmitting(true);
    try {
      const todayKey = formatDateKey(new Date());
      await addLogEntryToFirestore(user.id, todayKey, {
        type: logType,
        title: finalTitle,
        calories: calNum,
        protein: logType === 'meal' ? Number(protein) || 0 : 0,
        carbs: logType === 'meal' ? Number(carbs) || 0 : 0,
        fat: logType === 'meal' ? Number(fat) || 0 : 0,
        servingSize: logType === 'meal' ? '1 serving' : undefined,
      });
      setTitle('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');

      Alert.alert(
        'Logged Successfully!',
        `${calNum} cal logged as ${finalTitle}.`,
        [
          {
            text: 'View Home',
            onPress: () => {
              router.dismissAll();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error logging manual calories:', err);
      Alert.alert('Error', err?.message || 'Failed to log calories. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateBadgeText}>Today</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title & Subtitle */}
          <Text style={styles.screenTitle}>Manual Entry</Text>
          <Text style={styles.subTitle}>
            Log calories burned from workouts or consumed from meals.
          </Text>
          {/* Segmented Type Selector (Workout Burn vs Meal Consumed) */}
          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                logType === 'workout' && styles.typeBtnActiveWorkout,
              ]}
              onPress={() => setLogType('workout')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flame"
                size={18}
                color={logType === 'workout' ? '#FFFFFF' : '#F97316'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  logType === 'workout' && styles.typeBtnTextActive,
                ]}
              >
                Burned (Workout)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                logType === 'meal' && styles.typeBtnActiveMeal,
              ]}
              onPress={() => setLogType('meal')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="restaurant-outline"
                size={18}
                color={logType === 'meal' ? '#FFFFFF' : '#10B981'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  logType === 'meal' && styles.typeBtnTextActive,
                ]}
              >
                Consumed (Meal)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Calorie Input Card with Fire Icon */}
          <View style={styles.calorieCard}>
            <View style={styles.fireIconGlowContainer}>
              <View
                style={[
                  styles.fireIconBg,
                  {
                    backgroundColor:
                      logType === 'workout'
                        ? 'rgba(249, 115, 22, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <Ionicons
                  name="flame"
                  size={42}
                  color={logType === 'workout' ? '#F97316' : '#10B981'}
                />
              </View>
            </View>

            <Text style={styles.inputLabelHeader}>
              ENTER {logType === 'workout' ? 'BURNED' : 'CONSUMED'} CALORIES
            </Text>

            <View style={styles.bigCalorieInputRow}>
              <TextInput
                style={styles.bigCalorieInput}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={5}
                autoFocus
              />
              <Text style={styles.kcalUnitText}>cal</Text>
            </View>

            {/* Quick Add Presets */}
            <View style={styles.presetsRow}>
              {presets.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.presetChip}
                  onPress={() => handleAddPreset(val)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color="#F97316" />
                  <Text style={styles.presetChipText}>+{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title / Description Field */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Title / Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder={
                logType === 'workout'
                  ? 'e.g. Evening Jog, HIIT, Gym'
                  : 'e.g. Protein Shake, Lunch Salad'
              }
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Optional Macros for Meal */}
          {logType === 'meal' && (
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Macros (Optional)</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Log Button */}
        <View style={styles.bottomFooter}>
          <TouchableOpacity
            style={[
              styles.logBtn,
              (!calories || Number(calories) <= 0 || isSubmitting) && styles.logBtnDisabled,
            ]}
            onPress={handleLogSubmit}
            disabled={!calories || Number(calories) <= 0 || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.logBtnContent}>
                <Ionicons name="flame" size={22} color="#FFFFFF" />
                <Text style={styles.logBtnText}>
                  Log {calories ? `${calories} cal` : 'Calories'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  typeBtnActiveWorkout: {
    backgroundColor: '#F97316',
  },
  typeBtnActiveMeal: {
    backgroundColor: '#10B981',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calorieCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  fireIconGlowContainer: {
    marginBottom: 12,
  },
  fireIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabelHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  bigCalorieInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 18,
  },
  bigCalorieInput: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    minWidth: 100,
    paddingHorizontal: 8,
  },
  kcalUnitText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  formSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  macroInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bottomFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  logBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  logBtnDisabled: {
    opacity: 0.5,
  },
  logBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
