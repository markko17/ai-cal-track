import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export interface RecentMealCardProps {
  title?: string;
  calories?: number;
  imageUrl?: string;
  type?: 'meal' | 'workout';
  time?: string;
  exerciseType?: string;
  intensity?: 'low' | 'medium' | 'high';
  durationMinutes?: number;
}

const intensityColors = {
  low: '#20B486',
  medium: '#F59E0B',
  high: '#EF4444',
};

export default function RecentMealCard({
  title = 'Breakfast Platter',
  calories = 653,
  imageUrl,
  type = 'meal',
  time,
  exerciseType,
  intensity,
  durationMinutes,
}: RecentMealCardProps) {
  const isWorkout = type === 'workout';
  const isWeightWorkout =
    exerciseType === 'weight_lifting' || /weight|lifting|gym|barbell/i.test(title);
  const isCardio = exerciseType === 'run' || /run|cardio|jog/i.test(title);
  const displayTitle = isWeightWorkout ? 'Weight Lifting' : isCardio ? 'Cardio' : title.replace(/\s*\([^)]*\)\s*$/, '');
  const workoutColor = isWeightWorkout ? '#18B8AC' : '#F2717F';
  const workoutBackground = isWeightWorkout ? '#E4F9F6' : '#FFE9EC';
  const workoutIcon = isWeightWorkout ? 'barbell-outline' : 'footsteps-outline';

  if (!isWorkout) {
    return (
      <View style={styles.mealCard}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.mealIcon} />
        ) : (
          <View style={styles.mealIcon}>
            <Ionicons name="restaurant" size={24} color={Colors.primary} />
          </View>
        )}
        <View style={styles.activityInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
          <View style={styles.calorieRow}>
            <Ionicons name="flame" size={14} color="#18A86B" />
            <Text style={styles.calorieText}>{calories} Calories</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.workoutCard}>
      <View style={[styles.workoutIconCircle, { backgroundColor: workoutBackground }]}>
        <Ionicons name={workoutIcon} size={27} color={workoutColor} />
      </View>

      <View style={styles.activityInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.activityTitle} numberOfLines={1}>{displayTitle}</Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>

        <View style={styles.calorieRow}>
          <Ionicons name="flame" size={15} color="#18A86B" />
          <Text style={styles.workoutCalories}>{calories} kcal</Text>
        </View>

        {intensity ? (
          <View style={styles.detailRow}>
            <Ionicons name="flash-outline" size={14} color={intensityColors[intensity]} />
            <Text style={styles.detailLabel}>Intensity:</Text>
            <Text style={styles.detailValue}>{intensity.charAt(0).toUpperCase()}{intensity.slice(1)}</Text>
          </View>
        ) : null}

        {durationMinutes ? (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color="#8A9099" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{durationMinutes} min</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const sharedCard = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#FFFFFF',
  borderRadius: 19,
  paddingVertical: 15,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: '#ECEEF1',
  marginBottom: 12,
  shadowColor: '#1F2937',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  workoutCard: sharedCard,
  mealCard: sharedCard,
  workoutIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  mealIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityInfo: { flex: 1, justifyContent: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  activityTitle: { flex: 1, color: '#24282E', fontSize: 15, fontWeight: '800' },
  time: { color: '#8A9099', fontSize: 11, fontWeight: '600' },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  calorieText: { color: '#18A86B', fontSize: 14, fontWeight: '800' },
  workoutCalories: { color: '#18A86B', fontSize: 16, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  detailLabel: { color: '#747B85', fontSize: 12, fontWeight: '600' },
  detailValue: { color: '#343942', fontSize: 12, fontWeight: '700' },
});
