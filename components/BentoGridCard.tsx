import Colors from '@/constants/colors';
import { AIBentoInsight, BentoInputData } from '@/services/geminiService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface BentoGridCardProps {
  telemetry: BentoInputData;
  aiInsight: AIBentoInsight | null;
  currentStreak?: number;
  isAILoading?: boolean;
  onRefreshAI?: () => void;
}

export default function BentoGridCard({
  telemetry,
  aiInsight,
  currentStreak = 3,
  isAILoading = false,
  onRefreshAI,
}: BentoGridCardProps) {
  const score = aiInsight?.recoveryScore ?? 45;
  const netCalories = (telemetry.consumedCalories || 0) - (telemetry.burnedCalories || 0);
  const targetCalories = telemetry.dailyCalorieGoal || 2450;
  const isUnderTarget = telemetry.consumedCalories < targetCalories;

  const defaultAssessment =
    "You've built great momentum in the latter half of the week with three consecutive active days. Focusing on hitting your calorie and protein targets more consistently will help you maximize your results and energy levels.";

  const defaultMomentumText =
    "You successfully maintained an active lifestyle for three days straight starting Thursday!";

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="sparkles" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>AI Progress Insights</Text>
        </View>

        {onRefreshAI && (
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={onRefreshAI}
            disabled={isAILoading}
            activeOpacity={0.7}
          >
            {isAILoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons name="refresh" size={16} color="#10B981" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Top Cards Row: AI Recommendation (Left) + Health Score (Right) */}
      <View style={styles.topRow}>
        {/* Left Card: Soft Lavender AI Recommendation */}
        <View style={styles.aiInsightCard}>
          {isAILoading && !aiInsight ? (
            <View style={styles.skeletonContainer}>
              <View style={[styles.skeletonLine, { width: '90%' }]} />
              <View style={[styles.skeletonLine, { width: '80%' }]} />
              <View style={[styles.skeletonLine, { width: '65%' }]} />
              <View style={styles.skeletonPill} />
            </View>
          ) : (
            <>
              <Text style={styles.aiText}>
                {aiInsight?.aiAssessment || defaultAssessment}
              </Text>

              <View style={styles.aiBadgePill}>
                <Ionicons name="flash" size={12} color="#16A34A" />
                <Text style={styles.aiBadgeText}>
                  {isAILoading ? 'UPDATING...' : 'AI ANALYSIS'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Right Card: Soft Mint Green Health Score */}
        <View style={styles.healthScoreCard}>
          <Ionicons name="heart" size={26} color="#16A34A" />
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreLabel}>Health Score</Text>
        </View>
      </View>

      {/* Middle Row: 3 Status Pill Badges */}
      <View style={styles.pillsRow}>
        {/* Pill 1: Active Streak */}
        <View style={styles.pillBlue}>
          <Ionicons name="pulse" size={14} color="#0284C7" />
          <Text style={styles.pillBlueText}>
            {currentStreak > 0 ? `${currentStreak}d Streak` : 'Active Streak'}
          </Text>
        </View>

        {/* Pill 2: Hydration Focus */}
        <View style={styles.pillCyan}>
          <Ionicons name="water" size={14} color="#0284C7" />
          <Text style={styles.pillCyanText}>Hydration Focus</Text>
        </View>

        {/* Pill 3: Energy Gap / Status */}
        <View style={styles.pillOrange}>
          <Ionicons name="trending-down" size={14} color="#D97706" />
          <Text style={styles.pillOrangeText}>
            {netCalories < 0 ? 'Energy Gap' : 'Target Status'}
          </Text>
        </View>
      </View>

      {/* Bottom Card: Mid-Week Momentum / Highlight */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.activityTitle}>Mid-Week Momentum</Text>
        </View>
        <Text style={styles.activityBody}>
          {aiInsight?.actionableTip || defaultMomentumText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginBottom: 12,
  },
  aiInsightCard: {
    flex: 1.35,
    backgroundColor: '#F4F0FD',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    minHeight: 165,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  aiText: {
    color: '#4C1D95',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  healthScoreCard: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    minHeight: 165,
  },
  scoreNumber: {
    color: '#15803D',
    fontSize: 42,
    fontWeight: '800',
    marginVertical: 4,
  },
  scoreLabel: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  pillBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  pillBlueText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  pillCyan: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  pillCyanText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  pillOrange: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  pillOrangeText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trophyEmoji: {
    fontSize: 18,
  },
  activityTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  activityBody: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#DDD6FE',
    borderRadius: 6,
    marginBottom: 8,
    opacity: 0.6,
  },
  skeletonPill: {
    width: 90,
    height: 24,
    backgroundColor: '#DDD6FE',
    borderRadius: 12,
    opacity: 0.8,
    marginTop: 8,
  },
});
