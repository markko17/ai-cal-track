import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export interface WeekWaterData {
  day: string;
  liters: number;
}

export interface WeeklyWaterCardProps {
  data: WeekWaterData[];
  waterGoalLiters?: number;
  isLoading?: boolean;
}

const WATER_CYAN = '#06B6D4';
const WATER_BLUE = '#0284C7';

export default function WeeklyWaterCard({
  data = [],
  waterGoalLiters = 2.5,
  isLoading = false,
}: WeeklyWaterCardProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Calculate summary stats
  const totalWater = data.reduce((acc, curr) => acc + (curr.liters || 0), 0);
  const avgWater = data.length > 0 ? totalWater / data.length : 0;
  const maxWater = Math.max(0, ...data.map((d) => d.liters || 0));

  const chartWidth = Math.max(260, windowWidth - 72);

  // Prepare chart dataset
  const labels = data.map((d) => d.day);
  const waterValues = data.map((d) => d.liters || 0);

  const chartData = {
    labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: waterValues.length > 0 ? waterValues : [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: Colors.card,
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: WATER_BLUE,
      fill: WATER_CYAN,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4 4',
      stroke: '#E2E8F0',
    },
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="water" size={18} color={WATER_BLUE} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Water Consumption</Text>
            <Text style={styles.cardSubtitle}>Weekly hydration log</Text>
          </View>
        </View>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Bezier Chart</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsContainer}>
        {/* Total Water */}
        <View style={[styles.metricCard, { borderColor: 'rgba(6, 182, 212, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="water-outline" size={14} color={WATER_BLUE} />
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <Text style={[styles.metricValue, { color: WATER_BLUE }]}>
            {totalWater.toFixed(1)}
          </Text>
          <Text style={styles.metricUnit}>Liters</Text>
        </View>

        {/* Daily Average */}
        <View style={[styles.metricCard, { borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="analytics-outline" size={14} color="#3B82F6" />
            <Text style={styles.metricLabel}>Daily Avg</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
            {avgWater.toFixed(1)}
          </Text>
          <Text style={styles.metricUnit}>L/day</Text>
        </View>

        {/* Peak Day */}
        <View style={[styles.metricCard, { borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="trophy-outline" size={14} color="#10B981" />
            <Text style={styles.metricLabel}>Peak</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            {maxWater.toFixed(1)}
          </Text>
          <Text style={styles.metricUnit}>Liters</Text>
        </View>
      </View>

      {/* react-native-chart-kit LineChart with bezier prop */}
      <View style={styles.chartWrapper}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={WATER_BLUE} />
            <Text style={styles.loadingText}>Loading water analytics...</Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={180}
            yAxisSuffix="L"
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
          />
        )}
      </View>

      {/* Bottom Indicator */}
      <View style={styles.bottomInfoRow}>
        <Ionicons name="sparkles-outline" size={14} color={WATER_BLUE} />
        <Text style={styles.bottomInfoText}>
          Goal: {waterGoalLiters}L/day • Weekly target {(waterGoalLiters * 7).toFixed(1)}L
        </Text>
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
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
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
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  badgePillText: {
    color: WATER_BLUE,
    fontSize: 11,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  chartStyle: {
    borderRadius: 16,
    marginVertical: 4,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  bottomInfoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
