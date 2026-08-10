import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface WeekMacroData {
  day: string;
  proteinCal: number;
  carbsCal: number;
  fatCal: number;
}

export interface WeeklyMacroBalanceCardProps {
  data?: WeekMacroData[];
  isLoading?: boolean;
}

export const PROTEIN_COLOR = '#2563EB'; // Vibrant Blue
export const CARBS_COLOR = '#F59E0B';   // Warm Amber/Yellow
export const FAT_COLOR = '#EF4444';     // Bright Red

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyMacroBalanceCard({
  data = [],
  isLoading = false,
}: WeeklyMacroBalanceCardProps) {
  // Normalize 7-day data
  const normalizedData: WeekMacroData[] = DEFAULT_DAYS.map((dayName) => {
    const found = data.find((d) => d.day === dayName);
    return (
      found || {
        day: dayName,
        proteinCal: 0,
        carbsCal: 0,
        fatCal: 0,
      }
    );
  });

  // Determine max value for Y-axis scale (default to 1805 to match reference image)
  const maxDayTotal = Math.max(
    0,
    ...normalizedData.map((d) => (d.proteinCal || 0) + (d.carbsCal || 0) + (d.fatCal || 0))
  );

  const maxY = maxDayTotal > 0 ? Math.max(1805, maxDayTotal) : 1805;
  const chartHeight = 150;

  // Y-axis tick values (5 ticks from maxY down to 0)
  const step = maxY / 4;
  const yTicks = [
    (step * 4).toFixed(2),
    (step * 3).toFixed(2),
    (step * 2).toFixed(2),
    (step * 1).toFixed(2),
    '0.00',
  ];

  return (
    <View style={styles.cardContainer}>
      {/* Title */}
      <Text style={styles.cardTitle}>Weekly Macro Balance</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Loading macro chart...</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          {/* Main Chart Area */}
          <View style={styles.chartMainRow}>
            {/* Y-Axis Labels Column */}
            <View style={[styles.yAxisColumn, { height: chartHeight }]}>
              {yTicks.map((tickVal, index) => (
                <Text key={index} style={styles.yAxisText}>
                  {tickVal}
                </Text>
              ))}
            </View>

            {/* Grid & Bars Container */}
            <View style={styles.gridAndBarsContainer}>
              {/* Horizontal Grid lines */}
              <View style={[styles.gridLinesContainer, { height: chartHeight }]}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              {/* 7 Columns */}
              <View style={[styles.barsRow, { height: chartHeight }]}>
                {normalizedData.map((item, index) => {
                  const pCal = Math.max(0, item.proteinCal || 0);
                  const cCal = Math.max(0, item.carbsCal || 0);
                  const fCal = Math.max(0, item.fatCal || 0);
                  const dayTotal = pCal + cCal + fCal;

                  // Compute segment heights in pixels
                  const pHeight = dayTotal > 0 ? (pCal / maxY) * chartHeight : 0;
                  const cHeight = dayTotal > 0 ? (cCal / maxY) * chartHeight : 0;
                  const fHeight = dayTotal > 0 ? (fCal / maxY) * chartHeight : 0;

                  return (
                    <View key={index} style={styles.dayCol}>
                      {/* Stacked Bar Container */}
                      <View style={styles.stackedBarContainer}>
                        {dayTotal > 0 && (
                          <View style={styles.stackedBarInner}>
                            {/* Fat (Top) */}
                            {fHeight > 0 && (
                              <View
                                style={[
                                  styles.barSegment,
                                  {
                                    height: fHeight,
                                    backgroundColor: FAT_COLOR,
                                    borderTopLeftRadius: 3,
                                    borderTopRightRadius: 3,
                                  },
                                ]}
                              />
                            )}

                            {/* Carbs (Middle) */}
                            {cHeight > 0 && (
                              <View
                                style={[
                                  styles.barSegment,
                                  {
                                    height: cHeight,
                                    backgroundColor: CARBS_COLOR,
                                    borderTopLeftRadius: fHeight === 0 ? 3 : 0,
                                    borderTopRightRadius: fHeight === 0 ? 3 : 0,
                                  },
                                ]}
                              />
                            )}

                            {/* Protein (Bottom) */}
                            {pHeight > 0 && (
                              <View
                                style={[
                                  styles.barSegment,
                                  {
                                    height: pHeight,
                                    backgroundColor: PROTEIN_COLOR,
                                    borderTopLeftRadius: fHeight === 0 && cHeight === 0 ? 3 : 0,
                                    borderTopRightRadius: fHeight === 0 && cHeight === 0 ? 3 : 0,
                                  },
                                ]}
                              />
                            )}
                          </View>
                        )}
                      </View>

                      {/* Day Label */}
                      <Text style={styles.dayLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Legend Row */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PROTEIN_COLOR }]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CARBS_COLOR }]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: FAT_COLOR }]} />
              <Text style={styles.legendText}>Fat</Text>
            </View>
          </View>

          {/* Subtitle / Footnote */}
          <Text style={styles.captionText}>Stacked by Calorie contribution (cal)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  chartWrapper: {
    width: '100%',
  },
  chartMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisColumn: {
    width: 52,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: 6,
  },
  yAxisText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },
  gridAndBarsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  stackedBarContainer: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  stackedBarInner: {
    width: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  barSegment: {
    width: '100%',
  },
  dayLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 22,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  captionText: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
  },
});
