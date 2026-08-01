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

  const remainingCalories = Math.max(0, dailyCalorieGoal - consumedCalories + burnedCalories);
  const progressRatio = dailyCalorieGoal > 0 ? Math.min(1, Math.max(0, (consumedCalories - burnedCalories) / dailyCalorieGoal)) : 0;

  const remainingCarbs = Math.max(0, carbsGoal - consumedCarbs);
  const remainingProtein = Math.max(0, proteinGoal - consumedProtein);
  const remainingFat = Math.max(0, fatGoal - consumedFat);

  const containerPadding = 40;
  const cardPadding = 40;
  const availableWidth = windowWidth - containerPadding - cardPadding;
  const arcSize = Math.min(Math.max(availableWidth, 260), 320);

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row: "Calories" on left, Edit icon on right */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Calories</Text>

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
            strokeWidth={50}
            segments={15}
            gapAngle={24}
            value={remainingCalories}
            label="Remaining"
            showFlame={true}
            activeColor="#111827"
            inactiveColor="#E5E7EB"
          />
        )}
      </View>

      {/* 3 Macronutrient Grid Section */}
      <View style={styles.macroSectionContainer}>
        {/* Carbs Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.16)' }]}>
            <Ionicons name="cafe-outline" size={24} color="#F97316" />
          </View>
          <Text style={styles.macroValue}>{remainingCarbs}g</Text>
          <Text style={styles.macroLabel}>Carbs left</Text>
        </View>

        {/* Protein Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.16)' }]}>
            <Ionicons name="flame-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.macroValue}>{remainingProtein}g</Text>
          <Text style={styles.macroLabel}>Protein left</Text>
        </View>

        {/* Fats Card */}
        <View style={styles.macroCard}>
          <View style={[styles.macroIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
            <Ionicons name="accessibility-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.macroValue}>{remainingFat}g</Text>
          <Text style={styles.macroLabel}>Fats left</Text>
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
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
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
  progressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
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
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  macroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  macroValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
});
