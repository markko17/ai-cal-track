import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export interface RecentMealCardProps {
  title?: string;
  calories?: number;
  servingSize?: string;
  foodIcon?: string;
  imageUrl?: string;
  type?: 'meal' | 'workout';
  time?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  exerciseType?: string;
  intensity?: 'low' | 'medium' | 'high';
  durationMinutes?: number;
}

const intensityColors = {
  low: '#20B486',
  medium: '#F59E0B',
  high: '#EF4444',
};

// Intelligently determine food icon & styling based on food title / keywords
const getFoodIconConfig = (title: string) => {
  const t = title.toLowerCase();

  if (/apple|fruit|banana|berry|strawberry|grape|orange|mango|peach/i.test(t)) {
    return { name: 'nutrition-outline' as const, bg: '#EAF8F2', color: '#10B981' };
  }
  if (/salad|veggie|vegetable|avocado|spinach|kale|green/i.test(t)) {
    return { name: 'leaf-outline' as const, bg: '#ECFDF5', color: '#059669' };
  }
  if (/coffee|latte|espresso|tea|drink|juice|beverage|milk|smoothie|shake/i.test(t)) {
    return { name: 'cafe-outline' as const, bg: '#FFFBEB', color: '#D97706' };
  }
  if (/pizza|burger|taco|fries|sandwich|fast food/i.test(t)) {
    return { name: 'pizza-outline' as const, bg: '#FFF7ED', color: '#F97316' };
  }
  if (/chicken|steak|meat|beef|pork|turkey|bacon|sausage|ham/i.test(t)) {
    return { name: 'restaurant-outline' as const, bg: '#FEF2F2', color: '#EF4444' };
  }
  if (/fish|salmon|tuna|seafood|shrimp/i.test(t)) {
    return { name: 'fish-outline' as const, bg: '#E0F2FE', color: '#0284C7' };
  }
  if (/egg|omelet|toast|bread|cereal|oatmeal|rice|pasta|pancake|waffle|bagel/i.test(t)) {
    return { name: 'egg-outline' as const, bg: '#FEFCE8', color: '#EAB308' };
  }
  if (/cake|ice cream|cookie|chocolate|dessert|donut|candy|sweet/i.test(t)) {
    return { name: 'ice-cream-outline' as const, bg: '#FDF2F8', color: '#EC4899' };
  }

  return { name: 'restaurant-outline' as const, bg: '#EFF6FF', color: '#3B82F6' };
};

export default function RecentMealCard({
  title = 'Meal',
  calories = 0,
  servingSize,
  foodIcon,
  imageUrl,
  type = 'meal',
  time,
  protein,
  carbs,
  fat,
  exerciseType,
  intensity,
  durationMinutes,
}: RecentMealCardProps) {
  const isWorkout = type === 'workout';

  // Parse title and serving size if title contains embedded parentheses (e.g. "Chicken Salad (1 serving)")
  let cleanTitle = title.trim();
  let extractedServing = servingSize;

  const parenMatch = cleanTitle.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    cleanTitle = parenMatch[1].trim();
    if (!extractedServing) {
      extractedServing = parenMatch[2].trim();
    }
  }

  const finalServingSize = extractedServing || '1 serving';

  if (!isWorkout) {
    const iconConfig = getFoodIconConfig(cleanTitle);
    const hasMacros = (protein !== undefined && protein > 0) ||
      (carbs !== undefined && carbs > 0) ||
      (fat !== undefined && fat > 0);

    return (
      <View style={styles.cardContainer}>
        {/* Food Icon / Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.foodImage} />
        ) : (
          <View style={[styles.foodIconCircle, { backgroundColor: iconConfig.bg }]}>
            <Ionicons
              name={(foodIcon as any) || iconConfig.name}
              size={24}
              color={iconConfig.color}
            />
          </View>
        )}

        {/* Content Info */}
        <View style={styles.activityInfo}>
          {/* Header Row: Food Name & Time */}
          <View style={styles.titleRow}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {cleanTitle}
            </Text>
            {time ? <Text style={styles.timeText}>{time}</Text> : null}
          </View>

          {/* Badges Row: Calories & Serving Size */}
          <View style={styles.badgesRow}>
            {/* Calories Pill */}
            <View style={styles.calorieBadge}>
              <Ionicons name="flame" size={13} color="#10B981" />
              <Text style={styles.calorieBadgeText}>{calories} kcal</Text>
            </View>

            {/* Serving Size Pill */}
            <View style={styles.servingBadge}>
              <Ionicons name="cube-outline" size={12} color="#6B7280" />
              <Text style={styles.servingBadgeText} numberOfLines={1}>
                {finalServingSize}
              </Text>
            </View>
          </View>

          {/* Macros Row (if macro information is available) */}
          {hasMacros ? (
            <View style={styles.macrosRow}>
              {protein ? <Text style={styles.macroText}>P: {Math.round(protein)}g</Text> : null}
              {carbs ? <Text style={styles.macroText}>C: {Math.round(carbs)}g</Text> : null}
              {fat ? <Text style={styles.macroText}>F: {Math.round(fat)}g</Text> : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Workout Card rendering
  const isWeightWorkout =
    exerciseType === 'weight_lifting' || /weight|lifting|gym|barbell/i.test(title);
  const isCardio = exerciseType === 'run' || /run|cardio|jog/i.test(title);
  const displayWorkoutTitle = isWeightWorkout
    ? 'Weight Lifting'
    : isCardio
      ? 'Cardio'
      : cleanTitle;
  const workoutColor = isWeightWorkout ? '#18B8AC' : '#F2717F';
  const workoutBackground = isWeightWorkout ? '#E4F9F6' : '#FFE9EC';
  const workoutIcon = isWeightWorkout ? 'barbell-outline' : 'footsteps-outline';

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.workoutIconCircle, { backgroundColor: workoutBackground }]}>
        <Ionicons name={workoutIcon} size={25} color={workoutColor} />
      </View>

      <View style={styles.activityInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {displayWorkoutTitle}
          </Text>
          {time ? <Text style={styles.timeText}>{time}</Text> : null}
        </View>

        <View style={styles.badgesRow}>
          <View style={[styles.calorieBadge, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="flame" size={13} color="#F97316" />
            <Text style={[styles.calorieBadgeText, { color: '#F97316' }]}>
              {calories} kcal
            </Text>
          </View>
        </View>

        {intensity || durationMinutes ? (
          <View style={styles.workoutMetaRow}>
            {intensity ? (
              <View style={styles.detailRow}>
                <Ionicons name="flash-outline" size={12} color={intensityColors[intensity]} />
                <Text style={styles.detailValue}>
                  {intensity.charAt(0).toUpperCase()}{intensity.slice(1)}
                </Text>
              </View>
            ) : null}

            {durationMinutes ? (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={12} color="#8A9099" />
                <Text style={styles.detailValue}>{durationMinutes} min</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EEF0F4',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  foodIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
  },
  workoutIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  activityTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  calorieBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 160,
  },
  servingBadgeText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  macroText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  workoutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailValue: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
});
