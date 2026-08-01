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
  isLoading?: boolean;
  onEditPress?: () => void;
  onLogWaterPress?: () => void;
}

export default function WaterCard({
  waterGoalLiters = 3.0,
  consumedWaterLiters = 0,
  isLoading = false,
  onEditPress,
  onLogWaterPress,
}: WaterCardProps) {
  // Single row max 9 glasses
  const maxGlassesInRow = 9;
  const targetGlasses = Math.min(maxGlassesInRow, Math.max(1, Math.round(waterGoalLiters * 3)));
  const glassVolumeLiters = waterGoalLiters > 0 ? waterGoalLiters / targetGlasses : 0.33;
  const consumedGlassesCount = glassVolumeLiters > 0 ? consumedWaterLiters / glassVolumeLiters : 0;

  const remainingLiters = Math.max(0, waterGoalLiters - consumedWaterLiters);
  const remainingGlasses = Math.max(0, targetGlasses - Math.floor(consumedGlassesCount));

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row: "Water" on left, Edit icon on right */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Water</Text>
          <Text style={styles.cardSubTitle}>
            {consumedWaterLiters.toFixed(1)} / {waterGoalLiters.toFixed(1)} L
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editIconBtn}
          onPress={onEditPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit water goal"
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Single Row Glasses Grid (Max 9 glasses in 1 row) */}
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
              let glassState = 'empty';

              if (consumedGlassesCount >= fullAmount) {
                glassSource = FULL_GLASS;
                glassState = 'full';
              } else if (consumedGlassesCount >= halfAmount) {
                glassSource = HALF_GLASS;
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
                  <Image source={glassSource} style={styles.glassImage} resizeMode="contain" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom Footer Inside Card: Water Left Info */}
      <View style={styles.footerRow}>
        <View style={styles.waterInfoBadge}>
          <Ionicons name="water" size={16} color="#38BDF8" />
          <Text style={styles.footerText}>
            {remainingGlasses === 0
              ? 'Goal Achieved! Stay hydrated 🎉'
              : `${remainingGlasses} glass${remainingGlasses === 1 ? '' : 'es'} (${remainingLiters.toFixed(1)}L) left`}
          </Text>
        </View>

        {onLogWaterPress && (
          <TouchableOpacity style={styles.quickAddBtn} onPress={onLogWaterPress} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color="#38BDF8" />
            <Text style={styles.quickAddText}>+1 Glass</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 16,
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
    alignItems: 'center',
  },
  glassItem: {
    flex: 1,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassImage: {
    width: 28,
    height: 38,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  waterInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  quickAddText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
