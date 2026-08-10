import BentoGridCard from '@/components/BentoGridCard';
import { WeekMacroData } from '@/components/WeeklyMacroBalanceCard';
import WeeklyEnergyCard from '@/components/WeeklyEnergyCard';
import WeeklyWaterCard, { WeekWaterData } from '@/components/WeeklyWaterCard';
import Colors from '@/constants/colors';
import { getDailyLogByDate } from '@/services/dailyLogService';
import {
  AIBentoInsight,
  BentoInputData,
  generateBentoInsightsWithAI,
  getCachedBentoInsight,
  saveBentoInsightToStorageAndDB,
  shouldRegenerateBentoAI,
} from '@/services/geminiService';
import { getUserFromFirestore } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const WEEK_DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_DAY_DDD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_ICONS = ['flame', 'restaurant', 'barbell', 'water', 'walk', 'heart', 'trophy'] as const;

interface WeekStreakData {
  dayIndex: number;
  hasActivity: boolean;
}

type WeekCaloriesData = {
  day: string;
  consumed: number;
  burned: number;
};

export default function AnalyticsTabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const router = useRouter();
  const [userWeight, setUserWeight] = useState<string>('--');
  const [weekStreak, setWeekStreak] = useState<WeekStreakData[]>([]);
  const [weekCalories, setWeekCalories] = useState<WeekCaloriesData[]>([]);
  const [weekMacros, setWeekMacros] = useState<WeekMacroData[]>([]);
  const [weekWater, setWeekWater] = useState<WeekWaterData[]>([]);
  const [bentoInsight, setBentoInsight] = useState<AIBentoInsight | null>(null);
  const [isBentoAILoading, setIsBentoAILoading] = useState<boolean>(false);
  const [todayTelemetry, setTodayTelemetry] = useState<BentoInputData>({
    consumedCalories: 0,
    burnedCalories: 0,
    dailyCalorieGoal: 2000,
    consumedWaterLiters: 0,
    waterGoalLiters: 2.5,
    consumedProtein: 0,
    proteinGoal: 150,
    consumedCarbs: 0,
    carbsGoal: 200,
    consumedFat: 0,
    fatGoal: 65,
  });
  const [waterGoal, setWaterGoal] = useState<number>(2.5);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const requestIdRef = useRef(0);

  const resetUserState = () => {
    setUserWeight('--');
    setWeekStreak([]);
    setWeekCalories([]);
    setWeekMacros([]);
    setWeekWater([]);
    setBentoInsight(null);
    setWaterGoal(2.5);
    setCurrentStreak(0);
    setIsBentoAILoading(false);
    setIsLoading(false);
    setTodayTelemetry({
      consumedCalories: 0,
      burnedCalories: 0,
      dailyCalorieGoal: 2000,
      consumedWaterLiters: 0,
      waterGoalLiters: 2.5,
      consumedProtein: 0,
      proteinGoal: 150,
      consumedCarbs: 0,
      carbsGoal: 200,
      consumedFat: 0,
      fatGoal: 65,
    });
  };

  useFocusEffect(
    useCallback(() => {
      const userId = user?.id;
      const requestId = ++requestIdRef.current;

      resetUserState();

      if (!userId) {
        return;
      }

      setIsLoading(true);
      fetchAnalyticsData(userId, requestId);

      return () => {
        if (requestIdRef.current === requestId) {
          requestIdRef.current += 1;
        }
      };
    }, [user?.id])
  );

  const fetchBentoAI = useCallback(
    async (userId: string, telemetryData: BentoInputData, forceRefresh = false, requestId?: number) => {
      // 1. Check cached insight from database / storage first
      const cached = await getCachedBentoInsight(userId);
      if (requestId !== undefined && requestId !== requestIdRef.current) return;
      if (cached) {
        setBentoInsight(cached);
      }

      // 2. Check 6-hour rule
      const needsRegeneration = forceRefresh || shouldRegenerateBentoAI(cached);

      if (needsRegeneration) {
        setIsBentoAILoading(true);
        try {
          const freshInsight = await generateBentoInsightsWithAI(telemetryData);
          if (requestId !== undefined && requestId !== requestIdRef.current) return;
          setBentoInsight(freshInsight);
          await saveBentoInsightToStorageAndDB(userId, freshInsight);
        } catch (err) {
          console.error('Error generating Bento AI insight:', err);
        } finally {
          if (requestId === undefined || requestId === requestIdRef.current) {
            setIsBentoAILoading(false);
          }
        }
      }
    },
    []
  );

  const handleRefreshBentoAI = () => {
    if (user?.id) {
      fetchBentoAI(user.id, todayTelemetry, true, requestIdRef.current);
    }
  };

  const fetchAnalyticsData = async (userId: string, requestId: number) => {
    try {
      const userResult = await getUserFromFirestore(userId);
      if (requestId !== requestIdRef.current) return;

      let goal = 'Maintain weight';
      let calorieGoal = 2000;
      let wGoal = 2.5;
      let pGoal = 150;
      let cGoal = 200;
      let fGoal = 65;
      let weight = '--';

      if (userResult.exists && userResult.data) {
        const uData = userResult.data;
        if (uData.weight) {
          weight = uData.weight;
          setUserWeight(uData.weight);
        }
        if (uData.goal) goal = uData.goal;
        if (uData.dailyCalorieGoal) calorieGoal = uData.dailyCalorieGoal;
        if (uData.waterGoal?.liters) {
          wGoal = uData.waterGoal.liters;
          setWaterGoal(uData.waterGoal.liters);
        }
        if (uData.macroGoals) {
          if (uData.macroGoals.protein) pGoal = uData.macroGoals.protein;
          if (uData.macroGoals.carbs) cGoal = uData.macroGoals.carbs;
          if (uData.macroGoals.fat) fGoal = uData.macroGoals.fat;
        }
      }

      // Fetch Today's Daily Log from Database
      const todayStr = dateKey(new Date());
      const todayLog = await getDailyLogByDate(userId, todayStr);
      if (requestId !== requestIdRef.current) return;

      const liveTelemetry: BentoInputData = {
        consumedCalories: todayLog.consumedCalories || 0,
        burnedCalories: todayLog.burnedCalories || 0,
        dailyCalorieGoal: calorieGoal,
        consumedWaterLiters: todayLog.consumedWaterLiters || 0,
        waterGoalLiters: wGoal,
        consumedProtein: todayLog.consumedProtein || 0,
        proteinGoal: pGoal,
        consumedCarbs: todayLog.consumedCarbs || 0,
        carbsGoal: cGoal,
        consumedFat: todayLog.consumedFat || 0,
        fatGoal: fGoal,
        userWeight: weight,
        userGoal: goal,
        entriesCount: todayLog.entries ? todayLog.entries.length : 0,
      };

      setTodayTelemetry(liveTelemetry);
      fetchBentoAI(userId, liveTelemetry, false, requestId);

      await fetchWeekData(userId, requestId);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching analytics data:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchWeekData = async (userId: string, requestId: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
    startOfWeek.setHours(0, 0, 0, 0);

    const currentDayIndex = (today.getDay() + 6) % 7;
    const streakData: WeekStreakData[] = [];
    const calorieRows: WeekCaloriesData[] = [];
    const macroRows: WeekMacroData[] = [];
    const waterRows: WeekWaterData[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = dateKey(dayDate);
      const log = await getDailyLogByDate(userId, dateStr);
      if (requestId !== requestIdRef.current) return;

      const hasActivity = log.entries.length > 0 || (log.consumedWaterLiters || 0) > 0;
      streakData.push({ dayIndex: i, hasActivity });
      calorieRows.push({
        day: WEEK_DAY_DDD[i],
        consumed: log.consumedCalories || 0,
        burned: log.burnedCalories || 0,
      });

      // Calculate macro calories (Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g)
      let pCal = Math.round((log.consumedProtein || 0) * 4);
      let cCal = Math.round((log.consumedCarbs || 0) * 4);
      let fCal = Math.round((log.consumedFat || 0) * 9);

      // Fallback distribution if consumedCalories > 0 but individual macros weren't explicitly entered
      if (pCal === 0 && cCal === 0 && fCal === 0 && (log.consumedCalories || 0) > 0) {
        pCal = Math.round((log.consumedCalories || 0) * 0.3);
        cCal = Math.round((log.consumedCalories || 0) * 0.45);
        fCal = Math.round((log.consumedCalories || 0) * 0.25);
      }

      macroRows.push({
        day: WEEK_DAY_DDD[i],
        proteinCal: pCal,
        carbsCal: cCal,
        fatCal: fCal,
      });

      waterRows.push({
        day: WEEK_DAY_DDD[i],
        liters: log.consumedWaterLiters || 0,
      });
    }

    let streakCount = 0;
    const lastEligibleDay = streakData[currentDayIndex]?.hasActivity
      ? currentDayIndex
      : currentDayIndex - 1;
    for (let i = lastEligibleDay; i >= 0; i--) {
      if (streakData[i]?.hasActivity) {
        streakCount++;
      } else {
        break;
      }
    }

    if (requestId !== requestIdRef.current) return;
    setWeekStreak(streakData);
    setCurrentStreak(streakCount);
    setWeekCalories(calorieRows);
    setWeekMacros(macroRows);
    setWeekWater(waterRows);
  };

  const dateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7;

  return (
    <LinearGradient
      colors={['#FFF7ED', '#FFFBEB', '#FDF2F8', '#FFFFFF']}
      locations={[0, 0.4, 0.7, 1]}
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 20 + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Progress</Text>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Row: Streak + Weight */}
            <View style={styles.row}>
              {/* Streak Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  styles.streakCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setIsStreakModalOpen(true)}
              >
                <View style={styles.streakHeader}>
                  <Image source={require('../../assets/images/fire.png')} style={styles.fireImg} />
                  <View style={styles.streakTextCol}>
                    <Text style={styles.streakNum}>{currentStreak}</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                  </View>
                </View>

                <View style={styles.weekRow}>
                  {WEEK_DAY_LABELS.map((label, i) => {
                    const dayData = weekStreak.find(d => d.dayIndex === i);
                    const checked = dayData?.hasActivity || false;
                    const isToday = i === currentDayIndex;
                    const isFuture = i > currentDayIndex;

                    return (
                      <View key={i} style={styles.dayCol}>
                        <View
                          style={[
                            styles.dayBox,
                            checked && styles.dayBoxChecked,
                            isToday && !checked && styles.dayBoxToday,
                            isFuture && styles.dayBoxFuture,
                          ]}
                        >
                          <Ionicons
                            name={DAY_ICONS[i]}
                            size={11}
                            color={checked ? '#FFFFFF' : '#F97316'}
                          />
                        </View>
                        <Text style={[styles.dayTxt, isToday && styles.dayTxtToday]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>

              {/* Weight Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  styles.weightCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/update-weight',
                    params: { weight: userWeight },
                  })
                }
              >
                <View style={styles.weightTopRow}>
                  <View style={styles.weightIconWrap}>
                    <Ionicons name="scale-outline" size={22} color="#8B5CF6" />
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.textMuted}
                  />
                </View>

                <View style={styles.weightContent}>
                  <Text style={styles.weightLabel}>My Weight</Text>
                  <View style={styles.weightValueRow}>
                    <Text style={styles.weightNum}>{userWeight}</Text>
                    <Text style={styles.weightUnit}>kg</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Weekly Energy Card */}
            <WeeklyEnergyCard data={weekCalories} isLoading={isLoading} />

            {/* Bento Grid AI Progress Insights Section (Live Database Data + Gemini AI Engine) */}
            <BentoGridCard
              telemetry={todayTelemetry}
              aiInsight={bentoInsight}
              currentStreak={currentStreak}
              isAILoading={isBentoAILoading}
              onRefreshAI={handleRefreshBentoAI}
              weekMacros={weekMacros}
              isLoadingMacros={isLoading}
            />

            {/* Weekly Water Consumption Card */}
            <WeeklyWaterCard data={weekWater} waterGoalLiters={waterGoal} isLoading={isLoading} />

            {/* Motivational Card */}
            <View style={styles.motiveCard}>
              <Ionicons name="sparkles" size={20} color="#F59E0B" />
              <View style={styles.motiveTextCol}>
                <Text style={styles.motiveTitle}>Keep Going!</Text>
                <Text style={styles.motiveBody}>
                  Stay consistent with your daily logging to reach your fitness goals.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isStreakModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStreakModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsStreakModalOpen(false)}>
          <Pressable style={styles.modalDialog} onPress={() => { }}>
            <View style={styles.modalStreakHeader}>
              <Image source={require('../../assets/images/fire.png')} style={styles.modalFireImg} />
              <View style={styles.modalStreakTextCol}>
                <Text style={styles.modalStreakNum}>{currentStreak}</Text>
                <Text style={styles.modalStreakLabel}>Daily Streak</Text>
              </View>
              <Text style={styles.modalKeepItUp}>Keep it up 🔥</Text>
            </View>

            <View style={styles.modalWeekRow}>
              {WEEK_DAY_LABELS.map((label, i) => {
                const dayData = weekStreak.find(d => d.dayIndex === i);
                const checked = dayData?.hasActivity || false;
                const isToday = i === currentDayIndex;
                const isFuture = i > currentDayIndex;

                return (
                  <View key={i} style={styles.modalDayCol}>
                    <View
                      style={[
                        styles.modalDayBox,
                        checked && styles.dayBoxChecked,
                        isToday && !checked && styles.dayBoxToday,
                        isFuture && styles.dayBoxFuture,
                      ]}
                    >
                      {checked ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Ionicons name={DAY_ICONS[i]} size={16} color="#F97316" />
                      )}
                    </View>
                    <Text style={[styles.modalDayTxt, isToday && styles.dayTxtToday]}>
                      {WEEK_DAY_DDD[i]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalCloseBtn,
                pressed && styles.cardPressed,
              ]}
              onPress={() => setIsStreakModalOpen(false)}
            >
              <Text style={styles.modalCloseTxt}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const CARD_GAP = 10;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 110,
  },
  heading: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  loader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  streakCard: {
    marginRight: CARD_GAP / 2,
    justifyContent: 'space-between',
  },

  cardPressed: {
    opacity: 0.7,
  },

  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  fireImg: {
    width: 44,
    height: 44,
  },
  streakTextCol: {
    flex: 1,
  },
  streakNum: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  streakLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
    marginBottom: 8,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  dayTxt: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  dayTxtToday: {
    color: Colors.primary,
  },
  dayBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  dayBoxToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayBoxFuture: {
    opacity: 0.3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  modalFireImg: {
    width: 58,
    height: 58,
  },
  modalStreakTextCol: {
    flex: 1,
  },
  modalStreakNum: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 44,
  },
  modalStreakLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modalKeepItUp: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  modalDayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  modalDayBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDayTxt: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  modalCloseBtn: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginTop: 22,
  },
  modalCloseTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  weightCard: {
    marginLeft: CARD_GAP / 2,
    justifyContent: 'space-between',
  },
  weightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightContent: {
    justifyContent: 'flex-end',
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightNum: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  weightUnit: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  weightLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  motiveCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartTitleCol: {
    flex: 1,
  },
  chartTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chartIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motiveTextCol: {
    flex: 1,
  },
  motiveTitle: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  motiveBody: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
