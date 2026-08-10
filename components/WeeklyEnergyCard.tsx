import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface WeekCaloriesData {
  day: string;
  consumed: number;
  burned: number;
}

export interface WeeklyEnergyCardProps {
  data: WeekCaloriesData[];
  isLoading?: boolean;
}

export const CONSUMED_COLOR = '#F97316';
export const BURNED_COLOR = '#10B981';
export const NET_COLOR = '#8B5CF6';

export default function WeeklyEnergyCard({
  data = [],
  isLoading = false,
}: WeeklyEnergyCardProps) {
  // Compute Weekly Totals
  const totalConsumed = data.reduce((acc, curr) => acc + (curr.consumed || 0), 0);
  const totalBurned = data.reduce((acc, curr) => acc + (curr.burned || 0), 0);
  const netEnergy = totalConsumed - totalBurned;

  // Maximum value for scaling the bar chart heights (minimum scale 1000 kcal for clean visuals)
  const maxCalorieValue = Math.max(
    1000,
    ...data.map((item) => Math.max(item.consumed || 0, item.burned || 0))
  );

  const chartHeight = 140;

  const formatShortValue = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return `${Math.round(val)}`;
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Weekly Energy</Text>
            <Text style={styles.cardSubtitle}>Current week performance</Text>
          </View>
        </View>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>7 Days</Text>
        </View>
      </View>

      {/* Energy Metrics Grid (Burned, Consumed, Net Energy) */}
      <View style={styles.metricsContainer}>
        {/* Burned Stat */}
        <View style={[styles.metricCard, { borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="flame" size={15} color={BURNED_COLOR} />
            <Text style={styles.metricLabel}>Burned</Text>
          </View>
          <Text style={[styles.metricValue, { color: BURNED_COLOR }]}>
            {totalBurned.toLocaleString()}
          </Text>
          <Text style={styles.metricUnit}>kcal</Text>
        </View>

        {/* Consumed Stat */}
        <View style={[styles.metricCard, { borderColor: 'rgba(249, 115, 22, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="restaurant" size={14} color={CONSUMED_COLOR} />
            <Text style={styles.metricLabel}>Consumed</Text>
          </View>
          <Text style={[styles.metricValue, { color: CONSUMED_COLOR }]}>
            {totalConsumed.toLocaleString()}
          </Text>
          <Text style={styles.metricUnit}>kcal</Text>
        </View>

        {/* Net Energy (Consumed - Burned) Stat */}
        <View style={[styles.metricCard, { borderColor: 'rgba(139, 92, 246, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="swap-vertical-outline" size={15} color={NET_COLOR} />
            <Text style={styles.metricLabel}>Net Balance</Text>
          </View>
          <Text style={[styles.metricValue, { color: NET_COLOR }]}>
            {netEnergy > 0 ? `+${netEnergy.toLocaleString()}` : netEnergy.toLocaleString()}
          </Text>
          <Text style={styles.metricUnit}>kcal</Text>
        </View>
      </View>

      {/* Bar Chart Section */}
      <View style={styles.chartWrapper}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading weekly chart...</Text>
          </View>
        ) : (
          <View style={styles.chartArea}>
            {/* Horizontal Grid lines */}
            <View style={styles.gridLinesContainer}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>

            {/* 7 Days Columns */}
            <View style={styles.barsContainer}>
              {data.map((item, index) => {
                const consumedHeight = Math.max(
                  4,
                  Math.round(((item.consumed || 0) / maxCalorieValue) * chartHeight)
                );
                const burnedHeight = Math.max(
                  4,
                  Math.round(((item.burned || 0) / maxCalorieValue) * chartHeight)
                );

                const hasConsumed = item.consumed > 0;
                const hasBurned = item.burned > 0;

                return (
                  <View key={index} style={styles.dayColumn}>
                    {/* Bars Pair Container */}
                    <View style={[styles.barsPair, { height: chartHeight }]}>
                      {/* Consumed Bar (Orange) */}
                      <View style={styles.singleBarWrapper}>
                        {hasConsumed && (
                          <Text style={styles.barValueText}>
                            {formatShortValue(item.consumed)}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            {
                              height: consumedHeight,
                              backgroundColor: CONSUMED_COLOR,
                              opacity: hasConsumed ? 1 : 0.25,
                            },
                          ]}
                        />
                      </View>

                      {/* Burned Bar (Green) */}
                      <View style={styles.singleBarWrapper}>
                        {hasBurned && (
                          <Text style={styles.barValueText}>
                            {formatShortValue(item.burned)}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            {
                              height: burnedHeight,
                              backgroundColor: BURNED_COLOR,
                              opacity: hasBurned ? 1 : 0.25,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Day Name Label */}
                    <Text style={styles.dayLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Legend at Bottom of Card */}
      <View style={styles.legendContainer}>
        {/* Consumed Calories Legend */}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CONSUMED_COLOR }]} />
          <Text style={styles.legendText}>Consumed Calories</Text>
        </View>

        {/* Burned Calories Legend */}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BURNED_COLOR }]} />
          <Text style={styles.legendText}>Burned Calories</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  badgePill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  badgePillText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricUnit: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  chartWrapper: {
    marginTop: 4,
    marginBottom: 14,
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  chartArea: {
    position: 'relative',
    paddingTop: 18,
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 24,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 165,
    paddingBottom: 22,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  singleBarWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    maxWidth: 16,
  },
  barValueText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
