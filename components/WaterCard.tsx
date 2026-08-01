import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const FULL_GLASS = require('@/assets/images/full_glass.png');
const HALF_GLASS = require('@/assets/images/half_glass.png');
const EMPTY_GLASS = require('@/assets/images/empty_glass.png');

export interface WaterCardProps {
  waterGoalLiters?: number;       // e.g. 3.0L
  consumedWaterLiters?: number;   // e.g. 1.5L
  waterGoalMl?: number;
  consumedWaterMl?: number;
  isLoading?: boolean;
  onEditPress?: () => void;
  onLogWaterPress?: () => void;
}

export default function WaterCard({
  waterGoalLiters = 3.0,
  consumedWaterLiters = 0,
  waterGoalMl,
  consumedWaterMl,
  isLoading = false,
  onEditPress,
  onLogWaterPress,
}: WaterCardProps) {
  const consumedMl = consumedWaterMl !== undefined ? consumedWaterMl : Math.round(consumedWaterLiters * 1000);
  const goalMl = waterGoalMl !== undefined ? waterGoalMl : Math.round(waterGoalLiters * 1000);

  const goalLiters = goalMl / 1000;
  const consumedLiters = consumedMl / 1000;

  // Single row max 9 glasses
  const maxGlassesInRow = 9;
  const targetGlasses = Math.min(maxGlassesInRow, Math.max(1, Math.round(goalLiters * 3)));
  const glassVolumeLiters = goalLiters > 0 ? goalLiters / targetGlasses : 0.33;
  const consumedGlassesCount = glassVolumeLiters > 0 ? consumedLiters / glassVolumeLiters : 0;

  const remainingGlasses = Math.max(0, targetGlasses - Math.floor(consumedGlassesCount));
  const isGoalReached = consumedMl >= goalMl || remainingGlasses === 0;

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row: "Water" on left with subtitle stacked, green pencil icon on right */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.cardTitle}>Water</Text>
          <Text style={styles.cardSubTitle}>
            {consumedMl}ml / {goalMl}ml
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editIconBtn}
          onPress={onEditPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit water goal"
        >
          <Ionicons name="pencil" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Single Row Glasses Grid (Filled/Half glasses are large, Empty glasses are small) */}
      <View style={styles.gridWrapper}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading water intake...</Text>
          </View>
        ) : (
          <View style={styles.glassesGrid}>
            {Array.from({ length: targetGlasses }).map((_, index) => {
              const fullAmount = index + 1;
              const halfAmount = index + 0.5;

              let glassSource = EMPTY_GLASS;
              let isFilled = false;
              let glassState = 'empty';

              if (consumedGlassesCount >= fullAmount) {
                glassSource = FULL_GLASS;
                isFilled = true;
                glassState = 'full';
              } else if (consumedGlassesCount >= halfAmount) {
                glassSource = HALF_GLASS;
                isFilled = true;
                glassState = 'half';
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.glassItem}
                  onPress={onLogWaterPress}
                  activeOpacity={0.75}
                  accessibilityLabel={`Glass ${index + 1} ${glassState}`}
                >
                  <Image
                    source={glassSource}
                    style={isFilled ? styles.filledGlassImage : styles.emptyGlassImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom Center Info: Green "X glasses left" or "Goal Achieved!" */}
      <TouchableOpacity onPress={onLogWaterPress} activeOpacity={0.8} disabled={isGoalReached}>
        <Text style={styles.greenFooterText}>
          {isGoalReached
            ? 'Goal Achieved!'
            : `${remainingGlasses} glass${remainingGlasses === 1 ? '' : 'es'} left`}
        </Text>
      </TouchableOpacity>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleColumn: {
    flexDirection: 'column',
    gap: 2,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  cardSubTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
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
  gridWrapper: {
    marginBottom: 14,
  },
  loadingBox: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 52,
    paddingHorizontal: 4,
  },
  glassItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  filledGlassImage: {
    width: 32,
    height: 48,
  },
  emptyGlassImage: {
    width: 18,
    height: 28,
    marginBottom: 4,
  },
  greenFooterText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
});
