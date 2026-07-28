import Colors from '@/constants/colors';
import { getUserFromFirestore, getUserOnboardingFromStorage } from '@/services/userService';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeTabScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [userPlanData, setUserPlanData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      if (!user?.id) return;
      try {
        const localData = await getUserOnboardingFromStorage(user.id);
        if (localData && isMounted) {
          setUserPlanData(localData);
          return;
        }
        const dbResult = await getUserFromFirestore(user.id);
        if (dbResult.exists && dbResult.data && isMounted) {
          setUserPlanData(dbResult.data);
        }
      } catch (err) {
        console.error('Error loading home tab data:', err);
      }
    }
    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'User';
  const userFullName = user?.fullName || user?.firstName || 'Fitness Enthusiast';
  const userAvatar = user?.imageUrl;

  const dailyCalorieGoal = userPlanData?.dailyCalorieGoal || 2000;
  const proteinGoal = userPlanData?.macroGoals?.protein || 150;
  const carbsGoal = userPlanData?.macroGoals?.carbs || 200;
  const fatGoal = userPlanData?.macroGoals?.fat || 65;
  const waterLiters = userPlanData?.waterGoal?.liters || 3.0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.topBar}>
          <View style={styles.userInfoRow}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
            )}
            <View style={styles.userTextCol}>
              <Text style={styles.welcomeText}>Welcome back 👋</Text>
              <Text style={styles.userName}>{userFullName}</Text>
            </View>
          </View>

          <View style={styles.headerRightBadge}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={styles.headerRightBadgeText}>Pro Plan</Text>
          </View>
        </View>

        {/* Hero Daily Calorie Budget Card */}
        <View style={styles.heroCalorieCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>Daily Calorie Budget</Text>
              <Text style={styles.heroSub}>Target calculated by Gemini AI</Text>
            </View>
            <View style={styles.aiPill}>
              <Ionicons name="flame" size={14} color={Colors.primary} />
              <Text style={styles.aiPillText}>{userPlanData?.goal || 'Maintain'}</Text>
            </View>
          </View>

          <View style={styles.calorieNumberRow}>
            <Text style={styles.calorieVal}>{dailyCalorieGoal.toLocaleString()}</Text>
            <Text style={styles.calorieUnit}>kcal / day</Text>
          </View>

          {/* Calorie Stats Breakdown */}
          <View style={styles.calorieStatRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Consumed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>{dailyCalorieGoal}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Burned</Text>
            </View>
          </View>
        </View>

        {/* Daily Macros Targets */}
        <Text style={styles.sectionTitle}>Daily Macronutrient Targets</Text>
        <View style={styles.macroGrid}>
          {/* Protein */}
          <View style={[styles.macroCard, { borderColor: 'rgba(200, 169, 110, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: Colors.primaryGlow }]}>
              <Ionicons name="barbell" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.macroVal}>{proteinGoal}g</Text>
            <Text style={styles.macroName}>Protein</Text>
          </View>

          {/* Carbs */}
          <View style={[styles.macroCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="nutrition" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.macroVal}>{carbsGoal}g</Text>
            <Text style={styles.macroName}>Carbs</Text>
          </View>

          {/* Fat */}
          <View style={[styles.macroCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
            <View style={[styles.macroIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="flame-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.macroVal}>{fatGoal}g</Text>
            <Text style={styles.macroName}>Fats</Text>
          </View>
        </View>

        {/* Daily Hydration Card */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View style={styles.waterIconCircle}>
              <Ionicons name="water" size={22} color="#38BDF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.waterTitle}>Daily Water Requirement</Text>
              <Text style={styles.waterSub}>Target: {waterLiters} Liters per day</Text>
            </View>
          </View>
        </View>

        {/* Meal Logging Empty State */}
        <View style={styles.emptyMealCard}>
          <Ionicons name="restaurant-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyMealTitle}>No Meals Logged Today</Text>
          <Text style={styles.emptyMealSub}>
            Tap the floating + button on the bottom bar to snap a photo or quick-log your meal!
          </Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTextCol: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  userName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  headerRightBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  heroCalorieCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  heroSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  aiPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  calorieNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieVal: {
    color: Colors.primary,
    fontSize: 38,
    fontWeight: '900',
  },
  calorieUnit: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  calorieStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 14,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroVal: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  macroName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  waterCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  waterSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyMealCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyMealTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyMealSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
