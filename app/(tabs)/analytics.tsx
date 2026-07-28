import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WEEK_DAYS = [
  { day: 'Mon', calories: 1950, target: 2000, percentage: 0.95 },
  { day: 'Tue', calories: 2050, target: 2000, percentage: 1.0 },
  { day: 'Wed', calories: 1880, target: 2000, percentage: 0.9 },
  { day: 'Thu', calories: 1990, target: 2000, percentage: 0.98 },
  { day: 'Fri', calories: 2100, target: 2000, percentage: 1.0 },
  { day: 'Sat', calories: 1920, target: 2000, percentage: 0.92 },
  { day: 'Sun', calories: 0, target: 2000, percentage: 0.0, isToday: true },
];

export default function AnalyticsTabScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics & Insights</Text>
          <Text style={styles.subTitle}>Track your weekly consistency and macronutrient compliance</Text>
        </View>

        {/* Weekly Calorie Intake Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Weekly Calorie Compliance</Text>
              <Text style={styles.cardSub}>Average: 1,981 kcal / day</Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>96% Adherence</Text>
            </View>
          </View>

          {/* Bar Visualizer */}
          <View style={styles.barChartContainer}>
            {WEEK_DAYS.map((item, i) => {
              const barHeightPercent = Math.min(item.percentage * 100, 100);
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${barHeightPercent || 4}%` },
                        item.isToday && styles.barFillToday,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, item.isToday && styles.barLabelToday]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Macro Distribution Overview */}
        <View style={styles.macroRatioCard}>
          <Text style={styles.cardTitle}>Macro Distribution Ratio</Text>
          <Text style={styles.cardSub}>Recommended ratio for your fitness goal</Text>

          {/* Combined Progress Line */}
          <View style={styles.multiBarTrack}>
            <View style={[styles.multiBarChunk, { flex: 35, backgroundColor: Colors.primary }]} />
            <View style={[styles.multiBarChunk, { flex: 40, backgroundColor: '#3B82F6' }]} />
            <View style={[styles.multiBarChunk, { flex: 25, backgroundColor: '#F59E0B' }]} />
          </View>

          <View style={styles.macroLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Protein (35%)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Carbs (40%)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Fat (25%)</Text>
            </View>
          </View>
        </View>

        {/* Weekly Hydration & Streak Metric */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <View style={[styles.metricIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="water" size={20} color="#38BDF8" />
            </View>
            <Text style={styles.metricValue}>2.8 L</Text>
            <Text style={styles.metricLabel}>Daily Water Avg</Text>
          </View>

          <View style={styles.metricBox}>
            <View style={[styles.metricIconBg, { backgroundColor: Colors.primaryGlow }]}>
              <Ionicons name="flame" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>6 Days</Text>
            <Text style={styles.metricLabel}>Active Logging Streak</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  targetBadge: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetBadgeText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: Colors.primaryLight,
  },
  barLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  barLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  macroRatioCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  multiBarTrack: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    marginVertical: 16,
  },
  multiBarChunk: {
    height: '100%',
  },
  macroLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
