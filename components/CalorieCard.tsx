import { SegmentedHalfCircleProgress30 } from '@/components/HalfProgress';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export interface CalorieCardProps {
  dailyCalorieGoal?: number;
  consumedCalories?: number;
  burnedCalories?: number;
  carbsGoal?: number;
  proteinGoal?: number;
  fatGoal?: number;
  consumedCarbs?: number;
  consumedProtein?: number;
  consumedFat?: number;
  isLoading?: boolean;
  onEditPress?: () => void;
}

export default function CalorieCard({
  dailyCalorieGoal = 2000,
  consumedCalories = 0,
  burnedCalories = 0,
  carbsGoal = 25,
  proteinGoal = 35,
  fatGoal = 15,
  consumedCarbs = 0,
  consumedProtein = 0,
  consumedFat = 0,
  isLoading = false,
  onEditPress,
}: CalorieCardProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Net target available = Goal - Consumed + Burned
  const netRemainingRaw = dailyCalorieGoal - consumedCalories + burnedCalories;
  const isOverGoal = netRemainingRaw < 0;
  const remainingCalories = Math.max(0, netRemainingRaw);

  // Consumed ratio for progress ring (0 -> 1)
  const progressRatio = dailyCalorieGoal > 0
    ? Math.min(1, Math.max(1 / 15, consumedCalories / dailyCalorieGoal))
    : 0;

  const progressPct = dailyCalorieGoal > 0
    ? Math.min(100, Math.round((consumedCalories / dailyCalorieGoal) * 100))
    : 0;

  const formatMacroVal = (goal: number, consumed: number): { remainingStr: string; pct: number } => {
    const remaining = Math.max(0, goal - consumed);
    const remainingStr = String(parseFloat(remaining.toFixed(1)));
    const pct = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
    return { remainingStr, pct };
  };

  const carbsData = formatMacroVal(carbsGoal, consumedCarbs);
  const proteinData = formatMacroVal(proteinGoal, consumedProtein);
  const fatData = formatMacroVal(fatGoal, consumedFat);

  const containerPadding = 40;
  const cardPadding = 40;
  const availableWidth = windowWidth - containerPadding - cardPadding;
  const arcSize = Math.min(Math.max(availableWidth, 260), 320);

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadgeGroup}>
          <Text style={styles.cardTitle}>Calories</Text>
          <View style={styles.progressPill}>
            <Ionicons name="pie-chart-outline" size={13} color="#10B981" />
            <Text style={styles.progressPillText}>{progressPct}% Consumed</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editIconBtn}
          onPress={onEditPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit calorie target"
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Calorie Equation Stats Bar */}
      <View style={styles.equationBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Goal</Text>
          <Text style={styles.statValueGoal}>{dailyCalorieGoal}</Text>
        </View>

        <Text style={styles.operatorText}>-</Text>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Food</Text>
          <Text style={styles.statValueFood}>{consumedCalories}</Text>
        </View>

        <Text style={styles.operatorText}>+</Text>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Burned</Text>
          <Text style={styles.statValueBurned}>{burnedCalories}</Text>
        </View>

        <Text style={styles.operatorText}>=</Text>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{isOverGoal ? 'Over' : 'Left'}</Text>
          <Text style={[styles.statValueLeft, isOverGoal && styles.statValueOver]}>
            {isOverGoal ? Math.abs(netRemainingRaw) : remainingCalories}
          </Text>
        </View>
      </View>

      {/* Center Segmented Arc Progress Bar */}
      <View style={styles.progressWrapper}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading target...</Text>
          </View>
        ) : (
          <SegmentedHalfCircleProgress30
            progress={progressRatio}
            size={arcSize}
            strokeWidth={46}
            segments={15}
            gapAngle={4}
            value={isOverGoal ? `-${Math.abs(netRemainingRaw)}` : remainingCalories}
            label={isOverGoal ? 'Cal Over Goal' : 'Remaining'}
            showFlame={true}
            activeColor={isOverGoal ? '#EF4444' : '#111827'}
            inactiveColor="#E5E7EB"
          />
        )}
      </View>

      {/* Overall Progress Bar Indicator */}
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPct}%` },
              isOverGoal && { backgroundColor: '#EF4444' },
            ]}
          />
        </View>
        <Text style={styles.progressBarLabel}>
          {consumedCalories} of {dailyCalorieGoal} kcal eaten
        </Text>
      </View>

      {/* 3 Macronutrient Grid Section */}
      <View style={styles.macroSectionContainer}>
        {/* Carbs Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.14)' }]}>
            <Ionicons name="cafe-outline" size={20} color="#F97316" />
          </View>
          <Text style={styles.macroValue}>{carbsData.remainingStr}g</Text>
          <Text style={styles.macroLabel}>Carbs left</Text>
          {/* Mini macro progress bar */}
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${carbsData.pct}%`, backgroundColor: '#F97316' }]} />
          </View>
        </View>

        {/* Protein Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.14)' }]}>
            <Ionicons name="flame-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.macroValue}>{proteinData.remainingStr}g</Text>
          <Text style={styles.macroLabel}>Protein left</Text>
          {/* Mini macro progress bar */}
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${proteinData.pct}%`, backgroundColor: '#3B82F6' }]} />
          </View>
        </View>

        {/* Fats Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
            <Ionicons name="accessibility-outline" size={20} color="#10B981" />
          </View>
          <Text style={styles.macroValue}>{fatData.remainingStr}g</Text>
          <Text style={styles.macroLabel}>Fats left</Text>
          {/* Mini macro progress bar */}
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${fatData.pct}%`, backgroundColor: '#10B981' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  progressPillText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValueGoal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statValueFood: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316',
  },
  statValueBurned: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  statValueLeft: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  statValueOver: {
    color: '#EF4444',
  },
  operatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  progressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  loadingBox: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  progressBarWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 4,
  },
  progressBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  macroSectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  macroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  macroLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  miniProgressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
