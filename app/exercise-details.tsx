import Colors from '@/constants/colors';
import { getUserOnboardingFromStorage, getUserFromFirestore } from '@/services/userService';
import { calculateWorkoutCalories } from '@/utils/calorieBurn';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type IntensityLevel = 'low' | 'medium' | 'high';

const DURATION_PRESETS = [15, 30, 60, 90];
const NODE_SIZE = 54; // Circle container size in px

interface DraggableCircleSliderProps {
  value: IntensityLevel;
  onChange: (val: IntensityLevel) => void;
}

function DraggableCircleSlider({ value, onChange }: DraggableCircleSliderProps) {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const panAnim = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const startX = useRef(0);

  // Store latest refs to prevent PanResponder recreation mid-drag
  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Map intensity level to index 0, 1, 2
  const getIndex = (val: IntensityLevel) => {
    if (val === 'low') return 0;
    if (val === 'medium') return 1;
    return 2;
  };

  const getValueFromIndex = (idx: number): IntensityLevel => {
    if (idx === 0) return 'low';
    if (idx === 1) return 'medium';
    return 'high';
  };

  const activeColor =
    value === 'low' ? '#10B981' : value === 'medium' ? '#F97316' : '#EF4444';

  // Calculate exact snap X position for index
  const getSnapX = (idx: number, width: number) => {
    if (width <= 0) return 0;
    const usableWidth = width - NODE_SIZE;
    return (idx / 2) * usableWidth;
  };

  // Sync pan animation when value changes (e.g. on direct tap) and not dragging
  React.useEffect(() => {
    if (containerWidth > 0 && !isDragging.current) {
      const targetX = getSnapX(getIndex(value), containerWidth);
      Animated.spring(panAnim, {
        toValue: targetX,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    }
  }, [value, containerWidth]);

  // Stable PanResponder created ONLY when containerWidth changes
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          isDragging.current = true;
          const curIdx = getIndex(valueRef.current);
          startX.current = getSnapX(curIdx, containerWidth);
        },
        onPanResponderMove: (_, gestureState) => {
          const usableWidth = Math.max(containerWidth - NODE_SIZE, 1);
          const rawX = startX.current + gestureState.dx;
          const clampedX = Math.min(Math.max(rawX, 0), usableWidth);

          panAnim.setValue(clampedX);

          const ratio = clampedX / usableWidth;
          let liveIdx = 0;
          if (ratio > 0.66) liveIdx = 2;
          else if (ratio > 0.33) liveIdx = 1;
          else liveIdx = 0;

          const liveVal = getValueFromIndex(liveIdx);
          if (liveVal !== valueRef.current) {
            onChangeRef.current(liveVal);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const usableWidth = Math.max(containerWidth - NODE_SIZE, 1);
          const rawX = startX.current + gestureState.dx;
          const clampedX = Math.min(Math.max(rawX, 0), usableWidth);
          const ratio = clampedX / usableWidth;

          let closestIdx = 0;
          if (ratio > 0.66) closestIdx = 2;
          else if (ratio > 0.33) closestIdx = 1;
          else closestIdx = 0;

          const finalVal = getValueFromIndex(closestIdx);
          onChangeRef.current(finalVal);

          const snapX = getSnapX(closestIdx, containerWidth);
          Animated.spring(panAnim, {
            toValue: snapX,
            useNativeDriver: false,
            friction: 8,
            tension: 60,
          }).start(() => {
            isDragging.current = false;
          });
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
        },
      }),
    [containerWidth]
  );

  const usableWidth = Math.max(containerWidth - NODE_SIZE, 0);
  const activeLineWidth = (getIndex(value) / 2) * usableWidth;

  return (
    <View style={sliderStyles.wrapper}>
      {/* Circle Containers Row for Low, Medium, High */}
      <View
        style={sliderStyles.trackArea}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {/* Background Connecting Line */}
        <View style={sliderStyles.lineBackground} />

        {/* Active Colored Progress Line */}
        <View
          style={[
            sliderStyles.lineActive,
            {
              backgroundColor: activeColor,
              width: activeLineWidth,
            },
          ]}
        />

        {/* Circle Container 1: LOW */}
        <TouchableOpacity
          style={sliderStyles.nodeTouchArea}
          onPress={() => onChange('low')}
          activeOpacity={0.8}
        >
          <View
            style={[
              sliderStyles.circleContainer,
              value === 'low'
                ? sliderStyles.circleLowActive
                : sliderStyles.circleInactive,
            ]}
          >
            <Ionicons
              name="leaf"
              size={22}
              color={value === 'low' ? '#FFFFFF' : '#10B981'}
            />
          </View>
          <Text
            style={[
              sliderStyles.nodeTitle,
              value === 'low' && { color: '#10B981', fontWeight: '800' },
            ]}
          >
            Low
          </Text>
          <Text style={sliderStyles.nodeSub}>Light</Text>
        </TouchableOpacity>

        {/* Circle Container 2: MEDIUM */}
        <TouchableOpacity
          style={sliderStyles.nodeTouchArea}
          onPress={() => onChange('medium')}
          activeOpacity={0.8}
        >
          <View
            style={[
              sliderStyles.circleContainer,
              value === 'medium'
                ? sliderStyles.circleMediumActive
                : sliderStyles.circleInactive,
            ]}
          >
            <Ionicons
              name="flame"
              size={22}
              color={value === 'medium' ? '#FFFFFF' : '#F97316'}
            />
          </View>
          <Text
            style={[
              sliderStyles.nodeTitle,
              value === 'medium' && { color: '#F97316', fontWeight: '800' },
            ]}
          >
            Medium
          </Text>
          <Text style={sliderStyles.nodeSub}>Moderate</Text>
        </TouchableOpacity>

        {/* Circle Container 3: HIGH */}
        <TouchableOpacity
          style={sliderStyles.nodeTouchArea}
          onPress={() => onChange('high')}
          activeOpacity={0.8}
        >
          <View
            style={[
              sliderStyles.circleContainer,
              value === 'high'
                ? sliderStyles.circleHighActive
                : sliderStyles.circleInactive,
            ]}
          >
            <Ionicons
              name="flash"
              size={22}
              color={value === 'high' ? '#FFFFFF' : '#EF4444'}
            />
          </View>
          <Text
            style={[
              sliderStyles.nodeTitle,
              value === 'high' && { color: '#EF4444', fontWeight: '800' },
            ]}
          >
            High
          </Text>
          <Text style={sliderStyles.nodeSub}>Max Effort</Text>
        </TouchableOpacity>

        {/* Sliding Drag Thumb Handle - Fully Smooth Draggable */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            sliderStyles.dragThumb,
            {
              backgroundColor: activeColor,
              transform: [{ translateX: panAnim }],
            },
          ]}
        >
          <Ionicons
            name={
              value === 'low' ? 'leaf' : value === 'medium' ? 'flame' : 'flash'
            }
            size={22}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    defaultTitle?: string;
    iconName?: string;
    iconColor?: string;
    iconBg?: string;
  }>();

  const workoutId = params.id || 'workout';
  const workoutTitle = params.title || params.defaultTitle || 'Workout';
  const workoutDesc =
    params.description || 'Log your workout session and estimated calories burned.';

  // State
  const [intensity, setIntensity] = useState<IntensityLevel>('medium');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customDurationInput, setCustomDurationInput] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // A preview only. The final personalized calculation happens on Continue once
  // the user's saved profile data has been loaded.
  const estimatedCalories = useMemo(() => {
    let baseRatePerMin = 7; // default rate

    if (workoutId === 'run') {
      // Cardio / Running
      if (intensity === 'low') baseRatePerMin = 7;
      else if (intensity === 'medium') baseRatePerMin = 11;
      else baseRatePerMin = 15;
    } else if (workoutId === 'weight_lifting') {
      // Weight Lifting / Gym
      if (intensity === 'low') baseRatePerMin = 4;
      else if (intensity === 'medium') baseRatePerMin = 7;
      else baseRatePerMin = 10;
    } else {
      // General
      if (intensity === 'low') baseRatePerMin = 5;
      else if (intensity === 'medium') baseRatePerMin = 8;
      else baseRatePerMin = 12;
    }

    return Math.round(baseRatePerMin * (durationMinutes || 0));
  }, [workoutId, intensity, durationMinutes]);

  // Handle Preset Duration Chip Press
  const handleSelectPresetDuration = (mins: number) => {
    setDurationMinutes(mins);
    setCustomDurationInput(String(mins));
  };

  // Handle Custom Duration Text Change
  const handleCustomDurationChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setCustomDurationInput(sanitized);
    const parsed = parseInt(sanitized, 10);
    setDurationMinutes(isNaN(parsed) ? 0 : parsed);
  };

  // Handle Submit / Log Entry
  const handleContinue = async () => {
    if (!durationMinutes || durationMinutes <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid workout duration in minutes.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to log your exercise.');
      return;
    }

    setIsSubmitting(true);
    try {
      const localProfile = await getUserOnboardingFromStorage(user.id);
      const profile = localProfile || (await getUserFromFirestore(user.id)).data || {};
      const estimate = calculateWorkoutCalories({
        workoutId,
        intensity,
        durationMinutes,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        birthdate: profile.birthdate,
      });
      router.push({
        pathname: '/workout-burn',
        params: {
          calories: String(estimate.activeCalories),
          title: workoutTitle,
          duration: String(durationMinutes),
          intensity,
          workoutId,
        },
      } as any);
    } catch (error: any) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', error.message || 'Failed to save workout. Please try again.');
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
        {/* Header Back Button */}
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
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Option Title & Description */}
          <Text style={styles.screenTitle}>{workoutTitle}</Text>
          <Text style={styles.subTitle}>{workoutDesc}</Text>

          {/* Workout Intensity Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="speedometer-outline" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Workout Intensity</Text>
            </View>

            {/* Draggable Circle Slider Component */}
            <DraggableCircleSlider value={intensity} onChange={setIntensity} />

            {/* Dynamic Intensity Callout */}
            <View
              style={[
                styles.intensityCallout,
                intensity === 'low' && {
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                },
                intensity === 'medium' && {
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  borderColor: 'rgba(249, 115, 22, 0.3)',
                },
                intensity === 'high' && {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Ionicons
                name={
                  intensity === 'low'
                    ? 'leaf'
                    : intensity === 'medium'
                      ? 'flame'
                      : 'flash'
                }
                size={18}
                color={
                  intensity === 'low'
                    ? '#10B981'
                    : intensity === 'medium'
                      ? '#F97316'
                      : '#EF4444'
                }
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.intensityCalloutText,
                  intensity === 'low' && { color: '#059669' },
                  intensity === 'medium' && { color: '#EA580C' },
                  intensity === 'high' && { color: '#DC2626' },
                ]}
              >
                {intensity === 'low' && 'Light pace • Easy conversation'}
                {intensity === 'medium' && 'Moderate pace • Steady sweat & breathing'}
                {intensity === 'high' && 'Vigorous pace • Maximum effort & heart rate'}
              </Text>
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Duration</Text>
            </View>

            {/* Default Duration Option Chips */}
            <View style={styles.chipsRow}>
              {DURATION_PRESETS.map((preset) => {
                const isSelected = durationMinutes === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleSelectPresetDuration(preset)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {preset} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Manual Duration Input */}
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputLabel}>Enter duration manually (mins)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={Colors.textMuted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={styles.textInput}
                  value={customDurationInput}
                  onChangeText={handleCustomDurationChange}
                  keyboardType="numeric"
                  placeholder="e.g. 45"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={4}
                />
                <Text style={styles.inputSuffix}>min</Text>
              </View>
            </View>
          </View>

          {/* Estimated Calories Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Estimated Burn</Text>
                <Text style={styles.summaryDetail}>
                  {durationMinutes} min • {intensity.toUpperCase()} intensity
                </Text>
              </View>
              <View style={styles.caloriePill}>
                <Ionicons name="flame" size={20} color="#F97316" />
                <Text style={styles.calorieValueText}>{estimatedCalories} kcal</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Pinned Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.continueBtnText}>
                  Continue ({estimatedCalories} kcal)
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Draggable Circle Slider Styles
const sliderStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
  },
  trackArea: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: 8,
  },
  lineBackground: {
    position: 'absolute',
    top: 24, // Center of 54px circle (27px) minus 3px (half of 6px line)
    left: 27, // Center of Low circle
    right: 27, // Center of High circle
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  lineActive: {
    position: 'absolute',
    top: 24,
    left: 27,
    height: 6,
    borderRadius: 3,
  },
  nodeTouchArea: {
    alignItems: 'center',
    zIndex: 2,
  },
  circleContainer: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  circleInactive: {
    backgroundColor: Colors.surface,
    borderColor: '#D1D5DB',
  },
  circleLowActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  circleMediumActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  circleHighActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  nodeSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dragThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  intensityCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  intensityCalloutText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  // Duration Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  manualInputContainer: {
    marginTop: 4,
  },
  manualInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  // Summary Card
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  caloriePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  calorieValueText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '800',
  },
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider || '#E5E7EB',
  },
  continueBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
